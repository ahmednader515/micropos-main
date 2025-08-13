'use client'

import { useState } from 'react'
import MainLayout from '@/components/MainLayout'

export default function NewCategoryPage() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return alert('الاسم مطلوب')
    setLoading(true)
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description }),
      })
      if (res.ok) {
        alert('تم إنشاء التصنيف')
        setName('')
        setDescription('')
      } else {
        const err = await res.json()
        alert(err.error || 'فشل إنشاء التصنيف')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout navbarTitle="إضافة تصنيف جديد" onBack={() => history.back()}>
      <div className="max-w-xl mx-auto" dir="rtl">
        <form onSubmit={onSubmit} className="bg-white p-4 rounded shadow space-y-4">
          <div>
            <label className="block text-sm mb-1">اسم التصنيف *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm mb-1">الوصف</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border rounded px-3 py-2" />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => history.back()} className="px-4 py-2 bg-gray-100 rounded">إلغاء</button>
            <button disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">{loading ? 'جاري الحفظ...' : 'حفظ'}</button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}


