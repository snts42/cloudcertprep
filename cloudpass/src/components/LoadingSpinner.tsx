interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

export function LoadingSpinner({ size = 'md', text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className={`${sizeClasses[size]} relative`}>
        <div className="absolute inset-0 border-4 border-text-muted/20 rounded-full" />
        <div className="absolute inset-0 border-4 border-transparent border-t-aws-orange rounded-full animate-spin" />
      </div>
      {text && (
        <p className="text-text-muted text-sm">{text}</p>
      )}
    </div>
  )
}
