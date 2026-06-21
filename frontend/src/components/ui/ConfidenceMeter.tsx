import type { DimensionScores } from '../../types'

interface Props {
  confidence: number
  dimensionScores: DimensionScores
}

const DIMENSION_LABELS: { key: keyof DimensionScores; label: string }[] = [
  { key: 'problem',            label: 'Problem'     },
  { key: 'targetCustomer',     label: 'Customer'    },
  { key: 'solutionWedge',      label: 'Wedge'       },
  { key: 'alternatives',       label: 'Alternatives'},
  { key: 'valueAndWillingness',label: 'Value'       },
]

function scoreColor(score: number): string {
  if (score >= 70) return '#34d399'   // green
  if (score >= 40) return '#fbbf24'   // amber
  return '#52525b'                     // grey
}

function scoreIcon(score: number): string {
  if (score >= 70) return '✓'
  if (score >= 40) return '◐'
  return '✗'
}

function barColor(confidence: number): string {
  if (confidence >= 70) return 'linear-gradient(90deg, #34d399, #2dd4bf)'
  if (confidence >= 40) return 'linear-gradient(90deg, #fbbf24, #f59e0b)'
  return 'linear-gradient(90deg, #ef4444, #f97316)'
}

export default function ConfidenceMeter({ confidence, dimensionScores }: Props) {
  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
          Idea Clarity
        </span>
        <span
          className="text-sm font-bold tabular-nums"
          style={{
            color: confidence >= 70 ? '#34d399' : confidence >= 40 ? '#fbbf24' : '#ef4444',
          }}
        >
          {confidence}
          <span className="text-zinc-600 font-normal text-xs"> / 100</span>
        </span>
      </div>

      {/* Main bar */}
      <div
        className="w-full rounded-full overflow-hidden"
        style={{ height: 6, background: 'rgba(255,255,255,0.06)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${confidence}%`,
            background: barColor(confidence),
          }}
        />
      </div>

      {/* Dimension pills */}
      <div className="flex flex-wrap gap-1.5 pt-0.5">
        {DIMENSION_LABELS.map(({ key, label }) => {
          const score = dimensionScores[key]
          const color = scoreColor(score)
          const icon = scoreIcon(score)
          return (
            <div
              key={key}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all"
              style={{
                background: score >= 40 ? `${color}15` : 'rgba(255,255,255,0.03)',
                border: `1px solid ${score >= 40 ? `${color}30` : 'rgba(255,255,255,0.06)'}`,
                color: score >= 40 ? color : '#3f3f46',
              }}
              title={`${label}: ${score}/100`}
            >
              <span style={{ fontSize: 9 }}>{icon}</span>
              {label}
            </div>
          )
        })}
      </div>

      {/* Threshold hint */}
      {confidence < 70 && (
        <p className="text-[10px] text-zinc-700 leading-tight pt-0.5">
          Reach 70 with all dimensions ≥ 50 to unlock confident analysis
        </p>
      )}
    </div>
  )
}
