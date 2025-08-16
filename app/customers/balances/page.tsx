'use client'

import { useEffect, useMemo, useState } from 'react'
import MainLayout from '@/components/MainLayout'

interface Customer {
  id: string
  name: string
  balance: number
  phone?: string | null
  barcode?: string | null
  customerNumber?: string | null
}

interface PaymentForm {
  type: 'له' | 'عليه'
  documentNumber: string
  description: string
  date: string
  paymentMethod: 'نقدا' | 'بطاقة' | 'شيك'
  addToCashbox: boolean
}

export default function CustomerBalancesPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showPaymentPopup, setShowPaymentPopup] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [paymentForm, setPaymentForm] = useState<PaymentForm>({
    type: 'له',
    documentNumber: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'نقدا',
    addToCashbox: false
  })

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/customers', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          const list: Customer[] = (data.customers || []).map((c: any) => ({
            id: c.id,
            name: c.name,
            balance: typeof c.balance === 'number' ? c.balance : Number(c.balance || 0),
            phone: c.phone ?? null,
            barcode: c.barcode ?? null,
            customerNumber: c.customerNumber ?? null,
          }))
          setCustomers(list)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchCustomers()
  }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return customers
    const q = search.trim().toLowerCase()
    return customers.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      (c.phone ?? '').toLowerCase().includes(q) ||
      (c.barcode ?? '').toLowerCase().includes(q) ||
      (c.customerNumber ?? '').toLowerCase().includes(q)
    )
  }, [customers, search])

  const formatAmount = (n: number) => {
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const handleCustomerClick = (customer: Customer) => {
    setSelectedCustomer(customer)
    setPaymentForm({
      type: 'له',
      documentNumber: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'نقدا',
      addToCashbox: false
    })
    setShowPaymentPopup(true)
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement payment submission logic
    console.log('Payment form submitted:', { customer: selectedCustomer, ...paymentForm })
    alert('تم إرسال المبلغ بنجاح')
    setShowPaymentPopup(false)
    setSelectedCustomer(null)
  }

  const closePaymentPopup = () => {
    setShowPaymentPopup(false)
    setSelectedCustomer(null)
  }

  function BalancesNavbar() {
    return (
      <div className="sticky top-0 z-30 bg-white shadow-sm flex items-center justify-between px-2 py-2 lg:hidden" dir="rtl">
        <button
          onClick={() => window.history.back()}
          className="text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700 px-2"
          style={{ minWidth: 40 }}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-7 7 7 7" />
          </svg>
        </button>
        <div className="flex-1 flex justify-center">
          <h1 className="text-[10px] font-medium text-gray-900 truncate">الأرصدة الافتتاحية و المبالغ النقدية للعملاء</h1>
        </div>
        <span className="text-xl px-2">💵</span>
      </div>
    )
  }

  return (
    <MainLayout hideNavbar={true}>
      <div dir="rtl">
        <BalancesNavbar />

        <div className="max-w-3xl mx-auto mt-4">
          <div className="flex gap-2 items-center mb-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن عميل"
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <button
              className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700"
              onClick={async () => {
                try {
                  const res = await fetch('/api/reports/customers/balances', { method: 'GET' })
                  if (!res.ok) {
                    alert('تعذّر إنشاء التقرير')
                    return
                  }
                  const blob = await res.blob()
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = 'customer_balances.pdf'
                  a.click()
                  URL.revokeObjectURL(url)
                } catch (error) {
                  console.error('Error downloading PDF:', error)
                  alert('حدث خطأ أثناء تحميل التقرير')
                }
              }}
            >
              تحميل PDF
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr className="text-right">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-700">بيانات العميل</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-700">له</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-700">عليه</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-gray-500 text-sm">جاري التحميل...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-gray-500 text-sm">لا توجد بيانات</td>
                  </tr>
                ) : (
                  filtered.map((c) => {
                    const hasAmount = c.balance > 0 ? c.balance : 0
                    const oweAmount = c.balance < 0 ? Math.abs(c.balance) : 0
                    return (
                      <tr key={c.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleCustomerClick(c)}>
                        <td className="px-4 py-3">
                          <div className="flex flex-col text-right">
                            <span className="text-sm font-medium text-gray-900">{c.name}</span>
                            <span className="text-xs text-gray-500">
                              {(c.customerNumber ? `رقم: ${c.customerNumber}` : '')}
                              {c.customerNumber && c.phone ? ' • ' : ''}
                              {(c.phone ? `هاتف: ${c.phone}` : '')}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-green-600 font-semibold text-sm">{formatAmount(hasAmount)}</td>
                        <td className="px-4 py-3 text-red-600 font-semibold text-sm">{formatAmount(oweAmount)}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Popup */}
        {showPaymentPopup && selectedCustomer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto" dir="rtl">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">اضف مبلغ للعميل</h2>
                  <button
                    onClick={closePaymentPopup}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">العميل: <span className="font-medium text-gray-900">{selectedCustomer.name}</span></p>
                </div>

                <form onSubmit={handlePaymentSubmit} className="space-y-4">
                  {/* Type Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">نوع المبلغ</label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="type"
                          value="له"
                          checked={paymentForm.type === 'له'}
                          onChange={(e) => setPaymentForm(prev => ({ ...prev, type: e.target.value as 'له' | 'عليه' }))}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">له</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="type"
                          value="عليه"
                          checked={paymentForm.type === 'عليه'}
                          onChange={(e) => setPaymentForm(prev => ({ ...prev, type: e.target.value as 'له' | 'عليه' }))}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">عليه</span>
                      </label>
                    </div>
                  </div>

                  {/* Document Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">رقم السند</label>
                    <input
                      type="text"
                      value={paymentForm.documentNumber}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, documentNumber: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">البيان</label>
                    <input
                      type="text"
                      value={paymentForm.description}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ المعاملة</label>
                    <input
                      type="date"
                      value={paymentForm.date}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">طريقة الدفع</label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="نقدا"
                          checked={paymentForm.paymentMethod === 'نقدا'}
                          onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentMethod: e.target.value as 'نقدا' | 'بطاقة' | 'شيك' }))}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">نقدا</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="بطاقة"
                          checked={paymentForm.paymentMethod === 'بطاقة'}
                          onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentMethod: e.target.value as 'نقدا' | 'بطاقة' | 'شيك' }))}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">بطاقة</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="شيك"
                          checked={paymentForm.paymentMethod === 'شيك'}
                          onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentMethod: e.target.value as 'نقدا' | 'بطاقة' | 'شيك' }))}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">شيك</span>
                      </label>
                    </div>
                  </div>

                  {/* Cashbox Checkbox */}
                  {paymentForm.type === 'له' && (
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={paymentForm.addToCashbox}
                          onChange={(e) => setPaymentForm(prev => ({ ...prev, addToCashbox: e.target.checked }))}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">اضافة المبلغ للصندوق</span>
                      </label>
                    </div>
                  )}

                  {paymentForm.type === 'عليه' && (
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={paymentForm.addToCashbox}
                          onChange={(e) => setPaymentForm(prev => ({ ...prev, addToCashbox: e.target.checked }))}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">خصم المبلغ من الصندوق</span>
                      </label>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="flex gap-2 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
                    >
                      إرسال
                    </button>
                    <button
                      type="button"
                      onClick={closePaymentPopup}
                      className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
