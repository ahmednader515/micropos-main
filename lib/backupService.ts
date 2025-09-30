import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

// Dynamic import for Google Drive service to avoid client-side issues
let GoogleDriveService: any = null

export class BackupService {
  private prisma: PrismaClient
  private googleDrive: any

  constructor() {
    this.prisma = new PrismaClient()
    this.googleDrive = null
  }

  private async getGoogleDriveService() {
    if (!GoogleDriveService) {
      // Try OAuth service first, fallback to original service
      try {
        const { GoogleDriveOAuthService: GDS } = await import('./googleDriveOAuth')
        GoogleDriveService = GDS
      } catch {
        const { GoogleDriveService: GDS } = await import('./googleDrive')
        GoogleDriveService = GDS
      }
    }
    if (!this.googleDrive) {
      this.googleDrive = new GoogleDriveService()
      
      // Set credentials if available from environment
      const accessToken = process.env.GOOGLE_ACCESS_TOKEN
      const refreshToken = process.env.GOOGLE_REFRESH_TOKEN
      
      if (accessToken && refreshToken && this.googleDrive.setCredentials) {
        this.googleDrive.setCredentials(accessToken, refreshToken)
      }
    }
    return this.googleDrive
  }

  async createDatabaseBackup(): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupFileName = `micropos-backup-${timestamp}.json`
      const backupPath = path.join(process.cwd(), 'backups', backupFileName)

      // Ensure backups directory exists
      const backupsDir = path.dirname(backupPath)
      if (!fs.existsSync(backupsDir)) {
        fs.mkdirSync(backupsDir, { recursive: true })
      }

      // Create a JSON backup using Prisma
      const backupData = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        data: {
          // Users
          users: await this.prisma.user.findMany({
            include: {
              accounts: true,
              sessions: true
            }
          }),
          
          // Products and Categories
          products: await this.prisma.product.findMany({
            include: {
              category: true,
              saleItems: true,
              purchaseItems: true
            }
          }),
          categories: await this.prisma.category.findMany(),
          
          // Sales and related data
          sales: await this.prisma.sale.findMany({
            include: {
              items: true,
              customer: true,
              user: true
            }
          }),
          saleItems: await this.prisma.saleItem.findMany({
            include: {
              product: true,
              sale: true
            }
          }),
          
          // Purchases and related data
          purchases: await this.prisma.purchase.findMany({
            include: {
              items: true,
              supplier: true,
              user: true
            }
          }),
          purchaseItems: await this.prisma.purchaseItem.findMany({
            include: {
              product: true,
              purchase: true
            }
          }),
          
          // Customers and Suppliers
          customers: await this.prisma.customer.findMany(),
          suppliers: await this.prisma.supplier.findMany(),
          
          // Payments
          payments: await this.prisma.payment.findMany({
            include: {
              customer: true,
              supplier: true,
              user: true
            }
          }),
          
          // Expenses
          expenses: await this.prisma.expense.findMany({
            include: {
              user: true
            }
          }),
          
          // Cashbox transactions
          cashboxTransactions: await this.prisma.cashboxTransaction.findMany({
            include: {
              user: true
            }
          })
        }
      }

      // Write backup to file
      fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2))

      // Verify backup file was created
      if (!fs.existsSync(backupPath)) {
        throw new Error('Backup file was not created')
      }

      return {
        success: true,
        filePath: backupPath
      }
    } catch (error) {
      console.error('Error creating database backup:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async uploadBackupToGoogleDrive(filePath: string): Promise<{ success: boolean; fileId?: string; error?: string }> {
    try {
      // Check if Google Drive credentials are configured (OAuth or Service Account)
      const hasOAuthCredentials = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      const hasServiceAccountCredentials = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY
      
      if (!hasOAuthCredentials && !hasServiceAccountCredentials) {
        console.log('Google Drive credentials not configured. Backup saved locally only.')
        return {
          success: true,
          fileId: 'local-only'
        }
      }

      const googleDrive = await this.getGoogleDriveService()
      const fileName = path.basename(filePath)
      const fileContent = fs.readFileSync(filePath)
      
      const result = await googleDrive.uploadFile(
        fileName,
        fileContent,
        'application/json'
      )

      if (result.success) {
        // Clean up local backup file after successful upload
        fs.unlinkSync(filePath)
        return {
          success: true,
          fileId: result.fileId
        }
      } else {
        // If Google Drive upload fails, keep the local file and return success
        console.log('Google Drive upload failed, keeping local backup:', result.error)
        return {
          success: true,
          fileId: 'local-fallback',
          error: result.error
        }
      }
    } catch (error) {
      console.error('Error uploading backup to Google Drive:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async performFullBackup(): Promise<{ success: boolean; message: string; fileId?: string }> {
    try {
      console.log('Starting database backup...')
      
      // Create local backup
      const backupResult = await this.createDatabaseBackup()
      if (!backupResult.success) {
        return {
          success: false,
          message: `Backup creation failed: ${backupResult.error}`
        }
      }

      console.log('Backup created, uploading to Google Drive...')
      
      // Upload to Google Drive
      const uploadResult = await this.uploadBackupToGoogleDrive(backupResult.filePath!)
      if (!uploadResult.success) {
        return {
          success: false,
          message: `Upload to Google Drive failed: ${uploadResult.error}`
        }
      }

      console.log('Backup completed successfully')
      let message = 'Backup completed successfully'
      
      if (uploadResult.fileId === 'local-only') {
        message = 'Backup completed successfully and saved locally (Google Drive not configured)'
      } else if (uploadResult.fileId === 'local-fallback') {
        message = 'Backup completed successfully and saved locally (Google Drive upload failed)'
      } else {
        message = 'Backup completed successfully and uploaded to Google Drive'
      }
      
      return {
        success: true,
        message,
        fileId: uploadResult.fileId
      }
    } catch (error) {
      console.error('Error in full backup process:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  async listBackups() {
    try {
      // Check if Google Drive credentials are configured
      if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
        // List local backups instead
        const backupsDir = path.join(process.cwd(), 'backups')
        if (!fs.existsSync(backupsDir)) {
          return {
            success: true,
            files: []
          }
        }

        const files = fs.readdirSync(backupsDir)
          .filter(file => file.startsWith('micropos-backup-') && file.endsWith('.json'))
          .map(file => {
            const filePath = path.join(backupsDir, file)
            const stats = fs.statSync(filePath)
            return {
              id: file,
              name: file,
              size: stats.size.toString(),
              createdTime: stats.birthtime.toISOString(),
              modifiedTime: stats.mtime.toISOString()
            }
          })
          .sort((a, b) => new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime())

        return {
          success: true,
          files
        }
      }

      const googleDrive = await this.getGoogleDriveService()
      const result = await googleDrive.listBackups()
      return result
    } catch (error) {
      console.error('Error listing backups:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async cleanupOldBackups(keepCount: number = 10) {
    try {
      const backups = await this.listBackups()
      if (!backups.success || !backups.files) {
        return { success: false, error: 'Failed to list backups' }
      }

      // Sort by creation time (newest first)
      const sortedBackups = backups.files.sort((a: any, b: any) => 
        new Date(b.createdTime || 0).getTime() - new Date(a.createdTime || 0).getTime()
      )

      // Delete old backups if we have more than keepCount
      if (sortedBackups.length > keepCount) {
        const backupsToDelete = sortedBackups.slice(keepCount)
        
        // Handle cleanup based on backup type
        if (backups.files.length > 0 && backups.files[0].id && !backups.files[0].id.includes('micropos-backup-')) {
          // Google Drive backups
          const googleDrive = await this.getGoogleDriveService()
          for (const backup of backupsToDelete) {
            if (backup.id) {
              await googleDrive.deleteFile(backup.id)
              console.log(`Deleted old Google Drive backup: ${backup.name}`)
            }
          }
        } else {
          // Local backups
          for (const backup of backupsToDelete) {
            if (backup.id) {
              const filePath = path.join(process.cwd(), 'backups', backup.id)
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath)
                console.log(`Deleted old local backup: ${backup.name}`)
              }
            }
          }
        }
      }

      return { success: true }
    } catch (error) {
      console.error('Error cleaning up old backups:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async restoreFromBackup(backupFilePath: string): Promise<{ success: boolean; message: string }> {
    try {
      // Read backup file
      const backupContent = fs.readFileSync(backupFilePath, 'utf8')
      const backupData = JSON.parse(backupContent)

      if (!backupData.data) {
        throw new Error('Invalid backup file format')
      }

      // Start transaction for data restoration
      await this.prisma.$transaction(async (tx) => {
        // Clear existing data (in reverse order of dependencies)
        await tx.cashboxTransaction.deleteMany()
        await tx.expense.deleteMany()
        await tx.payment.deleteMany()
        await tx.saleItem.deleteMany()
        await tx.purchaseItem.deleteMany()
        await tx.sale.deleteMany()
        await tx.purchase.deleteMany()
        await tx.customer.deleteMany()
        await tx.supplier.deleteMany()
        await tx.product.deleteMany()
        await tx.category.deleteMany()
        await tx.session.deleteMany()
        await tx.account.deleteMany()
        await tx.user.deleteMany()

        // Restore data (in correct order)
        if (backupData.data.users) {
          await tx.user.createMany({ data: backupData.data.users })
        }
        if (backupData.data.accounts) {
          await tx.account.createMany({ data: backupData.data.accounts })
        }
        if (backupData.data.sessions) {
          await tx.session.createMany({ data: backupData.data.sessions })
        }
        if (backupData.data.categories) {
          await tx.category.createMany({ data: backupData.data.categories })
        }
        if (backupData.data.products) {
          await tx.product.createMany({ data: backupData.data.products })
        }
        if (backupData.data.customers) {
          await tx.customer.createMany({ data: backupData.data.customers })
        }
        if (backupData.data.suppliers) {
          await tx.supplier.createMany({ data: backupData.data.suppliers })
        }
        if (backupData.data.sales) {
          await tx.sale.createMany({ data: backupData.data.sales })
        }
        if (backupData.data.purchases) {
          await tx.purchase.createMany({ data: backupData.data.purchases })
        }
        if (backupData.data.saleItems) {
          await tx.saleItem.createMany({ data: backupData.data.saleItems })
        }
        if (backupData.data.purchaseItems) {
          await tx.purchaseItem.createMany({ data: backupData.data.purchaseItems })
        }
        if (backupData.data.payments) {
          await tx.payment.createMany({ data: backupData.data.payments })
        }
        if (backupData.data.expenses) {
          await tx.expense.createMany({ data: backupData.data.expenses })
        }
        if (backupData.data.cashboxTransactions) {
          await tx.cashboxTransaction.createMany({ data: backupData.data.cashboxTransactions })
        }
      })

      return {
        success: true,
        message: 'Database restored successfully from backup'
      }
    } catch (error) {
      console.error('Error restoring from backup:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }
}
