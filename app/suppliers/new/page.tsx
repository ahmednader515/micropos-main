'use client'

import { useState } from 'react'
import MainLayout from '@/components/MainLayout'

interface SupplierForm {
  name: string
  email: string
  phone: string
  address: string
  openingBalance: string
}

export default function NewSupplierPage() {
  const [form, setForm] = useState<SupplierForm>({
    name: '',
    email: '',
    phone: '',
    address: '',
    openingBalance: '0',
  })
  const [loading, setLoading] = useState(false)

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((p) => ({ ...p, [name]: value }))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      alert('اسم المورد مطلوب')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email || null,
          phone: form.phone || null,
          address: form.address || null,
          balance: parseFloat(form.openingBalance || '0') || 0,
        }),
      })
      if (res.ok) {
        alert('تم حفظ المورد')
        setForm({ name: '', email: '', phone: '', address: '', openingBalance: '0' })
      } else {
        const err = await res.json()
        alert(err.error || 'فشل حفظ المورد')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout navbarTitle="إضافة مورد جديد" onBack={() => history.back()}>
      <div className="max-w-xl mx-auto" dir="rtl">
        <form onSubmit={onSubmit} className="bg-white p-4 rounded shadow space-y-4">
          <div>
            <label className="block text-sm mb-1">اسم المورد *</label>
            <input name="name" required value={form.name} onChange={onChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">البريد الإلكتروني</label>
            <input name="email" type="email" value={form.email} onChange={onChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">الهاتف</label>
            <input name="phone" value={form.phone} onChange={onChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">العنوان</label>
            <textarea name="address" value={form.address} onChange={onChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">الرصيد الافتتاحي</label>
            <input name="openingBalance" type="number" step="0.01" value={form.openingBalance} onChange={onChange} className="w-full border rounded px-3 py-2" />
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


