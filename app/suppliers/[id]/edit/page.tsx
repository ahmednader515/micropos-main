'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import MainLayout from '@/components/MainLayout'

interface SupplierForm {
  supplierNumber: string
  name: string
  address: string
  phone: string
  taxRegistration: string
  commercialRegistration: string
  notes: string
}

export default function EditSupplierPage() {
  const params = useParams()
  const router = useRouter()
  const supplierId = params.id as string
  
  const [form, setForm] = useState<SupplierForm>({
    supplierNumber: '',
    name: '',
    address: '',
    phone: '',
    taxRegistration: '',
    commercialRegistration: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        const res = await fetch(`/api/suppliers/${supplierId}`)
        if (res.ok) {
          const supplier = await res.json()
          setForm({
            supplierNumber: supplier.supplierNumber || '',
            name: supplier.name || '',
            address: supplier.address || '',
            phone: supplier.phone || '',
            taxRegistration: supplier.taxRegistration || '',
            commercialRegistration: supplier.commercialRegistration || '',
            notes: supplier.notes || '',
          })
        } else {
          alert('فشل في تحميل بيانات المورد')
          router.back()
        }
      } catch (error) {
        console.error('Error fetching supplier:', error)
        alert('فشل في تحميل بيانات المورد')
        router.back()
      } finally {
        setFetching(false)
      }
    }

    if (supplierId) {
      fetchSupplier()
    }
  }, [supplierId, router])

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
      const res = await fetch(`/api/suppliers/${supplierId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierNumber: form.supplierNumber.trim() || null,
          name: form.name.trim(),
          address: form.address.trim() || null,
          phone: form.phone.trim() || null,
          taxRegistration: form.taxRegistration.trim() || null,
          commercialRegistration: form.commercialRegistration.trim() || null,
          notes: form.notes.trim() || null,
        }),
      })
      if (res.ok) {
        alert('تم تحديث المورد بنجاح')
        router.back()
      } else {
        const err = await res.json()
        alert(err.error || 'فشل تحديث المورد')
      }
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <MainLayout navbarTitle="تعديل المورد" onBack={() => router.back()}>
        <div className="flex justify-center py-6">
          <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"/>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout navbarTitle="تعديل المورد" onBack={() => router.back()}>
      <div className="max-w-2xl mx-auto" dir="rtl">
        <form onSubmit={onSubmit} className="bg-white p-6 rounded shadow space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">رقم المورد</label>
              <input 
                name="supplierNumber" 
                value={form.supplierNumber} 
                onChange={onChange} 
                className="w-full border rounded px-3 py-2" 
                placeholder="أدخل رقم المورد"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">اسم المورد *</label>
              <input 
                name="name" 
                required 
                value={form.name} 
                onChange={onChange} 
                className="w-full border rounded px-3 py-2" 
                placeholder="أدخل اسم المورد"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">العنوان</label>
            <textarea 
              name="address" 
              value={form.address} 
              onChange={onChange} 
              className="w-full border rounded px-3 py-2" 
              rows={3}
              placeholder="أدخل عنوان المورد"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">رقم الهاتف</label>
              <input 
                name="phone" 
                value={form.phone} 
                onChange={onChange} 
                className="w-full border rounded px-3 py-2" 
                placeholder="أدخل رقم الهاتف"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">الرقم الضريبي للمورد</label>
              <input 
                name="taxRegistration" 
                value={form.taxRegistration} 
                onChange={onChange} 
                className="w-full border rounded px-3 py-2" 
                placeholder="أدخل الرقم الضريبي"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">رقم السجل التجاري</label>
              <input 
                name="commercialRegistration" 
                value={form.commercialRegistration} 
                onChange={onChange} 
                className="w-full border rounded px-3 py-2" 
                placeholder="أدخل رقم السجل التجاري"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">ملاحظات</label>
              <textarea 
                name="notes" 
                value={form.notes} 
                onChange={onChange} 
                className="w-full border rounded px-3 py-2" 
                rows={3}
                placeholder="أدخل ملاحظات إضافية"
              />
            </div>
          </div>
          
          <div className="flex gap-2 justify-end pt-4">
            <button 
              type="button" 
              onClick={() => router.back()} 
              className="px-6 py-2 bg-gray-100 rounded hover:bg-gray-200"
            >
              إلغاء
            </button>
            <button 
              disabled={loading} 
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'جاري التحديث...' : 'تحديث'}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}
