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
