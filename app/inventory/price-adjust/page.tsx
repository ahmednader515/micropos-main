'use client'

import { useEffect, useState } from 'react'
import MainLayout from '@/components/MainLayout'

type Mode = 'percent' | 'fixed' | 'exchangeRate'

export default function PriceAdjustPage() {
  const [mode, setMode] = useState<Mode>('percent')
  const [amount, setAmount] = useState<string>('')
  const [direction, setDirection] = useState<'increase' | 'decrease'>('increase')
  const [targetGroup, setTargetGroup] = useState<'selling' | 'purchase'>('selling')
  const [onlyActive, setOnlyActive] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string>('')

  useEffect(() => {
    // If exchangeRate mode, direction is irrelevant
    if (mode === 'exchangeRate') {
      setDirection('increase')
    }
  }, [mode])

  // Single selection: either selling prices (price, price2, price3) or purchase price (costPrice)

  const handleSubmit = async () => {
    setMessage('')
    const amt = Number(amount)
    if (!amt || amt <= 0) {
      setMessage('الرجاء إدخال قيمة صحيحة')
      return
    }
    const targets = targetGroup === 'selling' ? ['price', 'price2', 'price3'] : ['costPrice']
    setSubmitting(true)
    try {
      const res = await fetch('/api/products/bulk-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          amount: amt,
          direction: mode === 'exchangeRate' ? undefined : direction,
          targets,
          onlyActive,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'فشل الطلب')
      setMessage(`تم تحديث ${data.updated} منتجاً`)
      setAmount('')
    } catch (e: any) {
      setMessage(e?.message || 'حدث خطأ')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <MainLayout navbarTitle="تعديل الأسعار" onBack={() => window.history.back()}>
      <div className="max-w-2xl mx-auto mt-4 space-y-4" dir="rtl">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الوضع</label>
              <div className="flex flex-wrap gap-2">
                {([
                  { key: 'percent', label: 'نسبة %' },
                  { key: 'fixed', label: 'قيمة ثابتة' },
                  { key: 'exchangeRate', label: 'سعر صرف' },
                ] as Array<{ key: Mode; label: string }>).map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setMode(opt.key)}
                    className={`px-3 py-1.5 rounded border text-sm ${
                      mode === opt.key ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-800 border-gray-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {mode !== 'exchangeRate' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الاتجاه</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDirection('increase')}
                    className={`px-3 py-1.5 rounded border text-sm ${
                      direction === 'increase' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-800 border-gray-300'
                    }`}
                  >
                    رفع
                  </button>
                  <button
                    onClick={() => setDirection('decrease')}
                    className={`px-3 py-1.5 rounded border text-sm ${
                      direction === 'decrease' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-800 border-gray-300'
                    }`}
                  >
                    خفض
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {mode === 'exchangeRate' ? 'سعر الصرف' : 'القيمة'}
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={mode === 'exchangeRate' ? 'مثال: 1.2' : 'مثال: 10 أو 5%'}
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الحقول المستهدفة</label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="targetGroup"
                    value="selling"
                    checked={targetGroup === 'selling'}
                    onChange={() => setTargetGroup('selling')}
                  />
                  <span>أسعار البيع (1، 2، 3)</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="targetGroup"
                    value="purchase"
                    checked={targetGroup === 'purchase'}
                    onChange={() => setTargetGroup('purchase')}
                  />
                  <span>سعر الشراء</span>
                </label>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} />
              <span>تطبيق على المنتجات الفعّالة فقط</span>
            </label>

            {message && (
              <div className={`text-sm text-right mt-1 ${message.includes('تم تحديث') ? 'text-green-700' : 'text-red-700'}`}>
                {message}
              </div>
            )}

            <div className="flex justify-end">
              <button
                disabled={submitting}
                onClick={handleSubmit}
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'جاري التنفيذ...' : 'تطبيق التعديل'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}


