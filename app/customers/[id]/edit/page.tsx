'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import MainLayout from '@/components/MainLayout'

type PriceTier = 'price1' | 'price2' | 'price3'

interface CustomerForm {
  customerNumber: string
  barcode: string
  name: string
  address: string
  taxRegistration: string
  commercialRegistration: string
  phone: string
  city: string
  streetName: string
  buildingNumber: string
  postalCode: string
  cardType: string
  cardNumber: string
  notes: string
  priceTier: PriceTier
  creditLimit: string
  dueDays: string
}

export default function EditCustomerPage() {
  const params = useParams()
  const router = useRouter()
  const customerId = params.id as string
  
  const [formData, setFormData] = useState<CustomerForm>({
    customerNumber: '',
    barcode: '',
    name: '',
    address: '',
    taxRegistration: '',
    commercialRegistration: '',
    phone: '',
    city: '',
    streetName: '',
    buildingNumber: '',
    postalCode: '',
    cardType: '',
    cardNumber: '',
    notes: '',
    priceTier: 'price1',
    creditLimit: '',
    dueDays: '',
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const priceTierOptions: { value: PriceTier; label: string }[] = [
    { value: 'price1', label: 'السعر 1' },
    { value: 'price2', label: 'السعر 2' },
    { value: 'price3', label: 'السعر 3' },
  ]

  // Load customer data
  useEffect(() => {
    const loadCustomer = async () => {
      try {
        const res = await fetch(`/api/customers/${customerId}`)
        if (res.ok) {
          const data = await res.json()
          const customer = data.customer
          
          setFormData({
            customerNumber: customer.customerNumber || '',
            barcode: customer.barcode || '',
            name: customer.name || '',
            address: customer.address || '',
            taxRegistration: customer.taxRegistration || '',
            commercialRegistration: customer.commercialRegistration || '',
            phone: customer.phone || '',
            city: customer.city || '',
            streetName: customer.streetName || '',
            buildingNumber: customer.buildingNumber || '',
            postalCode: customer.postalCode || '',
            cardType: customer.cardType || '',
            cardNumber: customer.cardNumber || '',
            notes: customer.notes || '',
            priceTier: customer.priceTier?.toLowerCase() as PriceTier || 'price1',
            creditLimit: customer.creditLimit?.toString() || '',
            dueDays: customer.dueDays?.toString() || '',
          })
        } else {
          alert('لم يتم العثور على العميل')
          router.push('/customers')
        }
      } catch (error) {
        console.error('Error loading customer:', error)
        alert('حدث خطأ أثناء تحميل بيانات العميل')
        router.push('/customers')
      } finally {
        setLoading(false)
      }
    }

    if (customerId) {
      loadCustomer()
    }
  }, [customerId, router])

  const updateField = (field: keyof CustomerForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      alert('اسم العميل مطلوب')
      return
    }
    
    setSaving(true)
    try {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerNumber: formData.customerNumber || null,
          barcode: formData.barcode || null,
          name: formData.name.trim(),
          address: formData.address || null,
          taxRegistration: formData.taxRegistration || null,
          commercialRegistration: formData.commercialRegistration || null,
          phone: formData.phone || null,
          city: formData.city || null,
          streetName: formData.streetName || null,
          buildingNumber: formData.buildingNumber || null,
          postalCode: formData.postalCode || null,
          cardType: formData.cardType || null,
          cardNumber: formData.cardNumber || null,
          notes: formData.notes || null,
          priceTier: formData.priceTier,
          creditLimit: formData.creditLimit || '0',
          dueDays: formData.dueDays || '0',
        }),
      })
      
      if (res.ok) {
        alert('تم تحديث العميل بنجاح')
        router.push('/customers')
      } else {
        const err = await res.json().catch(() => ({}))
        alert(err.error || 'حدث خطأ أثناء تحديث العميل')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <MainLayout
        navbarTitle="تعديل العميل"
        onBack={() => router.push('/customers')}
      >
        <div className="max-w-3xl mx-auto text-center py-8">
          <div className="text-gray-500">جاري التحميل...</div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout
      navbarTitle="تعديل العميل"
      onBack={() => router.push('/customers')}
    >
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto" dir="rtl">
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="grid grid-cols-1 gap-4">
            {/* 1 - رقم العميل */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">رقم العميل</label>
              <input
                type="text"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="يتم توليده تلقائيًا إذا تُرك فارغًا"
                value={formData.customerNumber}
                onChange={(e) => updateField('customerNumber', e.target.value)}
              />
            </div>

            {/* 2 - باركود العميل */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">باركود العميل</label>
              <input
                type="text"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.barcode}
                onChange={(e) => updateField('barcode', e.target.value)}
              />
            </div>

            {/* 3 - اسم العميل */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">اسم العميل</label>
              <input
                type="text"
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
              />
            </div>

            {/* 4 - العنوان */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">العنوان</label>
              <input
                type="text"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.address}
                onChange={(e) => updateField('address', e.target.value)}
              />
            </div>

            {/* 5 - السجل الضريبي للعميل */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">السجل الضريبي للعميل</label>
              <input
                type="text"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.taxRegistration}
                onChange={(e) => updateField('taxRegistration', e.target.value)}
              />
            </div>

            {/* 6 - رقم السجل التجاري */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">رقم السجل التجاري</label>
              <input
                type="text"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.commercialRegistration}
                onChange={(e) => updateField('commercialRegistration', e.target.value)}
              />
            </div>

            {/* 7 - رقم الهاتف */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
              <input
                type="tel"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
              />
            </div>

            {/* 8 - المدينة */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">المدينة</label>
              <input
                type="text"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.city}
                onChange={(e) => updateField('city', e.target.value)}
              />
            </div>

            {/* 9 - اسم الشارع */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">اسم الشارع</label>
              <input
                type="text"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.streetName}
                onChange={(e) => updateField('streetName', e.target.value)}
              />
            </div>

            {/* 10 - رقم المبني */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">رقم المبني</label>
              <input
                type="text"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.buildingNumber}
                onChange={(e) => updateField('buildingNumber', e.target.value)}
              />
            </div>

            {/* 11 - الرمز البريدي */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">الرمز البريدي</label>
              <input
                type="text"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.postalCode}
                onChange={(e) => updateField('postalCode', e.target.value)}
              />
            </div>

            {/* 12 - نوع البطاقة */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">نوع البطاقة</label>
              <input
                type="text"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.cardType}
                onChange={(e) => updateField('cardType', e.target.value)}
              />
            </div>

            {/* 13 - رقم البطاقة */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">رقم البطاقة</label>
              <input
                type="text"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.cardNumber}
                onChange={(e) => updateField('cardNumber', e.target.value)}
              />
            </div>

            {/* 14 - ملاحظات */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
              <textarea
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                value={formData.notes}
                onChange={(e) => updateField('notes', e.target.value)}
              />
            </div>

            {/* 15 - سعر البيع للعميل */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">سعر البيع للعميل</label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-right bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.priceTier}
                onChange={(e) => updateField('priceTier', e.target.value as PriceTier)}
              >
                {priceTierOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 16 - سقف العميل */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">سقف العميل</label>
              <input
                type="number"
                min={0}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.creditLimit}
                onChange={(e) => updateField('creditLimit', e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">(الحد الأقصي للعميل من الفواتير الاجل)</p>
            </div>

            {/* 17 - اكتب عدد الأيام */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">اكتب عدد الأيام</label>
              <input
                type="number"
                min={0}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.dueDays}
                onChange={(e) => updateField('dueDays', e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">(التنبيه في حال تأخر العميل عن السداد خلال المدة المحددة)</p>
            </div>
          </div>

          <div className="flex flex-row-reverse items-center gap-2 mt-6">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
            >
              {saving ? 'جاري التحديث...' : 'تحديث'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/customers')}
              className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 transition"
            >
              إلغاء
            </button>
          </div>
        </div>
      </form>
    </MainLayout>
  )
}
