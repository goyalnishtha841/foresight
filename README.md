# ForeSight

AI-powered predictive forecasting for financial time-series data. Upload any CSV, get a statistically rigorous forecast, anomaly detection, trend decomposition, backtested accuracy scores, and plain-English AI commentary — in 5–15 seconds.

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
GROQ_API_KEY=your_groq_api_key_here

Start the server:

```bash
uvicorn main:app --reload --port 8000
```

Verify it is running:

```bash
curl http://localhost:8000/health
# Expected: {"status":"ok","version":"1.0.0"}
```

**3. Frontend setup**

Open a new terminal:

```bash
cd frontend
npm install
cp .env.example .env
```

The default `VITE_API_URL` in `.env` points to `http://localhost:8000`. Update it only if your backend runs on a different port.

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

**4. Run the test suite (optional)**

```bash
cd backend
pytest tests/ -v
```

**5. Production build (optional)**

```bash
cd frontend
npm run build
npm run preview
```

---

## Tech Stack

**Frontend**

| Library | Version | Purpose |
|---------|---------|---------|
| React | 18.3 | UI framework |
| Vite | 5.3 | Build tool and dev server |
| Tailwind CSS | 3.4 | Utility-first styling |
| Framer Motion | 11.0 | Animations and transitions |
| Recharts | 2.12 | Interactive charts |
| Axios | 1.7 | HTTP client |
| Lucide React | 0.383 | Icon set |

**Backend**

| Library | Version | Purpose |
|---------|---------|---------|
| FastAPI | 0.111 | REST API framework |
| Uvicorn | 0.29 | ASGI server |
| Pandas | 2.0+ | Data ingestion and manipulation |
| NumPy | 1.26+ | Numerical operations |
| statsmodels | 0.14 | ETS model, seasonal decomposition |
| SciPy | 1.11+ | Statistical utilities |
| Groq SDK | 0.9 | LLM narration (llama-3.3-70b-versatile) |
| ReportLab | 4.1 | Server-side PDF generation |
| chardet | 5.2+ | CSV encoding detection |
| pytest | 8.2 | Unit test framework |

**Infrastructure**

| Service | Purpose |
|---------|---------|
| Render | Cloud hosting for both frontend and backend |
| GitHub | Version control (private during hackathon) |

**Runtime**

Python 3.11.9 (pinned in runtime.txt for Render deployment).

---

## Usage Examples

**Uploading your own data**

Prepare a CSV with at least one date column and one numeric column:
month,avg_house_price_gbp_thousands
2018-01,225.4
2018-02,226.1
2018-03,229.8

1. Open the app and click Upload CSV or drag the file onto the upload area.
2. The backend auto-detects columns; confirm or override the selection.
3. Set the forecast horizon (default 4 periods; max 30).
4. Click Run Analysis. Results appear in 5–15 seconds depending on series length and cold-start state.

**Switching between columns in a multi-column file**

Upload a file with several numeric columns. After the first analysis completes, use the Metric dropdown in the top header to switch columns. The full pipeline re-runs on the new column without re-uploading.

**Exploring anomalies**

Click any row in the Anomaly Detection panel to expand a plain-English explanation of the likely cause. Anomalies are colour-coded: red for critical (|z| ≥ 3.0), amber for warning (|z| ≥ 2.5), blue for mild (|z| ≥ 2.0).

**Custom scenario**

In the Scenario Comparison panel, enter any growth percentage (between -100 and +500) and click Run to generate a custom forecast alongside the three pre-computed scenarios.

**Asking a question**

Type any plain-English question in the Ask a Question panel at the bottom of the dashboard. Examples:

- "What is the strongest seasonal month in this dataset?"
- "Is the confidence band wide enough to trust this forecast?"
- "How many standard deviations was the largest anomaly?"

**Exporting**

Click Export in the top header to download a formatted PDF briefing containing the dataset summary, quality report, forecast narrative, and key findings. The PDF is generated server-side via ReportLab.

---

## Architecture

------------


Browser (React + Vite)
  UploadPanel
  ConfigurePanel
  Dashboard
    ForecastChart
    AnomalyPanel
    DecompositionPanel
    ValidationPanel
    ScenarioPanel
    AskPanel
    KeyFindings
         |
         | REST / JSON (Axios)
         v
FastAPI (Python 3.12)
  POST /upload            parse_csv → detect_columns → store in _session
  POST /analyse           prepare_series → quality_report → run_forecast
                          → detect_anomalies → compute_anomaly_risk
                          → run_validation → run_scenarios
                          → narrate_forecast → narrate_key_findings
  POST /anomaly/:id/explain   narrate_anomaly (Groq, on demand)
  POST /scenario/custom   run_custom_scenario (multiplier on base forecast)
  POST /ask               answer_question (Groq, grounded in session data)
  POST /export/pdf        generate_briefing_pdf (ReportLab)
  GET  /health            liveness check
         |
         | HTTPS (Groq SDK)
         v
Groq API — llama-3.3-70b-versatile

All application state lives in a single custom hook, `useAnalysis.js`. Components are pure: they receive data and callbacks only, with no direct API calls. The backend uses an in-memory session dict (`_session`) to share the uploaded DataFrame and analysis results across the `/anomaly/explain`, `/ask`, and `/scenario/custom` endpoints — avoiding re-uploads on follow-up calls. A production version would replace this with Redis or a proper session store.

**Analysis pipeline for a single /analyse call (in order):**

1. `parse_csv` — tries comma, semicolon, tab, and pipe separators; detects encoding with chardet
2. `detect_columns` — identifies the date column by attempting `pd.to_datetime` on each string column; returns all numeric columns as value candidates
3. `prepare_series` — parses dates, normalises to date-only (strips time components), sorts chronologically, returns a time-indexed `pd.Series`
4. `quality_report` — counts missing values, duplicate dates, and ±3σ outliers; fills gaps with linear interpolation; returns a clean series alongside the report
5. `run_forecast` — detects seasonal period from the pandas frequency string (with length-heuristic fallback); fits up to three ETS variants and selects by AIC; bootstraps 500 residual paths for confidence bands; clips to ±5σ; runs additive decomposition
6. `detect_anomalies` — computes rolling z-scores with an 8-period window; classifies by threshold into mild / warning / critical; sorts by severity then date
7. `compute_anomaly_risk` — compares std of last 8 periods to prior 8 periods; outputs a volatility ratio and risk level
8. `run_validation` — holds out the last N periods; refits ETS using the same AIC competition; compares against naive and moving-average baselines; computes MAPE, MAE, band coverage, and the Forecast Health Score
9. `run_scenarios` — applies 1.0x, 1.1x, and 0.9x multipliers to the central forecast to produce Baseline, Optimistic, and Pessimistic projections
10. `narrate_forecast`, `narrate_key_findings` — sends only the computed metrics (no raw data) to Groq; receives plain-English output

---

## Technical Depth

**ETS model selection**

Rather than fixing a single ETS specification, the backend runs an AIC competition across up to three variants for each dataset:

- add/add (additive trend, additive seasonality) — always attempted
- add/mul (additive trend, multiplicative seasonality) — attempted when all values are strictly positive
- mul/mul (multiplicative trend and seasonality) — attempted when values are positive and the coefficient of variation exceeds 0.15

The variant with the lowest Akaike Information Criterion is selected. This matters in practice: UK house price data (slow upward trend, mild seasonal cycle) typically favours add/add, while data with proportionally growing seasonal swings favours add/mul. Selecting automatically means the system works correctly on different datasets without manual tuning.

**Bootstrap confidence bands**

Standard ETS prediction intervals assume normally distributed errors. Financial time series rarely satisfy this. ForeSight instead resamples the fitted model's residuals with replacement 500 times per forecast horizon and takes the 10th and 90th percentiles as the band boundaries. This approach makes no distributional assumption and produces intervals that honestly reflect the actual residual spread of the specific dataset being analysed.

**Rolling z-score anomaly detection**

A global z-score would compare each value against the entire series mean and standard deviation. On a trending or growing series, this produces systematic false positives in the early periods (where values are legitimately lower than the long-run mean) and false negatives in the later periods. The rolling window (8 periods, min 3) adapts the reference distribution to the local context of each data point, which is more appropriate for financial data that changes regime over time.

**Forecast Health Score**

The 0–100 score combines three measurable components: model accuracy scored against a 20% MAPE ceiling (40 points — a MAPE of 0% scores full marks, 20% or above scores zero), confidence band calibration against the target 80% coverage rate (30 points, penalised for both over- and under-coverage), and data quality including series length and missing-value rate (30 points). The score gives a single interpretable signal about whether a given forecast should be trusted.

**AI narration design**

The LLM receives only the computed metrics — forecast values, band bounds, MAPE, health score, anomaly count — not the raw CSV data. This means the LLM cannot hallucinate incorrect numbers: all numerical claims in its output are grounded in values the statistical engine already calculated. It also keeps the privacy footprint minimal; no customer data is ever transmitted to a third-party API.

---

## Test Coverage

Unit tests are in `backend/tests/` and can be run with `pytest tests/ -v`.

Tests cover: `detect_seasonal_period` on short, medium, and long series; `run_forecast` output shape and confidence band ordering (low must never exceed high); `run_validation` output schema, error handling on short series, health score range (0–100), and valid winner values; `detect_anomalies` detecting a planted spike, valid severity levels, and valid direction values; `quality_report` on clean data, data with missing values, and short series; `detect_columns` correctly identifying a date column.

---

## Limitations

- **Backend cold start** — hosted on Render's free tier; the first request after a period of inactivity may take 30–60 seconds while the container wakes up
- **CSV only** — Excel and JSON ingestion are not currently supported; the file must be a well-formed CSV
- **Single date column** — the system expects one date column; multi-indexed or irregular time series may need pre-processing before upload
- **Stateless session** — the in-memory `_session` dict is not persistent across server restarts and does not support concurrent users sharing a single session
- **Minimum data** — at least 12 observations are required for any forecast; 24 or more is recommended for reliable seasonal decomposition
- **Forecast horizon** — the ETS model is optimised for short-to-medium horizons; very long-range projections should be treated as directional guidance only

---

## Future Improvements

- User authentication and saved analyses — allow analysts to return to previous forecasts
- Additional model types — ARIMA and Prophet as alternatives to ETS, with automatic selection by cross-validated MAPE
- Excel and JSON ingestion — extend the parse_csv pipeline to handle other common formats
- Concurrent session handling — replace the in-memory dict with Redis to support multiple simultaneous users
- Live data connectors — scheduled re-forecasting from a connected spreadsheet, database, or API endpoint
- Multi-variate modelling — forecast one column as a function of others, for example house prices as a function of mortgage rates

---

## Folder Structure
foresight/
  backend/
    main.py               API entry point; all route definitions and session management
    src/
      data_utils.py       CSV parsing, column detection, series preparation, quality report
      forecast.py         ETS model selection, bootstrap bands, seasonal decomposition
      anomaly.py          Rolling z-score detection, forward-looking risk score
      validation.py       Holdout backtesting, baseline comparison, Health Score
      scenarios.py        Baseline / Optimistic / Pessimistic / custom scenario generation
      narrator.py         Groq API integration; all LLM prompt construction and calls
      pdf_export.py       ReportLab PDF briefing generation
    tests/
      test_forecast.py    Unit tests for forecast, validation, anomaly, and data utils
      test_api.py         API endpoint integration tests
    requirements.txt
    runtime.txt           Python 3.12 (pinned for Render)
    .env.example

  frontend/
    public/
      data/               Pre-loaded UK banking demo CSVs
    src/
      components/         All UI panels (pure, data-driven; no direct API calls)
        Dashboard.jsx
        ForecastChart.jsx
        AnomalyPanel.jsx
        DecompositionPanel.jsx
        ValidationPanel.jsx
        ScenarioPanel.jsx
        AskPanel.jsx
        UploadPanel.jsx
        ConfigurePanel.jsx
        KeyFindings.jsx
        QualityBanner.jsx
        HealthDial.jsx
        LoadingOverlay.jsx
        ExportButton.jsx
      hooks/
        useAnalysis.js    Central state management; all API orchestration
      utils/
        api.js            Axios client; all backend calls in one place
        formatters.js     Number, date, and label formatting utilities
      App.jsx
      main.jsx
      index.css           Tailwind imports, CSS custom properties, keyframe animations
    package.json
    vite.config.js
    tailwind.config.cjs
    .env.example

---

## Environment Variables

**backend/.env**

| Variable | Required | Description |
|----------|----------|-------------|
| GROQ_API_KEY | Yes | API key from console.groq.com (free tier) |

**frontend/.env**

| Variable | Required | Description |
|----------|----------|-------------|
| VITE_API_URL | Yes | Backend base URL; defaults to http://localhost:8000 |

Credentials are loaded at runtime via python-dotenv and Vite's `import.meta.env`. Neither `.env` file is committed to the repository. The `.env.example` files in both directories list all required variables without values.

---

## Open-Source Compliance

Released under the Apache License 2.0.

All commits are signed off per the Developer Certificate of Origin (DCO) using `git commit -s`. A single email address is used for all commits and hackathon communications throughout the event.

All third-party dependencies use permissive licences: FastAPI, Uvicorn, Pydantic, and Starlette under MIT; Pandas, NumPy, and statsmodels under BSD-3; React, Vite, Tailwind CSS, and Framer Motion under MIT. No proprietary or confidential company information is used anywhere in the codebase.

---

Built for the NatWest Group — Code for Purpose India Hackathon.
