'use client'

import { useState } from 'react'
import MainLayout from '@/components/MainLayout'
import FlashNotification from '@/components/FlashNotification'

export default function ExpensesPage() {
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'CASHBOX' as 'CASHBOX' | 'CHECK' | 'CARD'
  })
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!formData.title || !formData.amount) {
        showNotification('error', 'الحساب والقيمة مطلوبان')
        return
      }

      const amount = parseFloat(formData.amount)
      if (isNaN(amount) || amount <= 0) {
        showNotification('error', 'القيمة يجب أن تكون أكبر من صفر')
        return
      }

      setSubmitting(true)
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          amount,
          date: formData.date,
          paymentMethod: formData.paymentMethod
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'فشل في إضافة المصروف')
      }

      showNotification('success', 'تم إضافة المصروف بنجاح')
      setFormData({
        title: '',
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'CASHBOX'
      })
    } catch (error: any) {
      showNotification('error', error.message || 'فشل في إضافة المصروف')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <MainLayout
      navbarTitle="المصروفات"
      onBack={() => window.history.back()}
      menuOptions={[]}
    >
      <div className="space-y-6" dir="rtl">
        <div className="bg-white rounded-xl p-4 shadow-sm border max-w-sm mx-auto">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">لحساب</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ادخل الحساب"
                required
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">البيان</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  description: e.target.value 
                })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="أدخل البيان"
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">القيمة</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
                required
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">طريقة الدفع</label>
              <div className="bg-gray-50 rounded-lg p-2 grid grid-cols-1 gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="pm" value="CASHBOX" checked={formData.paymentMethod === 'CASHBOX'} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })} />
                  <span>من الصندوق</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="pm" value="CHECK" checked={formData.paymentMethod === 'CHECK'} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })} />
                  <span>من الشيك</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="pm" value="CARD" checked={formData.paymentMethod === 'CARD'} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })} />
                  <span>من البطاقة</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">التاريخ</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={submitting}
              />
            </div>
            <div className="pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {submitting ? 'جاري الإضافة...' : 'حفظ المصروف'}
              </button>
            </div>
          </form>
        </div>

        {notification && (
          <FlashNotification
            type={notification.type}
            message={notification.message}
            isVisible={!!notification}
            onClose={() => setNotification(null)}
          />
        )}
      </div>
    </MainLayout>
  )
} 