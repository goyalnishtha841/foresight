import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, TrendingUp, Waves, ChevronDown } from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import { fmtNumber, fmtDate } from '../utils/formatters.js'

function buildDecompData(decomp) {
  return decomp.dates.map((d, i) => ({
    date: d, trend: decomp.trend[i], seasonal: decomp.seasonal[i], residual: decomp.residual[i],
  }))
}

function trendLabel(trend) {
  if (!trend?.length) return 'Could not determine trend.'
  const first = trend[0], last = trend[trend.length - 1]
  const pct = ((last - first) / Math.abs(first)) * 100
  if (Math.abs(pct) < 2) return 'The underlying trend is essentially flat.'
  const dir = pct > 0 ? 'upward' : 'downward'
  return `The underlying trend is ${dir} — a total change of ${pct > 0 ? '+' : ''}${pct.toFixed(1)}% over the period.`
}
function seasonalLabel(seasonal) {
  if (!seasonal?.length) return 'No seasonal pattern detected.'
  const amp = Math.max(...seasonal) - Math.min(...seasonal)
  if (amp < 0.5) return 'Seasonal variation is minimal on this dataset.'
  return `Consistent repeating pattern with a swing of ±${(amp / 2).toFixed(2)} per cycle.`
}
function residualLabel(residual) {
  if (!residual?.length) return ''
  const std = Math.sqrt(residual.reduce((s, v) => s + v * v, 0) / residual.length)
  if (std < 0.5) return 'Residual noise is low — this data is reliable for forecasting.'
  if (std < 2)   return 'Residual noise is moderate — treat forecasts with reasonable caution.'
  return 'Residual noise is high — significant unexplained variation present.'
}

const PANELS = [
  { key: 'trend',    label: 'Trend',           icon: TrendingUp, color: 'hsl(217,91%,60%)', gradId: 'dtrendGrad', descFn: d => trendLabel(d.trend) },
  { key: 'seasonal', label: 'Seasonality',     icon: Waves,      color: 'hsl(152,76%,48%)', gradId: 'dseasonGrad', descFn: d => seasonalLabel(d.seasonal) },
  { key: 'residual', label: 'Residual (noise)', icon: Activity,  color: 'hsl(var(--muted-foreground))', gradId: 'dresidualGrad', descFn: d => residualLabel(d.residual) },
]

function DecompTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
      className="glass-elevated rounded-xl px-3 py-2 shadow-xl border border-border/20 min-w-[120px]">
      <p className="text-[10px] text-muted-foreground mb-1.5 font-semibold uppercase">{fmtDate(label)}</p>
      {payload.map((p, i) => p.value != null && (
        <div key={i} className="flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
            <span className="text-muted-foreground capitalize">{p.name}</span>
          </div>
          <span className="font-mono font-semibold text-foreground">{fmtNumber(p.value, 2)}</span>
        </div>
      ))}
    </motion.div>
  )
}

export default function DecompositionPanel({ decomposition }) {
  const [open, setOpen] = useState(false)
  if (!decomposition?.dates?.length) return null

  const data = buildDecompData(decomposition)

  return (
    <div className="glass-card overflow-hidden">
      <button onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between p-5 hover:bg-secondary/10 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/10">
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-foreground">Trend decomposition</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Trend, seasonality, and residual noise</p>
          </div>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}
          className="p-1 rounded-md hover:bg-secondary/40 transition-colors">
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-0 border-t border-border/20">
              <div className="pt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                {PANELS.map((p, idx) => {
                  const Icon = p.icon
                  return (
                    <motion.div
                      key={p.key}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.08, duration: 0.4 }}
                      whileHover={{ y: -2, transition: { duration: 0.2 } }}
                      className="glass-card p-4 space-y-3 hover:shadow-[0_0_20px_-6px_hsl(var(--primary)/0.08)] transition-shadow"
                    >
                      <div className="flex items-start gap-2">
                        <div className="p-1.5 rounded-lg bg-secondary/40 border border-border/20">
                          <Icon className="w-3.5 h-3.5" style={{ color: p.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-semibold text-foreground">{p.label}</h4>
                          <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{p.descFn(decomposition)}</p>
                        </div>
                      </div>
                      <div className="h-28">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={data} margin={{ top: 2, right: 4, bottom: 0, left: -20 }}>
                            <defs>
                              <linearGradient id={p.gradId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={p.color} stopOpacity={0.2} />
                                <stop offset="100%" stopColor={p.color} stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                            <XAxis dataKey="date" tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false}
                              tickFormatter={d => fmtDate(d).split(' ').slice(1).join(' ')} interval="preserveStartEnd" />
                            <YAxis tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={36} tickFormatter={v => fmtNumber(v, 1)} />
                            <Tooltip content={<DecompTooltip />} />
                            <Area dataKey={p.key} stroke={p.color} strokeWidth={1.5} fill={`url(#${p.gradId})`} dot={false}
                              activeDot={{ r: 3, fill: p.color }} isAnimationActive animationDuration={800} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
