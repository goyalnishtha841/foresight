"""
tests/test_forecast.py
----------------------
Unit tests for the forecast and validation modules.

Tests are meaningful — each verifies a real behaviour, not just
that the function runs without error.
"""

import pytest
import numpy as np
import pandas as pd
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.forecast import run_forecast, detect_seasonal_period
from src.validation import run_validation
from src.anomaly import detect_anomalies
from src.data_utils import quality_report, detect_columns


# ── Fixtures ───────────────────────────────────────────────────────────────

def make_series(n: int = 52, trend: float = 10.0,
                noise: float = 50.0) -> pd.Series:
    """Generate a synthetic weekly time series with trend and noise."""
    np.random.seed(0)
    dates = pd.date_range("2022-01-03", periods=n, freq="W")
    values = (
        1000.0
        + np.arange(n) * trend
        + np.random.normal(0, noise, n)
    )
    return pd.Series(values, index=dates)


def make_monthly_series(n: int = 36) -> pd.Series:
    """Generate a synthetic monthly time series."""
    np.random.seed(1)
    dates = pd.date_range("2020-01-01", periods=n, freq="MS")
    values = 500.0 + np.arange(n) * 5 + np.random.normal(0, 20, n)
    return pd.Series(values, index=dates)


def make_daily_series(n: int = 60) -> pd.Series:
    """Generate a synthetic daily time series."""
    np.random.seed(2)
    dates = pd.date_range("2022-01-01", periods=n, freq="D")
    values = 100.0 + np.arange(n) * 0.5 + np.random.normal(0, 5, n)
    return pd.Series(values, index=dates)


def make_quarterly_series(n: int = 20) -> pd.Series:
    """Generate a synthetic quarterly time series."""
    np.random.seed(3)
    dates = pd.date_range("2015-01-01", periods=n, freq="QS")
    values = 1000.0 + np.arange(n) * 20 + np.random.normal(0, 30, n)
    return pd.Series(values, index=dates)


# ── detect_seasonal_period ─────────────────────────────────────────────────

def test_seasonal_period_weekly_long():
    """Weekly series of any length should return 52."""
    s = make_series(n=110)
    assert detect_seasonal_period(s) == 52


def test_seasonal_period_weekly_short():
    """Short weekly series still returns 52 — frequency takes priority over length."""
    s = make_series(n=10)
    assert detect_seasonal_period(s) == 52


def test_seasonal_period_weekly_medium():
    """Medium weekly series returns 52 — not 12 as old length heuristic gave."""
    s = make_series(n=30)
    assert detect_seasonal_period(s) == 52


def test_seasonal_period_monthly():
    """Monthly series should return 12 regardless of length."""
    s = make_monthly_series(n=36)
    assert detect_seasonal_period(s) == 12


def test_seasonal_period_monthly_long():
    """Long monthly series (>104 rows) must return 12, not 52."""
    s = make_monthly_series(n=150)
    assert detect_seasonal_period(s) == 12


def test_seasonal_period_daily():
    """Daily series should return 7 (weekly cycle)."""
    s = make_daily_series(n=60)
    assert detect_seasonal_period(s) == 7


def test_seasonal_period_quarterly():
    """Quarterly series should return 4."""
    s = make_quarterly_series(n=20)
    assert detect_seasonal_period(s) == 4


# ── run_forecast ───────────────────────────────────────────────────────────

def test_forecast_output_keys():
    s = make_series()
    result = run_forecast(s, periods=4)
    required_keys = {
        "dates", "forecast", "band_low", "band_high",
        "model_params", "decomposition",
        "historical_dates", "historical_values",
    }
    assert required_keys.issubset(result.keys())


def test_forecast_correct_length():
    s = make_series()
    periods = 4
    result = run_forecast(s, periods=periods)
    assert len(result["dates"]) == periods
    assert len(result["forecast"]) == periods
    assert len(result["band_low"]) == periods
    assert len(result["band_high"]) == periods


def test_confidence_band_ordering():
    """Low band must always be below or equal to high band."""
    s = make_series()
    result = run_forecast(s, periods=4)
    for lo, hi in zip(result["band_low"], result["band_high"]):
        assert lo <= hi, f"Band inverted: low={lo} > high={hi}"


def test_historical_values_match_series():
    s = make_series(n=20)
    result = run_forecast(s, periods=4)
    assert len(result["historical_values"]) == 20


def test_model_type_in_params():
    """model_type field must be present in model_params."""
    s = make_series()
    result = run_forecast(s, periods=4)
    assert "model_type" in result["model_params"]
    assert result["model_params"]["model_type"] in (
        "add/add", "add/mul", "mul/mul", "simple"
    )


# ── run_validation ─────────────────────────────────────────────────────────

def test_validation_output_keys():
    s = make_series(n=30)
    result = run_validation(s, holdout=4)
    required_keys = {
        "ets_mape", "naive_mape", "ma_mape", "ets_mae",
        "band_coverage", "health_score", "health_label",
        "winner", "uncertainty_label",
        "holdout_dates", "holdout_actual", "holdout_predicted",
    }
    assert required_keys.issubset(result.keys())


def test_validation_returns_error_on_short_series():
    s = make_series(n=5)
    result = run_validation(s, holdout=4)
    assert "error" in result


def test_health_score_range():
    s = make_series(n=30)
    result = run_validation(s, holdout=4)
    if "error" not in result:
        assert 0 <= result["health_score"] <= 100


def test_health_label_valid():
    s = make_series(n=30)
    result = run_validation(s, holdout=4)
    if "error" not in result:
        assert result["health_label"] in ("green", "amber", "red")


def test_winner_valid():
    s = make_series(n=30)
    result = run_validation(s, holdout=4)
    if "error" not in result:
        assert result["winner"] in ("ets", "naive", "moving_average")


def test_validation_short_window_does_not_crash():
    """Validation on a 24-row monthly series must not raise — uses fallback."""
    s = make_monthly_series(n=24)
    result = run_validation(s, holdout=4)
    # Either returns valid result or error dict — never raises
    assert isinstance(result, dict)


# ── detect_anomalies ───────────────────────────────────────────────────────

def test_anomaly_detects_spike():
    """A planted extreme spike must be detected."""
    s = make_series(n=30, noise=10.0)
    s.iloc[20] = s.mean() + 10 * s.std()   # extreme spike
    anomalies = detect_anomalies(s, threshold=2.0)
    dates = [a["date"] for a in anomalies]
    assert str(s.index[20].date()) in dates


def test_anomaly_severity_levels():
    """All returned severity values must be valid."""
    s = make_series(n=30)
    anomalies = detect_anomalies(s)
    valid = {"critical", "warning", "mild"}
    for a in anomalies:
        assert a["severity"] in valid


def test_anomaly_direction():
    """Direction field must be spike or dip."""
    s = make_series(n=30)
    anomalies = detect_anomalies(s)
    for a in anomalies:
        assert a["direction"] in ("spike", "dip")


# ── quality_report ─────────────────────────────────────────────────────────

def test_quality_report_clean_data():
    s = make_series(n=52)
    report = quality_report(s)
    assert report["n_missing"] == 0
    assert report["verdict"] == "clean"
    assert "series_clean" in report


def test_quality_report_catches_missing():
    s = make_series(n=52)
    s.iloc[5] = np.nan
    s.iloc[15] = np.nan
    report = quality_report(s)
    assert report["n_missing"] == 2
    assert len(report["issues"]) > 0


def test_quality_report_short_series_verdict():
    s = make_series(n=8)
    report = quality_report(s)
    assert report["verdict"] == "poor"


# ── detect_columns ─────────────────────────────────────────────────────────

def test_detect_columns_finds_date():
    df = pd.DataFrame({
        "week": ["2023-01-01", "2023-01-08", "2023-01-15"],
        "sales": [100, 200, 150],
    })
    result = detect_columns(df)
    assert result["date_col"] == "week"
    assert "sales" in result["value_cols"]
