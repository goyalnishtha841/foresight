// import jsPDF from 'jspdf'
// import { useState } from 'react'

// export default function ExportButton({ datasetLabel, results, validation }) {
//   const [loading, setLoading] = useState(false)

//   async function handleExport() {
//     setLoading(true)
//     try {
//       const pdf = new jsPDF('p', 'mm', 'a4')
//       const pw = pdf.internal.pageSize.getWidth()
//       const ph = pdf.internal.pageSize.getHeight()
//       let y = 0

//       // ── Purple header bar ──────────────────────────────────────
//       pdf.setFillColor(105, 65, 198)
//       pdf.rect(0, 0, pw, 18, 'F')
//       pdf.setTextColor(255, 255, 255)
//       pdf.setFontSize(13)
//       pdf.setFont('helvetica', 'bold')
//       pdf.text('ForeSight — AI Predictive Forecasting', 10, 11)
//       pdf.setFontSize(9)
//       pdf.setFont('helvetica', 'normal')
//       const dateStr = new Date().toLocaleDateString('en-GB', {
//         day: 'numeric', month: 'short', year: 'numeric'
//       })
//       pdf.text(`${datasetLabel} · ${dateStr}`, pw - 10, 11, { align: 'right' })
//       y = 26

//       // ── Section: Health Score ──────────────────────────────────
//       pdf.setTextColor(30, 30, 30)
//       pdf.setFontSize(11)
//       pdf.setFont('helvetica', 'bold')
//       pdf.text('Forecast Health', 10, y)

//       const score = results?.validation?.health_score ?? 0
//       const label = results?.validation?.health_label ?? 'amber'
//       const colour = label === 'green' ? [16,185,129]
//                    : label === 'amber' ? [245,158,11]
//                    : [239,68,68]
//       pdf.setFillColor(...colour)
//       pdf.roundedRect(pw - 55, y - 7, 45, 12, 3, 3, 'F')
//       pdf.setTextColor(255, 255, 255)
//       pdf.setFontSize(10)
//       pdf.setFont('helvetica', 'bold')
//       pdf.text(`${score} / 100`, pw - 32, y, { align: 'center' })
//       y += 6

//       pdf.setTextColor(100, 100, 100)
//       pdf.setFontSize(9)
//       pdf.setFont('helvetica', 'normal')
//       const unc = results?.validation?.uncertainty_label ?? ''
//       const uncText = unc === 'high_confidence' ? 'High confidence'
//                     : unc === 'moderate'         ? 'Moderate uncertainty'
//                     : 'Directional only'
//       pdf.text(`Confidence: ${uncText}`, 10, y)
//       y += 10

//       // ── Divider ────────────────────────────────────────────────
//       pdf.setDrawColor(220, 220, 220)
//       pdf.line(10, y, pw - 10, y)
//       y += 8

//       // ── Section: Key Findings ──────────────────────────────────
//       if (results?.key_findings?.length) {
//         pdf.setTextColor(30, 30, 30)
//         pdf.setFontSize(11)
//         pdf.setFont('helvetica', 'bold')
//         pdf.text('Key Findings', 10, y)
//         y += 6

//         const labels = ['Trend', 'Anomaly', 'Watch']
//         results.key_findings.forEach((finding, i) => {
//           if (!finding) return
//           pdf.setFillColor(238, 237, 254)
//           pdf.roundedRect(10, y - 4, pw - 20, 10, 2, 2, 'F')
//           pdf.setTextColor(83, 74, 183)
//           pdf.setFontSize(8)
//           pdf.setFont('helvetica', 'bold')
//           pdf.text(labels[i] ?? `Finding ${i+1}`, 14, y + 1)
//           pdf.setTextColor(50, 50, 50)
//           pdf.setFont('helvetica', 'normal')
//           const lines = pdf.splitTextToSize(finding, pw - 50)
//           pdf.text(lines[0], 35, y + 1)
//           y += 12
//         })
//         y += 2
//       }

//       // ── Divider ────────────────────────────────────────────────
//       pdf.setDrawColor(220, 220, 220)
//       pdf.line(10, y, pw - 10, y)
//       y += 8

//       // ── Section: Forecast Summary ──────────────────────────────
//       if (results?.narration?.summary) {
//         pdf.setTextColor(30, 30, 30)
//         pdf.setFontSize(11)
//         pdf.setFont('helvetica', 'bold')
//         pdf.text('Forecast Summary', 10, y)
//         y += 6
//         pdf.setTextColor(60, 60, 60)
//         pdf.setFontSize(9)
//         pdf.setFont('helvetica', 'normal')
//         const summaryLines = pdf.splitTextToSize(results.narration.summary, pw - 20)
//         pdf.text(summaryLines, 10, y)
//         y += summaryLines.length * 5 + 6
//       }

//       // ── Divider ────────────────────────────────────────────────
//       pdf.setDrawColor(220, 220, 220)
//       pdf.line(10, y, pw - 10, y)
//       y += 8

//       // ── Section: Accuracy Metrics ──────────────────────────────
//       pdf.setTextColor(30, 30, 30)
//       pdf.setFontSize(11)
//       pdf.setFont('helvetica', 'bold')
//       pdf.text('Model Accuracy', 10, y)
//       y += 7

//       const metrics = [
//         ['ETS MAPE',        `${results?.validation?.ets_mape ?? '—'}%`],
//         ['Naive MAPE',      `${results?.validation?.naive_mape ?? '—'}%`],
//         ['Band coverage',   `${results?.validation?.band_coverage ?? '—'}%`],
//         ['Best model',      results?.validation?.winner === 'ets' ? 'ETS model' : 'Baseline'],
//       ]
//       metrics.forEach(([label, value], i) => {
//         if (i % 2 === 0) pdf.setFillColor(248, 248, 252)
//         else pdf.setFillColor(255, 255, 255)
//         pdf.rect(10, y - 4, pw - 20, 8, 'F')
//         pdf.setTextColor(100, 100, 100)
//         pdf.setFontSize(9)
//         pdf.setFont('helvetica', 'normal')
//         pdf.text(label, 14, y)
//         pdf.setTextColor(30, 30, 30)
//         pdf.setFont('helvetica', 'bold')
//         pdf.text(value, pw - 14, y, { align: 'right' })
//         y += 8
//       })
//       y += 4

//       // ── Divider ────────────────────────────────────────────────
//       pdf.setDrawColor(220, 220, 220)
//       pdf.line(10, y, pw - 10, y)
//       y += 8

//       // ── Section: Anomalies ─────────────────────────────────────
//       if (results?.anomalies?.length) {
//         pdf.setTextColor(30, 30, 30)
//         pdf.setFontSize(11)
//         pdf.setFont('helvetica', 'bold')
//         pdf.text(`Anomalies Detected (${results.anomalies.length})`, 10, y)
//         y += 7

//         results.anomalies.slice(0, 6).forEach((a) => {
//           const dot = a.severity === 'critical' ? [239,68,68]
//                     : a.severity === 'warning'  ? [245,158,11]
//                     : [252,211,77]
//           pdf.setFillColor(...dot)
//           pdf.circle(13, y - 1, 1.5, 'F')
//           pdf.setTextColor(50, 50, 50)
//           pdf.setFontSize(8.5)
//           pdf.setFont('helvetica', 'bold')
//           pdf.text(a.date, 17, y)
//           pdf.setFont('helvetica', 'normal')
//           pdf.setTextColor(100, 100, 100)
//           pdf.text(
//             `${a.direction} · value ${a.value} · z = ${a.z_score}`,
//             pw - 10, y, { align: 'right' }
//           )
//           y += 7
//           if (y > ph - 25) { pdf.addPage(); y = 15 }
//         })

//         if (results.anomalies.length > 6) {
//           pdf.setTextColor(150, 150, 150)
//           pdf.setFontSize(8)
//           pdf.text(`+ ${results.anomalies.length - 6} more anomalies`, 14, y)
//           y += 8
//         }
//       }

//       // ── Footer disclaimer ──────────────────────────────────────
//       pdf.setFillColor(245, 245, 250)
//       pdf.rect(0, ph - 14, pw, 14, 'F')
//       pdf.setFontSize(7)
//       pdf.setTextColor(150, 150, 150)
//       pdf.text(
//         'This forecast is generated from historical patterns and should be used as decision support, not as a guaranteed prediction.',
//         pw / 2, ph - 5, { align: 'center' }
//       )

//       // ── Save ───────────────────────────────────────────────────
//       pdf.save(
//         `ForeSight_${datasetLabel.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`
//       )
//     } catch (e) {
//       console.error('Export failed:', e)
//     } finally {
//       setLoading(false)
//     }
//   }

//   return (
//     <button
//       onClick={handleExport}
//       disabled={loading}
//       className="btn-ghost flex items-center gap-1.5 text-sm"
//     >
//       {loading ? (
//         <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
//           <circle className="opacity-25" cx="12" cy="12" r="10"
//                   stroke="currentColor" strokeWidth="4"/>
//           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
//         </svg>
//       ) : (
//         <svg className="w-4 h-4" fill="none" stroke="currentColor"
//              strokeWidth={2} viewBox="0 0 24 24">
//           <path strokeLinecap="round" strokeLinejoin="round"
//                 d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
//         </svg>
//       )}
//       Export briefing
//     </button>
//   )
// }

import { useState } from 'react'
import { exportPdf } from '../utils/api.js'

export default function ExportButton() {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try { await exportPdf() }
    catch (e) { console.error('Export failed:', e) }
    finally { setLoading(false) }
  }

  return (
    <button onClick={handleExport} disabled={loading}
            className="btn-ghost flex items-center gap-1.5 text-sm">
      {loading
        ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
        : <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
          </svg>
      }
      Export briefing
    </button>
  )
}