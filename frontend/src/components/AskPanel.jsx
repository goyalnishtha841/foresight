import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Send, Loader2, Sparkles } from 'lucide-react'

const SUGGESTED_QUESTIONS = [
  'Why might the forecast be declining?',
  'When is the next expected peak?',
  'Should I be concerned about any anomalies?',
  'How reliable is this forecast?',
]

export default function AskPanel({ question, setQuestion, onAsk, answer, loading }) {
  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onAsk() }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card p-6 space-y-5"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-accent/10 border border-accent/10">
          <MessageCircle className="w-4 h-4 text-accent" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Ask AI</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Answers are grounded in your forecast results</p>
        </div>
      </div>

      {/* Input */}
      <div className="relative">
        <input
          type="text"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={handleKey}
          placeholder="e.g. Why was week 45 so high?"
          className="input-dark w-full pr-12"
          disabled={loading}
        />
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={onAsk}
          disabled={loading || !question.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-primary/90 hover:bg-primary text-white disabled:opacity-30 transition-all duration-200"
          style={{ boxShadow: '0 0 0px transparent' }}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </motion.button>
      </div>

      {/* Suggested questions */}
      {!answer && !loading && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map(q => (
            <motion.button
              key={q}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setQuestion(q)}
              className="px-3 py-1.5 rounded-full text-xs bg-secondary/20 border border-border/20 text-muted-foreground
                         hover:text-foreground hover:border-border/40 hover:bg-secondary/40 transition-all duration-200"
            >
              <Sparkles className="w-3 h-3 inline mr-1.5 opacity-50" />
              {q}
            </motion.button>
          ))}
        </div>
      )}

      {/* Response area */}
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-5 rounded-xl bg-secondary/15 border border-border/20 space-y-3"
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              <span>Analysing your data…</span>
            </div>
            <div className="space-y-2">
              {[1, 0.75, 0.5].map((w, i) => (
                <motion.div key={i}
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                  className="h-3 bg-secondary/30 rounded-full"
                  style={{ width: `${w * 100}%` }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {!loading && answer && (
          <motion.div
            key="answer"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="p-5 rounded-xl bg-secondary/15 border border-border/20 space-y-3"
          >
            <div className="flex gap-3">
              <div className="mt-0.5 p-1 rounded-md bg-accent/10 h-fit flex-shrink-0">
                <Sparkles className="w-3 h-3 text-accent" />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{answer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
