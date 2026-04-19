# ForeSight

AI-powered predictive forecasting for financial time-series data. Upload any CSV, get a statistically rigorous forecast, anomaly detection, trend decomposition, backtested accuracy scores, and plain-English AI commentary — in 5–15 seconds.

Live demo: https://foresight-mspf.onrender.com

---
<img width="1600" height="803" alt="image" src="https://github.com/user-attachments/assets/df1bbba7-c628-4075-ab6c-f0f352fa7b6a" />
<img width="1600" height="802" alt="image" src="https://github.com/user-attachments/assets/9995d926-5572-4d69-9a3c-c83422870377" />
<img width="1600" height="798" alt="image" src="https://github.com/user-attachments/assets/73476154-7a48-4a7d-b6e0-97b95d145ea9" />
<img width="1600" height="798" alt="image" src="https://github.com/user-attachments/assets/03cfebda-0b5d-43b6-a39d-34dbb41e04f6" />
<img width="1600" height="802" alt="image" src="https://github.com/user-attachments/assets/9b1eb47f-1f3d-44fd-b3a3-016a41f91885" />




## Overview

ForeSight is a full-stack forecasting platform built for financial analysts and data teams at institutions like NatWest who need fast, trustworthy predictions without writing code. The user uploads a time-series CSV file, confirms the date and value columns, and receives a complete analysis dashboard: an ETS forecast with 80% confidence bands, automatic anomaly detection sorted by severity, a three-component trend decomposition, model backtesting against naive and moving-average baselines, and a plain-English AI briefing generated from the computed results.

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
- **AI narrative generation** — sends only computed metrics (not raw data) to the Groq API (llama-3.3-70b-versatile); generates banking-contextualised plain-English briefings referencing BoE policy, capital buffers, impairment risk, and provisioning implications
- **AI anomaly explanation** — on-demand per-anomaly explanation; passes date, value, z-score, expected value, and dataset context to the LLM; responses are cached client-side in React state for the session
- **Natural language Q&A** — user can ask any question about the dataset; the system passes forecast values, confidence bands, anomaly list, and validation metrics as context to the LLM; answers are grounded in computed numbers and framed for banking analysts
- **PDF export** — generates a structured PDF briefing server-side via ReportLab with dataset label, quality report, forecast summary, anomaly list, and key findings
- **Threshold breach alerts** — user sets a critical level on the configure screen (e.g. "alert if mortgage approvals fall below 40,000"); ForeSight calculates breach probability for each forecast period from the confidence band width and displays a visual warning with per-period probability cards and a dashed threshold line on the forecast chart; combines backward-looking anomaly detection with forward-looking breach probability in a single view
- **Year-on-year comparison** — automatically compares the current forecast window against the same period one year ago; shows percentage change per period and overall YoY direction without any additional API calls; uses the seasonal period already detected from the data to determine the correct offset
- **Portfolio health scan** — when a multi-column CSV is uploaded, ForeSight automatically scans all numeric columns simultaneously before the user selects one; displays a ranked grid of metric cards showing health score, anomaly count, risk level, ETS vs naive winner, and trend direction for every column; worst metrics appear first so a risk manager sees immediately where to focus attention; clicking any card runs the full analysis on that metric
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

The test suite does not require a real Groq API key — all LLM calls are mocked.
Set the environment variable to any value before running:

```bash
cd backend
export GROQ_API_KEY=test
pytest tests/ -v
```

All 31 tests should pass.

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
```
month,avg_house_price_gbp_thousands
2018-01,225.4
2018-02,226.1
2018-03,229.8
```

1. Open the app and click Upload CSV or drag the file onto the upload area.
2. The backend auto-detects columns; confirm or override the selection.
3. Optionally set a threshold alert — for example, alert if mortgage approvals fall below 40,000.
4. Set the forecast horizon (default 4 periods; max 8).
5. Click Run Analysis. Results appear in 5–15 seconds depending on series length and cold-start state.

**Portfolio health scan for multi-column files**

Upload a CSV with multiple numeric columns — for example the UK banking multi-column dataset containing mortgage approvals, house prices, consumer credit, and mortgage rates. ForeSight automatically scans all four columns simultaneously and displays a ranked grid of metric cards before you select one for deep analysis. The worst-performing metric appears first. In one upload, a NatWest risk manager sees the health score, anomaly count, risk level, and forecast direction for every metric in their portfolio — identifying where to focus in 3 seconds without opening a single spreadsheet.

**Threshold breach alerts**

On the configure screen, set a threshold — for example "alert if mortgage approvals fall below 40". After the analysis runs, ForeSight calculates the probability of breaching that level in each forecast period based on the bootstrap confidence band. A red dashed line appears on the forecast chart at the threshold level, and a breach panel shows per-period probabilities. ForeSight combines two types of intelligence: anomaly detection tells you what already went wrong (like the COVID mortgage collapse in April 2020), while threshold alerts tell you what is about to go wrong — giving a 40–70% probability of breaching a critical level before it happens.

**Year-on-year comparison**

After running any analysis, the dashboard automatically shows a year-on-year comparison panel comparing the current forecast window against the same period one year ago. For UK house prices this reveals that collateral values are 5.5% below the same period last year — information that directly affects LTV ratios and mortgage book risk assessments. No configuration required; ForeSight infers the correct comparison window from the data frequency automatically.

**Switching between columns in a multi-column file**

After the full analysis completes on one column, use the Metric dropdown in the top header to switch to another column. The full pipeline re-runs on the new column without re-uploading.

**Exploring anomalies**

Click any row in the Anomaly Detection panel to expand a plain-English explanation of the likely cause, framed in banking context — referencing BoE policy changes, lockdown impacts, or seasonal mortgage market patterns where relevant. Anomalies are colour-coded: red for critical (|z| ≥ 3.0), amber for warning (|z| ≥ 2.5), blue for mild (|z| ≥ 2.0).

**Custom scenario**

In the Scenario Comparison panel, enter any growth percentage (between -100 and +500) and click Run to generate a custom forecast alongside the three pre-computed scenarios.

**Asking a question**

Type any plain-English question in the Ask a Question panel at the bottom of the dashboard. Examples:

- "What is the strongest seasonal month in this dataset?"
- "Is the confidence band wide enough to trust this forecast?"
- "How many standard deviations was the largest anomaly?"
- "What does this forecast mean for our provisioning requirements?"
- "Should we be concerned about capital allocation given this trend?"

**Exporting**

Click Export in the top header to download a formatted PDF briefing containing the dataset summary, quality report, forecast narrative, and key findings. The PDF is generated server-side via ReportLab.

---

## Architecture

```
Browser (React + Vite)
  UploadPanel
  PortfolioPanel        
  ConfigurePanel        
  Dashboard
    ForecastChart      
    ThresholdPanel      
    YoYPanel            
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
                          → check_threshold → narrate_forecast
                          → narrate_key_findings
  POST /portfolio-scan    run_validation + detect_anomalies + compute_anomaly_risk
                          + run_forecast for every column simultaneously
  POST /anomaly/:id/explain   narrate_anomaly (Groq, on demand)
  POST /scenario/custom   run_custom_scenario (multiplier on base forecast)
  POST /ask               answer_question (Groq, grounded in session data)
  POST /export/pdf        generate_briefing_pdf (ReportLab)
  GET  /health            liveness check
         |
         | HTTPS (Groq SDK)
         v
Groq API — llama-3.3-70b-versatile
```

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
10. `_check_threshold` — if a threshold is set, calculates breach probability for each forecast period from the confidence band width; returns per-period breach details with severity classification
11. `narrate_forecast`, `narrate_key_findings` — sends only the computed metrics (no raw data) to Groq; receives banking-contextualised plain-English output referencing NatWest-relevant concepts such as capital buffers, impairment risk, and BoE policy implications

**Portfolio scan pipeline for a single /portfolio-scan call:**

Runs steps 5, 6, 7, and 8 above on every numeric column in the uploaded file. Results are sorted by health score ascending (worst first) and returned as a ranked list. The frontend renders these as metric cards in a grid — a NatWest risk manager sees the entire portfolio at a glance in under 5 seconds.

---

## Technical Depth

**ETS model selection**

Rather than fixing a single ETS specification, the backend runs an AIC competition across up to three variants for each dataset:

- add/add (additive trend, additive seasonality) — always attempted
- add/mul (additive trend, multiplicative seasonality) — attempted when all values are strictly positive
- mul/mul (multiplicative trend and seasonality) — attempted when values are positive and the coefficient of variation exceeds 0.3

The variant with the lowest Akaike Information Criterion is selected. This matters in practice: UK house price data (slow upward trend, mild seasonal cycle) typically favours add/add, while digital banking adoption data with exponential growth favours mul/mul. Selecting automatically means the system works correctly on different datasets without manual tuning.

**Bootstrap confidence bands**

Standard ETS prediction intervals assume normally distributed errors. Financial time series rarely satisfy this. ForeSight instead resamples the fitted model's residuals with replacement 500 times per forecast horizon and takes the 10th and 90th percentiles as the band boundaries. This approach makes no distributional assumption and produces intervals that honestly reflect the actual residual spread of the specific dataset being analysed.

**Threshold breach probability**

The breach probability for each forecast period is derived from the confidence band. For a "falls below X" threshold, the probability equals the fraction of the 80% confidence band that lies below the threshold value. A 66% breach probability means two thirds of the simulated future paths breach the threshold. This is an approximation based on uniform distribution within the band — honest and directionally accurate, not falsely precise.

**Rolling z-score anomaly detection**

A global z-score would compare each value against the entire series mean and standard deviation. On a trending or growing series, this produces systematic false positives in the early periods (where values are legitimately lower than the long-run mean) and false negatives in the later periods. The rolling window (8 periods, min 3) adapts the reference distribution to the local context of each data point, which is more appropriate for financial data that changes regime over time — for example, detecting the COVID mortgage market collapse in April 2020 against the local pre-lockdown baseline rather than the full-series average.

**Year-on-year comparison**

The YoY panel requires no additional API calls. It uses the historical values already returned by the /analyse endpoint and offsets them by the detected seasonal period (12 months for monthly data, 52 weeks for weekly data, 4 quarters for quarterly data). This means the comparison is always frequency-appropriate: monthly mortgage data compares month-to-month, weekly transaction data compares week-to-week. The percentage change is calculated per period and averaged for the overall YoY badge — giving a NatWest mortgage risk manager an immediate view of whether collateral values, approval volumes, or lending rates are tracking above or below the prior year.

**Portfolio health scan**

The /portfolio-scan endpoint accepts the date column and list of value columns in the request body rather than relying on session state. This makes it stateless and robust on deployed infrastructure where multiple workers or container restarts can cause session data to be lost between requests. Each column is processed sequentially; the total scan time for a 4-column dataset with 72 monthly observations is under 2 seconds locally and under 8 seconds on Render's free tier.

**Forecast Health Score**

The 0–100 score combines three measurable components: model accuracy scored against a 20% MAPE ceiling (40 points — a MAPE of 0% scores full marks, 20% or above scores zero), confidence band calibration against the target 80% coverage rate (30 points, penalised for both over- and under-coverage), and data quality including series length and missing-value rate (30 points). The score gives a single interpretable signal about whether a given forecast should be trusted — directly analogous to the traffic-light RAG status used in NatWest's own risk reporting frameworks.

**AI narration design**

The LLM receives only the computed metrics — forecast values, band bounds, MAPE, health score, anomaly count — not the raw CSV data. This means the LLM cannot hallucinate incorrect numbers: all numerical claims in its output are grounded in values the statistical engine already calculated. The system prompt instructs the model to respond as a senior NatWest financial analyst, referencing banking-relevant concepts such as net interest margin, impairment risk, capital buffers, BoE base rate implications, and Basel III requirements where appropriate. No customer data is ever transmitted to a third-party API.

---

## NatWest Relevance

ForeSight was designed specifically for the challenges faced by NatWest Group analysts and risk managers:

**Mortgage market monitoring** — the UK mortgage approvals dataset demonstrates ForeSight detecting the April 2020 COVID lockdown collapse (9,300 approvals vs 66,000 expected) automatically. The threshold alert feature warns a treasury analyst before approvals fall below a critical level, with per-period breach probabilities derived from confidence bands.

**Portfolio-level risk visibility** — a NatWest risk manager tracking mortgage approvals, house prices, consumer credit, and mortgage rates can upload a single CSV and see all four metrics ranked by health score in one view. Consumer credit scored 48/100 amber in testing — immediately flagging it as the metric requiring attention that week without any manual analysis.

**Year-on-year performance tracking** — UK house prices in late 2023 are 5.5% below the same period in 2022, directly affecting LTV ratios and mortgage book risk. ForeSight surfaces this automatically, replacing a process that previously required analysts to manually compile and compare quarterly data.

**Honest forecasting for regulated institutions** — the Forecast Health Score and baseline comparison ensure ForeSight never presents overconfident forecasts. When naive persistence outperforms ETS, the system says so clearly. This transparency is essential for a PRA-regulated institution where forecast assumptions must be defensible.

---

## Test Coverage

Unit tests are in `backend/tests/` and can be run with `pytest tests/ -v`.

Tests cover: `detect_seasonal_period` on weekly, monthly, daily, quarterly, and long series confirming frequency-based detection; `run_forecast` output shape, confidence band ordering (low must never exceed high), and model_type field presence; `run_validation` output schema, error handling on short series, health score range (0–100), valid winner values, and short-window robustness; `detect_anomalies` detecting a planted spike, valid severity levels, and valid direction values; `quality_report` on clean data, data with missing values, and short series; `detect_columns` correctly identifying a date column. 31 tests pass.

---

## Limitations

- **Backend cold start** — hosted on Render's free tier; the first request after a period of inactivity may take 30–60 seconds while the container wakes up
- **CSV only** — Excel and JSON ingestion are not currently supported; the file must be a well-formed CSV
- **Single date column** — the system expects one date column; multi-indexed or irregular time series may need pre-processing before upload
- **Stateless session** — the in-memory `_session` dict is not persistent across server restarts and does not support concurrent users sharing a single session
- **Minimum data** — at least 12 observations are required for any forecast; 24 or more is recommended for reliable seasonal decomposition
- **Forecast horizon** — the ETS model is optimised for short-to-medium horizons; very long-range projections should be treated as directional guidance only
- **Threshold probability approximation** — breach probabilities assume uniform distribution within the confidence band; the true probability depends on the actual residual distribution which may be skewed

---

## Future Improvements

- User authentication and saved analyses — allow NatWest analysts to return to previous forecasts and track how predictions evolve over time
- Additional model types — ARIMA and Prophet as alternatives to ETS, with automatic selection by cross-validated MAPE
- Excel and JSON ingestion — extend the parse_csv pipeline to handle other common formats used in NatWest reporting
- Concurrent session handling — replace the in-memory dict with Redis to support multiple simultaneous users
- Live data connectors — scheduled re-forecasting from Bank of England Statistical Interactive Database (IADB) API for automatic updates to mortgage approval and consumer credit series
- Multi-variate modelling — forecast one column as a function of others, for example mortgage approvals as a function of the BoE base rate
- Regulatory stress test scenarios — pre-configured BoE annual cyclical scenario parameters applied as named scenario variants alongside the custom growth percentage input

---

## Folder Structure
```
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
        ThresholdPanel.jsx 
        YoYPanel.jsx       
        PortfolioPanel.jsx  
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
```

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
