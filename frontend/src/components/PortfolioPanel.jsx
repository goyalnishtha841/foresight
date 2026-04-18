import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, AlertTriangle, ShieldCheck, Zap, ChevronRight, Activity } from 'lucide-react'
import { fmtNumber } from '../utils/formatters.js'

// ── Helpers ────────────────────────────────────────────────────────────────

const HEALTH = {
  green: {
    dial:   'text-emerald-400',
    badge:  'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    bar:    'bg-emerald-500',
    glow:   'shadow-[0_0_20px_-4px_hsl(152_60%_50%_/_0.2)]',
    border: 'border-emerald-500/20',
  },
  amber: {
    dial:   'text-amber-400',
    badge:  'bg-amber-500/10 border-amber-500/20 text-amber-400',
    bar:    'bg-amber-500',
    glow:   'shadow-[0_0_20px_-4px_hsl(38_88%_58%_/_0.2)]',
    border: 'border-amber-500/20',
  },
  red: {
    dial:   'text-destructive',
    badge:  'bg-destructive/10 border-destructive/20 text-destructive',
    bar:    'bg-destructive',
    glow:   'shadow-[0_0_20px_-4px_hsl(4_72%_58%_/_0.2)]',
    border: 'border-destructive/20',
  },
}

const RISK = {
  high:    'text-destructive',
  medium:  'text-amber-400',
  low:     'text-emerald-400',
  unknown: 'text-muted-foreground',
}

function TrendIcon({ trend }) {
  if (trend === 'up')   return <TrendingUp  className="w-3.5 h-3.5 text-emerald-400" />
  if (trend === 'down') return <TrendingDown className="w-3.5 h-3.5 text-destructive" />
  return <Minus className="w-3.5 h-3.5 text-muted-foreground" />
}

function HealthArc({ score, label }) {
  const h = HEALTH[label] || HEALTH.amber
  const radius = 28
  const circumference = Math.PI * radius   // half circle
  const progress = (score / 100) * circumference

  return (
    <div className="relative w-20 h-12 flex items-end justify-center">
      <svg width="80" height="48" viewBox="0 0 80 48">
        {/* Track */}
        <path
          d="M 8 44 A 32 32 0 0 1 72 44"
          fill="none"
          stroke="hsl(var(--border))"
          strokeOpacity={0.3}
          strokeWidth="5"
          strokeLinecap="round"
        />
        {/* Progress */}
        <motion.path
          d="M 8 44 A 32 32 0 0 1 72 44"
          fill="none"
          stroke={label === 'green' ? 'hsl(152,60%,50%)' : label === 'amber' ? 'hsl(38,88%,58%)' : 'hsl(4,72%,58%)'}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 0.9, ease: 'easeOut', delay: 0.15 }}
        />
      </svg>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
        <p className={`text-lg font-black leading-none ${h.dial}`}>{score}</p>
      </div>
    </div>
  )
}

function MetricCard({ result, onSelect, index }) {
  const h = HEALTH[result.health_label] || HEALTH.amber

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(result.column)}
      className={`relative glass-card p-4 text-left w-full group cursor-pointer ${h.glow} transition-all duration-300`}
    >
      {/* Top colour bar */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl ${h.bar}`} />

      {/* Health arc */}
      <div className="flex items-start justify-between mb-3">
        <HealthArc score={result.health_score} label={result.health_label} />
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${h.badge}`}>
          {result.health_label}
        </span>
      </div>

      {/* Column name */}
      <p className="text-xs font-bold text-foreground mb-0.5 truncate pr-2">
        {result.column.replace(/_/g, ' ')}
      </p>

      {/* Trend + last value */}
      <div className="flex items-center gap-1.5 mb-3">
        <TrendIcon trend={result.trend} />
        <span className="text-xs text-muted-foreground font-mono">
          {fmtNumber(result.last_value, 1)}
        </span>
        <span className="text-[10px] text-muted-foreground">→</span>
        <span className="text-xs font-semibold text-foreground font-mono">
          {fmtNumber(result.forecast_next, 1)}
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-1.5 mb-3">
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground">MAPE</p>
          <p className="text-xs font-bold text-foreground">{result.ets_mape}%</p>
        </div>
        <div className="text-center border-x border-border/20">
          <p className="text-[10px] text-muted-foreground">Anomalies</p>
          <p className="text-xs font-bold text-foreground">{result.anomaly_count}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground">Risk</p>
          <p className={`text-xs font-bold ${RISK[result.risk_level]}`}>
            {result.risk_level}
          </p>
        </div>
      </div>

      {/* Winner badge */}
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
          result.winner === 'ets'
            ? 'bg-primary/10 border-primary/20 text-primary'
            : 'bg-secondary/30 border-border/30 text-muted-foreground'
        }`}>
          {result.winner === 'ets' ? '✓ ETS wins' : `${result.winner} wins`}
        </span>
        <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground
                         group-hover:text-primary transition-colors uppercase tracking-wider">
          Analyse
          <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </motion.button>
  )
}

export default function PortfolioPanel({ portfolioResults, onSelectColumn, onBack, datasetLabel, theme, onToggleTheme }) {
  if (!portfolioResults) return null

  const { columns, need_attention, total } = portfolioResults

  const greenCount  = columns.filter(c => c.health_label === 'green').length
  const amberCount  = columns.filter(c => c.health_label === 'amber').length
  const redCount    = columns.filter(c => c.health_label === 'red').length
  const highRisk    = columns.filter(c => c.risk_level === 'high').length
  const avgScore    = Math.round(columns.reduce((s, c) => s + c.health_score, 0) / columns.length)

  return (
    <div className="min-h-screen bg-background relative">
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/[0.03] blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-accent/[0.03] blur-[120px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border/20 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl border border-primary/20 bg-primary/10">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">ForeSight</p>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider truncate">
                {datasetLabel}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onToggleTheme}
              className="p-2 rounded-xl border border-border/30 bg-secondary/20 hover:bg-secondary/40 text-muted-foreground hover:text-foreground transition-all">
              {theme === 'dark'
                ? <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10 5 5 0 000-10z"/></svg>
                : <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z"/></svg>
              }
            </button>
            <button onClick={onBack}
              className="btn-ghost text-xs flex items-center gap-1.5 font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>
              </svg>
              Back
            </button>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Page title */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-3 mb-1">
            <Activity className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Portfolio Health Scan</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {total} metrics scanned automatically · Click any metric to run full analysis
          </p>
        </motion.div>

        {/* Summary bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="glass-card p-5"
        >
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-2xl font-black text-foreground">{avgScore}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Avg Health</p>
            </div>
            <div className="text-center border-l border-border/20">
              <p className="text-2xl font-black text-emerald-400">{greenCount}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Healthy</p>
            </div>
            <div className="text-center border-l border-border/20">
              <p className="text-2xl font-black text-amber-400">{amberCount}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Caution</p>
            </div>
            <div className="text-center border-l border-border/20">
              <p className="text-2xl font-black text-destructive">{redCount}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Critical</p>
            </div>
            <div className="text-center border-l border-border/20">
              <p className="text-2xl font-black text-destructive">{highRisk}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">High Risk</p>
            </div>
          </div>

          {/* Attention banner */}
          {need_attention > 0 && (
            <div className="mt-4 pt-4 border-t border-border/20 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <p className="text-xs text-amber-400 font-semibold">
                {need_attention} of {total} metrics need attention — sorted by priority below
              </p>
            </div>
          )}
          {need_attention === 0 && (
            <div className="mt-4 pt-4 border-t border-border/20 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <p className="text-xs text-emerald-400 font-semibold">
                All {total} metrics are healthy
              </p>
            </div>
          )}
        </motion.div>

        {/* Metric cards grid */}
        <div className={`grid gap-4 ${
          total <= 2 ? 'grid-cols-1 sm:grid-cols-2' :
          total === 3 ? 'grid-cols-1 sm:grid-cols-3' :
          'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
        }`}>
          {columns.map((result, i) => (
            <MetricCard
              key={result.column}
              result={result}
              onSelect={onSelectColumn}
              index={i}
            />
          ))}
        </div>

        {/* Footer hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-[10px] text-muted-foreground font-semibold uppercase tracking-[0.15em] pt-4"
        >
          Metrics sorted by health score · Worst first · Click any card for full ETS analysis
        </motion.p>

      </main>
    </div>
  )
}