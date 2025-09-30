import { NextRequest, NextResponse } from 'next/server'
import { GoogleDriveOAuthService } from '@/lib/googleDriveOAuth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    
    // Handle OAuth callback
    if (code) {
      const googleDrive = new GoogleDriveOAuthService()
      const result = await googleDrive.getTokens(code)
      
      if (result.success && result.tokens) {
        // Redirect to success page with tokens
        const redirectUrl = new URL('/setup/google-drive', request.url)
        redirectUrl.searchParams.set('success', 'true')
        redirectUrl.searchParams.set('access_token', result.tokens.access_token || '')
        redirectUrl.searchParams.set('refresh_token', result.tokens.refresh_token || '')
        
        return NextResponse.redirect(redirectUrl)
      } else {
        // Redirect to error page
        const redirectUrl = new URL('/setup/google-drive', request.url)
        redirectUrl.searchParams.set('error', result.error || 'Authentication failed')
        
        return NextResponse.redirect(redirectUrl)
      }
    }
    
    // Generate auth URL
    const googleDrive = new GoogleDriveOAuthService()
    const authUrl = googleDrive.getAuthUrl()
    
    return NextResponse.json({
      success: true,
      authUrl
    })
  } catch (error) {
    console.error('Error in Google OAuth:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to process OAuth request'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { code, access_token, refresh_token } = await request.json()
    
    // Handle storing tokens from OAuth callback
    if (access_token && refresh_token) {
      // Store tokens in environment variables (for server-side use)
      process.env.GOOGLE_ACCESS_TOKEN = access_token
      process.env.GOOGLE_REFRESH_TOKEN = refresh_token
      
      return NextResponse.json({
        success: true,
        message: 'Tokens stored successfully'
      })
    }
    
    // Handle authorization code exchange
    if (!code) {
      return NextResponse.json({
        success: false,
        error: 'Authorization code is required'
      }, { status: 400 })
    }

    const googleDrive = new GoogleDriveOAuthService()
    const result = await googleDrive.getTokens(code)
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Google Drive authentication successful',
        tokens: result.tokens
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 })
    }
  } catch (error) {
    console.error('Error exchanging code for tokens:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to exchange authorization code'
    }, { status: 500 })
  }
}
