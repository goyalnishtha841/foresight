import { useState } from 'react'
import { motion } from 'framer-motion'
import { Layers, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { fmtNumber, fmtDate } from '../utils/formatters.js'

function buildScenarioData(scenarios) {
  return scenarios.dates.map((d, i) => ({
    date:        d,
    baseline:    scenarios.baseline.forecast[i],
    optimistic:  scenarios.optimistic.forecast[i],
    pessimistic: scenarios.pessimistic.forecast[i],
    ...(scenarios.custom ? { custom: scenarios.custom.forecast[i] } : {}),
  }))
}

const SCENARIO_COLOURS = {
  baseline:    'hsl(217,91%,60%)',
  optimistic:  'hsl(152,76%,48%)',
  pessimistic: 'hsl(38,92%,50%)',
  custom:      'hsl(262,83%,65%)',
}

const scenarioMeta = [
  { id: 'baseline',    label: 'Baseline',    icon: Minus,       textColor: 'text-primary' },
  { id: 'optimistic',  label: 'Optimistic',  icon: TrendingUp,  textColor: 'text-success' },
  { id: 'pessimistic', label: 'Pessimistic', icon: TrendingDown, textColor: 'text-warning' },
]

function ScenarioTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-elevated rounded-xl px-4 py-3 shadow-2xl border border-border/20 min-w-[160px]"
    >
      <p className="text-[10px] text-muted-foreground mb-2 font-semibold uppercase tracking-wider">{fmtDate(label)}</p>
      <div className="space-y-1.5">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
              <span className="text-muted-foreground">{p.name}</span>
            </div>
            <span className="font-mono font-semibold text-foreground">{fmtNumber(p.value, 2)}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

export default function ScenarioPanel({ scenarios, onCustomScenario }) {
  const [customPct, setCustomPct] = useState(15)
  const [loading, setLoading]     = useState(false)
  const [activeScenario, setActiveScenario] = useState('baseline')

  async function handleRunCustom() {
    setLoading(true)
    await onCustomScenario(customPct)
    setLoading(false)
  }

  const data = buildScenarioData(scenarios)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5 space-y-5"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-accent/10 border border-accent/10">
          <Layers className="w-4 h-4 text-accent" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Scenario comparison</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Real-time forecast sensitivity analysis</p>
        </div>
      </div>

      {/* Scenario tabs */}
      <div className="grid grid-cols-3 gap-2">
        {scenarioMeta.map(s => {
          const Icon = s.icon
          const isActive = activeScenario === s.id
          return (
            <motion.button
              key={s.id}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setActiveScenario(s.id)}
              className={`p-3 rounded-xl border transition-all duration-200 text-xs font-medium flex flex-col items-center gap-1.5
                ${isActive
                  ? 'border-border/50 bg-secondary/30 shadow-[0_0_20px_-6px_hsl(var(--primary)/0.1)]'
                  : 'border-border/15 hover:border-border/30 bg-secondary/10 hover:bg-secondary/20'}`}
            >
              <div className={`p-1.5 rounded-lg ${isActive ? 'bg-secondary/50' : 'bg-secondary/20'} transition-colors`}>
                <Icon className={`w-3.5 h-3.5 ${s.textColor}`} />
              </div>
              <span className="text-foreground/80">{s.label}</span>
            </motion.button>
          )
        })}
      </div>

      {/* Chart */}
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: -15 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.4} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false}
              tickFormatter={d => fmtDate(d).split(' ').slice(0, 2).join(' ')} />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={52} tickFormatter={v => fmtNumber(v)} />
            <Tooltip content={<ScenarioTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10, paddingTop: 8, color: 'hsl(var(--muted-foreground))' }} />
            {scenarioMeta.map(s => (
              <Line key={s.id} dataKey={s.id} stroke={SCENARIO_COLOURS[s.id]}
                strokeWidth={activeScenario === s.id ? 2.5 : 1.5}
                strokeOpacity={activeScenario === s.id ? 1 : 0.4}
                strokeDasharray={activeScenario === s.id || s.id === 'baseline' ? '0' : '5 3'}
                dot={false} name={s.label} isAnimationActive={true} animationDuration={600} />
            ))}
            {scenarios.custom && (
              <Line dataKey="custom" stroke={SCENARIO_COLOURS.custom} strokeWidth={2}
                dot={false} name={`Custom (${scenarios.custom.growth_pct > 0 ? '+' : ''}${scenarios.custom.growth_pct}%)`}
                isAnimationActive animationDuration={600} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Comparison table */}
      <div className="rounded-xl border border-border/20 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-secondary/15 border-b border-border/20">
              <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground">Period</th>
              {scenarioMeta.map(s => (
                <th key={s.id} className="text-right px-3 py-2.5 font-semibold" style={{ color: SCENARIO_COLOURS[s.id] }}>{s.label}</th>
              ))}
              {scenarios.custom && <th className="text-right px-3 py-2.5 font-semibold" style={{ color: SCENARIO_COLOURS.custom }}>Custom</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/10">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-secondary/10 transition-colors">
                <td className="px-3 py-2 text-muted-foreground">{fmtDate(row.date)}</td>
                <td className="px-3 py-2 text-right font-mono font-medium text-foreground">{fmtNumber(row.baseline, 2)}</td>
                <td className="px-3 py-2 text-right font-mono text-success">{fmtNumber(row.optimistic, 2)}</td>
                <td className="px-3 py-2 text-right font-mono text-warning">{fmtNumber(row.pessimistic, 2)}</td>
                {scenarios.custom && <td className="px-3 py-2 text-right font-mono text-accent">{fmtNumber(row.custom, 2)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Custom scenario builder */}
      <div className="rounded-xl bg-secondary/10 border border-border/15 p-4 space-y-3">
        <p className="text-xs font-semibold text-foreground">Custom scenario</p>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>Growth assumption</span>
              <motion.span
                key={customPct}
                initial={{ scale: 1.3, color: 'hsl(var(--primary))' }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400 }}
                className="font-mono font-semibold text-primary"
              >
                {customPct > 0 ? '+' : ''}{customPct}%
              </motion.span>
            </div>
            <input type="range" min={-50} max={50} step={1}
              value={customPct}
              onChange={e => setCustomPct(Number(e.target.value))}
              className="w-full accent-primary" />
            <div className="flex justify-between text-[10px] text-muted-foreground/60 mt-1">
              <span>−50%</span><span>0</span><span>+50%</span>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleRunCustom}
            disabled={loading}
            className="btn-primary flex items-center gap-1.5 whitespace-nowrap"
          >
            {loading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"/>
              </svg>
            )}
            Run
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
