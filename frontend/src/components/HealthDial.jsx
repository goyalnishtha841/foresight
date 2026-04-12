import { useEffect, useState } from 'react'

const healthColour = label => {
  if (label === 'green') return { dial: 'hsl(152,76%,48%)', text: 'text-success', label: 'High trust' }
  if (label === 'amber') return { dial: 'hsl(38,92%,50%)',  text: 'text-warning', label: 'Moderate' }
  return                        { dial: 'hsl(0,72%,51%)',   text: 'text-destructive', label: 'Low trust' }
}

export default function HealthDial({ score, label }) {
  const [animated, setAnimated] = useState(false)
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 100); return () => clearTimeout(t) }, [])

  const colour = healthColour(label)
  const radius = 42, cx = 56, cy = 56
  const circumference = Math.PI * radius
  const filled = animated ? (score / 100) * circumference : 0

  return (
    <div className="flex flex-col items-center">
      <svg width="112" height="70" viewBox="0 0 112 70">
        {/* Glow filter */}
        <defs>
          <filter id="dial-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {/* Background arc */}
        <path d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none" stroke="hsl(var(--border))" strokeWidth="8" strokeLinecap="round" />
        {/* Foreground arc */}
        <path d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none" stroke={colour.dial} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference - filled}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          filter="url(#dial-glow)" />
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="22" fontWeight="700"
          fill={colour.dial} fontFamily="Inter, sans-serif">{score}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))"
          fontFamily="Inter, sans-serif">/ 100</text>
      </svg>
      <span className={`text-xs font-semibold mt-1 ${colour.text}`}>{colour.label}</span>
    </div>
  )
}
