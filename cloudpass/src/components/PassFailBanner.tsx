interface PassFailBannerProps {
  passed: boolean
  scaledScore: number
  percent: number
}

export function PassFailBanner({ passed, scaledScore, percent }: PassFailBannerProps) {
  return (
    <div
      className={`w-full p-8 rounded-lg ${
        passed ? 'bg-success' : 'bg-danger'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
            {passed ? (
              <svg className="w-10 h-10 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-10 h-10 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white mb-1">
              {passed ? 'PASS' : 'FAIL'}
            </h2>
            <p className="text-white/90">
              {passed ? 'Congratulations! You passed the exam.' : 'Keep practicing. You can do this!'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-5xl font-bold text-white mb-1">
            {scaledScore}
          </div>
          <div className="text-xl text-white/90">
            {Math.round(percent)}%
          </div>
        </div>
      </div>
    </div>
  )
}
