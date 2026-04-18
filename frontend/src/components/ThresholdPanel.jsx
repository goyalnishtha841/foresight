import { motion } from 'framer-motion'
import { AlertTriangle, ShieldAlert, TrendingDown, TrendingUp } from 'lucide-react'
import { fmtNumber } from '../utils/formatters.js'

const SEVERITY = {
  high: {
    bar:     'bg-destructive',
    text:    'text-destructive',
    badge:   'bg-destructive/10 border-destructive/25 text-destructive',
    card:    'bg-destructive/5 border-destructive/20',
    ring:    'ring-destructive/20',
    glow:    'shadow-[0_0_24px_-4px_hsl(4_72%_58%_/_0.25)]',
  },
  medium: {
    bar:     'bg-amber-500',
    text:    'text-amber-500',
    badge:   'bg-amber-500/10 border-amber-500/25 text-amber-500',
    card:    'bg-amber-500/5 border-amber-500/20',
    ring:    'ring-amber-500/20',
    glow:    'shadow-[0_0_24px_-4px_hsl(38_88%_58%_/_0.2)]',
  },
  low: {
    bar:     'bg-yellow-500',
    text:    'text-yellow-500',
    badge:   'bg-yellow-500/10 border-yellow-500/25 text-yellow-500',
    card:    'bg-yellow-500/5 border-yellow-500/20',
    ring:    'ring-yellow-500/20',
    glow:    'shadow-[0_0_24px_-4px_hsl(48_88%_58%_/_0.2)]',
  },
}

function ProbabilityRing({ probability, severity }) {
  const s = SEVERITY[severity]
  const radius = 20
  const circumference = 2 * Math.PI * radius
  const dash = (probability / 100) * circumference

  return (
    <div className="relative w-14 h-14 flex-shrink-0">
      <svg className="w-14 h-14 -rotate-90" viewBox="0 0 48 48">
        {/* Track */}
        <circle cx="24" cy="24" r={radius}
          fill="none" stroke="hsl(var(--border))" strokeOpacity={0.3} strokeWidth="4" />
        {/* Progress */}
        <motion.circle
          cx="24" cy="24" r={radius}
          fill="none"
          stroke={severity === 'high' ? 'hsl(4,72%,58%)' : severity === 'medium' ? 'hsl(38,88%,58%)' : 'hsl(48,88%,58%)'}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - dash }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-xs font-bold ${s.text}`}>{probability}%</span>
      </div>
    </div>
  )
}

export default function ThresholdPanel({ threshold }) {
  if (!threshold || !threshold.any_breach) return null

  const maxSeverity = threshold.breaches[0]?.severity || 'low'
  const s = SEVERITY[maxSeverity]
  const Icon = threshold.direction === 'below' ? TrendingDown : TrendingUp

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={`relative glass-card p-5 ${s.glow}`}
    >
      {/* Coloured top bar */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl ${s.bar}`} />

      {/* Header */}
      <div className="flex items-start gap-4 mb-5">
        {/* Icon */}
        <div className={`p-2.5 rounded-xl border ${s.badge} flex-shrink-0`}>
          <ShieldAlert className="w-4 h-4" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-2 h-2 rounded-full animate-pulse flex-shrink-0 ${s.bar}`} />
            <p className="text-sm font-bold text-foreground">
              Threshold breach detected
            </p>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${s.badge}`}>
              {maxSeverity} risk
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {threshold.summary}
          </p>
        </div>

        {/* Direction badge */}
        <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold flex-shrink-0 ${s.badge}`}>
          <Icon className="w-3.5 h-3.5" />
          {threshold.direction === 'below' ? 'Below' : 'Above'} {fmtNumber(threshold.threshold)}
        </div>
      </div>

      {/* Period cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {threshold.breaches.map((b, i) => {
          const bs = SEVERITY[b.severity]
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, delay: 0.1 + i * 0.06 }}
              className={`relative rounded-xl border p-3.5 ${bs.card} overflow-hidden`}
            >
              {/* Period label */}
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Period {b.period}
              </p>

              {/* Probability ring + value */}
              <div className="flex items-center gap-3 mb-2">
                <ProbabilityRing probability={b.probability} severity={b.severity} />
                <div>
                  <p className={`text-[10px] font-semibold ${bs.text}`}>breach risk</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{b.date}</p>
                </div>
              </div>

              {/* Forecast value */}
              <div className="pt-2 border-t border-border/20">
                <p className="text-[10px] text-muted-foreground">Forecast</p>
                <p className="text-sm font-bold text-foreground font-mono">
                  {fmtNumber(b.forecast, 1)}
                </p>
              </div>

              {/* Severity stripe */}
              <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${bs.bar} opacity-60`} />
            </motion.div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-border/20 flex items-center gap-2">
        <AlertTriangle className={`w-3 h-3 flex-shrink-0 ${s.text}`} />
        <p className="text-[10px] text-muted-foreground">
          Threshold set to{' '}
          <span className={`font-semibold ${s.text}`}>
            {threshold.direction === 'below' ? 'below' : 'above'} {fmtNumber(threshold.threshold)}
          </span>
          {' · '}Probabilities based on 80% confidence band width
          {' · '}Dashed line shown on forecast chart
        </p>
      </div>
    </motion.div>
  )
}