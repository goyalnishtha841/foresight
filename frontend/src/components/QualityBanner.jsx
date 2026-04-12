import { motion } from 'framer-motion'

export default function QualityBanner({ quality }) {
  if (!quality) return null

  const styles = {
    clean:   { bg: 'bg-success/[0.06]',     border: 'border-success/20',     text: 'text-success',     dot: 'bg-success' },
    warning: { bg: 'bg-warning/[0.06]',     border: 'border-warning/20',     text: 'text-warning',     dot: 'bg-warning' },
    poor:    { bg: 'bg-destructive/[0.06]', border: 'border-destructive/20', text: 'text-destructive', dot: 'bg-destructive' },
  }
  const s = styles[quality.verdict] || styles.warning

  const summary = quality.verdict === 'clean'
    ? `${quality.n_rows} observations · ${quality.date_start} to ${quality.date_end} · No issues found`
    : `${quality.n_rows} observations · ${quality.date_start} to ${quality.date_end}`

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border px-4 py-3 ${s.bg} ${s.border}`}
    >
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0 mt-1.5">
          <div className={`w-2 h-2 rounded-full ${s.dot}`} />
          {quality.verdict !== 'clean' && (
            <div className={`absolute inset-0 rounded-full animate-ping opacity-50 ${s.dot}`} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold ${s.text}`}>
              Data quality: {quality.verdict === 'clean' ? 'Clean' : quality.verdict === 'warning' ? 'Warning' : 'Poor'}
            </span>
            <span className={`text-xs ${s.text} opacity-70`}>{summary}</span>
          </div>
          {quality.issues?.length > 0 && (
            <ul className="mt-1 space-y-0.5">
              {quality.issues.map((issue, i) => (
                <li key={i} className={`text-xs ${s.text} opacity-75`}>· {issue}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </motion.div>
  )
}
