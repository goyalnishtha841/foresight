"""
forecast.py
-----------
Core forecasting engine using Exponential Triple Smoothing (ETS).

Why ETS over neural networks or Prophet:
- Interpretable: every parameter (alpha, beta, gamma) has a clear meaning.
- Accurate on short series: works well with as few as 12-24 observations.
- Fast: fits in milliseconds, no GPU required.
- Defensible: a judge can ask "how does it work?" and get a real answer.

Confidence bands use bootstrap resampling of model residuals rather than
parametric intervals. This avoids distributional assumptions and gives
honest uncertainty estimates that scale with actual model error.
"""

import warnings
import numpy as np
import pandas as pd
from statsmodels.tsa.holtwinters import ExponentialSmoothing
from statsmodels.tsa.seasonal import seasonal_decompose


def detect_seasonal_period(series: pd.Series) -> int:
    """
    Infer the most likely seasonal period from series length.

    Heuristic based on common business data frequencies:
    - 104+ points  -> annual seasonality (52-week cycle)
    - 24-103 points -> monthly seasonality (12-month cycle)
    - 14-23 points  -> weekly seasonality (7-day cycle)
    - <14 points    -> fallback to period of 4

    Args:
        series: Time-indexed pd.Series.

    Returns:
        Integer seasonal period.
    """
    """
    Infer the correct seasonal period from the series date index.

    Uses pandas frequency detection as primary method — accurate for
    any regularly-spaced time series. Falls back to length heuristic
    only when frequency cannot be determined.

    Seasonal periods by frequency:
    - Hourly:    24 (daily cycle)
    - Daily:      7 (weekly cycle — weekday/weekend pattern)
    - Weekly:    52 (annual cycle)
    - Monthly:   12 (annual cycle)
    - Quarterly:  4 (annual cycle)
    - Annual:     1 (no seasonality)

    Args:
        series: Time-indexed pd.Series.

    Returns:
        Integer seasonal period.
    """
    try:
        freq = pd.infer_freq(series.index)
        if freq:
            freq_upper = freq.upper()
            # Hourly
            if freq_upper.startswith('H') or freq_upper == 'T' or freq == 'h':
                return 24
            # Daily or Business daily
            if freq_upper.startswith('D') or freq_upper.startswith('B'):
                return 7
            # Weekly
            if freq_upper.startswith('W'):
                return 52
            # Monthly (MS, ME, M)
            if freq_upper.startswith('M'):
                return 12
            # Quarterly (QS, Q)
            if freq_upper.startswith('Q'):
                return 4
            # Annual (YS, Y, A, AS)
            if freq_upper.startswith('Y') or freq_upper.startswith('A'):
                return 1
    except Exception:
        pass

    # Fallback — length heuristic when frequency cannot be inferred
    # This handles irregular or unknown frequencies
    n = len(series)
    if n >= 730:  return 7   # likely daily
    if n >= 104:  return 52  # likely weekly
    if n >= 24:   return 12  # likely monthly
    if n >= 14:   return 7   # likely weekly
    return 4


def run_forecast(series: pd.Series, periods: int = 4) -> dict:
    """
    Fit an ETS model and generate a forecast with bootstrap confidence bands.

    Steps:
    1. Detect seasonal period automatically.
    2. Fit ExponentialSmoothing with additive trend + additive seasonality.
       Falls back to simple smoothing if full ETS fails to converge.
    3. Forecast N periods ahead — assigned OUTSIDE try/except block.
    4. Bootstrap 500 future paths from model residuals to build 80% band.
    5. Clip forecast and bands to prevent runaway values on unusual data.
    6. Decompose the series into trend / seasonal / residual components.
    7. Build forecast date index from the series frequency.

    Args:
        series:  Clean, time-indexed pd.Series (output of prepare_series).
        periods: Number of future periods to forecast.

    Returns:
        dict with keys: dates, forecast, band_low, band_high,
                        model_params, decomposition, converged,
                        historical_dates, historical_values.
    """
    seasonal_period = detect_seasonal_period(series)
    converged = True
    selected_type = "add/add"

    can_use_multiplicative = float(series.min()) > 0
    cv = float(series.std() / abs(series.mean())) if series.mean() != 0 else 0

    candidates = []

    # Always try additive
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            m_add = ExponentialSmoothing(
                series, trend="add", seasonal="add",
                seasonal_periods=seasonal_period,
                initialization_method="estimated",
            ).fit(optimized=True)
        candidates.append(("add/add", m_add, m_add.aic))
    except Exception:
        pass

    # Try add/mul on positive data
    if can_use_multiplicative:
        try:
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                m_addmul = ExponentialSmoothing(
                    series, trend="add", seasonal="mul",
                    seasonal_periods=seasonal_period,
                    initialization_method="estimated",
                ).fit(optimized=True)
            candidates.append(("add/mul", m_addmul, m_addmul.aic))
        except Exception:
            pass

    # Try mul/mul only on variable positive data
    if can_use_multiplicative and cv > 0.15:
        try:
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                m_mul = ExponentialSmoothing(
                    series, trend="mul", seasonal="mul",
                    seasonal_periods=seasonal_period,
                    initialization_method="estimated",
                ).fit(optimized=True)
            candidates.append(("mul/mul", m_mul, m_mul.aic))
        except Exception:
            pass

    # Pick lowest AIC — fallback to simple if all failed
    if not candidates:
        converged = False
        selected_type = "simple"
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            model = ExponentialSmoothing(
                series, trend=None, seasonal=None,
                initialization_method="estimated",
            ).fit(optimized=True)
    else:
        candidates.sort(key=lambda x: x[2])
        selected_type, model, _ = candidates[0]

    # forecast_values ALWAYS assigned here — outside all if/else blocks
    forecast_values = model.forecast(periods)

    # Bootstrap confidence bands
    residuals = model.resid.dropna().values
    np.random.seed(42)
    simulations = np.array([
        forecast_values.values +
        np.random.choice(residuals, periods, replace=True)
        for _ in range(500)
    ])
    band_low  = np.percentile(simulations, 10, axis=0)
    band_high = np.percentile(simulations, 90, axis=0)

    # Safety clip
    hist_mean = float(series.mean())
    hist_std  = float(series.std())
    clip_lo   = hist_mean - 5 * hist_std
    clip_hi   = hist_mean + 5 * hist_std

    forecast_clipped = np.clip(forecast_values.values, clip_lo, clip_hi)
    band_low         = np.clip(band_low,  clip_lo, clip_hi)
    band_high        = np.clip(band_high, clip_lo, clip_hi)

    # Model parameters
    model_params = {
        "alpha":           round(float(model.params["smoothing_level"]), 3),
        "beta":            round(float(model.params.get("smoothing_trend", 0)), 3),
        "gamma":           round(float(model.params.get("smoothing_seasonal", 0)), 3),
        "seasonal_period": seasonal_period,
        "aic":             round(float(model.aic), 2),
        "model_type":      selected_type,
        "converged":       converged,
    }

    # Build future date index
    last_date    = series.index[-1]
    freq         = pd.infer_freq(series.index) or "W"
    future_dates = pd.date_range(
        start=last_date, periods=periods + 1, freq=freq
    )[1:]

    decomposition = decompose_series(series, seasonal_period)

    return {
        "dates":             [str(d.date()) for d in future_dates],
        "forecast":          [round(float(v), 2) for v in forecast_clipped],
        "band_low":          [round(float(v), 2) for v in band_low],
        "band_high":         [round(float(v), 2) for v in band_high],
        "model_params":      model_params,
        "decomposition":     decomposition,
        "converged":         converged,
        "historical_dates":  [str(d.date()) for d in series.index],
        "historical_values": [round(float(v), 2) for v in series.values],
    }


def decompose_series(series: pd.Series,
                     seasonal_period: int) -> dict:
    """
    Decompose a time series into trend, seasonal, and residual components.

    Uses additive decomposition (trend + seasonal + residual = observed).
    extrapolate_trend='freq' handles edge NaNs at start/end of series.

    Args:
        series:          Time-indexed pd.Series.
        seasonal_period: Detected seasonal period.

    Returns:
        dict with keys: trend, seasonal, residual, dates.
        Returns empty lists if decomposition fails (e.g. too few points).
    """
    try:
        result = seasonal_decompose(
            series,
            model="additive",
            period=seasonal_period,
            extrapolate_trend="freq",
        )
        return {
            "trend":    [round(float(v), 2) for v in result.trend.fillna(0)],
            "seasonal": [round(float(v), 2) for v in result.seasonal.fillna(0)],
            "residual": [round(float(v), 2) for v in result.resid.fillna(0)],
            "dates":    [str(d.date()) for d in series.index],
        }
    except Exception:
        return {"trend": [], "seasonal": [], "residual": [], "dates": []}