import { Heart } from 'lucide-react'
import { useLocation } from 'react-router-dom'

export function DonateButton() {
  const location = useLocation()
  
  // Hide on mock exam page
  if (location.pathname === '/mock-exam') {
    return null
  }

  return (
    <div className="hidden md:block fixed bottom-6 left-6 z-40 group">
      <a
        href="https://ko-fi.com/alexsantonastaso"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 bg-aws-orange hover:bg-aws-orange/90 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
        aria-label="Support the developer"
      >
        {/* Heart Icon */}
        <div className="w-14 h-14 flex items-center justify-center">
          <Heart className="w-6 h-6 group-hover:scale-110 transition-transform" />
        </div>
        
        {/* Expanding Tooltip Text */}
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs group-hover:pr-4 transition-all duration-300 font-medium text-sm">
          Support the developer
        </span>
      </a>
    </div>
  )
}
