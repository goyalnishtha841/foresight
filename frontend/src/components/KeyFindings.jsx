import { motion } from 'framer-motion'
import { TrendingUp, AlertTriangle, Eye, Sparkles } from 'lucide-react'

const ICONS = [TrendingUp, AlertTriangle, Eye]
const FINDING_LABELS = ['Trend', 'Anomaly', 'Watch']

export default function KeyFindings({ keyFindings, narration, datasetLabel }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card p-5 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Key findings</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{datasetLabel}</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-accent font-medium
                        bg-accent/10 border border-accent/15 px-2.5 py-1 rounded-full">
          <Sparkles className="w-3 h-3" />
          AI generated
        </div>
      </div>

      {/* 3 findings */}
      {keyFindings?.length > 0 && (
        <div className="space-y-2">
          {keyFindings.map((finding, i) => {
            if (!finding) return null
            const Icon = ICONS[i]
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-start gap-3 p-3 rounded-xl bg-secondary/10 border border-border/20 hover:bg-secondary/20 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center text-primary flex-shrink-0 mt-0.5">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-primary mb-0.5">{FINDING_LABELS[i]}</p>
                  <p className="text-sm text-foreground/80 leading-relaxed">{finding}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Full summary */}
      {narration?.summary && (
        <div className="border-t border-border/20 pt-4">
          <p className="section-label mb-2">Forecast summary</p>
          <p className="text-sm text-muted-foreground leading-relaxed">{narration.summary}</p>
          {narration.disclaimer && (
            <p className="text-xs text-muted-foreground/60 mt-3 italic border-t border-border/20 pt-2">
              {narration.disclaimer}
            </p>
          )}
        </div>
      )}
    </motion.div>
  )
}
