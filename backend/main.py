"""
main.py
-------
ForeSight FastAPI application entry point.

Endpoints:
  POST /upload              — Upload a CSV file, get column info back.
  POST /analyse             — Run full analysis: forecast + anomaly +
                              validation + scenarios + AI narration.
  POST /anomaly/{index}/explain — Get Claude explanation for one anomaly.
  POST /scenario/custom     — Run a user-defined growth % scenario.
  POST /ask                 — Answer a plain-English question about the data.
  GET  /health              — Liveness check for deployment monitoring.

Session storage:
  In-memory dict `_session` holds the last uploaded DataFrame and
  analysis results. This is intentional for a hackathon — it keeps
  the stack simple and stateless. A production version would use
  Redis or a proper session store.

CORS:
  Allow all origins during development. In production this should be
  restricted to the deployed frontend domain.
"""

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
import math
import pandas as pd

from src.pdf_export import generate_briefing_pdf
from src.data_utils import (
    detect_columns,
    parse_csv,
    prepare_series,
    quality_report,
)
from src.forecast import run_forecast
from src.anomaly import detect_anomalies, compute_anomaly_risk
from src.validation import run_validation
from src.scenarios import run_scenarios, run_custom_scenario
from src.narrator import (
    answer_question,
    narrate_anomaly,
    narrate_forecast,
    narrate_key_findings,
)


def _sanitise(obj):
    """Recursively replace NaN/Inf with None so JSON serialisation never fails."""
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    if isinstance(obj, dict):
        return {k: _sanitise(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_sanitise(v) for v in obj]
    return obj

def _check_threshold(fc_values, band_low, band_high, dates,
                     threshold, direction, hist_mean, hist_std):
    """
    Check whether forecast periods breach a user-defined threshold.
    Returns breach details with probability estimates based on band width.
    """
    breaches = []
    for i, (fc, lo, hi, dt) in enumerate(zip(fc_values, band_low, band_high, dates)):
        band_width = hi - lo
        if band_width <= 0:
            continue

        if direction == "below" and lo < threshold:
            # What fraction of the band is below the threshold?
            below = max(0, min(band_width, threshold - lo))
            prob  = round(below / band_width * 100)
            if prob > 5:  # only report meaningful probabilities
                breaches.append({
                    "period":      i + 1,
                    "date":        dt,
                    "probability": prob,
                    "forecast":    round(fc, 2),
                    "threshold":   threshold,
                    "direction":   "below",
                    "severity":    "high" if prob >= 70 else "medium" if prob >= 40 else "low",
                })

        elif direction == "above" and hi > threshold:
            above = max(0, min(band_width, hi - threshold))
            prob  = round(above / band_width * 100)
            if prob > 5:
                breaches.append({
                    "period":      i + 1,
                    "date":        dt,
                    "probability": prob,
                    "forecast":    round(fc, 2),
                    "threshold":   threshold,
                    "direction":   "above",
                    "severity":    "high" if prob >= 70 else "medium" if prob >= 40 else "low",
                })

    # Summary
    max_prob = max((b["probability"] for b in breaches), default=0)
    return {
        "threshold":    threshold,
        "direction":    direction,
        "breaches":     breaches,
        "any_breach":   len(breaches) > 0,
        "max_probability": max_prob,
        "summary": (
            f"No periods are forecast to go {direction} {threshold}."
            if not breaches else
            f"{len(breaches)} of {len(fc_values)} forecast periods "
            f"have a risk of going {direction} {threshold}. "
            f"Highest probability: {max_prob}% in period {breaches[0]['period']}."
        ),
    }

app = FastAPI(
    title="ForeSight API",
    description=(
        "AI-powered predictive forecasting backend. "
        "Provides ETS forecasting, anomaly detection, backtesting, "
        "scenario comparison, and Groq-powered plain-English narration."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── In-memory session store ────────────────────────────────────────────────
_session: dict = {}


# ── Request / response models ──────────────────────────────────────────────

class AnalyseRequest(BaseModel):
    date_col:      str
    value_col:     str
    periods:       int = 4
    dataset_label: str = "your data"
    threshold:     float | None = None
    threshold_dir: str = "below"   # "below" or "above"


class QuestionRequest(BaseModel):
    question:      str
    dataset_label: str = "your data"


class CustomScenarioRequest(BaseModel):
    growth_pct: float
    periods:    int = 4

class PortfolioScanRequest(BaseModel):
    date_col:   str
    value_cols: list[str]


# ── Endpoints ──────────────────────────────────────────────────────────────

@app.get("/health", summary="Liveness check")
def health():
    """Returns 200 OK if the API is running."""
    return {"status": "ok", "version": "1.0.0"}


@app.post("/upload", summary="Upload a CSV file")
async def upload(file: UploadFile = File(...)):
    """Accept a CSV upload and return detected column information."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    content = await file.read()
    df = parse_csv(content)
    detected = detect_columns(df)

    _session["df"]       = df
    _session["filename"] = file.filename

    return {
        "filename":   file.filename,
        "rows":       len(df),
        "columns":    list(df.columns),
        "date_col":   detected["date_col"],
        "value_cols": detected["value_cols"],
    }


@app.post("/analyse", summary="Run full forecast analysis")
async def analyse(req: AnalyseRequest):
    """Run the complete ForeSight analysis pipeline."""
    if "df" not in _session:
        raise HTTPException(status_code=400, detail="No file uploaded. Call /upload first.")

    df = _session["df"]

    if req.date_col not in df.columns:
        raise HTTPException(status_code=400, detail=f"Column '{req.date_col}' not found.")
    if req.value_col not in df.columns:
        raise HTTPException(status_code=400, detail=f"Column '{req.value_col}' not found.")

    raw_series = prepare_series(df, req.date_col, req.value_col)
    quality    = quality_report(raw_series)
    series     = quality.pop("series_clean")

    forecast     = run_forecast(series, req.periods)
    anomalies    = detect_anomalies(series) or []
    anomaly_risk = compute_anomaly_risk(series)
    validation   = run_validation(series, holdout=req.periods)
    scenarios    = run_scenarios(series, req.periods)

    threshold_result = None
    if req.threshold is not None:
        threshold_result = _check_threshold(
            fc_values  = forecast["forecast"],
            band_low   = forecast["band_low"],
            band_high  = forecast["band_high"],
            dates      = forecast["dates"],
            threshold  = req.threshold,
            direction  = req.threshold_dir,
            hist_mean  = float(series.mean()),
            hist_std   = float(series.std()),
        )
    narration    = narrate_forecast(forecast, validation, req.dataset_label)
    key_findings = narrate_key_findings(forecast, anomalies, validation)

    _session["series"]       = series
    _session["forecast"]     = forecast
    _session["anomalies"]    = anomalies
    _session["validation"]   = validation
    _session["date_col"]     = req.date_col
    _session["value_col"]    = req.value_col
    _session["label"]        = req.dataset_label
    _session["quality"]      = quality
    _session["narration"]    = narration
    _session["key_findings"] = key_findings
    _session["threshold"] = threshold_result

    return _sanitise({
        "quality":      quality,
        "forecast":     forecast,
        "anomalies":    anomalies,
        "anomaly_risk": anomaly_risk,
        "validation":   validation,
        "scenarios":    scenarios,
        "narration":    narration,
        "key_findings": key_findings,
        "threshold": threshold_result,
    })


@app.post("/anomaly/{index}/explain", summary="Explain one anomaly")
async def explain_anomaly(index: int):
    """Generate a plain-English explanation for a specific anomaly."""
    if "anomalies" not in _session:
        raise HTTPException(status_code=400, detail="No analysis found. Call /analyse first.")

    anomalies = _session["anomalies"]

    if index < 0 or index >= len(anomalies):
        raise HTTPException(status_code=404,
            detail=f"Anomaly index {index} not found. Available: 0–{len(anomalies)-1}.")

    explanation = narrate_anomaly(
        anomalies[index],
        {"dataset": _session.get("label", "data"), "total_anomalies": len(anomalies)},
    )
    return {"index": index, "explanation": explanation}


@app.post("/scenario/custom", summary="Run a custom growth scenario")
async def custom_scenario(req: CustomScenarioRequest):
    """Compute a forecast under a user-specified growth percentage."""
    if "series" not in _session:
        raise HTTPException(status_code=400, detail="No analysis found. Call /analyse first.")

    if not -100 <= req.growth_pct <= 500:
        raise HTTPException(status_code=400, detail="growth_pct must be between -100 and 500.")

    result = run_custom_scenario(_session["series"], req.periods, req.growth_pct)
    return result


@app.post("/ask", summary="Answer a question about the data")
async def ask(req: QuestionRequest):
    """Accept a natural language question and return a Groq-generated answer."""
    if "forecast" not in _session:
        raise HTTPException(status_code=400, detail="No analysis found. Call /analyse first.")

    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    answer = answer_question(
        req.question,
        _session["forecast"],
        _session["anomalies"],
        _session["validation"],
        req.dataset_label,
    )
    return {"question": req.question, "answer": answer}

@app.post("/portfolio-scan", summary="Scan all columns for portfolio health overview")
async def portfolio_scan(req: PortfolioScanRequest):
    """
    Scan all numeric columns simultaneously and return health scores,
    anomaly counts, risk levels and trend directions for each.
    Sorted worst first so attention-needed metrics appear at the top.
    """
    if "df" not in _session:
        raise HTTPException(400, "No file uploaded. Call /upload first.")

    df         = _session["df"]
    date_col   = req.date_col
    value_cols = req.value_cols

    if not date_col or not value_cols:
        raise HTTPException(400, "date_col and value_cols are required.")

    results = []

    for col in value_cols:
        try:
            raw = prepare_series(df, date_col, col)
            q   = quality_report(raw)
            s   = q.pop("series_clean")

            vl  = run_validation(s)
            an  = detect_anomalies(s) or []
            rk  = compute_anomaly_risk(s)
            fc  = run_forecast(s, 4)

            vals = fc["historical_values"]
            if len(vals) >= 4:
                trend = "up" if vals[-1] > vals[-4] else "down" if vals[-1] < vals[-4] else "flat"
            else:
                trend = "flat"

            results.append({
                "column":        col,
                "health_score":  vl.get("health_score", 0),
                "health_label":  vl.get("health_label", "red"),
                "ets_mape":      round(vl.get("ets_mape", 0), 2),
                "winner":        vl.get("winner", "unknown"),
                "anomaly_count": len(an),
                "risk_level":    rk.get("risk_level", "unknown"),
                "trend":         trend,
                "last_value":    round(float(vals[-1]), 2) if vals else 0,
                "forecast_next": fc["forecast"][0] if fc.get("forecast") else 0,
                "n_rows":        len(s),
            })
        except Exception:
            results.append({
                "column":        col,
                "health_score":  0,
                "health_label":  "red",
                "ets_mape":      0,
                "winner":        "unknown",
                "anomaly_count": 0,
                "risk_level":    "unknown",
                "trend":         "flat",
                "last_value":    0,
                "forecast_next": 0,
                "n_rows":        0,
            })

    results.sort(key=lambda x: x["health_score"])
    need_attention = sum(1 for r in results if r["health_label"] != "green")

    return _sanitise({
        "columns":        results,
        "total":          len(results),
        "need_attention": need_attention,
        "date_col":       date_col,
    })
@app.post("/export/pdf", summary="Generate PDF briefing")
async def export_pdf():
    """Generate a clean PDF briefing from the current analysis."""
    if "forecast" not in _session:
        raise HTTPException(400, "No analysis found. Call /analyse first.")

    pdf_bytes = generate_briefing_pdf(
        dataset_label = _session.get("label", "Dataset"),
        quality       = _session.get("quality", {}),
        forecast      = _session["forecast"],
        anomalies     = _session["anomalies"],
        validation    = _session["validation"],
        narration     = _session.get("narration", {}),
        key_findings  = _session.get("key_findings", []),
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="ForeSight_Briefing.pdf"'}
    )