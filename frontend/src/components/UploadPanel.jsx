import { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileSpreadsheet, CheckCircle2, Zap, Sun, Moon, BarChart3 } from 'lucide-react'

const DATASET_META = [
  { description: 'Monthly avg prices', unit: '£ thousands', color: 'bg-primary/10 text-primary border-primary/20' },
  { description: 'Monthly approvals',  unit: 'thousands',   color: 'bg-success/10 text-success border-success/20'   },
  { description: 'User adoption',      unit: 'users (K)',   color: 'bg-accent/10 text-accent border-accent/20'   },
  { description: '4 banking metrics',  unit: 'multi-col',   color: 'bg-warning/10 text-warning border-warning/20' },
]

function DatasetPreviewModal({ demo, meta, onClose, onLoad, loading }) {
  const [preview, setPreview] = useState(null)
  const [loadingPreview, setLoadingPreview] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function fetchPreview() {
      try {
        const r = await fetch(demo.file)
        const text = await r.text()
        if (text.trim().startsWith('<')) throw new Error('Not a CSV')
        const lines = text.trim().split('\n').filter(Boolean)
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
        const rows = lines.slice(1, 6).map(l => {
          const vals = l.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
          const obj = {}
          headers.forEach((h, i) => { obj[h] = vals[i] ?? '' })
          return obj
        })
        if (!cancelled) setPreview({ headers, rows, total: lines.length - 1 })
      } catch {
        if (!cancelled) setPreview({ error: true })
      } finally {
        if (!cancelled) setLoadingPreview(false)
      }
    }
    fetchPreview()
    return () => { cancelled = true }
  }, [demo.file])

  const cols = Array.isArray(demo.valueCol) ? demo.valueCol : [demo.valueCol]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="glass-elevated rounded-2xl w-full max-w-xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-border/30 flex items-start justify-between gap-3">
          <div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${meta.color}`}>{meta.unit}</span>
            <h3 className="text-base font-semibold text-foreground mt-2">{demo.label}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">{meta.description}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground mt-1 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {preview && !preview.error && (
          <div className="px-5 py-3 flex gap-6 border-b border-border/20 bg-secondary/10">
            <div><p className="text-xs text-muted-foreground">Rows</p><p className="text-sm font-semibold text-foreground">{preview.total}</p></div>
            <div><p className="text-xs text-muted-foreground">Columns</p><p className="text-sm font-semibold text-foreground">{preview.headers.length}</p></div>
            <div><p className="text-xs text-muted-foreground">Date column</p><p className="text-sm font-semibold text-foreground">{demo.dateCol}</p></div>
            <div>
              <p className="text-xs text-muted-foreground">Value{cols.length > 1 ? 's' : ''}</p>
              <p className="text-sm font-semibold text-foreground truncate max-w-[160px]">
                {cols.length > 1 ? `${cols.length} columns` : cols[0]}
              </p>
            </div>
          </div>
        )}

        <div className="px-5 py-4">
          {loadingPreview && <p className="text-sm text-muted-foreground text-center py-6">Loading preview…</p>}
          {!loadingPreview && preview?.error && (
            <p className="text-sm text-destructive text-center py-6">Could not load preview. Make sure the CSV is in <code>frontend/public/data/</code></p>
          )}
          {!loadingPreview && preview && !preview.error && (
            <div className="overflow-x-auto rounded-xl border border-border/20">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-secondary/20">
                    {preview.headers.slice(0, 5).map(h => (
                      <th key={h} className={`px-3 py-2 text-left font-medium whitespace-nowrap
                        ${h === demo.dateCol ? 'text-primary' : cols.includes(h) ? 'text-accent' : 'text-muted-foreground'}`}>
                        {h}
                        {h === demo.dateCol && <span className="ml-1 text-muted-foreground/50">(date)</span>}
                        {cols.includes(h) && <span className="ml-1 text-muted-foreground/50">(value)</span>}
                      </th>
                    ))}
                    {preview.headers.length > 5 && <th className="px-3 py-2 text-muted-foreground">+{preview.headers.length - 5} more</th>}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((row, i) => (
                    <tr key={i} className="border-t border-border/10 hover:bg-secondary/10 transition-colors">
                      {preview.headers.slice(0, 5).map(h => (
                        <td key={h} className="px-3 py-2 text-muted-foreground whitespace-nowrap">{row[h]}</td>
                      ))}
                      {preview.headers.length > 5 && <td className="px-3 py-2 text-muted-foreground/40">…</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-muted-foreground/50 px-3 py-2 border-t border-border/10">Showing 5 of {preview.total} rows</p>
            </div>
          )}
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm rounded-xl border border-border/30 text-muted-foreground hover:bg-secondary/20 transition-colors">Cancel</button>
          <button
            onClick={onLoad}
            disabled={loading}
            className="flex-1 py-2.5 text-sm rounded-xl btn-primary flex items-center justify-center gap-2"
          >
            {loading ? 'Loading…' : <>Use this dataset <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg></>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function UploadPanel({ onUpload, onLoadDemo, loading, error, demoDatasets, theme, onToggleTheme }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [previewIdx, setPreviewIdx] = useState(null)
  const [uploadState, setUploadState] = useState('idle') // idle | uploading | success
  const [uploadedName, setUploadedName] = useState(null)

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file?.name.endsWith('.csv')) { setUploadedName(file.name); setUploadState('uploading'); onUpload(file) }
  }

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (file) { setUploadedName(file.name); setUploadState('uploading'); onUpload(file) }
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div animate={{ x: [0,30,-20,0], y: [0,-20,15,0] }} transition={{ repeat: Infinity, duration: 20 }}
          className="absolute top-[-30%] left-[-15%] w-[700px] h-[700px] rounded-full bg-primary/[0.04] blur-[150px]" />
        <motion.div animate={{ x: [0,-25,20,0], y: [0,25,-15,0] }} transition={{ repeat: Infinity, duration: 25 }}
          className="absolute bottom-[-30%] right-[-15%] w-[600px] h-[600px] rounded-full bg-accent/[0.04] blur-[150px]" />
      </div>

      {/* Header */}
      <header className="relative flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl border border-primary/20 bg-primary/10">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">ForeSight</p>
            <p className="text-[10px] text-muted-foreground">AI-Powered Forecasting</p>
          </div>
        </div>
        <button onClick={onToggleTheme} className="p-2 rounded-xl border border-border/30 bg-secondary/20 hover:bg-secondary/40 text-muted-foreground hover:text-foreground transition-all">
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </header>

      {/* Modal */}
      <AnimatePresence>
        {previewIdx !== null && demoDatasets[previewIdx] && (
          <DatasetPreviewModal
            demo={demoDatasets[previewIdx]}
            meta={DATASET_META[previewIdx] || DATASET_META[0]}
            loading={loading}
            onClose={() => setPreviewIdx(null)}
            onLoad={() => { setPreviewIdx(null); onLoadDemo(previewIdx) }}
          />
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="relative max-w-2xl mx-auto px-6 pt-12 pb-16 space-y-10">
        {/* Hero text */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center space-y-4">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium">
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
              <Zap className="w-3.5 h-3.5" />
            </motion.div>
            Powered by AI
          </motion.div>
          <h2 className="text-4xl font-extrabold tracking-tight text-foreground">
            Start your{' '}
            <span className="text-gradient">forecast</span>
          </h2>
          <p className="text-muted-foreground text-base max-w-lg mx-auto leading-relaxed">
            Upload any time-series CSV and get honest AI-powered forecasts, anomaly alerts, and plain-English insights in under 30 seconds.
          </p>
        </motion.div>

        {/* Error */}
        {error && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            {error}
          </motion.div>
        )}

        {/* Drop zone */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <motion.div
            whileHover={uploadState === 'idle' ? { scale: 1.01 } : undefined}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => uploadState === 'idle' && inputRef.current?.click()}
            className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer
              ${dragging ? 'border-primary/60 bg-primary/[0.04]' : 
                uploadState === 'success' ? 'border-success/40 bg-success/[0.03]' :
                'border-border/40 hover:border-primary/30 bg-card/30'}`}
          >
            <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
            <div className="p-14 text-center">
              {uploadState === 'success' ? (
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-success/10 border border-success/20 flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7 text-success" />
                  </div>
                  <p className="text-lg font-semibold text-foreground">{uploadedName}</p>
                  <p className="text-sm text-muted-foreground">File uploaded — configuring…</p>
                </motion.div>
              ) : uploadState === 'uploading' ? (
                <div className="space-y-5">
                  <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 2 }}
                    className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center">
                    <FileSpreadsheet className="w-7 h-7 text-primary" />
                  </motion.div>
                  <p className="text-sm text-muted-foreground">Reading your file…</p>
                </div>
              ) : (
                <div className="space-y-5">
                  <motion.div animate={{ y: [0,-4,0] }} transition={{ repeat: Infinity, duration: 3 }}
                    className="w-16 h-16 mx-auto rounded-2xl bg-secondary/30 border border-border/30 flex items-center justify-center">
                    <Upload className="w-7 h-7 text-muted-foreground" />
                  </motion.div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">Drop your CSV here</p>
                    <p className="text-sm text-muted-foreground mt-1">or click to browse</p>
                  </div>
                  <div className="flex items-center justify-center gap-3 text-[11px] text-muted-foreground/60">
                    <span className="px-2.5 py-1 rounded-md bg-secondary/30 border border-border/20">Any .csv</span>
                    <span className="px-2.5 py-1 rounded-md bg-secondary/30 border border-border/20">Time-series</span>
                    <span className="px-2.5 py-1 rounded-md bg-secondary/30 border border-border/20">Auto-detect</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* Demo datasets */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">Or explore with sample data</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {demoDatasets.map((d, i) => {
              const meta = DATASET_META[i] || DATASET_META[0]
              return (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + i * 0.08 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setPreviewIdx(i)}
                  disabled={loading}
                  className="group relative overflow-hidden glass-card p-4 text-left hover:border-border/50 transition-all duration-300 disabled:opacity-50"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-accent/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative">
                    <div className="w-8 h-8 rounded-lg bg-secondary/40 border border-border/20 flex items-center justify-center mb-3">
                      <BarChart3 className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-xs font-semibold text-foreground leading-tight">{d.label}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-tight">{meta.description}</p>
                    <span className={`text-[10px] font-medium mt-2 px-2 py-0.5 rounded-full border inline-block ${meta.color}`}>{meta.unit}</span>
                  </div>
                </motion.button>
              )
            })}
          </div>
        </motion.div>

        <p className="text-xs text-muted-foreground text-center">No personal data required or stored. All analysis runs in-session only.</p>
      </div>
    </div>
  )
}
