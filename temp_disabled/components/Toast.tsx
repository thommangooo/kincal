'use client'

import { useEffect } from 'react'
import { CheckCircle, X } from 'lucide-react'

interface ToastProps {
  message: string
  isVisible: boolean
  onClose: () => void
  duration?: number
}

export default function Toast({ message, isVisible, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      
      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onClose])

  if (!isVisible) return null

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-full">
      <div className="bg-green-50 border border-green-200 rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-start">
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800">{message}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-3 text-green-400 hover:text-green-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
