interface AnswerButtonProps {
  label: 'A' | 'B' | 'C' | 'D' | 'E'
  text: string
  state: 'default' | 'selected' | 'correct' | 'wrong' | 'disabled'
  onClick?: () => void
  disabled?: boolean
}

export function AnswerButton({ label, text, state, onClick, disabled }: AnswerButtonProps) {
  const stateStyles = {
    default: 'border-text-muted/30 hover:border-text-muted/50 bg-bg-card hover:bg-bg-card-hover',
    selected: 'border-aws-orange bg-aws-orange/10',
    correct: 'border-success bg-success/10',
    wrong: 'border-danger bg-danger/10',
    disabled: 'border-text-muted/20 bg-bg-card opacity-50 cursor-not-allowed',
  }

  const labelStyles = {
    default: 'bg-bg-dark text-text-primary',
    selected: 'bg-aws-orange text-white',
    correct: 'bg-success text-white',
    wrong: 'bg-danger text-white',
    disabled: 'bg-bg-dark text-text-muted',
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled || state === 'disabled'}
      className={`w-full min-h-[60px] p-4 border-2 rounded-lg transition-all duration-200 text-left flex items-start gap-4 ${stateStyles[state]}`}
    >
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${labelStyles[state]}`}>
        {label}
      </div>
      <div className="flex-1 text-text-primary pt-1">
        {text}
      </div>
    </button>
  )
}
