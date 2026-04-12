/**
 * api.js
 * ------
 * Centralised API client for the ForeSight backend.
 * All fetch calls go through here — no fetch() calls scattered in components.
 */

import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, // 60s — Claude API calls can take a few seconds
})

/**
 * Upload a CSV file and get detected column info.
 * @param {File} file
 */
export async function uploadFile(file) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await client.post('/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

/**
 * Run full analysis pipeline.
 * @param {object} params - { date_col, value_col, periods, dataset_label }
 */
export async function runAnalysis(params) {
  const { data } = await client.post('/analyse', params)
  return data
}

/**
 * Get Claude explanation for a specific anomaly by index.
 * @param {number} index
 */
export async function explainAnomaly(index) {
  const { data } = await client.post(`/anomaly/${index}/explain`)
  return data
}

/**
 * Run a custom growth scenario.
 * @param {number} growthPct - e.g. 15.0 for +15%
 * @param {number} periods
 */
export async function runCustomScenario(growthPct, periods = 4) {
  const { data } = await client.post('/scenario/custom', {
    growth_pct: growthPct,
    periods,
  })
  return data
}

/**
 * Ask a plain-English question about the current dataset.
 * @param {string} question
 * @param {string} datasetLabel
 */
export async function askQuestion(question, datasetLabel) {
  const { data } = await client.post('/ask', {
    question,
    dataset_label: datasetLabel,
  })
  return data
}

/** Liveness check */
export async function checkHealth() {
  const { data } = await client.get('/health')
  return data
}
export async function exportPdf() {
  const response = await fetch(`${BASE_URL}/export/pdf`, { method: 'POST' })
  const blob = await response.blob()
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = 'ForeSight_Briefing.pdf'
  a.click()
  URL.revokeObjectURL(url)
}
