interface ProgressBarProps {
  percent: number
  color?: string
  showLabel?: boolean
}

export function ProgressBar({ percent, color, showLabel = true }: ProgressBarProps) {
  // Always use AWS orange for consistency, unless a specific color is provided
  const barColor = color || '#FF9900' // AWS orange

  return (
    <div className="w-full">
      <div className="w-full h-3 bg-bg-dark rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-500 ease-out rounded-full"
          style={{
            width: `${Math.min(100, Math.max(0, percent))}%`,
            backgroundColor: barColor,
          }}
        />
      </div>
      {showLabel && (
        <div className="mt-1 text-right">
          <span className="text-sm font-medium" style={{ color: barColor }}>
            {Math.round(percent)}%
          </span>
        </div>
      )}
    </div>
  )
}
