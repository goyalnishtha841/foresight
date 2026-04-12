import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, TrendingUp, TrendingDown, ChevronDown, Loader2, ShieldAlert } from 'lucide-react'
import { fmtDate, fmtNumber } from '../utils/formatters.js'

/* ── Per-severity colour tokens ── */
const SEV = {
  critical: {
    card:   'border-red-500/40 bg-red-500/8',
    leftBar:'bg-red-500',
    icon:   'bg-red-500/15 border-red-500/25 text-red-400',
    badge:  'bg-red-500/12 border-red-500/30 text-red-400',
    dot:    'bg-red-500',
    glow:   '0 0 8px hsl(4,72%,55%,0.55)',
    label:  'High',
  },
  warning: {
    card:   'border-amber-500/40 bg-amber-500/6',
    leftBar:'bg-amber-500',
    icon:   'bg-amber-500/15 border-amber-500/25 text-amber-400',
    badge:  'bg-amber-500/12 border-amber-500/30 text-amber-400',
    dot:    'bg-amber-500',
    glow:   '0 0 8px hsl(38,88%,55%,0.55)',
    label:  'Medium',
  },
  minor: {
    card:   'border-blue-500/30 bg-blue-500/5',
    leftBar:'bg-blue-500/70',
    icon:   'bg-blue-500/12 border-blue-500/20 text-blue-400',
    badge:  'bg-blue-500/10 border-blue-500/20 text-blue-400',
    dot:    'bg-blue-500',
    glow:   '0 0 8px hsl(217,85%,60%,0.4)',
    label:  'Low',
  },
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
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/20">
            <ShieldAlert className="w-4 h-4 text-destructive" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Anomaly Detection</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Rolling z-score (±2σ threshold)</p>
          </div>
        </div>
        <motion.span
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`text-xs font-bold px-3 py-1 rounded-full border ${
            anomalies.length === 0
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-destructive/12 text-red-400 border-red-500/25'
          }`}
        >
          {anomalies.length === 0 ? '✓ Clean' : `${anomalies.length} found`}
        </motion.span>
      </div>

      {/* Anomaly risk banner */}
      {anomalyRisk && anomalyRisk.risk_level !== 'unknown' && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-start gap-3 p-3.5 rounded-xl mb-4 border ${
            anomalyRisk.risk_level === 'high'   ? 'bg-red-500/[0.07] border-red-500/25'
            : anomalyRisk.risk_level === 'medium' ? 'bg-amber-500/[0.07] border-amber-500/25'
            : 'bg-emerald-500/[0.07] border-emerald-500/20'
          }`}
        >
          <div className="relative flex-shrink-0 mt-1">
            <div className={`w-2.5 h-2.5 rounded-full ${
              anomalyRisk.risk_level === 'high' ? 'bg-red-500'
              : anomalyRisk.risk_level === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
            }`} />
            {anomalyRisk.risk_level !== 'low' && (
              <div className={`absolute inset-0 rounded-full animate-ping opacity-60 ${
                anomalyRisk.risk_level === 'high' ? 'bg-red-500' : 'bg-amber-500'
              }`} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground">
              Forward-looking anomaly risk:{' '}
              <span className={
                anomalyRisk.risk_level === 'high'   ? 'text-red-400'
                : anomalyRisk.risk_level === 'medium' ? 'text-amber-400'
                : 'text-emerald-400'
              }>{anomalyRisk.risk_level.toUpperCase()}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{anomalyRisk.message}</p>
            <p className="text-xs text-muted-foreground/50 mt-1">
              Recent vol: {anomalyRisk.recent_std} · Prior vol: {anomalyRisk.prior_std} · Ratio: {anomalyRisk.volatility_ratio}x
            </p>
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {anomalies.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 py-5 text-emerald-400"
        >
          <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold">No anomalies detected</p>
            <p className="text-xs text-emerald-400/60 mt-0.5">All historical values are within normal range.</p>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-2.5">
          {anomalies.map((a, i) => {
            const sk = getSeverityKey(a.severity)
            const sev = SEV[sk]
            const isOpen = expanded === i
            const isLoading = loadingIdx === i

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className={`rounded-xl border overflow-hidden relative ${sev.card}`}
              >
                {/* Left accent bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${sev.leftBar}`} />

                <button onClick={() => toggle(i)} className="w-full flex items-center gap-3 p-3.5 pl-4 text-left">
                  {/* Icon */}
                  <div className={`shrink-0 p-1.5 rounded-lg border ${sev.icon}`}>
                    {a.direction === 'spike'
                      ? <TrendingUp className="w-3.5 h-3.5" />
                      : <TrendingDown className="w-3.5 h-3.5" />
                    }
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">{fmtDate(a.date)}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wide ${sev.badge}`}>
                        {sev.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Value: <span className="font-mono text-foreground/80">{fmtNumber(a.value, 2)}</span>
                      {' '}· Expected: <span className="font-mono text-foreground/80">{fmtNumber(a.expected, 2)}</span>
                      {' '}· z = <span className="font-mono font-semibold">{a.z_score > 0 ? '+' : ''}{a.z_score}</span>
                    </p>
                  </div>

                  {/* Severity dot + chevron */}
                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    <div className="relative">
                      <div
                        className={`w-2 h-2 rounded-full ${sev.dot}`}
                        style={{ boxShadow: sev.glow }}
                      />
                      {sk !== 'minor' && (
                        <div className={`absolute inset-0 rounded-full animate-ping opacity-50 ${sev.dot}`} />
                      )}
                    </div>
                    <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
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
                      <div className="px-4 pb-4 pt-1 border-t border-border/15 ml-1">
                        {isLoading ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            Generating explanation…
                          </div>
                        ) : explanations[i] ? (
                          <motion.p
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-sm text-muted-foreground leading-relaxed mt-2"
                          >
                            {explanations[i]}
                          </motion.p>
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
