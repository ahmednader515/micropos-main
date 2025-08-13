'use client'

import { useState, useEffect } from 'react'
import MainLayout from '@/components/MainLayout'
import FlashNotification from '@/components/FlashNotification'

interface CashboxTransaction {
  id: string
  type: 'INCOME' | 'EXPENSE'
  amount: string
  description: string
  reference: string
  paymentMethod: string
  createdAt: string
}

interface CashboxData {
  balance: string
  transactions: CashboxTransaction[]
}

export default function CashboxPage() {
  const [cashboxData, setCashboxData] = useState<CashboxData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [transactionType, setTransactionType] = useState<'INCOME' | 'EXPENSE'>('INCOME')
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    date: '' as string,
  })
  const [includeSalesCustomers, setIncludeSalesCustomers] = useState(false)
  const [deductPurchasesSuppliers, setDeductPurchasesSuppliers] = useState(false)
  const [deductExpenses, setDeductExpenses] = useState(false)
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  useEffect(() => {
    fetchCashboxData()
  }, [])

  useEffect(() => {
    const toLocalDateInput = (d: Date) => {
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    setFormData((prev) => ({ ...prev, date: toLocalDateInput(new Date()) }))
  }, [])

  const fetchCashboxData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/cashbox')
      if (response.ok) {
        const data = await response.json()
        setCashboxData(data)
      } else {
        throw new Error('فشل في جلب بيانات الصندوق')
      }
    } catch (error) {
      showNotification('error', 'فشل في جلب بيانات الصندوق')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      if (!formData.amount || !formData.description || !formData.date) {
        showNotification('error', 'جميع الحقول مطلوبة')
        return
      }

      const amount = parseFloat(formData.amount)
      if (amount <= 0) {
        showNotification('error', 'المبلغ يجب أن يكون أكبر من صفر')
        return
      }

      // Additional validation for EXPENSE transactions
      if (transactionType === 'EXPENSE' && cashboxData) {
        const currentBalance = parseFloat(cashboxData.balance)
        if (currentBalance < amount) {
          showNotification('error', `رصيد الصندوق غير كافي. الرصيد الحالي: ${formatCurrency(cashboxData.balance)}`)
          return
        }
      }

      setSubmitting(true)
      const response = await fetch('/api/cashbox', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: transactionType,
          amount,
          description: formData.description,
          date: formData.date,
          // The following flags are informative for backend if supported
          includeSalesCustomers,
          deductPurchasesSuppliers,
          deductExpenses,
        })
      })

      if (response.ok) {
        showNotification('success', transactionType === 'INCOME' ? 'تم إضافة المبلغ بنجاح' : 'تم خصم المبلغ بنجاح')
        setFormData((prev) => ({ ...prev, amount: '', description: '' }))
        fetchCashboxData()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'فشل في إتمام العملية')
      }
    } catch (error: any) {
      showNotification('error', error.message || 'فشل في إتمام العملية')
    } finally {
      setSubmitting(false)
    }
  }

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  const formatCurrency = (amount: string) => {
    return parseFloat(amount).toLocaleString('ar-EG', {
      style: 'currency',
      currency: 'EGP'
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Helpers kept minimal for this screen

  if (loading) {
    return (
      <MainLayout
        navbarTitle="الصندوق"
        onBack={() => window.history.back()}
        menuOptions={[]}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">جاري التحميل...</div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout
      navbarTitle="الصندوق"
      onBack={() => window.history.back()}
      menuOptions={[]}
    >
      <div className="max-w-sm mx-auto w-full p-3 space-y-3" dir="rtl">
        <div className="bg-white rounded-xl shadow-sm border p-3">

          {/* 1 - نوع العملية */}
          <div className="mb-2">
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="txType" value="INCOME" checked={transactionType === 'INCOME'} onChange={() => setTransactionType('INCOME')} />
                <span>إضافة إلى الصندوق</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="txType" value="EXPENSE" checked={transactionType === 'EXPENSE'} onChange={() => setTransactionType('EXPENSE')} />
                <span>خصم من الصندوق</span>
              </label>
            </div>
          </div>

          {/* 2 - المبلغ */}
          <div className="mb-2">
            <label className="block text-sm text-gray-700 mb-1">المبلغ</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>

          {/* 3 - التاريخ */}
          <div className="mb-2">
            <label className="block text-sm text-gray-700 mb-1">التاريخ</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 4 - البيان */}
          <div className="mb-2">
            <label className="block text-sm text-gray-700 mb-1">البيان</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="اكتب البيان"
            />
          </div>

          {/* 5 - الخيارات */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={includeSalesCustomers} onChange={(e) => setIncludeSalesCustomers(e.target.checked)} />
              <span>اضافة مبالغ المبيعات و العملاء للصندوق</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={deductPurchasesSuppliers} onChange={(e) => setDeductPurchasesSuppliers(e.target.checked)} />
              <span>خصم مبالغ المشتريات و الموردين من الصندوق</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={deductExpenses} onChange={(e) => setDeductExpenses(e.target.checked)} />
              <span>خصم مبالغ المصروفات من الصندوق</span>
            </label>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`flex-1 px-3 py-2 rounded-lg text-white ${transactionType === 'INCOME' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'} disabled:opacity-50`}
            >
              {submitting ? 'جارٍ الحفظ...' : 'حفظ العملية'}
            </button>
          </div>
        </div>

        {/* Bottom balance */}
        <div className="sticky bottom-2">
          <div className="bg-white rounded-xl shadow border p-3 text-center">
            <div className="text-sm text-gray-600">الرصيد</div>
            <div className="text-xl font-bold text-gray-900 mt-1">{cashboxData ? formatCurrency(cashboxData.balance) : formatCurrency('0')}</div>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <FlashNotification
          type={notification.type}
          message={notification.message}
          isVisible={!!notification}
          onClose={() => setNotification(null)}
        />
      )}
    </MainLayout>
  )
} 