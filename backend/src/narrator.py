"""
narrator.py
-----------
All AI narration for ForeSight using Groq API (free tier).
Model: llama-3.3-70b-versatile — fast, free, high quality.

Design principle: Groq does narration only, never maths.
All numbers come from the statistical engine. Groq receives structured
JSON and converts it to plain English. No raw CSV data is ever sent.
"""

import json
import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
_MODEL  = "llama-3.3-70b-versatile"

DISCLAIMER = (
    "This forecast is generated from historical patterns and should be "
    "used as decision support, not as a guaranteed prediction."
)

_UNCERTAINTY_MAP = {
    "high_confidence":  "high confidence",
    "moderate":         "moderate uncertainty — plan for both outcomes",
    "directional_only": "high uncertainty — treat as directional guidance only",
}


def _call_groq(prompt: str, max_tokens: int = 200) -> str:
    """
    Make a single Groq API call and return the text response.

    Args:
        prompt:     Full prompt string.
        max_tokens: Maximum response length.

    Returns:
        Stripped response text.

    Raises:
        RuntimeError: If the API call fails.
    """
    try:
        response = _client.chat.completions.create(
            model=_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=max_tokens,
            temperature=0.3,
        )
        return response.choices[0].message.content.strip()
    except Exception as exc:
        raise RuntimeError(f"Groq API call failed: {exc}") from exc


def narrate_forecast(forecast: dict,
                     validation: dict,
                     dataset_label: str = "your data") -> dict:
    """
    Generate a 3-sentence plain-English forecast summary.
    Sends only computed metrics — not raw data — to Groq.
    """
    uncertainty_text = _UNCERTAINTY_MAP.get(
        validation.get("uncertainty_label", "moderate"),
        "moderate uncertainty",
    )
    context = {
        "dataset": dataset_label,
        "periods_ahead": len(forecast["dates"]),
        "forecast_values": forecast["forecast"],
        "band_low": forecast["band_low"],
        "band_high": forecast["band_high"],
        "model_mape_pct": validation.get("ets_mape"),
        "beats_naive_baseline": validation.get("winner") == "ets",
        "uncertainty_level": uncertainty_text,
    }
    prompt = f"""You are a concise data analyst briefing a non-technical \
business user at a bank.

Data context: {json.dumps(context)}

Write exactly 3 sentences. No bullet points, no markdown, no jargon.
Sentence 1: The central forecast direction and approximate magnitude.
Sentence 2: The uncertainty range and what it means practically.
Sentence 3: The single most important thing to watch or act on.
Maximum 90 words total."""

    summary = _call_groq(prompt, max_tokens=180)
    return {"summary": summary, "disclaimer": DISCLAIMER}


def narrate_anomaly(anomaly: dict, context: dict) -> str:
    """Generate a 3-sentence plain-English anomaly explanation."""
    prompt = f"""You are a concise data analyst explaining an unusual \
data point to a non-technical business user.

Anomaly: {json.dumps(anomaly)}
Context: {json.dumps(context)}

Write exactly 3 sentences. No bullet points, no markdown, no jargon.
Sentence 1: What happened — the date, the value, how unusual it was.
Sentence 2: A likely business reason based on the data pattern shown.
Sentence 3: The recommended next step for the user.
Maximum 80 words total."""

    return _call_groq(prompt, max_tokens=160)


def narrate_key_findings(forecast: dict,
                         anomalies: list,
                         validation: dict) -> list:
    anomalies= anomalies or []
    """Generate 3 proactive key findings shown immediately after upload."""
    context = {
        "forecast_values": forecast["forecast"],
        "band_low": forecast["band_low"],
        "band_high": forecast["band_high"],
        "health_score": validation.get("health_score"),
        "model_beats_baseline": validation.get("winner") == "ets",
        "anomaly_count": len(anomalies),
        "top_anomaly": anomalies[0] if anomalies else "none",
    }
    prompt = f"""You are a senior data analyst writing a Monday morning \
briefing for a bank manager.

Data context: {json.dumps(context)}

Write exactly 3 findings. Each is one plain-English sentence.
Finding 1: The most important trend in the forecast period.
Finding 2: The most significant anomaly, or "No anomalies detected" \
if there are none.
Finding 3: The single most important action or watch point.

Return only the 3 sentences separated by the pipe character |.
No labels, no bullets, no markdown, no line breaks."""

    raw = _call_groq(prompt, max_tokens=220)
    parts = [p.strip() for p in raw.split("|")]
    while len(parts) < 3:
        parts.append("")
    return parts[:3]


def answer_question(question: str,
                    forecast: dict,
                    anomalies: list,
                    validation: dict,
                    dataset_label: str) -> str:
    """Answer a plain-English question grounded in forecast context."""
    context = {
        "dataset": dataset_label,
        "forecast_dates": forecast["dates"],
        "forecast_values": forecast["forecast"],
        "band_low": forecast["band_low"],
        "band_high": forecast["band_high"],
        "model_mape_pct": validation.get("ets_mape"),
        "health_score": validation.get("health_score"),
        "anomaly_count": len(anomalies),
        "top_anomalies": anomalies[:2],
    }
    prompt = f"""You are a helpful data analyst assistant. A user is \
viewing a forecast dashboard for "{dataset_label}" and has asked:

"{question}"

Available data: {json.dumps(context)}

Answer in 2-3 plain-English sentences. Be specific to the numbers above.
If you cannot answer from the available data, say so honestly.
No bullet points, no markdown."""

    return _call_groq(prompt, max_tokens=200)