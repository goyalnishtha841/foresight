"""
anomaly.py
----------
Detects unusual spikes and dips in historical time-series data
using a rolling z-score approach.

Why rolling z-score instead of a global z-score:
- Business data changes over time (growth, seasonality, market shifts).
- A value that is "normal" in Year 2 may have been extreme in Year 1.
- Rolling statistics adapt to the local context of each data point,
  giving fewer false positives on trending or seasonal series.

Threshold of 2.0 standard deviations flags the outermost ~5% of values
under a normal distribution — a practical balance between sensitivity
and specificity for weekly business metrics.
"""

import pandas as pd
import numpy as np


def detect_anomalies(series: pd.Series,
                     window: int = 8,
                     threshold: float = 2.0) -> list:
    """
    Identify anomalous data points using a rolling z-score.

    Severity bands:
    - mild:     2.0 <= |z| < 2.5
    - warning:  2.5 <= |z| < 3.0
    - critical: |z| >= 3.0

    Args:
        series:    Clean, time-indexed pd.Series.
        window:    Rolling window size in periods (default 8 weeks).
        threshold: Minimum |z-score| to flag as anomaly (default 2.0).

    Returns:
        List of dicts sorted by severity then date. Always returns a list.
    """
    rolling_mean = series.rolling(window, min_periods=3).mean()
    rolling_std  = series.rolling(window, min_periods=3).std()

    # Avoid division by zero on flat series segments
    rolling_std = rolling_std.replace(0, np.nan)

    z_scores = (series - rolling_mean) / rolling_std

    anomalies = []
    for idx in series.index:
        z = z_scores.get(idx)
        if z is None or pd.isna(z):
            continue
        if abs(z) < threshold:
            continue

        anomalies.append({
            "date":      str(idx.date()),
            "value":     round(float(series[idx]), 2),
            "z_score":   round(float(z), 2),
            "expected":  round(float(rolling_mean[idx]), 2),
            "direction": "spike" if z > 0 else "dip",
            "severity": (
                "critical" if abs(z) >= 3.0
                else "warning" if abs(z) >= 2.5
                else "mild"
            ),
        })

    # Sort: critical first, then warning, then mild; within each by date
    severity_rank = {"critical": 0, "warning": 1, "mild": 2}
    anomalies.sort(
        key=lambda x: (severity_rank[x["severity"]], x["date"])
    )
    return anomalies


def compute_anomaly_risk(series: pd.Series, window: int = 8) -> dict:
    """
    Compute forward-looking anomaly risk based on recent volatility trend.

    Compares std of most recent window against prior window.
    If volatility is increasing, anomaly risk is rising.

    Returns:
        dict with risk_level, risk_score, message, and supporting stats.
    """
    if len(series) < window * 2:
        return {
            "risk_level":       "unknown",
            "risk_score":       50,
            "message":          "Insufficient data to assess anomaly risk.",
            "recent_std":       0,
            "prior_std":        0,
            "volatility_ratio": 1.0,
        }

    recent_std = float(series.iloc[-window:].std())
    prior_std  = float(series.iloc[-window*2:-window].std())

    if prior_std < 1e-10:
        ratio = 1.0
    else:
        ratio = recent_std / prior_std

    risk_score = min(100, int(50 * ratio))

    if risk_score >= 85:
        risk_level = "high"
        message = (
            f"Anomaly risk is HIGH — recent volatility is "
            f"{ratio:.1f}x the prior period. "
            f"Closely monitor the next few observations."
        )
    elif risk_score >= 65:
        risk_level = "medium"
        message = (
            f"Anomaly risk is ELEVATED — volatility has increased "
            f"compared to the prior period. Stay alert."
        )
    else:
        risk_level = "low"
        message = "Data is stable — anomaly risk is low based on recent volatility."

    return {
        "risk_level":       risk_level,
        "risk_score":       risk_score,
        "message":          message,
        "recent_std":       round(recent_std, 4),
        "prior_std":        round(prior_std, 4),
        "volatility_ratio": round(ratio, 2),
    }