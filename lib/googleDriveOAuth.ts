import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'
import { Readable } from 'stream'

export class GoogleDriveOAuthService {
  private drive: any
  private auth: OAuth2Client

  constructor() {
    // Initialize Google Drive API with OAuth2 (free method using personal Google account)
    this.auth = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/google-auth'
    )

    // Set credentials if available (from environment or localStorage)
    const accessToken = process.env.GOOGLE_ACCESS_TOKEN || 
      (typeof window !== 'undefined' ? localStorage.getItem('google_access_token') : null)
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN || 
      (typeof window !== 'undefined' ? localStorage.getItem('google_refresh_token') : null)

    if (accessToken && refreshToken) {
      this.auth.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken
      })
    }

    this.drive = google.drive({ version: 'v3', auth: this.auth })
  }

  // Method to set credentials after OAuth flow
  setCredentials(accessToken: string, refreshToken: string) {
    this.auth.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken
    })
  }

  // Generate OAuth2 authorization URL
  getAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.metadata.readonly'
    ]

    return this.auth.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    })
  }

  // Exchange authorization code for tokens
  async getTokens(code: string) {
    try {
      const { tokens } = await this.auth.getToken(code)
      this.auth.setCredentials(tokens)
      return {
        success: true,
        tokens
      }
    } catch (error) {
      console.error('Error getting tokens:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Check if authenticated
  isAuthenticated(): boolean {
    return !!(this.auth.credentials?.access_token)
  }

  async uploadFile(fileName: string, fileContent: Buffer, mimeType: string = 'application/octet-stream') {
    try {
      if (!this.isAuthenticated()) {
        return {
          success: false,
          error: 'Not authenticated. Please complete OAuth flow first.'
        }
      }

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
      if (!this.isAuthenticated()) {
        return {
          success: false,
          error: 'Not authenticated. Please complete OAuth flow first.'
        }
      }

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
      if (!this.isAuthenticated()) {
        return {
          success: false,
          error: 'Not authenticated. Please complete OAuth flow first.'
        }
      }

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
