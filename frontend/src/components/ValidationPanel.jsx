import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, ChevronRight } from 'lucide-react'
import {
  ResponsiveContainer, ComposedChart, Line, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import HealthDial from './HealthDial.jsx'
import { fmtNumber, fmtPct, fmtDate, uncertaintyDisplay } from '../utils/formatters.js'

function buildBacktestData(validation) {
  return validation.holdout_dates.map((d, i) => ({
    date: d,
    actual: validation.holdout_actual[i],
    predicted: validation.holdout_predicted[i],
    bandLow: validation.holdout_low[i],
    bandHigh: validation.holdout_high[i],
  }))
}

function BtTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
      className="glass-elevated rounded-xl px-4 py-3 shadow-2xl border border-border/20 min-w-[140px]">
      <p className="text-[10px] text-muted-foreground mb-2 font-semibold uppercase">{fmtDate(label)}</p>
      {payload.map((p, i) => p.value != null && (
        <div key={i} className="flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
            <span className="text-muted-foreground">{p.name}</span>
          </div>
          <span className="font-mono font-semibold text-foreground">{fmtNumber(p.value, 2)}</span>
        </div>
      ))}
    </motion.div>
  )
}

export default function ValidationPanel({ validation, modelParams }) {
  const [showParams, setShowParams] = useState(false)

  if (validation.error) {
    return (
      <div className="glass-card p-5">
        <p className="text-sm text-muted-foreground">{validation.error}</p>
      </div>
    )
  }

  const btData    = buildBacktestData(validation)
  const unc       = uncertaintyDisplay(validation.uncertainty_label)
  const winnerMap = { ets: 'ETS model', naive: 'Naive baseline', moving_average: 'Moving average' }

  return (
    <div className="glass-card p-5 space-y-5">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-success/10 border border-success/10">
          <Shield className="w-4 h-4 text-success" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Forecast accuracy</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Last {validation.holdout_dates.length} periods held out and tested
          </p>
        </div>
      </div>

      {/* Metric grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="col-span-2 sm:col-span-1 flex flex-col items-center justify-center bg-secondary/10 rounded-xl p-4 border border-border/15">
          <p className="section-label mb-2">Health</p>
          <HealthDial score={validation.health_score} label={validation.health_label} />
        </div>
        <div className="stat-card">
          <p className="text-xs text-muted-foreground mb-1">ETS MAPE</p>
          <p className="text-2xl font-extrabold text-foreground">{fmtPct(validation.ets_mape, 2)}</p>
          <p className="text-xs text-muted-foreground mt-1">vs naive {fmtPct(validation.naive_mape)}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-muted-foreground mb-1">Band coverage</p>
          <p className="text-2xl font-extrabold text-foreground">{fmtPct(validation.band_coverage)}</p>
          <p className="text-xs text-muted-foreground mt-1">target ≈ 80%</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-muted-foreground mb-1">Confidence</p>
          <p className={`text-sm font-semibold mt-1 ${unc.colour}`}>{unc.text}</p>
          <p className="text-xs text-muted-foreground mt-1">Best: {winnerMap[validation.winner] || validation.winner}</p>
        </div>
      </div>

      {/* Backtest chart */}
      <div>
        <p className="section-label">Backtest — actual vs predicted</p>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={btData} margin={{ top: 4, right: 8, bottom: 4, left: -15 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.4} />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false}
                tickFormatter={d => fmtDate(d).split(' ').slice(0, 2).join(' ')} />
              <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={48} tickFormatter={v => fmtNumber(v)} />
              <Tooltip content={<BtTooltip />} />
              <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 10, color: 'hsl(var(--muted-foreground))' }} />
              <Area dataKey="bandHigh" stroke="none" fill="hsl(217,91%,60%)" fillOpacity={0.08} legendType="none" name="Upper band" />
              <Area dataKey="bandLow" stroke="none" fill="hsl(var(--background))" fillOpacity={1} legendType="none" name="Lower band" />
              <Line dataKey="actual" stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={{ r: 2.5 }} name="Actual" isAnimationActive={false} />
              <Line dataKey="predicted" stroke="hsl(217,91%,60%)" strokeWidth={2} strokeDasharray="4 2" dot={{ r: 2.5 }} name="Predicted" isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Baseline comparison */}
      <div>
        <p className="section-label">Baseline comparison</p>
        <div className="rounded-xl border border-border/20 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/15 border-b border-border/20">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Model</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground">MAPE</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground">MAE</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/10">
              {[
                { name: 'ETS model',      mape: validation.ets_mape,   mae: validation.ets_mae, key: 'ets' },
                { name: 'Naive baseline', mape: validation.naive_mape, mae: null,               key: 'naive' },
                { name: 'Moving average', mape: validation.ma_mape,    mae: null,               key: 'moving_average' },
              ].map(row => (
                <tr key={row.key} className={`${row.key === validation.winner ? 'bg-primary/[0.04]' : 'hover:bg-secondary/10'} transition-colors`}>
                  <td className="px-4 py-2.5 font-medium text-foreground flex items-center gap-2">
                    {row.key === validation.winner && (
                      <svg className="w-3.5 h-3.5 text-primary flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd"/>
                      </svg>
                    )}
                    {row.name}
                  </td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground font-mono">{fmtPct(row.mape, 2)}</td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground font-mono">{row.mae ? fmtNumber(row.mae, 1) : '—'}</td>
                  <td className="px-4 py-2.5 text-right">
                    {row.key === validation.winner
                      ? <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-semibold">Winner</span>
                      : <span className="text-xs text-muted-foreground/50">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {validation.winner !== 'ets' && (
          <p className="text-xs text-warning bg-warning/[0.06] border border-warning/20 rounded-xl px-3 py-2 mt-2">
            {Math.abs(validation.ets_mape - validation.naive_mape) < 1.0
              ? `ETS and the baseline performed similarly (ETS: ${validation.ets_mape}% vs baseline: ${validation.naive_mape}% MAPE). Forecast direction is reliable.`
              : validation.ets_mape < validation.naive_mape
              ? `ETS outperforms the naive baseline (${validation.ets_mape}% vs ${validation.naive_mape}% MAPE). Forecast direction is reliable.`
              : `A simpler baseline outperforms ETS. Treat exact values with caution.`}
          </p>
        )}
      </div>

      {/* Model params — collapsible */}
      {modelParams && (
        <div>
          <button onClick={() => setShowParams(p => !p)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium">
            <motion.div animate={{ rotate: showParams ? 90 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronRight className="w-3.5 h-3.5" />
            </motion.div>
            Model parameters
          </button>
          <AnimatePresence>
            {showParams && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { label: 'Alpha (level)',    value: modelParams.alpha },
                    { label: 'Beta (trend)',     value: modelParams.beta },
                    { label: 'Gamma (seasonal)', value: modelParams.gamma },
                    { label: 'Seasonal period', value: modelParams.seasonal_period },
                    { label: 'AIC',             value: fmtNumber(modelParams.aic) },
                    { label: 'Model variant',   value: modelParams.model_type || 'add/add' },
                  ].map(p => (
                    <div key={p.label} className="bg-secondary/10 border border-border/15 rounded-xl px-3 py-2">
                      <p className="text-[10px] text-muted-foreground">{p.label}</p>
                      <p className="text-sm font-semibold text-foreground font-mono">{p.value}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
