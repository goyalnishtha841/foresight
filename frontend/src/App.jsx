/**
 * App.jsx
 * -------
 * Root component. Manages the three-step user journey:
 *   1. upload    — CSV upload / demo dataset selection
 *   2. configure — column mapping + forecast horizon
 *   3. dashboard — full results view
 *
 * All state lives in the useAnalysis hook.
 * Theme (dark/light) is toggled here and applied to the root element.
 */

import { useState, useEffect } from 'react'
import UploadPanel    from './components/UploadPanel.jsx'
import ConfigurePanel from './components/ConfigurePanel.jsx'
import Dashboard      from './components/Dashboard.jsx'
import LoadingOverlay from './components/LoadingOverlay.jsx'
import { useAnalysis } from './hooks/useAnalysis.js'

export default function App() {
  const analysis = useAnalysis()
  const [theme, setTheme] = useState('dark')

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'light') {
      root.classList.add('light')
    } else {
      root.classList.remove('light')
    }
  }, [theme])

  function toggleTheme() {
    setTheme(t => t === 'dark' ? 'light' : 'dark')
  }

  return (
    <>
      {analysis.loading && <LoadingOverlay message={analysis.loadingMsg} />}

      {analysis.step === 'upload' && (
        <UploadPanel
          onUpload={analysis.handleUpload}
          onLoadDemo={analysis.handleLoadDemo}
          loading={analysis.loading}
          error={analysis.error}
          demoDatasets={analysis.DEMO_DATASETS}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}
        {analysis.step === 'configure' && (
                <ConfigurePanel
                  uploadInfo={analysis.uploadInfo}
                  dateCol={analysis.dateCol}
                  setDateCol={analysis.setDateCol}
                  valueCol={analysis.valueCol}
                  setValueCol={analysis.setValueCol}
                  periods={analysis.periods}
                  setPeriods={analysis.setPeriods}
                  datasetLabel={analysis.datasetLabel}
                  setDatasetLabel={analysis.setDatasetLabel}
                  onAnalyse={analysis.handleAnalyse}
                  onBack={analysis.handleReset}
                  loading={analysis.loading}
                  error={analysis.error}
                  theme={theme}
                  onToggleTheme={toggleTheme}
                  threshold={analysis.threshold}
                  setThreshold={analysis.setThreshold}
                  thresholdDir={analysis.thresholdDir}
                  setThresholdDir={analysis.setThresholdDir}
                />
              )}

      {analysis.step === 'dashboard' && analysis.results && (
        <Dashboard
          results={analysis.results}
          datasetLabel={analysis.datasetLabel}
          valueCol={analysis.valueCol}
          anomalyExplanations={analysis.anomalyExplanations}
          loadingAnomalyIdx={analysis.loadingAnomalyIdx}
          onExplainAnomaly={analysis.handleExplainAnomaly}
          onCustomScenario={analysis.handleCustomScenario}
          question={analysis.question}
          setQuestion={analysis.setQuestion}
          onAsk={analysis.handleAsk}
          answer={analysis.answer}
          loadingAnswer={analysis.loadingAnswer}
          onReset={analysis.handleReset}
          valueCols={analysis.valueCols}
          onSwitchColumn={analysis.handleSwitchColumn}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}
    </>
  )
}
