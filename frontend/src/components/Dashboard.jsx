/**
 * Dashboard.jsx
 * -------------
 * Master layout for the results view. Composes all analysis panels
 * into a two-column grid (wide screens) or single column (mobile).
 *
 * Layout order (matches judge review priority):
 *  1. Header bar — dataset name, health score, reset button
 *  2. Quality banner
 *  3. Key findings (AI proactive brief)
 *  4. Forecast chart (primary visual)
 *  5. Anomaly panel          │  Validation / accuracy panel
 *  6. Scenario comparison    │  Trend decomposition
 *  7. Ask a question (full width)
 */

import QualityBanner      from './QualityBanner.jsx'
import KeyFindings        from './KeyFindings.jsx'
import ForecastChart      from './ForecastChart.jsx'
import AnomalyPanel       from './AnomalyPanel.jsx'
import ValidationPanel    from './ValidationPanel.jsx'
import ScenarioPanel      from './ScenarioPanel.jsx'
import DecompositionPanel from './DecompositionPanel.jsx'
import AskPanel           from './AskPanel.jsx'
import HealthDial         from './HealthDial.jsx'
import ExportButton from './ExportButton.jsx'

export default function Dashboard({
  results,
  datasetLabel,
  anomalyExplanations,
  loadingAnomalyIdx,
  onExplainAnomaly,
  onCustomScenario,
  valueCols,
  valueCol,
  onSwitchColumn,
  question, setQuestion, onAsk, answer, loadingAnswer,
  onReset,
}) {
  const {
    quality, forecast, anomalies,
    validation, scenarios,
    narration, key_findings,
  } = results

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Top nav bar */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3
                        flex items-center justify-between gap-4">
          {/* Logo + dataset */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-nw-600 flex items-center
                            justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor"
                   strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                      d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.94" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">ForeSight</p>
              <p className="text-xs text-gray-400 truncate">{datasetLabel}</p>
            </div>
          {/* Column switcher */}
        {valueCols && valueCols.length > 1 && valueCol && (
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-xs text-gray-400">Forecasting:</span>
            <select
              className="text-xs border border-gray-200 rounded-lg px-2 py-1
                        bg-white text-gray-700 font-medium cursor-pointer
                        hover:border-nw-300 focus:outline-none focus:border-nw-400
                        transition-colors"
              value={valueCol || ''}
              onChange={(e) => onSwitchColumn(e.target.value)}
            >
              {valueCols.map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>
        )}
          </div>

          {/* Health score compact */}
          {validation && !validation.error && (
            <div className="hidden sm:block">
              <HealthDial
                score={validation.health_score}
                label={validation.health_label}
              />
            </div>
          )}
          <ExportButton datasetLabel={datasetLabel} results={results} />
          {/* Reset */}
          <button onClick={onReset} className="btn-ghost flex items-center gap-1.5 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor"
                 strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                    d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
            </svg>
            New analysis
          </button>
        </div>
      </header>

      {/* Main content */}
      <main id="dashboard-content" className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4">

        {/* Quality banner */}
        {quality && <QualityBanner quality={quality} />}

        {/* Key findings */}
        {(key_findings || narration) && (
          <KeyFindings
            keyFindings={key_findings}
            narration={narration}
            datasetLabel={datasetLabel}
          />
        )}

        {/* Primary forecast chart — full width */}
        {forecast && (
          <ForecastChart
            forecast={forecast}
            anomalies={anomalies || []}
            validationWinner={validation?.winner}
          />
        )}

        {/* Two-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left column */}
          <div className="space-y-4">
            {anomalies && (
    <AnomalyPanel
      anomalies={anomalies}
      anomalyRisk={results.anomaly_risk}
      explanations={anomalyExplanations}
      loadingIdx={loadingAnomalyIdx}
      onExplain={onExplainAnomaly}
    />
  )}
            {scenarios && (
              <ScenarioPanel
                scenarios={scenarios}
                onCustomScenario={onCustomScenario}
              />
            )}
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {validation && (
              <ValidationPanel
                validation={validation}
                modelParams={forecast?.model_params}
              />
            )}
            {forecast?.decomposition && (
              <DecompositionPanel decomposition={forecast.decomposition} />
            )}
          </div>
        </div>

        {/* Ask a question — full width */}
        <AskPanel
          question={question}
          setQuestion={setQuestion}
          onAsk={onAsk}
          answer={answer}
          loading={loadingAnswer}
        />

        {/* Footer */}
        <p className="text-xs text-center text-gray-400 pb-6">
          ForeSight · NatWest Code for Purpose — India Hackathon ·
          No personal data stored · Decision support only
        </p>
      </main>
    </div>
  )
}
