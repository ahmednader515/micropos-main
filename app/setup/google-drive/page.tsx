'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function GoogleDriveSetupContent() {
  const [authUrl, setAuthUrl] = useState('')
  const [code, setCode] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const searchParams = useSearchParams()

  // Handle OAuth callback
  useEffect(() => {
    const success = searchParams.get('success')
    const error = searchParams.get('error')
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')

    if (success === 'true' && accessToken) {
      setIsAuthenticated(true)
      // Store tokens in localStorage for now (in production, use secure storage)
      localStorage.setItem('google_access_token', accessToken)
      if (refreshToken) {
        localStorage.setItem('google_refresh_token', refreshToken)
      }
      
      // Also store tokens in environment variables for server-side use
      const storeTokens = async () => {
        try {
          await fetch('/api/auth/google', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              access_token: accessToken,
              refresh_token: refreshToken
            })
          })
        } catch (error) {
          console.error('Error storing tokens:', error)
        }
      }
      
      storeTokens()
    } else if (error) {
      alert(`Authentication failed: ${error}`)
    }
  }, [searchParams])

  const handleGetAuthUrl = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/google-auth')
      const data = await response.json()
      if (data.success) {
        setAuthUrl(data.authUrl)
        // Automatically open the auth URL in a new window
        window.open(data.authUrl, '_blank', 'width=500,height=600')
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error getting auth URL:', error)
      alert('Error getting authorization URL')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAuthenticate = async () => {
    if (!code.trim()) {
      alert('Please enter the authorization code')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      })
      const data = await response.json()
      if (data.success) {
        setIsAuthenticated(true)
        alert('Google Drive authentication successful! You can now use the backup feature.')
      } else {
        alert(`Authentication failed: ${data.error}`)
      }
    } catch (error) {
      console.error('Error authenticating:', error)
      alert('Error during authentication')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          إعداد Google Drive
        </h1>
        
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">خطوات الإعداد:</h3>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. انقر على "الحصول على رابط التفويض"</li>
              <li>2. ستفتح نافذة جديدة - سجل الدخول إلى حساب Google</li>
              <li>3. وافق على الصلاحيات المطلوبة</li>
              <li>4. انسخ رمز التفويض من الصفحة (سيظهر في النافذة الجديدة)</li>
              <li>5. الصق الرمز في المربع أدناه</li>
            </ol>
          </div>
          
          <button
            onClick={handleGetAuthUrl}
            disabled={isLoading}
            className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'جاري التحميل...' : 'الحصول على رابط التفويض'}
          </button>
          
          {authUrl && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800 mb-2">انقر على الرابط أدناه للتفويض:</p>
              <a
                href={authUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline text-sm break-all"
              >
                {authUrl}
              </a>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              رمز التفويض:
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="الصق رمز التفويض هنا"
            />
          </div>
          
          <button
            onClick={handleAuthenticate}
            disabled={isLoading || !code.trim()}
            className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'جاري المصادقة...' : 'إكمال المصادقة'}
          </button>
          
          {isAuthenticated && (
            <div className="bg-green-100 text-green-800 p-4 rounded-lg text-center">
              <div className="text-2xl mb-2">✅</div>
              <div className="font-semibold">تم إعداد Google Drive بنجاح!</div>
              <div className="text-sm mt-1">يمكنك الآن استخدام ميزة النسخ الاحتياطي</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function GoogleDriveSetup() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">جاري التحميل...</div>}>
      <GoogleDriveSetupContent />
    </Suspense>
  )
}
