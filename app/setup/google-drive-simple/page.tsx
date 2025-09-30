'use client'

import { useState } from 'react'

export default function GoogleDriveSimpleSetup() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleDirectAuth = async () => {
    setIsLoading(true)
    setMessage('')
    
    try {
      // Direct OAuth URL with your client ID
      const clientId = '654255324365-dnsqfmfoq81fkfrtjg0sj31i0ijo8v7k.apps.googleusercontent.com'
      const redirectUri = encodeURIComponent('http://localhost:3000/api/auth/google/callback')
      const scope = encodeURIComponent('https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.metadata.readonly')
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${redirectUri}&` +
        `scope=${scope}&` +
        `response_type=code&` +
        `access_type=offline&` +
        `prompt=consent`
      
      // Open in new window
      const authWindow = window.open(authUrl, 'google-auth', 'width=500,height=600')
      
      // Listen for the callback
      const checkClosed = setInterval(() => {
        if (authWindow?.closed) {
          clearInterval(checkClosed)
          setMessage('Please check the authorization code from the popup window and paste it below.')
        }
      }, 1000)
      
    } catch (error) {
      console.error('Error:', error)
      setMessage('Error opening authorization window')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          إعداد Google Drive (طريقة مبسطة)
        </h1>
        
        <div className="space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">⚠️ خطوات مهمة:</h3>
            <ol className="text-sm text-yellow-800 space-y-1">
              <li>1. تأكد من إضافة بريدك الإلكتروني كـ "Test User" في Google Cloud Console</li>
              <li>2. انقر على "بدء المصادقة"</li>
              <li>3. سجل الدخول ووافق على الصلاحيات</li>
              <li>4. انسخ رمز التفويض من النافذة المنبثقة</li>
            </ol>
          </div>
          
          <button
            onClick={handleDirectAuth}
            disabled={isLoading}
            className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'جاري التحميل...' : 'بدء المصادقة'}
          </button>
          
          {message && (
            <div className="bg-blue-100 text-blue-800 p-4 rounded-lg text-center">
              {message}
            </div>
          )}
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">إذا استمر الخطأ:</h3>
            <p className="text-sm text-gray-700 mb-2">
              استخدم طريقة Service Account بدلاً من OAuth:
            </p>
            <a
              href="/setup/service-account"
              className="text-blue-500 underline text-sm"
            >
              إعداد Service Account
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
