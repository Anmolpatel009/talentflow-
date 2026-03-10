'use client'

import { useState, useEffect } from 'react'
import { useToastContext } from '@/contexts/ToastContext'

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)
  const { showToast } = useToastContext()

  useEffect(() => {
    // Initial network check
    setIsOnline(navigator.onLine)
    setLastCheck(new Date())

    // Listen for online/offline events
    const handleOnline = () => {
      console.log('🌐 Network connection restored')
      setIsOnline(true)
      setLastCheck(new Date())
      showToast('success', 'Network connection restored')
    }

    const handleOffline = () => {
      console.log('🌐 Network connection lost')
      setIsOnline(false)
      setLastCheck(new Date())
      showToast('warning', 'Network connection lost. You are currently offline.')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Cleanup event listeners
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [showToast])

  // Function to manually check network status
  const checkNetworkStatus = async (): Promise<boolean> => {
    try {
      // Try to fetch a small resource to check connectivity
      const response = await fetch('https://www.google.com/favicon.ico', { 
        method: 'HEAD', 
        mode: 'no-cors' 
      })
      const isConnected = navigator.onLine && response.ok
      setIsOnline(isConnected)
      setLastCheck(new Date())
      return isConnected
    } catch (error) {
      console.error('🌐 Network check failed:', error)
      setIsOnline(false)
      setLastCheck(new Date())
      return false
    }
  }

  return {
    isOnline,
    lastCheck,
    checkNetworkStatus
  }
}
