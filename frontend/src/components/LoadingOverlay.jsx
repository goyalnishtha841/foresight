import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'

export default function LoadingOverlay({ message }) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-6 text-center px-6"
      >
        {/* Animated logo mark */}
        <div className="relative w-16 h-16">
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.15, 0.3] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 rounded-2xl"
            style={{ background: 'var(--gradient-primary)' }}
          />
          <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center"
               style={{ background: 'var(--gradient-primary)' }}>
            <Zap className="w-8 h-8 text-white" />
          </div>
        </div>

        <div>
          <p className="text-base font-semibold text-foreground">{message}</p>
          <p className="text-sm text-muted-foreground mt-1">This takes a few seconds…</p>
        </div>

        {/* Progress dots */}
        <div className="flex gap-2">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
              className="w-2 h-2 rounded-full bg-primary"
            />
          ))}
        </div>
      </motion.div>
    </div>
  )
}
