import { motion } from 'framer-motion'
import { Zap, Sun, Moon, RotateCcw } from 'lucide-react'
import QualityBanner      from './QualityBanner.jsx'
import KeyFindings        from './KeyFindings.jsx'
import ForecastChart      from './ForecastChart.jsx'
import AnomalyPanel       from './AnomalyPanel.jsx'
import ValidationPanel    from './ValidationPanel.jsx'
import ScenarioPanel      from './ScenarioPanel.jsx'
import DecompositionPanel from './DecompositionPanel.jsx'
import AskPanel           from './AskPanel.jsx'
import HealthDial         from './HealthDial.jsx'
import ExportButton       from './ExportButton.jsx'
import ThresholdPanel    from './ThresholdPanel.jsx'

function ScrollReveal({ children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

export default function Dashboard({
  results, datasetLabel,
  anomalyExplanations, loadingAnomalyIdx, onExplainAnomaly,
  onCustomScenario, valueCols, valueCol, onSwitchColumn,
  question, setQuestion, onAsk, answer, loadingAnswer,
  onReset, theme, onToggleTheme,
}) {
  const { quality, forecast, anomalies, validation, scenarios, narration, key_findings } = results

  return (
    <div className="min-h-screen bg-background relative">
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div animate={{ x: [0,30,-20,0], y: [0,-20,15,0] }} transition={{ repeat: Infinity, duration: 20 }}
          className="absolute top-[-30%] left-[-15%] w-[700px] h-[700px] rounded-full bg-primary/[0.03] blur-[150px]" />
        <motion.div animate={{ x: [0,-25,20,0], y: [0,25,-15,0] }} transition={{ repeat: Infinity, duration: 25 }}
          className="absolute bottom-[-30%] right-[-15%] w-[600px] h-[600px] rounded-full bg-accent/[0.03] blur-[150px]" />
      </div>

      {/* Sticky header */}
      <header className="sticky top-0 z-20 border-b border-border/20 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          {/* Logo + dataset */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl border border-primary/20 bg-primary/10 flex-shrink-0">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground truncate">ForeSight</p>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider truncate">{datasetLabel}</p>
            </div>

            {valueCols && valueCols.length > 1 && (
              <div className="hidden md:flex items-center gap-2 ml-4 border-l pl-4 border-border/20">
                <span className="text-[10px] text-muted-foreground font-bold uppercase">Metric:</span>
                <select
                  className="text-xs border border-border/30 rounded-lg px-2 py-1 bg-secondary/20 text-foreground font-medium cursor-pointer
                             hover:border-primary/30 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                  value={valueCol || ''}
                  onChange={(e) => onSwitchColumn(e.target.value)}
                >
                  {valueCols.map(col => <option key={col} value={col}>{col}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {validation && !validation.error && (
              <div className="hidden lg:block border-r pr-4 border-border/20">
                <HealthDial score={validation.health_score} label={validation.health_label} />
              </div>
            )}
            <ExportButton datasetLabel={datasetLabel} results={results} />
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl border border-border/30 bg-secondary/20 hover:bg-secondary/40 text-muted-foreground hover:text-foreground transition-all"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button onClick={onReset} className="group flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors btn-ghost text-xs">
              <RotateCcw className="w-3.5 h-3.5 group-hover:rotate-[-45deg] transition-transform" />
              <span className="hidden sm:inline font-semibold uppercase tracking-wider text-[10px]">Reset</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main id="dashboard-content" className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {quality && <ScrollReveal><QualityBanner quality={quality} /></ScrollReveal>}

        {(key_findings || narration) && (
          <ScrollReveal delay={0.05}>
            <KeyFindings keyFindings={key_findings} narration={narration} datasetLabel={datasetLabel} />
          </ScrollReveal>
        )}

        {forecast && (
                  <ScrollReveal delay={0.1}>
                    <ForecastChart
                      forecast={forecast}
                      anomalies={anomalies || []}
                      validationWinner={validation?.winner}
                      threshold={results?.threshold}
                    />
                  </ScrollReveal>
                )}

        {results?.threshold?.any_breach && (
          <ScrollReveal delay={0.12}>
            <ThresholdPanel threshold={results.threshold} />
          </ScrollReveal>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            {anomalies && (
              <ScrollReveal delay={0.15}>
                <AnomalyPanel
                  anomalies={anomalies}
                  anomalyRisk={results.anomaly_risk}
                  explanations={anomalyExplanations}
                  loadingIdx={loadingAnomalyIdx}
                  onExplain={onExplainAnomaly}
                />
              </ScrollReveal>
            )}
            {scenarios && (
              <ScrollReveal delay={0.2}>
                <ScenarioPanel scenarios={scenarios} onCustomScenario={onCustomScenario} />
              </ScrollReveal>
            )}
          </div>
          <div className="space-y-6">
            {validation && (
              <ScrollReveal delay={0.15}>
                <ValidationPanel validation={validation} modelParams={forecast?.model_params} />
              </ScrollReveal>
            )}
          </div>
        </div>

        {forecast?.decomposition && (
          <ScrollReveal delay={0.22}>
            <DecompositionPanel decomposition={forecast.decomposition} />
          </ScrollReveal>
        )}

        <ScrollReveal delay={0.25}>
          <AskPanel question={question} setQuestion={setQuestion} onAsk={onAsk} answer={answer} loading={loadingAnswer} />
        </ScrollReveal>

        <footer className="pt-12 pb-8 border-t border-border/20">
          <p className="text-[10px] text-center text-muted-foreground font-semibold uppercase tracking-[0.2em]">
            ForeSight · AI Predictive Engine · Secure · No personal data stored
          </p>
        </footer>
      </main>
    </div>
  )
}
