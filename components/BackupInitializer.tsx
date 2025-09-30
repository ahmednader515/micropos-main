'use client'

import { useEffect } from 'react'

export default function BackupInitializer() {
  useEffect(() => {
    // Initialize backup service on server side only
    // We'll handle this differently to avoid client-side Node.js module issues
    if (typeof window !== 'undefined') {
      // Call the server-side initialization endpoint
      fetch('/api/backup/init', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            console.log('Backup service initialized')
          }
        })
        .catch(error => {
          console.error('Failed to initialize backup service:', error)
        })
    }
  }, [])

  return null // This component doesn't render anything
}
