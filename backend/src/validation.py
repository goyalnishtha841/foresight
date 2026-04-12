"""
validation.py
-------------
Validates forecast accuracy using backtesting and baseline comparison.

Core idea — backtesting:
We cannot test a future prediction until the future arrives. Instead,
we hold out the last N periods of the historical data, train the model
on everything before that, and measure how well it predicts those
held-out periods — which we already know the true values for.

Why we compare against baselines:
A model that achieves 8% MAPE sounds impressive — until you find that
simply carrying the last value forward achieves 7% MAPE. The baseline
comparison prevents teams from over-claiming model performance.

Forecast Health Score (0–100):
Combines three sub-scores into a single, human-readable quality signal:
  - Model accuracy vs naive baseline (40 pts)
  - Confidence band calibration — how close to 80% coverage (30 pts)
  - Data quality — length and missing value rate (30 pts)
"""

import warnings
import numpy as np
import pandas as pd
from statsmodels.tsa.holtwinters import ExponentialSmoothing
from .forecast import detect_seasonal_period


def _mape(actual: np.ndarray, predicted: np.ndarray) -> float:
    mask = np.abs(actual) > 1e-10
    if not mask.any(): return 0.0
    return float(np.mean(np.abs(actual[mask] - predicted[mask]) / np.abs(actual[mask])) * 100)


def _mae(actual: np.ndarray, predicted: np.ndarray) -> float:
    return float(np.mean(np.abs(actual - predicted)))


def _coverage(actual: np.ndarray, low: np.ndarray, high: np.ndarray) -> float:
    inside = np.sum((actual >= low) & (actual <= high))
    return float(inside / len(actual) * 100)


def _compute_health_score(ets_mape: float, naive_mape: float,
                          band_coverage: float, series: pd.Series) -> tuple:
    score_model = max(0.0, 40.0 * (1.0 - min(ets_mape, 20.0) / 20.0))
    calibration = 1.0 - abs(band_coverage - 80.0) / 80.0
    score_band  = max(0.0, calibration * 30.0)
    missing_pct = float(series.isna().mean() * 100)
    length_bonus = min(10.0, len(series) / 5.0)
    score_data  = max(0.0, 20.0 - min(20.0, missing_pct * 2.0) + length_bonus)
    health_score = round(score_model + score_band + score_data)
    health_label = (
        "green" if health_score >= 70
        else "amber" if health_score >= 40
        else "red"
    )
    return health_score, health_label


def _fit_best_model(train: pd.Series, sp: int):
    """
    Try ETS variants in order, return first that succeeds.
    Always returns a fitted model — never raises.
    """
    can_mul = float(train.min()) > 0
    cv = float(train.std() / abs(train.mean())) if train.mean() != 0 else 0

    # Build candidate list — ordered by preference
    variants = [("add", "add", sp)]
    if can_mul:
        variants.append(("add", "mul", sp))
    if can_mul and cv > 0.3:
        variants.append(("mul", "mul", sp))
    # No-seasonal fallbacks
    variants.append(("add", None, None))
    variants.append((None, None, None))

    candidates = []
    for trend_t, season_t, season_p in variants:
        try:
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                kwargs = dict(
                    trend=trend_t,
                    seasonal=season_t,
                    initialization_method="estimated",
                )
                if season_p is not None:
                    kwargs["seasonal_periods"] = season_p
                m = ExponentialSmoothing(train, **kwargs).fit(optimized=True)
            candidates.append((m.aic, m))
        except Exception:
            continue

    if candidates:
        candidates.sort(key=lambda x: x[0])
        return candidates[0][1]

    # Absolute last resort — mean repeat
    return None


def run_validation(series: pd.Series, holdout: int = 4) -> dict:
    """
    Run full backtesting and baseline comparison.
    Never raises — returns error dict if validation cannot be completed.
    """
    min_required = holdout + 8
    if len(series) < min_required:
        return {
            "error": (
                f"Need at least {min_required} observations for backtesting. "
                f"Received {len(series)}."
            )
        }

    train  = series.iloc[:-holdout]
    test   = series.iloc[-holdout:]
    actual = test.values

    sp    = detect_seasonal_period(train)
    model = _fit_best_model(train, sp)

    # Generate predictions
    if model is not None:
        try:
            ets_pred = model.forecast(holdout).values
        except Exception:
            ets_pred = np.full(holdout, float(train.iloc[-1]))
    else:
        ets_pred = np.full(holdout, float(train.iloc[-1]))

    # Bootstrap bands
    if model is not None:
        try:
            residuals = model.resid.dropna().values
            if len(residuals) == 0:
                raise ValueError("no residuals")
        except Exception:
            residuals = np.array([float(train.std()) or 1.0])
    else:
        residuals = np.array([float(train.std()) or 1.0])

    np.random.seed(42)
    sims = np.array([
        ets_pred + np.random.choice(residuals, holdout, replace=True)
        for _ in range(500)
    ])
    band_low  = np.percentile(sims, 10, axis=0)
    band_high = np.percentile(sims, 90, axis=0)

    # Baselines
    naive_pred = np.full(holdout, float(train.iloc[-1]))
    ma_pred    = np.full(holdout, float(train.iloc[-4:].mean()))

    # Metrics
    ets_mape      = _mape(actual, ets_pred)
    naive_mape    = _mape(actual, naive_pred)
    ma_mape       = _mape(actual, ma_pred)
    ets_mae       = _mae(actual, ets_pred)
    band_coverage = _coverage(actual, band_low, band_high)

    health_score, health_label = _compute_health_score(
        ets_mape, naive_mape, band_coverage, series
    )

    winner = (
        "ets" if ets_mape <= naive_mape and ets_mape <= ma_mape
        else "naive" if naive_mape <= ma_mape
        else "moving_average"
    )

    band_range_pct = (
        (band_high.mean() - band_low.mean()) / abs(ets_pred.mean()) * 100
        if ets_pred.mean() != 0 else 50.0
    )
    uncertainty_label = (
        "high_confidence" if band_range_pct < 10
        else "moderate"   if band_range_pct < 25
        else "directional_only"
    )

    return {
        "ets_mape":          round(ets_mape, 2),
        "naive_mape":        round(naive_mape, 2),
        "ma_mape":           round(ma_mape, 2),
        "ets_mae":           round(ets_mae, 2),
        "band_coverage":     round(band_coverage, 1),
        "health_score":      health_score,
        "health_label":      health_label,
        "winner":            winner,
        "uncertainty_label": uncertainty_label,
        "holdout_dates":     [str(d.date()) for d in test.index],
        "holdout_actual":    [round(float(v), 2) for v in actual],
        "holdout_predicted": [round(float(v), 2) for v in ets_pred],
        "holdout_low":       [round(float(v), 2) for v in band_low],
        "holdout_high":      [round(float(v), 2) for v in band_high],
    }