interface MasteryRingProps {
  percent: number
  size?: number
}

export function MasteryRing({ percent, size = 120 }: MasteryRingProps) {
  const getColor = () => {
    if (percent < 40) return '#EF4444' // danger
    if (percent < 70) return '#F59E0B' // warning
    return '#22C55E' // success
  }

  const color = getColor()
  const radius = (size - 12) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgb(var(--color-bg-dark))"
          strokeWidth="8"
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-text-primary">
          {Math.round(percent)}%
        </span>
        <span className="text-xs text-text-muted">Mastery</span>
      </div>
    </div>
  )
}
