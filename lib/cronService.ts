import cron from 'node-cron'

export class CronService {
  private backupService: any
  private isRunning: boolean = false

  constructor() {
    this.backupService = null
  }

  private async getBackupService() {
    if (!this.backupService) {
      const { BackupService } = await import('./backupService')
      this.backupService = new BackupService()
    }
    return this.backupService
  }

  startAutomaticBackups() {
    if (this.isRunning) {
      console.log('Cron service is already running')
      return
    }

    // Run backup every day at 2:00 AM
    cron.schedule('0 2 * * *', async () => {
      console.log('Starting automatic backup...')
      try {
        const backupService = await this.getBackupService()
        const result = await backupService.performFullBackup()
        if (result.success) {
          console.log('Automatic backup completed successfully')
          // Clean up old backups (keep last 10)
          await backupService.cleanupOldBackups(10)
        } else {
          console.error('Automatic backup failed:', result.message)
        }
      } catch (error) {
        console.error('Error in automatic backup:', error)
      }
    }, {
      timezone: "Asia/Riyadh" // Adjust timezone as needed
    })

    this.isRunning = true
    console.log('Automatic backup service started - will run daily at 2:00 AM')
  }

  stopAutomaticBackups() {
    // Note: node-cron doesn't have a destroy method, tasks are automatically cleaned up
    this.isRunning = false
    console.log('Automatic backup service stopped')
  }

  getStatus() {
    return {
      isRunning: this.isRunning
    }
  }
}
