"""
pdf_export.py
-------------
Generates a professional ForeSight briefing PDF using ReportLab.
Designed to look like an actual analyst report — not a dashboard screenshot.

Layout:
  Page 1: Header + Executive Summary + Health Score + Key Findings
  Page 2: Forecast Values + Model Accuracy + Anomaly Detection
"""

import io
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table,
    TableStyle, HRFlowable, KeepTogether
)

# ── Brand colours ──────────────────────────────────────────────────────────
PURPLE       = colors.HexColor('#6941C6')
PURPLE_LIGHT = colors.HexColor('#F3F1FF')
PURPLE_MID   = colors.HexColor('#EEEDFE')
PURPLE_TEXT  = colors.HexColor('#3C3489')
GREEN        = colors.HexColor('#059669')
GREEN_LIGHT  = colors.HexColor('#ECFDF5')
AMBER        = colors.HexColor('#D97706')
AMBER_LIGHT  = colors.HexColor('#FFFBEB')
RED          = colors.HexColor('#DC2626')
RED_LIGHT    = colors.HexColor('#FEF2F2')
GREY_LIGHT   = colors.HexColor('#F9F8FF')
GREY_MID     = colors.HexColor('#E5E7EB')
GREY_TEXT    = colors.HexColor('#6B7280')
DARK_TEXT    = colors.HexColor('#1A1523')
WHITE        = colors.white

page_w, page_h = A4
MARGIN = 15 * mm
CONTENT_W = page_w - 2 * MARGIN


def _hcol(label):
    return GREEN if label == 'green' else AMBER if label == 'amber' else RED


def _hlabel(label):
    return 'High trust' if label == 'green' else 'Moderate' if label == 'amber' else 'Low trust'


def _uncertainty(label):
    return {
        'high_confidence':  'High confidence',
        'moderate':         'Moderate uncertainty',
        'directional_only': 'Directional only — use for direction, not exact values',
    }.get(label or '', 'Moderate uncertainty')


def _winner_text(winner, ets_mape, naive_mape):
    if winner == 'ets':
        diff = round(naive_mape - ets_mape, 2)
        return f"ETS model wins — {diff}% more accurate than naive baseline"
    gap = abs(round(ets_mape - (naive_mape if winner == 'naive' else ets_mape), 2))
    name = 'Naive baseline' if winner == 'naive' else 'Moving average'
    if gap < 1.0:
        return f"{name} wins marginally — models performed similarly ({gap}% gap)"
    return f"{name} outperforms ETS on this dataset — treat forecast as directional"


def _quality_insight(quality):
    verdict = quality.get('verdict', 'warning')
    n = quality.get('n_rows', 0)
    issues = quality.get('issues', [])
    if verdict == 'clean':
        return f"{n} observations with no data quality issues detected. The dataset is reliable for forecasting."
    elif verdict == 'warning':
        issue_str = ' '.join(issues[:2]) if issues else 'Minor issues detected.'
        return f"{n} observations analysed. {issue_str} Results may be slightly affected."
    else:
        return f"Only {n} observations available. {' '.join(issues[:1])} Forecasts should be treated as directional only."


def _forecast_insight(forecast, validation):
    vals = forecast.get('forecast', [])
    hist = forecast.get('historical_values', [])
    if not vals or not hist:
        return "Forecast generated successfully."
    last_hist = hist[-1]
    fc_mean = sum(vals) / len(vals)
    pct_change = ((fc_mean - last_hist) / abs(last_hist)) * 100 if last_hist != 0 else 0
    direction = "increase" if pct_change > 1 else "decrease" if pct_change < -1 else "remain stable"
    band_low = forecast.get('band_low', vals)
    band_high = forecast.get('band_high', vals)
    band_width_pct = ((band_high[-1] - band_low[-1]) / abs(vals[-1])) * 100 if vals[-1] != 0 else 0

    insight = f"The forecast projects values to {direction} "
    if abs(pct_change) > 1:
        insight += f"by approximately {abs(pct_change):.1f}% "
    insight += f"over the next {len(vals)} period(s). "
    if band_width_pct < 10:
        insight += "The confidence band is narrow, indicating high forecast precision."
    elif band_width_pct < 25:
        insight += f"The confidence band spans ±{band_width_pct/2:.0f}% around the central forecast — plan for both upside and downside."
    else:
        insight += "The confidence band is wide, reflecting high uncertainty. Focus on the direction rather than exact values."
    return insight


def _anomaly_insight(anomalies):
    if not anomalies:
        return "No anomalies detected in the historical data. The series has been stable throughout the observation period."
    critical = [a for a in anomalies if a['severity'] == 'critical']
    warnings = [a for a in anomalies if a['severity'] == 'warning']
    mild     = [a for a in anomalies if a['severity'] == 'mild']
    spikes   = [a for a in anomalies if a['direction'] == 'spike']
    dips     = [a for a in anomalies if a['direction'] == 'dip']

    parts = [f"{len(anomalies)} anomalous period(s) detected."]
    if critical:
        parts.append(f"{len(critical)} critical anomaly/anomalies requiring immediate review.")
    if warnings:
        parts.append(f"{len(warnings)} warning-level anomaly/anomalies detected.")
    if spikes and dips:
        parts.append(f"Pattern includes {len(spikes)} upward spike(s) and {len(dips)} downward dip(s).")
    elif spikes:
        parts.append(f"All anomalies are upward spikes — possible demand surges or data errors.")
    elif dips:
        parts.append(f"All anomalies are downward dips — possible disruptions or seasonal troughs.")
    top = anomalies[0]
    parts.append(f"Most significant: {top['date']} (z={top['z_score']:+.2f}, {top['direction']}).")
    return " ".join(parts)


# ── Paragraph styles ───────────────────────────────────────────────────────

def _styles():
    return {
        'h1': ParagraphStyle('h1', fontSize=14, fontName='Helvetica-Bold',
                             textColor=DARK_TEXT, spaceBefore=6, spaceAfter=3),
        'h2': ParagraphStyle('h2', fontSize=10, fontName='Helvetica-Bold',
                             textColor=DARK_TEXT, spaceBefore=4, spaceAfter=2),
        'body': ParagraphStyle('body', fontSize=9, fontName='Helvetica',
                               textColor=DARK_TEXT, leading=14, spaceAfter=2),
        'muted': ParagraphStyle('muted', fontSize=8, fontName='Helvetica',
                                textColor=GREY_TEXT, leading=12),
        'small': ParagraphStyle('small', fontSize=7.5, fontName='Helvetica',
                                textColor=GREY_TEXT, leading=11),
        'th': ParagraphStyle('th', fontSize=8, fontName='Helvetica-Bold',
                             textColor=WHITE, alignment=TA_LEFT),
        'td': ParagraphStyle('td', fontSize=8.5, fontName='Helvetica',
                             textColor=DARK_TEXT, leading=12),
        'td_bold': ParagraphStyle('td_bold', fontSize=8.5, fontName='Helvetica-Bold',
                                  textColor=DARK_TEXT, leading=12),
        'td_muted': ParagraphStyle('td_muted', fontSize=8, fontName='Helvetica',
                                   textColor=GREY_TEXT, leading=12),
        'td_r': ParagraphStyle('td_r', fontSize=8.5, fontName='Helvetica',
                               textColor=DARK_TEXT, alignment=TA_RIGHT),
        'td_bold_r': ParagraphStyle('td_bold_r', fontSize=8.5, fontName='Helvetica-Bold',
                                    textColor=DARK_TEXT, alignment=TA_RIGHT),
        'label_purple': ParagraphStyle('lp', fontSize=8, fontName='Helvetica-Bold',
                                       textColor=PURPLE_TEXT),
        'finding': ParagraphStyle('finding', fontSize=9, fontName='Helvetica',
                                  textColor=DARK_TEXT, leading=13),
        'disclaimer': ParagraphStyle('disc', fontSize=7, fontName='Helvetica-Oblique',
                                     textColor=GREY_TEXT, alignment=TA_CENTER),
        'insight': ParagraphStyle('insight', fontSize=9, fontName='Helvetica',
                                  textColor=DARK_TEXT, leading=14,
                                  leftIndent=8, borderPad=4),
    }


# ── Header / footer drawn on every page ───────────────────────────────────

def _make_header_footer(dataset_label, disclaimer_text):
    def draw(canvas, doc):
        canvas.saveState()

        # Purple header
        canvas.setFillColor(PURPLE)
        canvas.rect(0, page_h - 16*mm, page_w, 16*mm, fill=1, stroke=0)
        canvas.setFillColor(WHITE)
        canvas.setFont('Helvetica-Bold', 11)
        canvas.drawString(MARGIN, page_h - 9*mm, 'ForeSight — AI Predictive Forecasting')
        canvas.setFont('Helvetica', 8)
        date_str = datetime.now().strftime('%d %b %Y')
        canvas.drawRightString(
            page_w - MARGIN, page_h - 9*mm,
            f'{dataset_label}  ·  {date_str}'
        )

        # Page number
        canvas.setFillColor(GREY_TEXT)
        canvas.setFont('Helvetica', 7)
        canvas.drawCentredString(page_w / 2, 6*mm,
                                 f'Page {doc.page}')

        # Footer disclaimer
        canvas.setFont('Helvetica-Oblique', 6.5)
        canvas.drawCentredString(
            page_w / 2, 3*mm,
            disclaimer_text[:130]
        )
        canvas.restoreState()
    return draw


# ── Main function ──────────────────────────────────────────────────────────

def generate_briefing_pdf(
    dataset_label: str,
    quality:       dict,
    forecast:      dict,
    anomalies:     list,
    validation:    dict,
    narration:     dict,
    key_findings:  list,
) -> bytes:
    """
    Generate a professional ForeSight briefing PDF.
    Returns PDF as bytes.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=MARGIN,
        leftMargin=MARGIN,
        topMargin=22*mm,
        bottomMargin=14*mm,
    )

    S = _styles()
    story = []
    div = lambda: [
        Spacer(1, 3*mm),
        HRFlowable(width='100%', thickness=0.5, color=GREY_MID),
        Spacer(1, 3*mm),
    ]

    disclaimer = narration.get(
        'disclaimer',
        'This forecast is generated from historical patterns and should be '
        'used as decision support, not as a guaranteed prediction.'
    )

    # ── SECTION 1: Executive summary banner ───────────────────────────────
    score  = validation.get('health_score', 0)
    hlabel = validation.get('health_label', 'amber')
    hcol   = _hcol(hlabel)
    htext  = _hlabel(hlabel)
    unc    = _uncertainty(validation.get('uncertainty_label'))
    winner = validation.get('winner', '')

    # Health score row
    score_data = [[
        Paragraph(f'<b>{score}</b><br/><font size="7" color="grey">{htext}</font>',
                  ParagraphStyle('sc', fontSize=20, fontName='Helvetica-Bold',
                                 textColor=hcol, alignment=TA_CENTER, leading=22)),
        Table([
            [Paragraph('<b>ETS MAPE</b>', S['muted']),
             Paragraph('<b>vs Naive</b>', S['muted']),
             Paragraph('<b>Band Coverage</b>', S['muted']),
             Paragraph('<b>Confidence</b>', S['muted'])],
            [Paragraph(f"<b>{validation.get('ets_mape','?')}%</b>",
                       ParagraphStyle('v', fontSize=13, fontName='Helvetica-Bold',
                                      textColor=DARK_TEXT)),
             Paragraph(f"{validation.get('naive_mape','?')}%", S['td_muted']),
             Paragraph(f"<b>{validation.get('band_coverage','?')}%</b>",
                       ParagraphStyle('v', fontSize=13, fontName='Helvetica-Bold',
                                      textColor=DARK_TEXT)),
             Paragraph(unc, ParagraphStyle('v', fontSize=8, fontName='Helvetica',
                                           textColor=hcol))],
        ], colWidths=[CONTENT_W*0.2]*4,
        style=TableStyle([
            ('TOPPADDING',   (0,0),(-1,-1), 3),
            ('BOTTOMPADDING',(0,0),(-1,-1), 3),
            ('LEFTPADDING',  (0,0),(-1,-1), 4),
        ])),
    ]]
    score_table = Table(score_data,
                        colWidths=[CONTENT_W*0.18, CONTENT_W*0.82])
    score_table.setStyle(TableStyle([
        ('BACKGROUND',   (0,0), (0,0), colors.HexColor('#F0FDF4') if hlabel=='green'
                                       else colors.HexColor('#FFFBEB') if hlabel=='amber'
                                       else colors.HexColor('#FEF2F2')),
        ('BACKGROUND',   (1,0), (1,0), GREY_LIGHT),
        ('TOPPADDING',   (0,0),(-1,-1), 6),
        ('BOTTOMPADDING',(0,0),(-1,-1), 6),
        ('LEFTPADDING',  (0,0),(-1,-1), 8),
        ('VALIGN',       (0,0),(-1,-1), 'MIDDLE'),
        ('GRID',         (0,0),(-1,-1), 0.5, WHITE),
    ]))
    story.append(score_table)
    story.append(Spacer(1, 2*mm))

    # Model winner insight
    winner_insight = _winner_text(
        winner,
        validation.get('ets_mape', 0),
        validation.get('naive_mape', 0)
    )
    story.append(Paragraph(f'&#9679; {winner_insight}', S['muted']))
    story.extend(div())

    # ── SECTION 2: Data Quality ────────────────────────────────────────────
    story.append(Paragraph('Data Quality', S['h2']))
    q_insight = _quality_insight(quality)
    qcol = GREEN_LIGHT if quality.get('verdict')=='clean' else AMBER_LIGHT
    q_table = Table(
        [[Paragraph(q_insight, S['body'])]],
        colWidths=[CONTENT_W]
    )
    q_table.setStyle(TableStyle([
        ('BACKGROUND',   (0,0),(-1,-1), qcol),
        ('TOPPADDING',   (0,0),(-1,-1), 6),
        ('BOTTOMPADDING',(0,0),(-1,-1), 6),
        ('LEFTPADDING',  (0,0),(-1,-1), 8),
        ('RIGHTPADDING', (0,0),(-1,-1), 8),
    ]))
    story.append(q_table)
    story.extend(div())

    # ── SECTION 3: Key Findings ────────────────────────────────────────────
    if key_findings:
        story.append(Paragraph('Key Findings', S['h1']))
        labels = ['Trend', 'Anomaly', 'Watch']
        rows = []
        for i, finding in enumerate(key_findings[:3]):
            if not finding:
                continue
            rows.append([
                Paragraph(labels[i] if i < len(labels) else f'Finding {i+1}',
                          S['label_purple']),
                Paragraph(finding, S['finding']),
            ])
        if rows:
            ft = Table(rows, colWidths=[18*mm, CONTENT_W - 18*mm])
            ft.setStyle(TableStyle([
                ('ROWBACKGROUNDS', (0,0),(-1,-1), [PURPLE_MID, WHITE]),
                ('TOPPADDING',    (0,0),(-1,-1), 6),
                ('BOTTOMPADDING', (0,0),(-1,-1), 6),
                ('LEFTPADDING',   (0,0),(-1,-1), 8),
                ('RIGHTPADDING',  (0,0),(-1,-1), 8),
                ('GRID',          (0,0),(-1,-1), 0.3, colors.HexColor('#E0DAFF')),
            ]))
            story.append(ft)
        story.extend(div())

    # ── SECTION 4: Forecast Summary + Insight ─────────────────────────────
    story.append(Paragraph('Forecast Summary', S['h1']))

    summary = narration.get('summary', '')
    if summary:
        story.append(Paragraph(summary, S['body']))
        story.append(Spacer(1, 2*mm))

    fc_insight = _forecast_insight(forecast, validation)
    story.append(Paragraph(
        f'<b>Analysis:</b> {fc_insight}', S['insight']
    ))
    story.extend(div())

    # ── SECTION 5: Forecast Values ─────────────────────────────────────────
    if forecast.get('dates'):
        story.append(Paragraph('Forecast Values', S['h1']))
        header = [
            Paragraph('<b>Period</b>',     S['th']),
            Paragraph('<b>Forecast</b>',   S['th']),
            Paragraph('<b>Lower (10%)</b>',S['th']),
            Paragraph('<b>Upper (90%)</b>',S['th']),
            Paragraph('<b>Range width</b>',S['th']),
        ]
        rows = [header]
        for i, d in enumerate(forecast['dates']):
            fc_val = forecast['forecast'][i]
            lo     = forecast['band_low'][i]
            hi     = forecast['band_high'][i]
            width  = hi - lo
            rows.append([
                Paragraph(d, S['td']),
                Paragraph(f'{fc_val:,.2f}', S['td_bold']),
                Paragraph(f'{lo:,.2f}',     S['td_muted']),
                Paragraph(f'{hi:,.2f}',     S['td_muted']),
                Paragraph(f'{width:,.2f}',  S['td_muted']),
            ])
        cw = CONTENT_W / 5
        ft = Table(rows, colWidths=[cw]*5)
        ft.setStyle(TableStyle([
            ('BACKGROUND',    (0,0),(-1, 0), PURPLE),
            ('ROWBACKGROUNDS',(0,1),(-1,-1), [GREY_LIGHT, WHITE]),
            ('TOPPADDING',    (0,0),(-1,-1), 5),
            ('BOTTOMPADDING', (0,0),(-1,-1), 5),
            ('LEFTPADDING',   (0,0),(-1,-1), 6),
            ('RIGHTPADDING',  (0,0),(-1,-1), 6),
            ('GRID',          (0,0),(-1,-1), 0.3, GREY_MID),
        ]))
        story.append(ft)
        story.append(Spacer(1, 2*mm))
        story.append(Paragraph(
            'Lower and upper bands represent the 80% confidence interval '
            'computed from 500 bootstrap simulations of model residuals.',
            S['small']
        ))
        story.extend(div())

    # ── SECTION 6: Model Accuracy ──────────────────────────────────────────
    story.append(Paragraph('Model Accuracy — Backtest Results', S['h1']))
    story.append(Paragraph(
        f'The model was tested by holding out the last '
        f'{len(validation.get("holdout_dates", [4]))} periods and '
        f'comparing predictions against known actual values.',
        S['body']
    ))
    story.append(Spacer(1, 2*mm))

    acc_data = [
        [Paragraph('<b>Model</b>', S['th']),
         Paragraph('<b>MAPE</b>',  S['th']),
         Paragraph('<b>MAE</b>',   S['th']),
         Paragraph('<b>Result</b>',S['th'])],
        [Paragraph('ETS model',       S['td']),
         Paragraph(f"{validation.get('ets_mape','?')}%",   S['td_bold']),
         Paragraph(f"{validation.get('ets_mae','—')}",     S['td']),
         Paragraph('Winner' if winner=='ets' else '—',
                   ParagraphStyle('w', fontSize=8.5, fontName='Helvetica-Bold',
                                  textColor=GREEN if winner=='ets' else GREY_TEXT))],
        [Paragraph('Naive baseline',  S['td']),
         Paragraph(f"{validation.get('naive_mape','?')}%", S['td']),
         Paragraph('—', S['td_muted']),
         Paragraph('Winner' if winner=='naive' else '—',
                   ParagraphStyle('w', fontSize=8.5, fontName='Helvetica-Bold',
                                  textColor=GREEN if winner=='naive' else GREY_TEXT))],
        [Paragraph('Moving average',  S['td']),
         Paragraph(f"{validation.get('ma_mape','?')}%",    S['td']),
         Paragraph('—', S['td_muted']),
         Paragraph('Winner' if winner=='moving_average' else '—',
                   ParagraphStyle('w', fontSize=8.5, fontName='Helvetica-Bold',
                                  textColor=GREEN if winner=='moving_average' else GREY_TEXT))],
    ]
    cw2 = CONTENT_W / 4
    at = Table(acc_data, colWidths=[cw2*1.8, cw2*0.7, cw2*0.7, cw2*0.8])
    at.setStyle(TableStyle([
        ('BACKGROUND',    (0,0),(-1, 0), PURPLE),
        ('BACKGROUND',    (0,1),(-1, 1),
         GREEN_LIGHT if winner=='ets' else GREY_LIGHT),
        ('ROWBACKGROUNDS',(0,2),(-1,-1), [WHITE, GREY_LIGHT]),
        ('TOPPADDING',    (0,0),(-1,-1), 5),
        ('BOTTOMPADDING', (0,0),(-1,-1), 5),
        ('LEFTPADDING',   (0,0),(-1,-1), 8),
        ('GRID',          (0,0),(-1,-1), 0.3, GREY_MID),
    ]))
    story.append(at)
    story.append(Spacer(1, 2*mm))
    story.append(Paragraph(
        f'Band coverage: {validation.get("band_coverage","?")}% of actual values '
        f'fell inside the 80% confidence band (target: ~80%). '
        f'{"Well calibrated." if 70 <= float(validation.get("band_coverage",0)) <= 90 else "Band may be over- or under-confident."}',
        S['small']
    ))
    story.extend(div())

    # ── SECTION 7: Anomaly Detection ──────────────────────────────────────
    story.append(Paragraph(
        f'Anomaly Detection ({len(anomalies)} found)', S['h1']
    ))

    anom_insight = _anomaly_insight(anomalies)
    ai_table = Table(
        [[Paragraph(anom_insight, S['body'])]],
        colWidths=[CONTENT_W]
    )
    ai_table.setStyle(TableStyle([
        ('BACKGROUND',   (0,0),(-1,-1),
         RED_LIGHT if any(a['severity']=='critical' for a in anomalies) else AMBER_LIGHT if anomalies else GREEN_LIGHT),
        ('TOPPADDING',   (0,0),(-1,-1), 6),
        ('BOTTOMPADDING',(0,0),(-1,-1), 6),
        ('LEFTPADDING',  (0,0),(-1,-1), 8),
        ('RIGHTPADDING', (0,0),(-1,-1), 8),
    ]))
    story.append(ai_table)
    story.append(Spacer(1, 3*mm))

    if anomalies:
        a_header = [
            Paragraph('<b>Date</b>',     S['th']),
            Paragraph('<b>Value</b>',    S['th']),
            Paragraph('<b>Expected</b>', S['th']),
            Paragraph('<b>Z-score</b>',  S['th']),
            Paragraph('<b>Type</b>',     S['th']),
            Paragraph('<b>Severity</b>', S['th']),
        ]
        a_rows = [a_header]
        for a in anomalies[:12]:
            sc = RED if a['severity']=='critical' else AMBER if a['severity']=='warning' else DARK_TEXT
            a_rows.append([
                Paragraph(a['date'],              S['td']),
                Paragraph(f"{a['value']:,.2f}",   S['td_bold']),
                Paragraph(f"{a['expected']:,.2f}", S['td_muted']),
                Paragraph(f"{a['z_score']:+.2f}", S['td']),
                Paragraph(a['direction'].upper(),  S['td']),
                Paragraph(a['severity'].upper(),
                          ParagraphStyle('sv', fontSize=8, fontName='Helvetica-Bold',
                                         textColor=sc)),
            ])
        cw3 = CONTENT_W / 6
        at2 = Table(a_rows, colWidths=[cw3]*6)
        at2.setStyle(TableStyle([
            ('BACKGROUND',    (0,0),(-1, 0), PURPLE),
            ('ROWBACKGROUNDS',(0,1),(-1,-1), [GREY_LIGHT, WHITE]),
            ('TOPPADDING',    (0,0),(-1,-1), 4),
            ('BOTTOMPADDING', (0,0),(-1,-1), 4),
            ('LEFTPADDING',   (0,0),(-1,-1), 5),
            ('RIGHTPADDING',  (0,0),(-1,-1), 5),
            ('GRID',          (0,0),(-1,-1), 0.3, GREY_MID),
            ('FONTSIZE',      (0,0),(-1,-1), 7.5),
        ]))
        story.append(at2)
        if len(anomalies) > 12:
            story.append(Spacer(1, 2*mm))
            story.append(Paragraph(
                f'+ {len(anomalies)-12} additional anomalies not shown. '
                f'All anomalies are available in the ForeSight dashboard.',
                S['small']
            ))

    # ── Build ──────────────────────────────────────────────────────────────
    cb = _make_header_footer(dataset_label, disclaimer)
    doc.build(story, onFirstPage=cb, onLaterPages=cb)
    buffer.seek(0)
    return buffer.read()