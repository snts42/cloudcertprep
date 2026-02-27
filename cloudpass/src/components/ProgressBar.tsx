interface ProgressBarProps {
  percent: number
  color?: string
  showLabel?: boolean
}

export function ProgressBar({ percent, color, showLabel = true }: ProgressBarProps) {
  const hasCustomColor = !!color

  return (
    <div className="w-full">
      <div className="w-full h-3 bg-bg-dark rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ease-out rounded-full ${!hasCustomColor ? 'bg-aws-orange' : ''}`}
          style={{
            width: `${Math.min(100, Math.max(0, percent))}%`,
            ...(hasCustomColor ? { backgroundColor: color } : {}),
          }}
        />
      </div>
      {showLabel && (
        <div className="mt-1 text-right">
          <span
            className={`text-sm font-medium ${!hasCustomColor ? 'text-aws-orange' : ''}`}
            style={hasCustomColor ? { color } : {}}
          >
            {Math.round(percent)}%
          </span>
        </div>
      )}
    </div>
  )
}
