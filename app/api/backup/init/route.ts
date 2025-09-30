import { NextResponse } from 'next/server'

// Global variable to track if service is already initialized
let isInitialized = false

export async function POST() {
  try {
    if (!isInitialized) {
      const { initializeBackupService } = await import('@/lib/startupService')
      initializeBackupService()
      isInitialized = true
      console.log('Backup service initialized successfully')
    }

    return NextResponse.json({
      success: true,
      message: 'Backup service initialized'
    })
  } catch (error) {
    console.error('Error initializing backup service:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to initialize backup service'
    }, { status: 500 })
  }
}
