'use client'

import { useEffect, useState, useMemo } from 'react'
import MainLayout from '@/components/MainLayout'

type Supplier = { id: string; name: string; balance: number }

interface PaymentForm {
  type: 'له' | 'عليه'
  documentNumber: string
  description: string
  date: string
  paymentMethod: 'نقدا' | 'بطاقة' | 'شيك'
  addToCashbox: boolean
}

export default function SupplierBalancesPage() {
  const [rows, setRows] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [showPaymentPopup, setShowPaymentPopup] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [paymentForm, setPaymentForm] = useState<PaymentForm>({
    type: 'له',
    documentNumber: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'نقدا',
    addToCashbox: false
  })

  useEffect(() => {
    ;(async () => {
      try {
        const r = await fetch('/api/suppliers')
        const j = await r.json()
        setRows((j.suppliers || []).map((c: any) => ({ id: c.id, name: c.name, balance: Number(c.balance || 0) })))
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  // Filter suppliers based on search query
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rows
    const query = searchQuery.toLowerCase()
    return rows.filter(supplier => 
      supplier.name.toLowerCase().includes(query)
    )
  }, [rows, searchQuery])

  const handleSupplierClick = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
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
    // TODO: Implement payment submission logic for suppliers
    console.log('Payment form submitted:', { supplier: selectedSupplier, ...paymentForm })
    alert('تم إرسال المبلغ بنجاح')
    setShowPaymentPopup(false)
    setSelectedSupplier(null)
  }

  const closePaymentPopup = () => {
    setShowPaymentPopup(false)
    setSelectedSupplier(null)
  }

  const handleGeneratePDF = async () => {
    setGeneratingPDF(true)
    try {
      const response = await fetch('/api/reports/suppliers/balances')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'supplier_balances.pdf'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        console.error('Failed to generate PDF')
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
    } finally {
      setGeneratingPDF(false)
    }
  }

  return (
    <MainLayout navbarTitle="الأرصدة الافتتاحية والمبالغ النقدية للموردين" onBack={() => history.back()}>
      <div className="space-y-4" dir="rtl">
        {/* Search and PDF Button Section */}
        <div className="bg-white p-4 rounded shadow">
          <div className="flex flex-col md:flex-row gap-3 items-center">
            <div className="flex-1">
              <input
                type="text"
                placeholder="البحث عن مورد..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border rounded px-3 py-2 text-right"
                dir="rtl"
              />
            </div>
            <button
              onClick={handleGeneratePDF}
              disabled={generatingPDF}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {generatingPDF ? 'جاري إنشاء PDF...' : 'طباعة PDF'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-6"><div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"/></div>
        ) : (
          <div className="bg-white rounded shadow overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-right">بيانات المورد</th>
                  <th className="px-3 py-2 text-right">له</th>
                  <th className="px-3 py-2 text-right">عليه</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((c) => {
                  const balance = Number(c.balance || 0)
                  const hasAmount = balance > 0 ? balance : 0  // له (Credit) - We owe them
                  const oweAmount = balance < 0 ? Math.abs(balance) : 0  // عليه (Debit) - They owe us
                  
                  return (
                    <tr key={c.id} className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => handleSupplierClick(c)}>
                      <td className="px-3 py-2">{c.name}</td>
                      <td className="px-3 py-2 text-blue-600">{hasAmount.toFixed(2)}</td>
                      <td className="px-3 py-2 text-red-600">{oweAmount.toFixed(2)}</td>
                    </tr>
                  )
                })}
                {filteredRows.length === 0 && (
                  <tr>
                    <td className="px-3 py-6 text-center" colSpan={3}>
                      {searchQuery ? 'لا توجد نتائج للبحث' : 'لا توجد بيانات'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Payment Popup */}
        {showPaymentPopup && selectedSupplier && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto" dir="rtl">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">اضف مبلغ للمورد</h2>
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
                  <p className="text-sm text-gray-600">المورد: <span className="font-medium text-gray-900">{selectedSupplier.name}</span></p>
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
                        <span className="font-medium text-gray-700">عليه</span>
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


