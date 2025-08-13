'use client'

import { useState, useEffect } from 'react'
import MainLayout from '@/components/MainLayout'
import FlashNotification from '@/components/FlashNotification'

interface Product {
  id: string
  name: string
  price: number
  stock: number
  barcode: string | null
  sku: string | null
}

interface Customer {
  id: string
  name: string
  balance: string
}

interface SaleItem {
  productId: string
  name: string
  price: number
  quantity: number
  discount: number
  total: number
}

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

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    customerId: '',
    paymentMethod: 'ALL',
    status: 'ALL',
    startDate: '',
    endDate: ''
  })
  const [formData, setFormData] = useState({
    customerId: '',
    items: [] as SaleItem[],
    totalAmount: 0,
    paidAmount: 0,
    discount: 0,
    tax: 0,
    paymentMethod: 'CASH',
    notes: ''
  })
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  useEffect(() => {
    fetchData()
  }, [filters])

  const fetchData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        fetchSales(),
        fetchProducts(),
        fetchCustomers()
      ])
    } catch (error) {
      showNotification('error', 'فشل في جلب البيانات')
    } finally {
      setLoading(false)
    }
  }

  const fetchSales = async () => {
    const params = new URLSearchParams()
    if (filters.customerId) params.append('customerId', filters.customerId)
    if (filters.paymentMethod !== 'ALL') params.append('paymentMethod', filters.paymentMethod)
    if (filters.status !== 'ALL') params.append('status', filters.status)
    if (filters.startDate) params.append('startDate', filters.startDate)
    if (filters.endDate) params.append('endDate', filters.endDate)

    const response = await fetch(`/api/sales?${params}`)
    if (response.ok) {
      const data = await response.json()
      setSales(data)
    }
  }

  const fetchProducts = async () => {
    const response = await fetch('/api/products')
    if (response.ok) {
      const data = await response.json()
      setProducts(data.products || [])
    }
  }

  const fetchCustomers = async () => {
    const response = await fetch('/api/customers')
    if (response.ok) {
      const data = await response.json()
      setCustomers(data.customers || [])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (formData.items.length === 0) {
        showNotification('error', 'يجب إضافة منتجات على الأقل')
        return
      }

      if (formData.totalAmount <= 0) {
        showNotification('error', 'المبلغ الإجمالي يجب أن يكون أكبر من صفر')
        return
      }

      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        showNotification('success', 'تم إنشاء الفاتورة بنجاح')
        setFormData({
          customerId: '',
          items: [],
          totalAmount: 0,
          paidAmount: 0,
          discount: 0,
          tax: 0,
          paymentMethod: 'CASH',
          notes: ''
        })
        setShowCreateForm(false)
        fetchSales()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'فشل في إنشاء الفاتورة')
      }
    } catch (error: any) {
      showNotification('error', error.message || 'فشل في إنشاء الفاتورة')
    }
  }

  const addProductToSale = (product: Product) => {
    const existingItem = formData.items.find(item => item.productId === product.id)
    
    if (existingItem) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
            : item
        )
      }))
    } else {
      const newItem: SaleItem = {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        discount: 0,
        total: product.price
      }
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, newItem]
      }))
    }
    updateTotalAmount()
  }

  const removeProductFromSale = (productId: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.productId !== productId)
    }))
    updateTotalAmount()
  }

  const updateItemQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) return
    
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.productId === productId
          ? { ...item, quantity, total: quantity * item.price }
          : item
      )
    }))
    updateTotalAmount()
  }

  const updateItemPrice = (productId: string, price: number) => {
    if (price <= 0) return
    
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.productId === productId
          ? { ...item, price, total: item.quantity * price }
          : item
      )
    }))
    updateTotalAmount()
  }

  const updateTotalAmount = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.total, 0)
    const total = subtotal - formData.discount + formData.tax
    setFormData(prev => ({ ...prev, totalAmount: total }))
  }

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('ar-SA', {
      style: 'currency',
      currency: 'SAR'
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getPaymentMethodLabel = (method: string) => {
    const labels: { [key: string]: string } = {
      'CASH': 'نقداً',
      'CARD': 'بطاقة',
      'BANK_TRANSFER': 'تحويل بنكي',
      'CHECK': 'شيك',
      'MOBILE_PAYMENT': 'دفع إلكتروني'
    }
    return labels[method] || method
  }

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      'PENDING': 'معلق',
      'COMPLETED': 'مكتمل',
      'CANCELLED': 'ملغي',
      'REFUNDED': 'مسترد'
    }
    return labels[status] || status
  }

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'PENDING': 'text-yellow-600',
      'COMPLETED': 'text-green-600',
      'CANCELLED': 'text-red-600',
      'REFUNDED': 'text-gray-600'
    }
    return colors[status] || 'text-gray-600'
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.barcode && product.barcode.includes(searchTerm)) ||
    (product.sku && product.sku.includes(searchTerm))
  )

  if (loading) {
    return (
      <MainLayout
        navbarTitle="المبيعات"
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
      navbarTitle="المبيعات"
      onBack={() => window.history.back()}
      menuOptions={[]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">المبيعات</h1>
          <p className="mt-2 text-gray-600">إدارة فواتير المبيعات</p>
        </div>

        {/* Action Button */}
        <div className="flex justify-end">
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            إنشاء فاتورة جديدة
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">تصفية النتائج</h3>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">العميل</label>
              <select
                value={filters.customerId}
                onChange={(e) => setFilters({ ...filters, customerId: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">جميع العملاء</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>{customer.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">طريقة الدفع</label>
              <select
                value={filters.paymentMethod}
                onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">جميع الطرق</option>
                <option value="CASH">نقداً</option>
                <option value="CARD">بطاقة</option>
                <option value="BANK_TRANSFER">تحويل بنكي</option>
                <option value="CHECK">شيك</option>
                <option value="MOBILE_PAYMENT">دفع إلكتروني</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">جميع الحالات</option>
                <option value="PENDING">معلق</option>
                <option value="COMPLETED">مكتمل</option>
                <option value="CANCELLED">ملغي</option>
                <option value="REFUNDED">مسترد</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">من تاريخ</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">إلى تاريخ</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Create Sale Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">إنشاء فاتورة جديدة</h3>
            
            {/* Product Search */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">البحث عن المنتجات</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ابحث بالاسم، الباركود، أو SKU"
              />
              
              {/* Product Results */}
              {searchTerm && (
                <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                  {filteredProducts.map(product => (
                    <div
                      key={product.id}
                      onClick={() => addProductToSale(product)}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-gray-500">
                            الباركود: {product.barcode || 'N/A'} | SKU: {product.sku || 'N/A'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(product.price)}</div>
                          <div className="text-sm text-gray-500">المخزون: {product.stock}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sale Items */}
            {formData.items.length > 0 && (
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-3">المنتجات المختارة</h4>
                <div className="space-y-3">
                  {formData.items.map((item, index) => (
                    <div key={item.productId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-gray-500">
                          السعر: {formatCurrency(item.price)} | الكمية: {item.quantity}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItemQuantity(item.productId, parseInt(e.target.value) || 1)}
                          className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
                        />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.price}
                          onChange={(e) => updateItemPrice(item.productId, parseFloat(e.target.value) || 0)}
                          className="w-24 rounded border border-gray-300 px-2 py-1 text-sm"
                        />
                        <span className="font-medium w-20 text-right">
                          {formatCurrency(item.total)}
                        </span>
                        <button
                          onClick={() => removeProductFromSale(item.productId)}
                          className="text-red-600 hover:text-red-800"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sale Details Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">العميل</label>
                  <select
                    value={formData.customerId}
                    onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">اختر العميل (اختياري)</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>{customer.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">طريقة الدفع</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CASH">نقداً</option>
                    <option value="CARD">بطاقة</option>
                    <option value="BANK_TRANSFER">تحويل بنكي</option>
                    <option value="CHECK">شيك</option>
                    <option value="MOBILE_PAYMENT">دفع إلكتروني</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الخصم</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.discount}
                    onChange={(e) => {
                      const discount = parseFloat(e.target.value) || 0
                      setFormData({ ...formData, discount })
                      updateTotalAmount()
                    }}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الضريبة</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.tax}
                    onChange={(e) => {
                      const tax = parseFloat(e.target.value) || 0
                      setFormData({ ...formData, tax })
                      updateTotalAmount()
                    }}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ المدفوع</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.paidAmount}
                    onChange={(e) => setFormData({ ...formData, paidAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ملاحظات إضافية"
                  rows={3}
                />
              </div>
              
              {/* Total Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>الإجمالي:</span>
                  <span>{formatCurrency(formData.totalAmount)}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  إنشاء الفاتورة
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Sales List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">فواتير المبيعات</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm" dir="rtl">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right font-medium text-gray-500">رقم الفاتورة</th>
                  <th className="px-6 py-3 text-right font-medium text-gray-500">التاريخ</th>
                  <th className="px-6 py-3 text-right font-medium text-gray-500">العميل</th>
                  <th className="px-6 py-3 text-right font-medium text-gray-500">المبلغ الإجمالي</th>
                  <th className="px-6 py-3 text-right font-medium text-gray-500">المدفوع</th>
                  <th className="px-6 py-3 text-right font-medium text-gray-500">طريقة الدفع</th>
                  <th className="px-6 py-3 text-right font-medium text-gray-500">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-900 font-medium">
                      {sale.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 text-gray-900">
                      {formatDate(sale.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-gray-900">
                      {sale.customer?.name || 'عميل نقدي'}
                    </td>
                    <td className="px-6 py-4 text-gray-900 font-medium">
                      {formatCurrency(parseFloat(sale.totalAmount))}
                    </td>
                    <td className="px-6 py-4 text-gray-900">
                      {formatCurrency(parseFloat(sale.paidAmount))}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-blue-600">
                        {getPaymentMethodLabel(sale.paymentMethod)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-medium ${getStatusColor(sale.status)}`}>
                        {getStatusLabel(sale.status)}
                      </span>
                    </td>
                  </tr>
                ))}
                {sales.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      لا توجد فواتير مبيعات
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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