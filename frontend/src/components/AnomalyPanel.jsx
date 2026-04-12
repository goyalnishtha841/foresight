/**
 * AnomalyPanel.jsx
 * ----------------
 * Lists all detected anomalies as severity-coded badges.
 * Clicking a badge triggers a Claude API call (via parent hook)
 * and displays the plain-English explanation inline.
 *
 * Shows "No anomalies detected" with a green tick when the series is clean.
 */

import { useState } from 'react'
import { fmtDate, fmtNumber, severityColour } from '../utils/formatters.js'

export default function AnomalyPanel({
  anomalies,
  anomalyRisk,
  explanations,
  loadingIdx,
  onExplain,
}) {
  const [expanded, setExpanded] = useState(null)

  function toggle(i) {
    if (expanded === i) {
      setExpanded(null)
    } else {
      setExpanded(i)
      onExplain(i)
    }
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">Anomaly detection</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Historical data scanned using rolling z-score (±2σ threshold)
          </p>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full
          ${anomalies.length === 0
            ? 'bg-emerald-50 text-emerald-700'
            : 'bg-red-50 text-red-700'}`}>
          {anomalies.length === 0 ? 'Clean' : `${anomalies.length} found`}
        </span>
      </div>
       {anomalyRisk && anomalyRisk.risk_level !== 'unknown' && (
          <div className={`flex items-start gap-3 p-3 rounded-xl mb-4 border
            ${anomalyRisk.risk_level === 'high'
              ? 'bg-red-50 border-red-200'
              : anomalyRisk.risk_level === 'medium'
              ? 'bg-amber-50 border-amber-200'
              : 'bg-emerald-50 border-emerald-200'}`}>
            <div className="relative flex-shrink-0 mt-0.5">
              <div className={`w-2.5 h-2.5 rounded-full
                ${anomalyRisk.risk_level === 'high'   ? 'bg-red-500'
                : anomalyRisk.risk_level === 'medium' ? 'bg-amber-500'
                :                                        'bg-emerald-500'}`} />
              {anomalyRisk.risk_level !== 'low' && (
                <div className={`absolute inset-0 rounded-full animate-ping opacity-75
                  ${anomalyRisk.risk_level === 'high' ? 'bg-red-400' : 'bg-amber-400'}`} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-700">
                Forward-looking anomaly risk:&nbsp;
                <span className={
                  anomalyRisk.risk_level === 'high'   ? 'text-red-600'
                  : anomalyRisk.risk_level === 'medium' ? 'text-amber-600'
                  :                                        'text-emerald-600'
                }>
                  {anomalyRisk.risk_level.toUpperCase()}
                </span>
              </p>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                {anomalyRisk.message}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Recent volatility: {anomalyRisk.recent_std}&nbsp;·&nbsp;
                Prior volatility: {anomalyRisk.prior_std}&nbsp;·&nbsp;
                Ratio: {anomalyRisk.volatility_ratio}x
              </p>
            </div>
          </div>
        )}

      {anomalies.length === 0 ? (
        <div className="flex items-center gap-3 py-4 text-emerald-700">
          <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium">No anomalies detected</p>
            <p className="text-xs text-emerald-600 mt-0.5">
              All historical values are within normal range.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {anomalies.map((a, i) => {
            const sc     = severityColour(a.severity)
            const isOpen = expanded === i
            const isLoading = loadingIdx === i

            return (
              <div
                key={i}
                className={`rounded-xl border transition-colors duration-150
                  ${isOpen ? 'border-nw-200 bg-nw-50' : 'border-gray-100 hover:border-gray-200'}`}
              >
                {/* Badge row — click to expand */}
                <button
                  onClick={() => toggle(i)}
                  className="w-full flex items-center gap-3 p-3 text-left"
                >
                  {/* Severity dot */}
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${sc.dot}`} />

                  {/* Date + value */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-800">
                        {fmtDate(a.date)}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${sc.badge}`}>
                        {a.severity}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium
                        ${a.direction === 'spike'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                        {a.direction}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Value: {fmtNumber(a.value, 2)} &nbsp;·&nbsp;
                      Expected: {fmtNumber(a.expected, 2)} &nbsp;·&nbsp;
                      z = {a.z_score > 0 ? '+' : ''}{a.z_score}
                    </p>
                  </div>

                  {/* Expand chevron */}
                  <svg
                    className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200
                      ${isOpen ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>

                {/* Explanation */}
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 border-t border-nw-100">
                    {isLoading ? (
                      <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                        <svg className="w-4 h-4 animate-spin text-nw-600" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                        Generating explanation…
                      </div>
                    ) : explanations[i] ? (
                      <p className="text-sm text-gray-700 leading-relaxed mt-2">
                        {explanations[i]}
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
