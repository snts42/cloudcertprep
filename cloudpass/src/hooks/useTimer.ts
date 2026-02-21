import { useState, useEffect, useRef } from 'react'

interface UseTimerOptions {
  initialSeconds: number
  onComplete?: () => void
}

export function useTimer({ initialSeconds, onComplete }: UseTimerOptions) {
  const [seconds, setSeconds] = useState(initialSeconds)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    if (isRunning && seconds > 0) {
      intervalRef.current = window.setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            setIsRunning(false)
            if (onComplete) onComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, seconds, onComplete])

  const start = () => setIsRunning(true)
  const pause = () => setIsRunning(false)
  const reset = () => {
    setSeconds(initialSeconds)
    setIsRunning(false)
  }

  return {
    seconds,
    isRunning,
    start,
    pause,
    reset,
  }
}
