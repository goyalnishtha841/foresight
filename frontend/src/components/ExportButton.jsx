import { useState } from 'react'
import { motion } from 'framer-motion'
import { Download, Loader2 } from 'lucide-react'
import { exportPdf } from '../utils/api.js'

export default function ExportButton() {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try { await exportPdf() }
    catch (e) { console.error('Export failed:', e) }
    finally { setLoading(false) }
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={handleExport}
      disabled={loading}
      className="btn-ghost flex items-center gap-1.5 text-xs"
    >
      {loading
        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
        : <Download className="w-3.5 h-3.5" />}
      <span className="hidden sm:inline font-semibold uppercase tracking-wider text-[10px]">Export</span>
    </motion.button>
  )
}
