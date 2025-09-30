import { CronService } from './cronService'

let cronService: CronService | null = null

export function initializeBackupService() {
  // Only initialize on server side
  if (typeof window !== 'undefined') {
    console.log('Backup service initialization skipped on client side')
    return
  }

  if (!cronService) {
    try {
      cronService = new CronService()
      cronService.startAutomaticBackups()
      console.log('Backup service initialized successfully')
    } catch (error) {
      console.error('Error initializing backup service:', error)
    }
  }
}

export function getCronService() {
  return cronService
}
