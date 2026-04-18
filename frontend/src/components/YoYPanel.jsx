import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { fmtNumber } from '../utils/formatters.js'
import { CalendarDays } from 'lucide-react'

export default function YoYPanel({ forecast }) {
  if (!forecast?.historical_values?.length) return null

  const vals  = forecast.historical_values
  const dates = forecast.historical_dates
  const n     = forecast.forecast.length  // number of forecast periods

  // Detect period offset — 12 for monthly, 52 for weekly, 4 for quarterly
  // Use seasonal_period from model_params if available
  const sp = forecast.model_params?.seasonal_period || 12

  // Not enough history for comparison
  if (vals.length < sp + n) return null

  // This year — last N historical values (same window as forecast)
  const thisYearVals  = vals.slice(-n)
  const thisYearDates = dates.slice(-n)

  // Last year — same N values offset by one seasonal period
  const lastYearVals  = vals.slice(-(sp + n), -sp || undefined)

  // Build chart data
  const data = thisYearDates.map((date, i) => ({
    date,
    this_year: thisYearVals[i],
    last_year: lastYearVals[i],
    change_pct: lastYearVals[i]
      ? ((thisYearVals[i] - lastYearVals[i]) / Math.abs(lastYearVals[i]) * 100)
      : null,
  }))

  // Overall direction
  const avgChange = data.reduce((s, d) => s + (d.change_pct || 0), 0) / data.length
  const isUp   = avgChange > 1
  const isDown = avgChange < -1

  return (
    <div className="glass-card p-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10 border border-primary/15">
          <CalendarDays className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Year-on-Year</h3>
          <p className="text-xs text-muted-foreground">
            Current period vs same period last year
          </p>
        </div>
        <span className={`ml-auto text-xs font-bold px-2.5 py-1 rounded-full border ${
          isUp
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : isDown
            ? 'bg-destructive/10 border-destructive/20 text-destructive'
            : 'bg-secondary/30 border-border/30 text-muted-foreground'
        }`}>
          {isUp ? '▲' : isDown ? '▼' : '●'} {Math.abs(avgChange).toFixed(1)}% YoY
        </span>
      </div>

      {/* Chart */}
      <div className="h-40 w-full mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false}
                           stroke="hsl(var(--border))" strokeOpacity={0.3} />
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                   axisLine={false} tickLine={false}
                   tickFormatter={d => new Date(d).toLocaleString('en-GB', { month: 'short' })} />
            <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                   axisLine={false} tickLine={false}
                   tickFormatter={v => fmtNumber(v)} width={55} />
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
                borderRadius: 12, fontSize: 11,
              }}
              formatter={(v, name) => [fmtNumber(v, 1), name === 'this_year' ? 'This period' : 'Last year']}
            />
            <ReferenceLine y={0} stroke="hsl(var(--border))" strokeOpacity={0.5} />
            <Line dataKey="last_year" name="last_year"
                  stroke="hsl(var(--muted-foreground))" strokeWidth={1.5}
                  strokeDasharray="4 3" dot={false} connectNulls />
            <Line dataKey="this_year" name="this_year"
                  stroke="hsl(217,85%,65%)" strokeWidth={2.5}
                  dot={{ r: 3, fill: 'hsl(217,85%,65%)', strokeWidth: 0 }}
                  connectNulls />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Period table */}
      <div className="space-y-1.5">
        {data.map((d, i) => (
          <div key={i} className="flex items-center justify-between text-xs py-1
                                   border-b border-border/10 last:border-0">
            <span className="text-muted-foreground w-24 truncate">
              {new Date(d.date).toLocaleString('en-GB', { month: 'short', year: '2-digit' })}
            </span>
            <span className="font-mono text-foreground">{fmtNumber(d.this_year, 1)}</span>
            <span className="font-mono text-muted-foreground">{fmtNumber(d.last_year, 1)}</span>
            <span className={`font-bold w-14 text-right ${
              d.change_pct > 0 ? 'text-emerald-400'
              : d.change_pct < 0 ? 'text-destructive'
              : 'text-muted-foreground'
            }`}>
              {d.change_pct != null
                ? `${d.change_pct > 0 ? '+' : ''}${d.change_pct.toFixed(1)}%`
                : '—'}
            </span>
          </div>
        ))}
      </div>

      {/* Column headers */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground
                      uppercase tracking-wider mt-2 pt-2 border-t border-border/20">
        <span className="w-24">Period</span>
        <span>This year</span>
        <span>Last year</span>
        <span className="w-14 text-right">Change</span>
      </div>
    </div>
  )
}