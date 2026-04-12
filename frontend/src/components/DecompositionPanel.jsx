import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Activity, TrendingUp, Waves, BarChart2 } from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
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
  if (Math.abs(pct) < 2) return 'Underlying trend is essentially flat over this period.'
  const dir = pct > 0 ? 'Upward' : 'Downward'
  return `${dir} trend — total change of ${pct > 0 ? '+' : ''}${pct.toFixed(1)}% over the period.`
}
function seasonalLabel(seasonal) {
  if (!seasonal?.length) return 'No seasonal pattern detected.'
  const amp = Math.max(...seasonal) - Math.min(...seasonal)
  if (amp < 0.5) return 'Seasonal variation is minimal on this dataset.'
  return `Repeating cycle detected with amplitude ±${(amp / 2).toFixed(2)} per cycle.`
}
function residualLabel(residual) {
  if (!residual?.length) return ''
  const std = Math.sqrt(residual.reduce((s, v) => s + v * v, 0) / residual.length)
  if (std < 0.5) return 'Very low noise — data is highly reliable for forecasting.'
  if (std < 2)   return 'Moderate noise — treat forecasts with reasonable caution.'
  return 'High residual noise — significant unexplained variation present.'
}

const PANELS = [
  {
    key: 'trend',
    label: 'Trend',
    subtitle: 'Long-term directional movement',
    icon: TrendingUp,
    color: 'hsl(217,85%,65%)',
    gradId: 'dtrendGrad',
    descFn: d => trendLabel(d.trend),
    cardStyle: { borderColor: 'hsl(217 85% 65% / 0.2)', background: 'hsl(217 85% 65% / 0.04)' },
    iconStyle: { background: 'hsl(217 85% 65% / 0.12)', borderColor: 'hsl(217 85% 65% / 0.2)', color: 'hsl(217,85%,70%)' },
    badgeStyle: { background: 'hsl(217 85% 65% / 0.1)', borderColor: 'hsl(217 85% 65% / 0.2)', color: 'hsl(217,85%,72%)' },
  },
  {
    key: 'seasonal',
    label: 'Seasonality',
    subtitle: 'Repeating periodic patterns',
    icon: Waves,
    color: 'hsl(152,65%,52%)',
    gradId: 'dseasonGrad',
    descFn: d => seasonalLabel(d.seasonal),
    cardStyle: { borderColor: 'hsl(152 65% 52% / 0.2)', background: 'hsl(152 65% 52% / 0.04)' },
    iconStyle: { background: 'hsl(152 65% 52% / 0.12)', borderColor: 'hsl(152 65% 52% / 0.2)', color: 'hsl(152,65%,58%)' },
    badgeStyle: { background: 'hsl(152 65% 52% / 0.1)', borderColor: 'hsl(152 65% 52% / 0.2)', color: 'hsl(152,65%,60%)' },
  },
  {
    key: 'residual',
    label: 'Residual',
    subtitle: 'Random noise after decomposition',
    icon: Activity,
    color: 'hsl(258,60%,68%)',
    gradId: 'dresidualGrad',
    descFn: d => residualLabel(d.residual),
    cardStyle: { borderColor: 'hsl(258 60% 68% / 0.2)', background: 'hsl(258 60% 68% / 0.04)' },
    iconStyle: { background: 'hsl(258 60% 68% / 0.12)', borderColor: 'hsl(258 60% 68% / 0.2)', color: 'hsl(258,60%,74%)' },
    badgeStyle: { background: 'hsl(258 60% 68% / 0.1)', borderColor: 'hsl(258 60% 68% / 0.2)', color: 'hsl(258,60%,75%)' },
  },
]

function DecompTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.12 }}
      className="glass-elevated rounded-xl px-3.5 py-2.5 shadow-2xl border border-border/30 min-w-[130px]"
    >
      <p className="text-[10px] text-muted-foreground mb-2 font-semibold uppercase tracking-wider border-b border-border/20 pb-1.5">
        {fmtDate(label)}
      </p>
      {payload.map((p, i) => p.value != null && (
        <div key={i} className="flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-muted-foreground capitalize">{p.name}</span>
          </div>
          <span className="font-mono font-semibold text-foreground">{fmtNumber(p.value, 2)}</span>
        </div>
      ))}
    </motion.div>
  )
}

function DecompCard({ panel, data, decomposition, index }) {
  const [loaded, setLoaded] = useState(false)
  const Icon = panel.icon

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 180 + index * 130)
    return () => clearTimeout(t)
  }, [index])

  const values = decomposition[panel.key] || []
  const minVal = values.length ? Math.min(...values) : 0
  const maxVal = values.length ? Math.max(...values) : 0
  const avgVal = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="glass-card border overflow-hidden flex flex-col"
      style={panel.cardStyle}
    >
      {/* Header */}
      <div className="p-5 pb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg border" style={panel.iconStyle}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">{panel.label}</h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">{panel.subtitle}</p>
          </div>
        </div>
        <div className="text-[10px] font-semibold px-2.5 py-1 rounded-full border" style={panel.badgeStyle}>
          ±{((maxVal - minVal) / 2).toFixed(1)}
        </div>
      </div>

      {/* Description */}
      <p className="px-5 pb-4 text-[11px] text-muted-foreground leading-relaxed">
        {panel.descFn(decomposition)}
      </p>

      {/* Chart */}
      <div className="px-4 pb-4">
        <div style={{
          opacity: loaded ? 1 : 0,
          transform: loaded ? 'none' : 'translateY(10px)',
          transition: 'opacity 0.7s ease, transform 0.7s ease',
        }}>
          <ResponsiveContainer width="100%" height={175}>
            <AreaChart data={data} margin={{ top: 8, right: 6, bottom: 0, left: -8 }}>
              <defs>
                <linearGradient id={panel.gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={panel.color} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={panel.color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.22} vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))', opacity: 0.65 }}
                axisLine={false} tickLine={false}
                tickFormatter={d => {
                  const dt = new Date(d)
                  if (isNaN(dt)) return typeof d === 'number' ? `${d}` : String(d).slice(0, 5)
                  return `${dt.toLocaleString('en-GB', { month: 'short' })} '${String(dt.getFullYear()).slice(2)}`
                }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))', opacity: 0.65 }}
                axisLine={false} tickLine={false}
                width={40}
                tickFormatter={v => fmtNumber(v, 0)}
              />
              {panel.key === 'residual' && (
                <ReferenceLine y={0} stroke={panel.color} strokeOpacity={0.35} strokeDasharray="4 4" />
              )}
              <Tooltip
                content={<DecompTooltip />}
                cursor={{ stroke: panel.color, strokeOpacity: 0.2, strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area
                dataKey={panel.key}
                name={panel.label}
                stroke={panel.color}
                strokeWidth={2}
                fill={`url(#${panel.gradId})`}
                dot={false}
                activeDot={{ r: 4.5, fill: panel.color, stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                isAnimationActive={true}
                animationDuration={1100}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Footer stats */}
      <div className="border-t border-border/15 px-5 py-2.5 flex items-center justify-between">
        <div className="flex gap-5">
          {[['Min', minVal], ['Max', maxVal], ['Avg', avgVal]].map(([label, val]) => (
            <div key={label}>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
              <p className="text-[11px] font-mono font-semibold text-foreground">{fmtNumber(val, 1)}</p>
            </div>
          ))}
        </div>
        <p className="text-[9px] text-muted-foreground/40 font-semibold uppercase">{values.length} pts</p>
      </div>
    </motion.div>
  )
}

export default function DecompositionPanel({ decomposition }) {
  if (!decomposition?.dates?.length) return null
  const data = buildDecompData(decomposition)

  return (
    <div className="space-y-4">
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-3"
      >
        <div className="p-2 rounded-lg bg-primary/10 border border-primary/15">
          <BarChart2 className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Trend Decomposition</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Time series broken into independent components</p>
        </div>
      </motion.div>

      {/* Three cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {PANELS.map((p, idx) => (
          <DecompCard key={p.key} panel={p} data={data} decomposition={decomposition} index={idx} />
        ))}
      </div>
    </div>
  )
}
