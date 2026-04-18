/**
 * useAnalysis.js
 * --------------
 * Custom hook that owns all application state and API interactions.
 * Components stay pure — they receive data and callbacks, never call APIs directly.
 */

import { useState, useCallback } from 'react'
import {
  uploadFile,
  runAnalysis,
  explainAnomaly,
  runCustomScenario,
  askQuestion,
  runPortfolioScan,
} from '../utils/api.js'

const DEMO_DATASETS = [
  {
    label:    'UK house prices',
    file:     '/data/uk_house_prices.csv',
    dateCol:  'month',
    valueCol: 'avg_house_price_gbp_thousands',
  },
  {
    label:    'UK mortgage approvals',
    file:     '/data/uk_mortgage_approvals_monthly.csv',
    dateCol:  'month',
    valueCol: 'mortgage_approvals_thousands',
  },
  {
    label:    'UK digital banking adoption',
    file:     '/data/uk_digital_banking_users.csv',
    dateCol:  'month',
    valueCol: 'digital_banking_users_k',
  },
  {
    label:    'UK banking multi-column dataset',
    file:     '/data/uk_banking_multicolumn.csv',
    dateCol:  'date',
    valueCol: ['mortgage_approvals_thousands', 'avg_house_price_gbp_thousands', 'consumer_credit_gbp_bn', 'effective_mortgage_rate_pct'],
  },
]

export function useAnalysis() {
  // Upload state
  const [uploadInfo, setUploadInfo]     = useState(null)
  const [dateCol, setDateCol]           = useState('')
  const [valueCol, setValueCol]         = useState('')
  const [valueCols, setValueCols]       = useState([])
  const [periods, setPeriods]           = useState(4)
  const [datasetLabel, setDatasetLabel] = useState('')

  // Results state
  const [results, setResults]           = useState(null)

  // UI state
  const [step, setStep]                 = useState('upload')
  const [loading, setLoading]           = useState(false)
  const [loadingMsg, setLoadingMsg]     = useState('')
  const [error, setError]               = useState(null)

  // Anomaly explanation cache
  const [anomalyExplanations, setAnomalyExplanations] = useState({})
  const [loadingAnomalyIdx, setLoadingAnomalyIdx]     = useState(null)

  // Q&A state
  const [question, setQuestion]           = useState('')
  const [answer, setAnswer]               = useState(null)
  const [loadingAnswer, setLoadingAnswer] = useState(false)

  // Threshold state
  const [threshold, setThreshold]       = useState('')
  const [thresholdDir, setThresholdDir] = useState('below')

  // Portfolio state
  const [portfolioResults, setPortfolioResults] = useState(null)
  const [loadingPortfolio, setLoadingPortfolio] = useState(false)

  // ── Upload ─────────────────────────────────────────────────────────────

  const handleUpload = useCallback(async (file) => {
    setLoading(true)
    setLoadingMsg('Reading your file…')
    setError(null)
    try {
      const info = await uploadFile(file)
      setUploadInfo(info)
      setDateCol(info.date_col || info.columns[0])
      setValueCol(info.value_cols?.[0] || info.columns[1])
      setValueCols(info.value_cols || [])
      setDatasetLabel(file.name.replace('.csv', '').replace(/_/g, ' '))

      if (info.value_cols && info.value_cols.length > 1) {
        setLoading(false)
        setLoadingPortfolio(true)
        try {
          const portfolio = await runPortfolioScan(
            info.date_col || info.columns[0],
            info.value_cols
          )
          setPortfolioResults(portfolio)
          setStep('portfolio')
        } catch {
          setStep('configure')
        } finally {
          setLoadingPortfolio(false)
        }
      } else {
        setStep('configure')
      }
    } catch (e) {
      setError(e?.response?.data?.detail || 'Upload failed. Please try a valid CSV.')
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Load demo dataset ──────────────────────────────────────────────────

  const handleLoadDemo = useCallback(async (demoIdx) => {
    const demo = DEMO_DATASETS[demoIdx]
    setLoading(true)
    setLoadingMsg('Loading demo dataset…')
    setError(null)
    try {
      const resp = await fetch(demo.file)
      const text = await resp.text()
      const blob = new Blob([text], { type: 'text/csv' })
      const file = new File([blob], `${demo.label}.csv`, { type: 'text/csv' })
      const info = await uploadFile(file)
      setUploadInfo(info)
      setDateCol(demo.dateCol)

      const firstCol = Array.isArray(demo.valueCol) ? demo.valueCol[0] : demo.valueCol
      setValueCol(firstCol)
      setValueCols(
        Array.isArray(demo.valueCol) ? demo.valueCol : info.value_cols || []
      )
      setDatasetLabel(demo.label)

      if (Array.isArray(demo.valueCol) && demo.valueCol.length > 1) {
        setLoading(false)
        setLoadingPortfolio(true)
        try {
          const portfolio = await runPortfolioScan(demo.dateCol, demo.valueCol)
          setPortfolioResults(portfolio)
          setStep('portfolio')
        } catch {
          setStep('configure')
        } finally {
          setLoadingPortfolio(false)
        }
      } else {
        setStep('configure')
      }
    } catch (e) {
      setError('Could not load demo dataset.')
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Run analysis ───────────────────────────────────────────────────────

  const handleAnalyse = useCallback(async () => {
    setLoading(true)
    setError(null)
    setResults(null)
    setAnomalyExplanations({})
    setAnswer(null)

    const steps = [
      'Checking data quality…',
      'Running ETS forecast…',
      'Detecting anomalies…',
      'Backtesting accuracy…',
      'Generating AI summary…',
    ]
    let i = 0
    setLoadingMsg(steps[i])
    const interval = setInterval(() => {
      i = Math.min(i + 1, steps.length - 1)
      setLoadingMsg(steps[i])
    }, 1200)

    try {
      const data = await runAnalysis({
        date_col:      dateCol,
        value_col:     valueCol,
        periods,
        dataset_label: datasetLabel,
        threshold:     threshold ? parseFloat(threshold) : null,
        threshold_dir: thresholdDir,
      })
      setResults(data)
      setStep('dashboard')
    } catch (e) {
      setError(e?.response?.data?.detail || 'Analysis failed. Please check your column selection.')
    } finally {
      clearInterval(interval)
      setLoading(false)
    }
  }, [dateCol, valueCol, periods, datasetLabel, threshold, thresholdDir])

  // ── Switch column from dashboard header ───────────────────────────────

  const handleSwitchColumn = useCallback(async (newCol) => {
    setValueCol(newCol)
    setLoading(true)
    setError(null)
    setResults(null)
    setAnomalyExplanations({})
    setAnswer(null)

    const steps = [
      'Switching column…',
      'Running ETS forecast…',
      'Detecting anomalies…',
      'Backtesting accuracy…',
      'Generating AI summary…',
    ]
    let i = 0
    setLoadingMsg(steps[i])
    const interval = setInterval(() => {
      i = Math.min(i + 1, steps.length - 1)
      setLoadingMsg(steps[i])
    }, 1200)

    try {
      const data = await runAnalysis({
        date_col:      dateCol,
        value_col:     newCol,
        periods,
        dataset_label: datasetLabel,
        threshold:     threshold ? parseFloat(threshold) : null,
        threshold_dir: thresholdDir,
      })
      setResults(data)
      setStep('dashboard')
    } catch (e) {
      setError(e?.response?.data?.detail || 'Analysis failed.')
    } finally {
      clearInterval(interval)
      setLoading(false)
    }
  }, [dateCol, periods, datasetLabel, threshold, thresholdDir])

  // ── Select column from portfolio card ─────────────────────────────────

  const handleSelectColumn = useCallback((col) => {
    setValueCol(col)
    setStep('configure')
  }, [])

  // ── Anomaly explanation ────────────────────────────────────────────────

  const handleExplainAnomaly = useCallback(async (index) => {
    if (anomalyExplanations[index]) return
    setLoadingAnomalyIdx(index)
    try {
      const { explanation } = await explainAnomaly(index)
      setAnomalyExplanations(prev => ({ ...prev, [index]: explanation }))
    } catch {
      setAnomalyExplanations(prev => ({
        ...prev,
        [index]: 'Could not generate explanation. Please try again.',
      }))
    } finally {
      setLoadingAnomalyIdx(null)
    }
  }, [anomalyExplanations])

  // ── Custom scenario ────────────────────────────────────────────────────

  const handleCustomScenario = useCallback(async (growthPct) => {
    try {
      const scenario = await runCustomScenario(growthPct, periods)
      setResults(prev => ({
        ...prev,
        scenarios: { ...prev.scenarios, custom: scenario },
      }))
    } catch {
      // Silently fail
    }
  }, [periods])

  // ── Q&A ────────────────────────────────────────────────────────────────

  const handleAsk = useCallback(async () => {
    if (!question.trim()) return
    setLoadingAnswer(true)
    setAnswer(null)
    try {
      const resp = await askQuestion(question, datasetLabel)
      setAnswer(resp.answer)
    } catch {
      setAnswer('Sorry, could not answer that question right now.')
    } finally {
      setLoadingAnswer(false)
    }
  }, [question, datasetLabel])

  // ── Reset ──────────────────────────────────────────────────────────────

  const handleReset = useCallback(() => {
    setStep('upload')
    setUploadInfo(null)
    setResults(null)
    setError(null)
    setAnswer(null)
    setQuestion('')
    setAnomalyExplanations({})
    setValueCols([])
    setPortfolioResults(null)
    setThreshold('')
    setThresholdDir('below')
  }, [])

  return {
    // State
    step, loading, loadingMsg, error,
    uploadInfo,
    dateCol,  setDateCol,
    valueCol, setValueCol, valueCols,
    periods,  setPeriods,
    datasetLabel, setDatasetLabel,
    results,
    anomalyExplanations, loadingAnomalyIdx,
    question, setQuestion, answer, loadingAnswer,
    threshold, setThreshold,
    thresholdDir, setThresholdDir,
    portfolioResults, loadingPortfolio,
    // Actions
    handleUpload,
    handleLoadDemo,
    handleAnalyse,
    handleSwitchColumn,
    handleSelectColumn,
    handleExplainAnomaly,
    handleCustomScenario,
    handleAsk,
    handleReset,
    // Constants
    DEMO_DATASETS,
  }
}