'use client'

import { useEffect, useState } from 'react'
import MainLayout from '@/components/MainLayout'
import FlashNotification from '@/components/FlashNotification'

type Tab = 'SALES' | 'PURCHASES' | 'INVENTORY' | 'CUSTOMERS' | 'SUPPLIERS' | 'EXPENSES'

interface Customer { id: string; name: string; balance: string }
interface Supplier { id: string; name: string; balance: string }
interface Product {
  id: string
  name: string
  price: number
  costPrice: number
  stock: number
  minStock?: number
  barcode: string | null
  sku: string | null
  category?: { id: string; name: string } | null
}
interface SaleItem { productId: string; name: string; price: number; quantity: number; discount: number; total: number }
interface Sale {
  id: string
  invoiceNumber: string
  customer: Customer | null
  totalAmount: string
  paidAmount: string
  discount: string
  tax: string
  status: string
  paymentMethod: string
  notes: string
  createdAt: string
  items: SaleItem[]
}
interface PurchaseItem { productId: string; name: string; price: number; quantity: number; discount: number; total: number }
interface Purchase {
  id: string
  invoiceNumber: string
  supplier: Supplier | null
  totalAmount: string
  paidAmount: string
  discount: string
  tax: string
  status: string
  paymentMethod: string
  notes: string
  createdAt: string
  items: PurchaseItem[]
}
interface Expense {
  id: string
  title: string
  description: string | null
  amount: string
  category: string | null
  date: string
  paymentMethod: string
}

export default function InquiriesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('SALES')

  const [customers, setCustomers] = useState<Customer[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])

  const [sales, setSales] = useState<Sale[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])

  const [salesFilters, setSalesFilters] = useState({ customerId: '', paymentMethod: 'ALL', status: 'ALL', startDate: '', endDate: '' })
  const [purchaseFilters, setPurchaseFilters] = useState({ supplierId: '', paymentMethod: 'ALL', status: 'ALL', startDate: '', endDate: '' })
  const [expenseFilters, setExpenseFilters] = useState({ paymentMethod: 'ALL', startDate: '', endDate: '' })
  const [productSearch, setProductSearch] = useState('')
  const [entitySearch, setEntitySearch] = useState('')

  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    // Preload lookups
    fetchCustomers()
    fetchSuppliers()
    fetchProducts()
  }, [])

  useEffect(() => {
    if (activeTab === 'SALES') fetchSales()
    if (activeTab === 'PURCHASES') fetchPurchases()
    if (activeTab === 'EXPENSES') fetchExpenses()
  }, [activeTab])

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  const formatCurrency = (amount: number) => amount.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' })
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' })

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      CASH: 'نقداً',
      CARD: 'بطاقة',
      BANK_TRANSFER: 'تحويل بنكي',
      CHECK: 'شيك',
      MOBILE_PAYMENT: 'دفع إلكتروني',
      CASHBOX: 'الصندوق',
    }
    return labels[method] || method
  }
  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = { PENDING: 'معلق', COMPLETED: 'مكتمل', CANCELLED: 'ملغي', REFUNDED: 'مسترد', RETURNED: 'مرتجع' }
    return labels[status] || status
  }
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = { PENDING: 'text-yellow-600', COMPLETED: 'text-green-600', CANCELLED: 'text-red-600', REFUNDED: 'text-gray-600', RETURNED: 'text-gray-600' }
    return colors[status] || 'text-gray-600'
  }

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers')
      if (res.ok) {
        const data = await res.json()
        setCustomers(data.customers || [])
      }
    } catch {
      // ignore
    }
  }
  const fetchSuppliers = async () => {
    try {
      const res = await fetch('/api/suppliers')
      if (res.ok) {
        const data = await res.json()
        setSuppliers(data.suppliers || [])
      }
    } catch {
      // ignore
    }
  }
  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products')
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products || [])
      }
    } catch {
      // ignore
    }
  }

  const fetchSales = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (salesFilters.customerId) params.append('customerId', salesFilters.customerId)
      if (salesFilters.paymentMethod !== 'ALL') params.append('paymentMethod', salesFilters.paymentMethod)
      if (salesFilters.status !== 'ALL') params.append('status', salesFilters.status)
      if (salesFilters.startDate) params.append('startDate', salesFilters.startDate)
      if (salesFilters.endDate) params.append('endDate', salesFilters.endDate)
      const res = await fetch(`/api/sales?${params.toString()}`)
      if (res.ok) setSales(await res.json())
    } catch {
      showNotification('error', 'فشل في جلب المبيعات')
    } finally {
      setLoading(false)
    }
  }
  const fetchPurchases = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (purchaseFilters.supplierId) params.append('supplierId', purchaseFilters.supplierId)
      if (purchaseFilters.paymentMethod !== 'ALL') params.append('paymentMethod', purchaseFilters.paymentMethod)
      if (purchaseFilters.status !== 'ALL') params.append('status', purchaseFilters.status)
      if (purchaseFilters.startDate) params.append('startDate', purchaseFilters.startDate)
      if (purchaseFilters.endDate) params.append('endDate', purchaseFilters.endDate)
      const res = await fetch(`/api/purchases?${params.toString()}`)
      if (res.ok) setPurchases(await res.json())
    } catch {
      showNotification('error', 'فشل في جلب المشتريات')
    } finally {
      setLoading(false)
    }
  }
  const fetchExpenses = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (expenseFilters.paymentMethod !== 'ALL') params.append('paymentMethod', expenseFilters.paymentMethod)
      if (expenseFilters.startDate) params.append('startDate', expenseFilters.startDate)
      if (expenseFilters.endDate) params.append('endDate', expenseFilters.endDate)
      const res = await fetch(`/api/expenses?${params.toString()}`)
      if (res.ok) setExpenses(await res.json())
    } catch {
      showNotification('error', 'فشل في جلب المصروفات')
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.barcode && p.barcode.includes(productSearch)) ||
    (p.sku && p.sku.includes(productSearch))
  )
  const filteredCustomers = customers.filter(c => c.name.toLowerCase().includes(entitySearch.toLowerCase()))
  const filteredSuppliers = suppliers.filter(s => s.name.toLowerCase().includes(entitySearch.toLowerCase()))

  return (
    <MainLayout navbarTitle="الاستعلامات" onBack={() => window.history.back()} menuOptions={[]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">الاستعلامات</h1>
          <p className="mt-2 text-gray-600">تنفيذ الاستعلامات والبحث السريع</p>
        </div>

        {/* Tabs */}
        <div className="bg-white border rounded-lg p-2 flex flex-wrap gap-2">
          {([
            { key: 'SALES', label: 'المبيعات' },
            { key: 'PURCHASES', label: 'المشتريات' },
            { key: 'INVENTORY', label: 'المخزون' },
            { key: 'CUSTOMERS', label: 'العملاء' },
            { key: 'SUPPLIERS', label: 'الموردون' },
            { key: 'EXPENSES', label: 'المصروفات' },
          ] as { key: Tab; label: string }[]).map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-3 py-2 rounded-md text-sm font-medium ${activeTab === t.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'SALES' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">تصفية المبيعات</h3>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">العميل</label>
                  <select value={salesFilters.customerId} onChange={e => setSalesFilters({ ...salesFilters, customerId: e.target.value })} className="w-full rounded-lg border px-3 py-2">
                    <option value="">جميع العملاء</option>
                    {customers.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">طريقة الدفع</label>
                  <select value={salesFilters.paymentMethod} onChange={e => setSalesFilters({ ...salesFilters, paymentMethod: e.target.value })} className="w-full rounded-lg border px-3 py-2">
                    <option value="ALL">جميع الطرق</option>
                    <option value="CASH">نقداً</option>
                    <option value="CARD">بطاقة</option>
                    <option value="BANK_TRANSFER">تحويل بنكي</option>
                    <option value="CHECK">شيك</option>
                    <option value="MOBILE_PAYMENT">دفع إلكتروني</option>
                    <option value="CASHBOX">الصندوق</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
                  <select value={salesFilters.status} onChange={e => setSalesFilters({ ...salesFilters, status: e.target.value })} className="w-full rounded-lg border px-3 py-2">
                    <option value="ALL">جميع الحالات</option>
                    <option value="PENDING">معلق</option>
                    <option value="COMPLETED">مكتمل</option>
                    <option value="CANCELLED">ملغي</option>
                    <option value="REFUNDED">مسترد</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">من تاريخ</label>
                  <input type="date" value={salesFilters.startDate} onChange={e => setSalesFilters({ ...salesFilters, startDate: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">إلى تاريخ</label>
                  <input type="date" value={salesFilters.endDate} onChange={e => setSalesFilters({ ...salesFilters, endDate: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
                </div>
              </div>
              <div className="flex justify-end mt-3">
                <button onClick={fetchSales} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">تحديث</button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b"><h3 className="text-lg font-semibold text-gray-900">نتائج المبيعات</h3></div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm" dir="rtl">
                  <thead className="bg-gray-50"><tr>
                    <th className="px-6 py-3 text-right text-gray-500">رقم الفاتورة</th>
                    <th className="px-6 py-3 text-right text-gray-500">التاريخ</th>
                    <th className="px-6 py-3 text-right text-gray-500">العميل</th>
                    <th className="px-6 py-3 text-right text-gray-500">الإجمالي</th>
                    <th className="px-6 py-3 text-right text-gray-500">المدفوع</th>
                    <th className="px-6 py-3 text-right text-gray-500">الدفع</th>
                    <th className="px-6 py-3 text-right text-gray-500">الحالة</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-200">
                    {sales.map(s => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3">{s.invoiceNumber}</td>
                        <td className="px-6 py-3">{formatDate(s.createdAt)}</td>
                        <td className="px-6 py-3">{s.customer?.name || 'عميل نقدي'}</td>
                        <td className="px-6 py-3 font-medium">{formatCurrency(parseFloat(s.totalAmount))}</td>
                        <td className="px-6 py-3">{formatCurrency(parseFloat(s.paidAmount))}</td>
                        <td className="px-6 py-3 text-blue-600">{getPaymentMethodLabel(s.paymentMethod)}</td>
                        <td className={`px-6 py-3 ${getStatusColor(s.status)}`}>{getStatusLabel(s.status)}</td>
                      </tr>
                    ))}
                    {sales.length === 0 && (
                      <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">لا توجد نتائج</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'PURCHASES' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">تصفية المشتريات</h3>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المورد</label>
                  <select value={purchaseFilters.supplierId} onChange={e => setPurchaseFilters({ ...purchaseFilters, supplierId: e.target.value })} className="w-full rounded-lg border px-3 py-2">
                    <option value="">جميع الموردين</option>
                    {suppliers.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">طريقة الدفع</label>
                  <select value={purchaseFilters.paymentMethod} onChange={e => setPurchaseFilters({ ...purchaseFilters, paymentMethod: e.target.value })} className="w-full rounded-lg border px-3 py-2">
                    <option value="ALL">جميع الطرق</option>
                    <option value="CASH">نقداً</option>
                    <option value="CARD">بطاقة</option>
                    <option value="BANK_TRANSFER">تحويل بنكي</option>
                    <option value="CHECK">شيك</option>
                    <option value="MOBILE_PAYMENT">دفع إلكتروني</option>
                    <option value="CASHBOX">الصندوق</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
                  <select value={purchaseFilters.status} onChange={e => setPurchaseFilters({ ...purchaseFilters, status: e.target.value })} className="w-full rounded-lg border px-3 py-2">
                    <option value="ALL">جميع الحالات</option>
                    <option value="PENDING">معلق</option>
                    <option value="COMPLETED">مكتمل</option>
                    <option value="CANCELLED">ملغي</option>
                    <option value="RETURNED">مرتجع</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">من تاريخ</label>
                  <input type="date" value={purchaseFilters.startDate} onChange={e => setPurchaseFilters({ ...purchaseFilters, startDate: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">إلى تاريخ</label>
                  <input type="date" value={purchaseFilters.endDate} onChange={e => setPurchaseFilters({ ...purchaseFilters, endDate: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
                </div>
              </div>
              <div className="flex justify-end mt-3"><button onClick={fetchPurchases} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">تحديث</button></div>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b"><h3 className="text-lg font-semibold text-gray-900">نتائج المشتريات</h3></div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm" dir="rtl">
                  <thead className="bg-gray-50"><tr>
                    <th className="px-6 py-3 text-right text-gray-500">رقم الفاتورة</th>
                    <th className="px-6 py-3 text-right text-gray-500">التاريخ</th>
                    <th className="px-6 py-3 text-right text-gray-500">المورد</th>
                    <th className="px-6 py-3 text-right text-gray-500">الإجمالي</th>
                    <th className="px-6 py-3 text-right text-gray-500">المدفوع</th>
                    <th className="px-6 py-3 text-right text-gray-500">الدفع</th>
                    <th className="px-6 py-3 text-right text-gray-500">الحالة</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-200">
                    {purchases.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3">{p.invoiceNumber}</td>
                        <td className="px-6 py-3">{formatDate(p.createdAt)}</td>
                        <td className="px-6 py-3">{p.supplier?.name || 'مورد نقدي'}</td>
                        <td className="px-6 py-3 font-medium">{formatCurrency(parseFloat(p.totalAmount))}</td>
                        <td className="px-6 py-3">{formatCurrency(parseFloat(p.paidAmount))}</td>
                        <td className="px-6 py-3 text-blue-600">{getPaymentMethodLabel(p.paymentMethod)}</td>
                        <td className={`px-6 py-3 ${getStatusColor(p.status)}`}>{getStatusLabel(p.status)}</td>
                      </tr>
                    ))}
                    {purchases.length === 0 && (<tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">لا توجد نتائج</td></tr>)}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'EXPENSES' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">تصفية المصروفات</h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">طريقة الدفع</label>
                  <select value={expenseFilters.paymentMethod} onChange={e => setExpenseFilters({ ...expenseFilters, paymentMethod: e.target.value })} className="w-full rounded-lg border px-3 py-2">
                    <option value="ALL">جميع الطرق</option>
                    <option value="CASH">نقداً</option>
                    <option value="CARD">بطاقة</option>
                    <option value="BANK_TRANSFER">تحويل بنكي</option>
                    <option value="CHECK">شيك</option>
                    <option value="MOBILE_PAYMENT">دفع إلكتروني</option>
                    <option value="CASHBOX">الصندوق</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">من تاريخ</label>
                  <input type="date" value={expenseFilters.startDate} onChange={e => setExpenseFilters({ ...expenseFilters, startDate: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">إلى تاريخ</label>
                  <input type="date" value={expenseFilters.endDate} onChange={e => setExpenseFilters({ ...expenseFilters, endDate: e.target.value })} className="w-full rounded-lg border px-3 py-2" />
                </div>
                <div className="flex items-end"><button onClick={fetchExpenses} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg w-full">تحديث</button></div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b"><h3 className="text-lg font-semibold text-gray-900">نتائج المصروفات</h3></div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm" dir="rtl">
                  <thead className="bg-gray-50"><tr>
                    <th className="px-6 py-3 text-right text-gray-500">التاريخ</th>
                    <th className="px-6 py-3 text-right text-gray-500">العنوان</th>
                    <th className="px-6 py-3 text-right text-gray-500">الفئة</th>
                    <th className="px-6 py-3 text-right text-gray-500">المبلغ</th>
                    <th className="px-6 py-3 text-right text-gray-500">طريقة الدفع</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-200">
                    {expenses.map(ex => (
                      <tr key={ex.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3">{formatDate(ex.date)}</td>
                        <td className="px-6 py-3">{ex.title}</td>
                        <td className="px-6 py-3">{ex.category || '-'}</td>
                        <td className="px-6 py-3 font-medium">{formatCurrency(parseFloat(ex.amount))}</td>
                        <td className="px-6 py-3 text-blue-600">{getPaymentMethodLabel(ex.paymentMethod)}</td>
                      </tr>
                    ))}
                    {expenses.length === 0 && (<tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">لا توجد نتائج</td></tr>)}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'INVENTORY' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">بحث المخزون</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">بحث</label>
                  <input value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="اسم، باركود، SKU" className="w-full rounded-lg border px-3 py-2" />
                </div>
                <div className="flex items-end">
                  <button onClick={fetchProducts} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg w-full">تحديث</button>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b"><h3 className="text-lg font-semibold text-gray-900">المنتجات</h3></div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm" dir="rtl">
                  <thead className="bg-gray-50"><tr>
                    <th className="px-6 py-3 text-right text-gray-500">المنتج</th>
                    <th className="px-6 py-3 text-right text-gray-500">الفئة</th>
                    <th className="px-6 py-3 text-right text-gray-500">السعر</th>
                    <th className="px-6 py-3 text-right text-gray-500">سعر التكلفة</th>
                    <th className="px-6 py-3 text-right text-gray-500">المخزون</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredProducts.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3">{p.name}</td>
                        <td className="px-6 py-3">{p.category?.name || '-'}</td>
                        <td className="px-6 py-3">{formatCurrency(p.price)}</td>
                        <td className="px-6 py-3">{formatCurrency(p.costPrice)}</td>
                        <td className="px-6 py-3">{p.stock}</td>
                      </tr>
                    ))}
                    {filteredProducts.length === 0 && (<tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">لا توجد نتائج</td></tr>)}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {(activeTab === 'CUSTOMERS' || activeTab === 'SUPPLIERS') && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">بحث {activeTab === 'CUSTOMERS' ? 'العملاء' : 'الموردين'}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">الاسم</label>
                  <input value={entitySearch} onChange={e => setEntitySearch(e.target.value)} placeholder="ابحث بالاسم" className="w-full rounded-lg border px-3 py-2" />
                </div>
                <div className="flex items-end">
                  <button onClick={() => (activeTab === 'CUSTOMERS' ? fetchCustomers() : fetchSuppliers())} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg w-full">تحديث</button>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b"><h3 className="text-lg font-semibold text-gray-900">{activeTab === 'CUSTOMERS' ? 'العملاء' : 'الموردون'}</h3></div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm" dir="rtl">
                  <thead className="bg-gray-50"><tr>
                    <th className="px-6 py-3 text-right text-gray-500">الاسم</th>
                    <th className="px-6 py-3 text-right text-gray-500">الرصيد</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-200">
                    {(activeTab === 'CUSTOMERS' ? filteredCustomers : filteredSuppliers).map(e => (
                      <tr key={e.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3">{e.name}</td>
                        <td className="px-6 py-3">{formatCurrency(parseFloat(String(e.balance)))}</td>
                      </tr>
                    ))}
                    {(activeTab === 'CUSTOMERS' ? filteredCustomers : filteredSuppliers).length === 0 && (
                      <tr><td colSpan={2} className="px-6 py-8 text-center text-gray-500">لا توجد نتائج</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

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