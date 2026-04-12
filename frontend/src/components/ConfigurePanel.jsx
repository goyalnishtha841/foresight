import { motion } from 'framer-motion'
import { ArrowLeft, Zap, Sun, Moon } from 'lucide-react'

export default function ConfigurePanel({
  uploadInfo, dateCol, setDateCol,
  valueCol, setValueCol,
  periods, setPeriods,
  datasetLabel, setDatasetLabel,
  onAnalyse, onBack, loading, error,
  theme, onToggleTheme,
}) {
  const { columns = [], value_cols = [], rows } = uploadInfo || {}

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/[0.04] blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-accent/[0.04] blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl border border-primary/20 bg-primary/10">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <p className="text-sm font-bold text-foreground">ForeSight</p>
        </div>
        <button onClick={onToggleTheme} className="p-2 rounded-xl border border-border/30 bg-secondary/20 hover:bg-secondary/40 text-muted-foreground hover:text-foreground transition-all">
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </header>

      <div className="relative flex-1 flex flex-col items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg"
        >
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <h2 className="text-2xl font-bold text-foreground mb-1">Configure your forecast</h2>
          <p className="text-sm text-muted-foreground mb-6">{rows} rows detected. Confirm which columns to use.</p>

          <div className="glass-card p-6 space-y-5">
            {/* Dataset label */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Dataset name</label>
              <input
                type="text"
                value={datasetLabel}
                onChange={e => setDatasetLabel(e.target.value)}
                className="input-dark"
                placeholder="e.g. Weekly sales revenue"
              />
            </div>

            {/* Date column */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Date column</label>
              <select
                value={dateCol}
                onChange={e => setDateCol(e.target.value)}
                className="input-dark bg-secondary/20"
              >
                {columns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Value column */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Value column <span className="text-muted-foreground font-normal">(what to forecast)</span>
              </label>
              <select
                value={valueCol}
                onChange={e => setValueCol(e.target.value)}
                className="input-dark bg-secondary/20"
              >
                {(value_cols.length ? value_cols : columns).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Forecast horizon */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Forecast horizon —{' '}
                <span className="text-primary font-semibold">{periods} period{periods !== 1 ? 's' : ''} ahead</span>
              </label>
              <input
                type="range" min={1} max={8} step={1}
                value={periods}
                onChange={e => setPeriods(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1</span><span>4</span><span>8</span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Submit */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={onAnalyse}
              disabled={loading || !dateCol || !valueCol}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Analysing…
                </>
              ) : (
                <>
                  Run forecast
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
