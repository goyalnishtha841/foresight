# ForeSight

AI-powered predictive forecasting for financial time-series data. Upload any CSV, get a statistically rigorous forecast, anomaly detection, trend decomposition, backtested accuracy scores, and plain-English AI commentary — in under ten seconds.

Live demo: https://foresight-mspf.onrender.com

---

## Overview

ForeSight is a full-stack forecasting platform built for financial analysts and data teams who need fast, trustworthy predictions without writing code. The user uploads a time-series CSV file, confirms the date and value columns, and receives a complete analysis dashboard: an ETS forecast with 80% confidence bands, automatic anomaly detection sorted by severity, a three-component trend decomposition, model backtesting against naive and moving-average baselines, and a plain-English AI briefing generated from the computed results.

The system ships with four pre-loaded UK banking datasets — house prices, mortgage approvals, digital banking adoption, and a multi-column banking dataset — so judges can explore the full feature set without needing to prepare a file.

---

## Features

All features listed here are implemented and functional in the current codebase.

- **CSV upload with automatic column detection** — the backend tries multiple separators (comma, semicolon, tab, pipe) and detects encoding automatically via chardet
- **Multi-column dataset support** — switch between metric columns in the header without re-uploading the file; re-runs the full pipeline on the new column instantly
- **Automatic data quality report** — checks for missing values, duplicate dates, and extreme outliers before forecasting; fills gaps via linear interpolation rather than dropping rows, which preserves series length for seasonal detection
- **ETS model selection with AIC competition** — fits up to three ETS variants (add/add, add/mul, mul/mul) and selects the lowest-AIC winner; falls back to simple exponential smoothing if all variants fail to converge
- **Frequency-aware seasonal period detection** — infers the correct seasonal period from the pandas date index (hourly=24, daily=7, weekly=52, monthly=12, quarterly=4); falls back to a length heuristic only when the pandas frequency cannot be determined
- **Bootstrap confidence bands** — resamples 500 paths from model residuals (10th–90th percentile) to produce honest uncertainty estimates that scale with actual model error, without parametric distributional assumptions
- **Safety clipping** — clips forecast and band values to mean ± 5 standard deviations to prevent runaway projections on non-stationary data
- **Additive trend decomposition** — decomposes each series into independent trend, seasonality, and residual components using statsmodels seasonal_decompose with `extrapolate_trend='freq'` to avoid edge NaNs
- **Rolling z-score anomaly detection** — uses an 8-period rolling window (min 3 periods) to adapt to local data context; flags mild (|z| ≥ 2.0), warning (|z| ≥ 2.5), and critical (|z| ≥ 3.0) anomalies; avoids false positives on trending series that a global z-score would produce
- **Forward-looking anomaly risk score** — compares standard deviation of the most recent 8 periods against the prior 8 periods; outputs Low / Medium / High risk with a volatility ratio
- **Model backtesting** — holds out the last N periods, trains ETS on the remaining data, then compares against naive (last-value-forward) and 4-period moving-average baselines on the withheld points
- **Forecast Health Score (0–100)** — three-component score: model accuracy scored against a 20% MAPE ceiling (40 pts), confidence band calibration against 80% target coverage (30 pts), and data quality including length and missing-value rate (30 pts)
- **Scenario comparison** — generates Baseline / Optimistic (+10%) / Pessimistic (-10%) scenarios by applying a multiplier to the central forecast; user can enter any custom growth percentage via the dashboard
- **AI narrative generation** — sends only computed metrics (not raw data) to the Groq API (llama-3.3-70b-versatile); generates a three-sentence plain-English forecast briefing and three key findings formatted for non-technical stakeholders
- **AI anomaly explanation** — on-demand per-anomaly explanation; passes date, value, z-score, expected value, and dataset context to the LLM; responses are cached client-side in React state for the session
- **Natural language Q&A** — user can ask any question about the dataset; the system passes forecast values, confidence bands, anomaly list, and validation metrics as context to the LLM
- **PDF export** — generates a structured PDF briefing server-side via ReportLab with dataset label, quality report, forecast summary, anomaly list, and key findings
- **Dark and light theme** — toggled via a button in the header; dark theme uses a slate-blue palette calibrated for extended screen readability
- **Animated dashboard** — chart skeleton loaders during data fetch, staggered entry animations via Framer Motion, animated hover tooltips on all chart lines

---

## Install and Run

Prerequisites: Node.js 18 or later, Python 3.10 or later, pip.

**1. Clone the repository**

```bash
git clone https://github.com/<your-org>/foresight.git
cd foresight
```

**2. Backend setup**

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
```

Open `.env` and add your Groq API key (free at console.groq.com):
