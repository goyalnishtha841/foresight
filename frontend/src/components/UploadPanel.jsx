/**
 * UploadPanel.jsx
 * ---------------
 * Landing screen. Accepts CSV via drag-and-drop or file picker.
 * Also shows three one-click demo dataset buttons for instant demo.
 */

// import { useRef, useState } from 'react'

// export default function UploadPanel({ onUpload, onLoadDemo, loading, error, demoDatasets }) {
//   const inputRef = useRef(null)
//   const [dragging, setDragging] = useState(false)

//   function handleDrop(e) {
//     e.preventDefault()
//     setDragging(false)
//     const file = e.dataTransfer.files[0]
//     if (file?.name.endsWith('.csv')) onUpload(file)
//   }

//   function handleFileChange(e) {
//     const file = e.target.files[0]
//     if (file) onUpload(file)
//   }

//   return (
//     <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">

//       {/* Logo / header */}
//       <div className="mb-10 text-center animate-fade-in">
//         <div className="inline-flex items-center gap-3 mb-4">
//           <div className="w-10 h-10 rounded-xl bg-nw-600 flex items-center justify-center">
//             <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.94" />
//             </svg>
//           </div>
//           <span className="text-2xl font-semibold text-gray-900">ForeSight</span>
//         </div>
//         <p className="text-gray-500 text-base max-w-sm">
//           Upload any time-series CSV and get honest AI-powered forecasts,
//           anomaly alerts, and plain-English insights in under 30 seconds.
//         </p>
//       </div>

//       {/* Drop zone */}
//       <div
//         className={`w-full max-w-lg rounded-2xl border-2 border-dashed p-12 text-center
//           transition-colors duration-200 cursor-pointer
//           ${dragging ? 'border-nw-600 bg-nw-50' : 'border-gray-200 bg-white hover:border-nw-400 hover:bg-nw-50'}`}
//         onDragOver={e => { e.preventDefault(); setDragging(true) }}
//         onDragLeave={() => setDragging(false)}
//         onDrop={handleDrop}
//         onClick={() => inputRef.current?.click()}
//       >
//         <input
//           ref={inputRef}
//           type="file"
//           accept=".csv"
//           className="hidden"
//           onChange={handleFileChange}
//         />
//         <div className="flex flex-col items-center gap-3">
//           <div className="w-12 h-12 rounded-full bg-nw-100 flex items-center justify-center">
//             <svg className="w-6 h-6 text-nw-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
//             </svg>
//           </div>
//           {loading ? (
//             <p className="text-nw-600 font-medium">Reading your file…</p>
//           ) : (
//             <>
//               <p className="font-medium text-gray-800">
//                 Drop your CSV here, or <span className="text-nw-600">browse</span>
//               </p>
//               <p className="text-sm text-gray-400">
//                 Any time-series CSV — sales, churn, traffic, transactions
//               </p>
//             </>
//           )}
//         </div>
//       </div>

//       {/* Error */}
//       {error && (
//         <div className="mt-4 w-full max-w-lg rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
//           {error}
//         </div>
//       )}

//       {/* Demo datasets */}
//       <div className="mt-8 w-full max-w-lg">
//         <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3 text-center">
//           Or try a demo dataset
//         </p>
//         <div className="grid grid-cols-3 gap-3">
//           {demoDatasets.map((d, i) => (
//             <button
//               key={i}
//               onClick={() => onLoadDemo(i)}
//               disabled={loading}
//               className="card p-4 text-left hover:border-nw-200 hover:bg-nw-50 transition-colors duration-150 disabled:opacity-50"
//             >
//               <div className="w-8 h-8 rounded-lg bg-nw-100 flex items-center justify-center mb-2">
//                 <svg className="w-4 h-4 text-nw-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
//                 </svg>
//               </div>
//               <p className="text-xs font-medium text-gray-700 leading-tight">{d.label}</p>
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* Footer note */}
//       <p className="mt-8 text-xs text-gray-400 text-center max-w-sm">
//         No personal data required or stored. All analysis runs in-session only.
//       </p>
//     </div>
//   )
// }

import { useRef, useState, useEffect } from 'react'

const DATASET_META = [
  { description: 'Monthly avg prices', unit: '£ thousands', color: 'bg-purple-100 text-purple-700' },
  { description: 'Monthly approvals',  unit: 'thousands',   color: 'bg-teal-100 text-teal-700'   },
  { description: 'User adoption',      unit: 'users (K)',   color: 'bg-blue-100 text-blue-700'   },
  { description: '4 banking metrics',  unit: 'multi-col',   color: 'bg-amber-100 text-amber-700' },
]

function DatasetPreviewModal({ demo, meta, onClose, onLoad, loading }) {
  const [preview, setPreview] = useState(null)
  const [loadingPreview, setLoadingPreview] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function fetchPreview() {
      try {
        const r = await fetch(demo.file)
        const text = await r.text()
        if (text.trim().startsWith('<')) throw new Error('Not a CSV')
        const lines = text.trim().split('\n').filter(Boolean)
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
        const rows = lines.slice(1, 6).map(l => {
          const vals = l.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
          const obj = {}
          headers.forEach((h, i) => { obj[h] = vals[i] ?? '' })
          return obj
        })
        if (!cancelled) setPreview({ headers, rows, total: lines.length - 1 })
      } catch {
        if (!cancelled) setPreview({ error: true })
      } finally {
        if (!cancelled) setLoadingPreview(false)
      }
    }
    fetchPreview()
    return () => { cancelled = true }
  }, [demo.file])

  const cols = Array.isArray(demo.valueCol) ? demo.valueCol : [demo.valueCol]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.35)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${meta.color}`}>
                {meta.unit}
              </span>
            </div>
            <h3 className="text-base font-semibold text-gray-900">{demo.label}</h3>
            <p className="text-sm text-gray-400 mt-0.5">{meta.description}</p>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 mt-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Stats row */}
        {preview && !preview.error && (
          <div className="px-5 py-3 flex gap-6 border-b border-gray-100 bg-gray-50">
            <div>
              <p className="text-xs text-gray-400">Rows</p>
              <p className="text-sm font-semibold text-gray-800">{preview.total}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Columns</p>
              <p className="text-sm font-semibold text-gray-800">{preview.headers.length}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Date column</p>
              <p className="text-sm font-semibold text-gray-800">{demo.dateCol}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Value column{cols.length > 1 ? 's' : ''}</p>
              <p className="text-sm font-semibold text-gray-800 truncate max-w-[160px]">
                {cols.length > 1 ? `${cols.length} columns` : cols[0]}
              </p>
            </div>
          </div>
        )}

        {/* Preview table */}
        <div className="px-5 py-4">
          {loadingPreview && (
            <p className="text-sm text-gray-400 text-center py-6">Loading preview…</p>
          )}
          {!loadingPreview && preview?.error && (
            <p className="text-sm text-red-500 text-center py-6">
              Could not load preview. Make sure the CSV is in <code>frontend/public/data/</code>
            </p>
          )}
          {!loadingPreview && preview && !preview.error && (
            <div className="overflow-x-auto rounded-lg border border-gray-100">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50">
                    {preview.headers.slice(0, 5).map(h => (
                      <th key={h} className={`px-3 py-2 text-left font-medium whitespace-nowrap
                        ${h === demo.dateCol ? 'text-nw-600' :
                          cols.includes(h) ? 'text-purple-600' : 'text-gray-400'}`}>
                        {h}
                        {h === demo.dateCol && <span className="ml-1 text-gray-300">(date)</span>}
                        {cols.includes(h) && <span className="ml-1 text-gray-300">(value)</span>}
                      </th>
                    ))}
                    {preview.headers.length > 5 && (
                      <th className="px-3 py-2 text-gray-300">+{preview.headers.length - 5} more</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((row, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      {preview.headers.slice(0, 5).map(h => (
                        <td key={h} className="px-3 py-2 text-gray-600 whitespace-nowrap">
                          {row[h]}
                        </td>
                      ))}
                      {preview.headers.length > 5 && <td className="px-3 py-2 text-gray-300">…</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-gray-300 px-3 py-2 border-t border-gray-100">
                Showing 5 of {preview.total} rows
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onLoad}
            disabled={loading}
            className="flex-1 py-2.5 text-sm rounded-xl bg-nw-600 text-white font-medium
                       hover:bg-nw-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Loading…' : (
              <>
                Use this dataset
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function UploadPanel({ onUpload, onLoadDemo, loading, error, demoDatasets }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [previewIdx, setPreviewIdx] = useState(null)

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file?.name.endsWith('.csv')) onUpload(file)
  }

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (file) onUpload(file)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">

      {/* Preview modal */}
      {previewIdx !== null && demoDatasets[previewIdx] && (
        <DatasetPreviewModal
          demo={demoDatasets[previewIdx]}
          meta={DATASET_META[previewIdx] || DATASET_META[0]}
          loading={loading}
          onClose={() => setPreviewIdx(null)}
          onLoad={() => { setPreviewIdx(null); onLoadDemo(previewIdx) }}
        />
      )}

      {/* Logo / header */}
      <div className="mb-10 text-center animate-fade-in">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-nw-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.94" />
            </svg>
          </div>
          <span className="text-2xl font-semibold text-gray-900">ForeSight</span>
        </div>
        <p className="text-gray-500 text-base max-w-sm">
          Upload any time-series CSV and get honest AI-powered forecasts,
          anomaly alerts, and plain-English insights in under 30 seconds.
        </p>
      </div>

      {/* Drop zone */}
      <div
        className={`w-full max-w-lg rounded-2xl border-2 border-dashed p-12 text-center
          transition-colors duration-200 cursor-pointer
          ${dragging ? 'border-nw-600 bg-nw-50' : 'border-gray-200 bg-white hover:border-nw-400 hover:bg-nw-50'}`}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-nw-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-nw-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          {loading ? (
            <p className="text-nw-600 font-medium">Reading your file…</p>
          ) : (
            <>
              <p className="font-medium text-gray-800">
                Drop your CSV here, or <span className="text-nw-600">browse</span>
              </p>
              <p className="text-sm text-gray-400">
                Any time-series CSV — sales, churn, traffic, transactions
              </p>
            </>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 w-full max-w-lg rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Demo datasets */}
      <div className="mt-8 w-full max-w-lg">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3 text-center">
          Or try a demo dataset
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {demoDatasets.map((d, i) => {
            const meta = DATASET_META[i] || DATASET_META[0]
            return (
              <button
                key={i}
                onClick={() => setPreviewIdx(i)}
                disabled={loading}
                className="card p-4 text-left hover:border-nw-200 hover:bg-nw-50 transition-colors duration-150 disabled:opacity-50 group"
              >
                <div className="w-8 h-8 rounded-lg bg-nw-100 flex items-center justify-center mb-2">
                  <svg className="w-4 h-4 text-nw-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                </div>
                <p className="text-xs font-medium text-gray-700 leading-tight">{d.label}</p>
                <p className="text-xs text-gray-400 mt-1 leading-tight">{meta.description}</p>
                <p className={`text-xs font-medium mt-2 px-1.5 py-0.5 rounded-full inline-block ${meta.color}`}>
                  {meta.unit}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Footer note */}
      <p className="mt-8 text-xs text-gray-400 text-center max-w-sm">
        No personal data required or stored. All analysis runs in-session only.
      </p>
    </div>
  )
}
