import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, TrendingUp, TrendingDown, ChevronDown, Loader2 } from 'lucide-react'
import { fmtDate, fmtNumber, severityColour } from '../utils/formatters.js'

const severityStyles = {
  critical: 'bg-destructive/[0.06] border-destructive/20 hover:bg-destructive/[0.1]',
  warning:  'bg-warning/[0.06] border-warning/20 hover:bg-warning/[0.1]',
  minor:    'bg-primary/[0.06] border-primary/20 hover:bg-primary/[0.1]',
}
const severityDot = {
  critical: 'bg-destructive shadow-[0_0_8px_hsl(0,72%,51%,0.5)]',
  warning:  'bg-warning shadow-[0_0_8px_hsl(38,92%,50%,0.5)]',
  minor:    'bg-primary shadow-[0_0_8px_hsl(217,91%,60%,0.4)]',
}
const severityText = {
  critical: 'text-destructive',
  warning:  'text-warning',
  minor:    'text-primary',
}
const severityBorder = {
  critical: 'border-l-destructive/40',
  warning:  'border-l-warning/40',
  minor:    'border-l-primary/40',
}

function getSeverityKey(s) {
  if (s === 'critical') return 'critical'
  if (s === 'warning')  return 'warning'
  return 'minor'
}

export default function AnomalyPanel({ anomalies, anomalyRisk, explanations, loadingIdx, onExplain }) {
  const [expanded, setExpanded] = useState(null)

  function toggle(i) {
    if (expanded === i) { setExpanded(null) }
    else { setExpanded(i); onExplain(i) }
  }

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-secondary/40 border border-border/20">
            <AlertTriangle className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Anomaly detection</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Rolling z-score (±2σ threshold)</p>
          </div>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border
          ${anomalies.length === 0
            ? 'bg-success/10 text-success border-success/20'
            : 'bg-destructive/10 text-destructive border-destructive/20'}`}>
          {anomalies.length === 0 ? 'Clean' : `${anomalies.length} found`}
        </span>
      </div>

      {/* Anomaly risk banner */}
      {anomalyRisk && anomalyRisk.risk_level !== 'unknown' && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-start gap-3 p-3 rounded-xl mb-4 border
            ${anomalyRisk.risk_level === 'high' ? 'bg-destructive/[0.06] border-destructive/20'
              : anomalyRisk.risk_level === 'medium' ? 'bg-warning/[0.06] border-warning/20'
              : 'bg-success/[0.06] border-success/20'}`}
        >
          <div className="relative flex-shrink-0 mt-1">
            <div className={`w-2.5 h-2.5 rounded-full
              ${anomalyRisk.risk_level === 'high' ? 'bg-destructive'
              : anomalyRisk.risk_level === 'medium' ? 'bg-warning' : 'bg-success'}`} />
            {anomalyRisk.risk_level !== 'low' && (
              <div className={`absolute inset-0 rounded-full animate-ping opacity-60
                ${anomalyRisk.risk_level === 'high' ? 'bg-destructive' : 'bg-warning'}`} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground">
              Forward-looking anomaly risk:{' '}
              <span className={anomalyRisk.risk_level === 'high' ? 'text-destructive'
                : anomalyRisk.risk_level === 'medium' ? 'text-warning' : 'text-success'}>
                {anomalyRisk.risk_level.toUpperCase()}
              </span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{anomalyRisk.message}</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Recent vol: {anomalyRisk.recent_std} · Prior vol: {anomalyRisk.prior_std} · Ratio: {anomalyRisk.volatility_ratio}x
            </p>
          </div>
        </motion.div>
      )}

      {anomalies.length === 0 ? (
        <div className="flex items-center gap-3 py-4 text-success">
          <div className="w-8 h-8 rounded-full bg-success/10 border border-success/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium">No anomalies detected</p>
            <p className="text-xs text-success/70 mt-0.5">All historical values are within normal range.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {anomalies.map((a, i) => {
            const sk = getSeverityKey(a.severity)
            const isOpen = expanded === i
            const isLoading = loadingIdx === i

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className={`rounded-xl border border-l-[3px] transition-all duration-200
                  ${severityStyles[sk]} ${severityBorder[sk]}`}
              >
                <button onClick={() => toggle(i)} className="w-full flex items-center gap-3 p-3 text-left">
                  <div className={`shrink-0 p-1.5 rounded-lg bg-secondary/30 ${severityText[sk]}`}>
                    {a.direction === 'spike' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground">{fmtDate(a.date)}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wide ${severityText[sk]} bg-current/5`}
                            style={{ borderColor: 'currentColor', opacity: undefined }}>
                        {a.severity}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Value: {fmtNumber(a.value, 2)} · Expected: {fmtNumber(a.expected, 2)} · z = {a.z_score > 0 ? '+' : ''}{a.z_score}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <motion.div
                      animate={{ boxShadow: ['0 0 0px transparent', `0 0 8px currentColor`, '0 0 0px transparent'] }}
                      transition={{ repeat: Infinity, duration: 2.5 }}
                      className={`w-1.5 h-1.5 rounded-full ${severityDot[sk]}`}
                    />
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </motion.div>
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-1 border-t border-border/20">
                        {isLoading ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            Generating explanation…
                          </div>
                        ) : explanations[i] ? (
                          <p className="text-sm text-muted-foreground leading-relaxed mt-2">{explanations[i]}</p>
                        ) : null}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
