"""
data_utils.py
-------------
Handles CSV ingestion, automatic column detection, data cleaning,
and the data quality report shown to users before forecasting begins.

Why this exists as a separate module:
- Separates data concerns from modelling concerns
- Quality checks must run before any forecast to prevent garbage-in/garbage-out
- Makes it easy to extend to Excel uploads later
"""

import pandas as pd
import numpy as np
from io import BytesIO


def parse_csv(file_bytes: bytes) -> pd.DataFrame:
    """
    Parse raw CSV bytes into a DataFrame.

    Args:
        file_bytes: Raw bytes from an uploaded CSV file.

    Returns:
        Parsed DataFrame with original column names preserved.

    Raises:
        ValueError: If the file cannot be parsed as CSV.
    """
    try:
        return pd.read_csv(BytesIO(file_bytes))
    except Exception as exc:
        raise ValueError(f"Could not parse file as CSV: {exc}") from exc


def detect_columns(df: pd.DataFrame) -> dict:
    """
    Auto-detect which column is the date and which are numeric values.

    Tries to parse each object column as a date. Takes the first
    successfully parsed column as the date column. All numeric columns
    are returned as candidate value columns.

    Args:
        df: Input DataFrame.

    Returns:
        dict with keys:
            - date_col  (str | None): Name of detected date column.
            - value_cols (list[str]): Names of numeric columns.
    """
    date_col = None
    for col in df.columns:
        if df[col].dtype == object:
            try:
                pd.to_datetime(df[col])
                date_col = col
                break
            except Exception:
                continue

    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()

    return {"date_col": date_col, "value_cols": numeric_cols}


def prepare_series(df: pd.DataFrame,
                   date_col: str,
                   value_col: str) -> pd.Series:
    """
    Extract a clean time-indexed pandas Series from a DataFrame.

    Parses dates, sorts chronologically, and sets the date as index.

    Args:
        df:        Source DataFrame.
        date_col:  Name of the column containing dates.
        value_col: Name of the column containing numeric values.

    Returns:
        Time-indexed pd.Series sorted in ascending date order.
    """
    subset = df[[date_col, value_col]].copy()
    try:
        subset[date_col] = pd.to_datetime(subset[date_col])
    except ValueError:
        # Fall back to coerce — converts unparseable values to NaT
        subset[date_col] = pd.to_datetime(subset[date_col], errors='coerce')
    # Normalise to date only — strips time/nanosecond components
    subset[date_col] = subset[date_col].dt.normalize()
    subset = subset.sort_values(date_col).set_index(date_col)
    return subset[value_col].astype(float)


def quality_report(series: pd.Series) -> dict:
    """
    Run a data quality check before forecasting.

    Checks for missing values, duplicate dates, short series length,
    and extreme outliers. Returns a clean series alongside the report
    so the forecast engine always receives interpolated data.

    Why we interpolate rather than drop:
    - Dropping rows changes the series length and breaks seasonal detection.
    - Linear interpolation is the least-biased fill for time series gaps.

    Args:
        series: Raw time-indexed pd.Series.

    Returns:
        dict with keys:
            - n_rows, n_missing, n_duplicates, n_outliers (int)
            - date_start, date_end (str)
            - issues (list[str]): Human-readable issue descriptions.
            - verdict (str): 'clean' | 'warning' | 'poor'
            - series_clean (pd.Series): Interpolated, ready-to-use series.
    """
    n_total = len(series)
    n_missing = int(series.isna().sum())
    n_duplicates = int(series.index.duplicated().sum())

    # Remove duplicate index entries (keep first occurrence)
    series = series[~series.index.duplicated(keep="first")]

    # Fill missing values using linear interpolation
    series_clean = series.interpolate(method="linear").ffill().bfill()

    # Detect extreme outliers (beyond ±3 standard deviations)
    mean = series_clean.mean()
    std = series_clean.std()
    outlier_mask = (series_clean < mean - 3 * std) | \
                   (series_clean > mean + 3 * std)
    n_outliers = int(outlier_mask.sum())

    date_start = str(series.index.min().date())
    date_end = str(series.index.max().date())
    
    
    # Build human-readable issue list
    issues = []
    if n_missing > 0:
        issues.append(
            f"{n_missing} missing value(s) detected — "
            f"filled using linear interpolation."
        )
    if n_duplicates > 0:
        issues.append(
            f"{n_duplicates} duplicate date(s) removed "
            f"(kept first occurrence)."
        )
    if n_outliers > 0:
        issues.append(
            f"{n_outliers} extreme outlier(s) found in raw data "
            f"(beyond ±3 standard deviations)."
        )
    if n_total < 12:
        issues.append(
            f"Only {n_total} observations — "
            f"a minimum of 12 is recommended for reliable forecasting."
        )

    verdict = (
        "clean" if not issues
        else "poor" if n_total < 12
        else "warning"
    )

    return {
        "n_rows": n_total,
        "n_missing": n_missing,
        "n_duplicates": n_duplicates,
        "n_outliers": n_outliers,
        "date_start": date_start,
        "date_end": date_end,
        "issues": issues,
        "verdict": verdict,
        "series_clean": series_clean,
    }
