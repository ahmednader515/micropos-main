import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    
    if (code) {
      // Redirect to our new OAuth handler
      const redirectUrl = new URL('/api/google-auth', request.url)
      redirectUrl.searchParams.set('code', code)
      
      return NextResponse.redirect(redirectUrl)
    }
    
    // If no code, redirect to setup page
    return NextResponse.redirect(new URL('/setup/google-drive', request.url))
  } catch (error) {
    console.error('Error in callback redirect:', error)
    return NextResponse.redirect(new URL('/setup/google-drive?error=callback_failed', request.url))
  }
}
