import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ResponsiveContainer, ComposedChart, Line, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ReferenceDot, ReferenceLine,
} from 'recharts'
import { TrendingUp, Activity } from 'lucide-react'
import { fmtNumber, fmtDate } from '../utils/formatters.js'

function buildChartData(forecast, anomalies) {
  const anomalyDates = new Set(anomalies.map(a => a.date))
  const historical = forecast.historical_dates.map((d, i) => ({
    date: d, historical: forecast.historical_values[i], isAnomaly: anomalyDates.has(d),
  }))
  const lastHistorical = forecast.historical_values[forecast.historical_values.length - 1]
  const future = forecast.dates.map((d, i) => ({
    date: d,
    predicted: forecast.forecast[i],
    bandLow: forecast.band_low[i],
    bandHigh: forecast.band_high[i],
    naive: lastHistorical,
  }))
  return [...historical, ...future]
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  const dayLabel = (() => {
    const dt = new Date(label)
    if (!isNaN(dt)) return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    return String(label)
  })()

  const entries = payload.filter(p => p.value !== undefined && p.value !== null)

  return (
    <AnimatePresence>
      <motion.div
        key={label}
        initial={{ opacity: 0, scale: 0.92, y: -6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={{ duration: 0.14, ease: 'easeOut' }}
        className="glass-elevated rounded-2xl shadow-2xl border border-border/25 overflow-hidden"
        style={{ minWidth: 200 }}
      >
        {/* Tooltip header */}
        <div className="px-4 py-2.5 border-b border-border/20 bg-secondary/20">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{dayLabel}</p>
        </div>

        {/* Tooltip rows */}
        <div className="px-4 py-3 space-y-2">
          {entries.map(p => {
            const labelMap = {
              historical: 'Actual',
              predicted: 'Forecast',
              bandHigh: 'Upper CI',
              bandLow: 'Lower CI',
              naive: 'Benchmark',
            }
            const name = labelMap[p.dataKey] || p.dataKey
            const isMain = p.dataKey === 'predicted' || p.dataKey === 'historical'

            return (
              <div key={p.dataKey} className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: p.color, boxShadow: isMain ? `0 0 6px ${p.color}` : 'none' }}
                  />
                  <span className={`text-xs ${isMain ? 'text-foreground/80 font-medium' : 'text-muted-foreground'}`}>
                    {name}
                  </span>
                </div>
                <span className={`font-mono font-bold text-sm ${isMain ? 'text-foreground' : 'text-foreground/60'}`}>
                  {fmtNumber(p.value, 1)}
                </span>
              </div>
            )
          })}
        </div>

        {/* Delta badge */}
        {entries.find(p => p.dataKey === 'predicted') && entries.find(p => p.dataKey === 'historical') && (() => {
          const pred = entries.find(p => p.dataKey === 'predicted').value
          const hist = entries.find(p => p.dataKey === 'historical').value
          const delta = ((pred - hist) / Math.abs(hist)) * 100
          return (
            <div className={`px-4 py-2 border-t border-border/15 text-[10px] font-semibold flex items-center gap-1.5 ${delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              <span>{delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}% vs actual</span>
            </div>
          )
        })()}
      </motion.div>
    </AnimatePresence>
  )
}

/* Animated chart skeleton while loading */
function ChartSkeleton() {
  return (
    <div className="h-80 w-full flex items-end gap-1 px-4 pb-6">
      {Array.from({ length: 28 }).map((_, i) => (
        <motion.div
          key={i}
          className="flex-1 rounded-t-sm bg-primary/10"
          initial={{ height: 0 }}
          animate={{ height: `${20 + Math.sin(i * 0.6) * 30 + Math.random() * 20}%` }}
          transition={{ delay: i * 0.03, duration: 0.5, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}

export default function ForecastChart({ forecast, anomalies, validationWinner }) {
  const [phase, setPhase] = useState('skeleton') // skeleton → chart

  useEffect(() => {
    setPhase('skeleton')
    const t = setTimeout(() => setPhase('chart'), 600)
    return () => clearTimeout(t)
  }, [forecast])

  const data = buildChartData(forecast, anomalies)
  const showBaseline = validationWinner !== 'ets'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card p-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/15">
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Forecast Overview</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {forecast.dates.length}-period projection with 80% confidence interval
            </p>
          </div>
        </div>
        {showBaseline && (
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/25 text-amber-400 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            {validationWinner === 'naive' ? 'Naive baseline outperforming AI' : 'Moving avg outperforming AI'}
          </div>
        )}
      </div>

      {/* Chart area */}
      <div className="relative h-80 w-full">
        <AnimatePresence mode="wait">
          {phase === 'skeleton' ? (
            <motion.div
              key="skeleton"
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <ChartSkeleton />
            </motion.div>
          ) : (
            <motion.div
              key="chart"
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(217,85%,65%)" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="hsl(217,85%,65%)" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(215,18%,60%)" stopOpacity={0.12} />
                      <stop offset="100%" stopColor="hsl(215,18%,60%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.3} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 }}
                    axisLine={false} tickLine={false}
                    tickFormatter={d => {
                      const dt = new Date(d)
                      if (isNaN(dt)) return typeof d === 'number' ? `D${d}` : String(d).slice(0, 5)
                      return `${dt.toLocaleString('en-GB', { month: 'short' })} '${String(dt.getFullYear()).slice(2)}`
                    }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 }}
                    axisLine={false} tickLine={false}
                    tickFormatter={v => fmtNumber(v)} width={65}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ stroke: 'hsl(217,85%,65%)', strokeOpacity: 0.25, strokeWidth: 1.5, strokeDasharray: '5 4' }}
                  />
                  <Legend
                    verticalAlign="top" align="right" iconType="circle"
                    wrapperStyle={{ fontSize: 10, paddingBottom: 16, fontWeight: 600, color: 'hsl(var(--muted-foreground))' }}
                  />

                  {/* Confidence band */}
                  <Area dataKey="bandHigh" stroke="none" fill="hsl(217,85%,65%)" fillOpacity={0.1}
                    legendType="none" name="Upper CI" isAnimationActive animationDuration={1400} />
                  <Area dataKey="bandLow" stroke="none" fill="hsl(var(--background))" fillOpacity={1}
                    legendType="none" name="Lower CI" isAnimationActive animationDuration={1400} />

                  {/* Historical line */}
                  <Line dataKey="historical" stroke="hsl(215,20%,62%)" strokeWidth={2} dot={false}
                    name="Historical" isAnimationActive={false} connectNulls />

                  {/* AI Forecast line */}
                  <Line dataKey="predicted" stroke="hsl(217,85%,65%)" strokeWidth={3} strokeDasharray="6 4"
                    dot={{ r: 3.5, fill: 'hsl(217,85%,65%)', strokeWidth: 0 }}
                    activeDot={{ r: 7, fill: 'hsl(217,85%,70%)', stroke: 'hsl(var(--background))', strokeWidth: 2.5 }}
                    name="AI Forecast" isAnimationActive animationDuration={1100} connectNulls />

                  {showBaseline && (
                    <Line dataKey="naive" stroke="hsl(38,88%,58%)" strokeWidth={1.5} strokeDasharray="3 3"
                      dot={false} name="Benchmark" isAnimationActive={false} connectNulls />
                  )}

                  {/* Anomaly dots */}
                  {anomalies.map((a, i) => (
                    <ReferenceDot key={`anom-${i}`} x={a.date} y={a.value} r={6}
                      fill={a.severity === 'critical' ? 'hsl(4,72%,58%)' : a.severity === 'warning' ? 'hsl(38,88%,58%)' : 'hsl(217,85%,65%)'}
                      stroke="hsl(var(--background))" strokeWidth={2.5}
                    />
                  ))}

                  {/* Forecast start divider */}
                  {forecast.historical_dates?.length > 0 && (
                    <ReferenceLine
                      x={forecast.historical_dates[forecast.historical_dates.length - 1]}
                      stroke="hsl(var(--border))" strokeDasharray="4 4" strokeOpacity={0.5}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Legend strip */}
      <div className="mt-5 pt-4 border-t border-border/20 flex flex-wrap items-center gap-5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
        <div className="flex items-center gap-2">
          <div className="w-6 h-1.5 rounded-full" style={{ background: 'hsl(217 85% 65% / 0.2)', border: '1px solid hsl(217 85% 65% / 0.35)' }} />
          <span>80% Confidence Band</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-red-500/20" />
          <span>Critical Anomaly</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-500/20" />
          <span>Warning</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 border-t-2 border-dashed border-primary/60" />
          <span>Forecast</span>
        </div>
      </div>
    </motion.div>
  )
}
