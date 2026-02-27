interface PassFailBannerProps {
  passed: boolean
  scaledScore: number
  percent: number
}

export function PassFailBanner({ passed, scaledScore, percent }: PassFailBannerProps) {
  return (
    <div
      className={`w-full p-4 md:p-8 rounded-lg ${
        passed ? 'bg-success' : 'bg-danger'
      }`}
    >
      <div className="flex flex-col md:flex-row items-center md:justify-between gap-4">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-full flex items-center justify-center flex-shrink-0">
            {passed ? (
              <svg className="w-7 h-7 md:w-10 md:h-10 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-7 h-7 md:w-10 md:h-10 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">
              {passed ? 'PASS' : 'FAIL'}
            </h2>
            <p className="text-sm md:text-base text-white/90">
              {passed ? 'Congratulations! You passed the exam.' : 'Keep practicing. You can do this!'}
            </p>
          </div>
        </div>
        <div className="text-center md:text-right">
          <div className="text-3xl md:text-5xl font-bold text-white mb-1">
            {scaledScore}
          </div>
          <div className="text-base md:text-xl text-white/90">
            {Math.round(percent)}%
          </div>
        </div>
      </div>
    </div>
  )
}
