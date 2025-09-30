'use client'

import { useState } from 'react'

export default function ServiceAccountSetup() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleTestBackup = async () => {
    setIsLoading(true)
    setMessage('')
    
    try {
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()
      
      if (result.success) {
        setMessage(`✅ ${result.message}`)
      } else {
        setMessage(`❌ Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Backup test error:', error)
      setMessage('❌ Error testing backup')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          إعداد Service Account (الطريقة البديلة)
        </h1>
        
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">✅ مزايا Service Account:</h3>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• لا توجد مشاكل في OAuth consent</li>
              <li>• يعمل فوراً بدون تفاعل المستخدم</li>
              <li>• أكثر موثوقية من OAuth</li>
              <li>• لا يحتاج إلى إعداد معقد</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">📋 خطوات الإعداد:</h3>
            <ol className="text-sm text-blue-800 space-y-2">
              <li>1. اذهب إلى Google Cloud Console</li>
              <li>2. أنشئ Service Account جديد</li>
              <li>3. حمل ملف JSON للمفاتيح</li>
              <li>4. أنشئ Shared Drive في Google Drive</li>
              <li>5. شارك المجلد مع Service Account</li>
              <li>6. أضف المتغيرات إلى .env.local</li>
            </ol>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">⚠️ متغيرات البيئة المطلوبة:</h3>
            <pre className="text-xs text-yellow-800 bg-yellow-100 p-2 rounded overflow-x-auto">
{`GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service-account@project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYour key here\\n-----END PRIVATE KEY-----\\n"
GOOGLE_DRIVE_FOLDER_ID="your-shared-drive-folder-id"`}
            </pre>
          </div>
          
          <button
            onClick={handleTestBackup}
            disabled={isLoading}
            className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'جاري الاختبار...' : 'اختبار النسخ الاحتياطي'}
          </button>
          
          {message && (
            <div className={`p-4 rounded-lg text-center ${
              message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {message}
            </div>
          )}
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">📖 دليل مفصل:</h3>
            <p className="text-sm text-gray-700 mb-2">
              للحصول على دليل مفصل لإعداد Service Account:
            </p>
            <a
              href="/SERVICE_ACCOUNT_SETUP.md"
              target="_blank"
              className="text-blue-500 underline text-sm"
            >
              فتح دليل Service Account
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
