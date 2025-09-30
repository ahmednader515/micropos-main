import { google } from 'googleapis'
import { JWT } from 'google-auth-library'
import { Readable } from 'stream'

export class GoogleDriveService {
  private drive: any
  private auth: JWT

  constructor() {
    // Initialize Google Drive API
    this.auth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/drive.file']
    })

    this.drive = google.drive({ version: 'v3', auth: this.auth })
  }

  async uploadFile(fileName: string, fileContent: Buffer, mimeType: string = 'application/octet-stream') {
    try {
      const fileMetadata = {
        name: fileName,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID || 'root']
      }

      // Convert Buffer to stream for Google Drive API
      const stream = new Readable()
      stream.push(fileContent)
      stream.push(null)

      const media = {
        mimeType,
        body: stream
      }

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media,
        fields: 'id,name,size,createdTime'
      })

      return {
        success: true,
        fileId: response.data.id,
        fileName: response.data.name,
        size: response.data.size,
        createdTime: response.data.createdTime
      }
    } catch (error) {
      console.error('Error uploading to Google Drive:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async listBackups() {
    try {
      const response = await this.drive.files.list({
        q: `name contains 'micropos-backup' and parents in '${process.env.GOOGLE_DRIVE_FOLDER_ID || 'root'}'`,
        orderBy: 'createdTime desc',
        fields: 'files(id,name,size,createdTime,modifiedTime)'
      })

      return {
        success: true,
        files: response.data.files || []
      }
    } catch (error) {
      console.error('Error listing backups:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async deleteFile(fileId: string) {
    try {
      await this.drive.files.delete({
        fileId
      })

      return {
        success: true
      }
    } catch (error) {
      console.error('Error deleting file:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}
