import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ResponsiveContainer, ComposedChart, Line, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ReferenceDot,
} from 'recharts'
import { TrendingUp } from 'lucide-react'
import { fmtNumber, fmtDate } from '../utils/formatters.js'

function buildChartData(forecast, anomalies) {
  const anomalyDates = new Set(anomalies.map(a => a.date))
  const historical = forecast.historical_dates.map((d, i) => ({
    date: d, historical: forecast.historical_values[i], isAnomaly: anomalyDates.has(d),
  }))
  const future = forecast.dates.map((d, i) => ({
    date: d,
    predicted: forecast.forecast[i],
    bandLow: forecast.band_low[i],
    bandHigh: forecast.band_high[i],
    naive: forecast.historical_values[forecast.historical_values.length - 1],
  }))
  return [...historical, ...future]
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="glass-elevated rounded-xl px-4 py-3 shadow-2xl border border-border/20 min-w-[160px]"
    >
      <p className="text-[11px] text-muted-foreground mb-2 font-semibold uppercase tracking-wider border-b border-border/20 pb-2">
        {fmtDate(label)}
      </p>
      <div className="space-y-1.5">
        {payload.map(p => (
          p.value !== undefined && p.value !== null &&
          <div key={p.dataKey} className="flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
              <span className="text-muted-foreground capitalize">
                {p.dataKey === 'bandHigh' ? 'Upper band' : p.dataKey === 'bandLow' ? 'Lower band' : p.dataKey}:
              </span>
            </div>
            <span className="font-mono font-semibold text-foreground">{fmtNumber(p.value, 2)}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

export default function ForecastChart({ forecast, anomalies, validationWinner }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 250)
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/10">
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Predictive Forecast</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {forecast.dates.length}-period projection with 80% confidence interval
            </p>
          </div>
        </div>
        {showBaseline && (
          <div className="flex items-center gap-2 bg-warning/10 border border-warning/20 text-warning px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
            {validationWinner === 'naive' ? 'Naive baseline outperforming AI' : 'Moving average outperforming AI'}
          </div>
        )}
      </div>

      <div
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.8s cubic-bezier(0.4,0,0.2,1)' }}
        className="h-80 w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(217,91%,60%)" stopOpacity={0.15} />
                <stop offset="100%" stopColor="hsl(217,91%,60%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.4} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 }}
              axisLine={false} tickLine={false}
              tickFormatter={d => {
                const dt = new Date(d)
                return `${dt.toLocaleString('en-GB', { month: 'short' })} '${String(dt.getFullYear()).slice(2)}`
              }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 }}
              axisLine={false} tickLine={false}
              tickFormatter={v => fmtNumber(v)} width={65}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(217,91%,60%)', strokeOpacity: 0.2, strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: 10, paddingBottom: 16, fontWeight: 600, color: 'hsl(var(--muted-foreground))' }} />

            <Area dataKey="bandHigh" stroke="none" fill="hsl(217,91%,60%)" fillOpacity={0.08} legendType="none" name="Upper band" isAnimationActive={true} animationDuration={1200} />
            <Area dataKey="bandLow" stroke="none" fill="hsl(var(--background))" fillOpacity={1} legendType="none" name="Lower band" isAnimationActive={true} animationDuration={1200} />
            <Line dataKey="historical" stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={false} name="Historical" isAnimationActive={false} connectNulls />
            <Line dataKey="predicted" stroke="hsl(217,91%,60%)" strokeWidth={3} strokeDasharray="6 4"
              dot={{ r: 3.5, fill: 'hsl(217,91%,60%)', strokeWidth: 0 }}
              activeDot={{ r: 6, fill: 'hsl(217,91%,55%)', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
              name="AI Forecast" isAnimationActive={true} animationDuration={1000} connectNulls />
            {showBaseline && (
              <Line dataKey="naive" stroke="hsl(38,92%,50%)" strokeWidth={1.5} strokeDasharray="3 3" dot={false} name="Benchmark" isAnimationActive={false} connectNulls />
            )}
            {anomalies.map((a, i) => (
              <ReferenceDot key={`anom-${i}`} x={a.date} y={a.value} r={5}
                fill={a.severity === 'critical' ? 'hsl(0,72%,51%)' : a.severity === 'warning' ? 'hsl(38,92%,50%)' : 'hsl(38,82%,60%)'}
                stroke="hsl(var(--background))" strokeWidth={2} />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-5 pt-4 border-t border-border/20 flex flex-wrap items-center gap-5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
        <div className="flex items-center gap-2">
          <div className="w-6 h-2 rounded-full" style={{ background: 'hsl(217 91% 60% / 0.15)', border: '1px solid hsl(217 91% 60% / 0.3)' }} />
          <span>80% Confidence Band</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-destructive ring-2 ring-destructive/20" />
          <span>Critical Anomaly</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-warning ring-2 ring-warning/20" />
          <span>Warning</span>
        </div>
      </div>
    </motion.div>
  )
}
