'use client'

import { useState, useEffect, useRef } from 'react'
import MainLayout from '@/components/MainLayout'
import FlashNotification from '@/components/FlashNotification'
import BarcodeInput from '@/components/BarcodeInput'

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  costPrice: number
  stock: number
  minStock: number
  barcode: string | null
  sku: string | null
  category?: {
    id: string
    name: string
  } | null
  isActive: boolean
  createdAt: string
}

interface QuickEditForm {
  stock: string
  price: string
}

export default function InventoryProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showPopup, setShowPopup] = useState(false)
  const [quickEditForm, setQuickEditForm] = useState<QuickEditForm>({ stock: '', price: '' })
  const [updating, setUpdating] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [notification, setNotification] = useState<{
    message: string
    type: 'success' | 'error' | 'info'
    isVisible: boolean
  }>({
    message: '',
    type: 'info',
    isVisible: false
  })

  const selectAllRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products/inventory')
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }





  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.barcode && product.barcode.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
    
    return matchesSearch
  })

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product)
    setQuickEditForm({
      stock: product.stock.toString(),
      price: product.price.toString()
    })
    setShowPopup(true)
  }

  const allVisibleSelected = filteredProducts.length > 0 && filteredProducts.every(p => selectedIds.has(p.id))
  const someVisibleSelected = filteredProducts.some(p => selectedIds.has(p.id)) && !allVisibleSelected

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someVisibleSelected
    }
  }, [someVisibleSelected])

  const toggleSelectAllVisible = () => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (allVisibleSelected) {
        // Deselect all visible
        filteredProducts.forEach(p => next.delete(p.id))
      } else {
        // Select all visible
        filteredProducts.forEach(p => next.add(p.id))
      }
      return next
    })
  }

  const toggleSelectProduct = (productId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(productId)) next.delete(productId)
      else next.add(productId)
      return next
    })
  }

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({
      message,
      type,
      isVisible: true
    })
  }

  const handleQuickUpdate = async () => {
    if (!selectedProduct) return

    setUpdating(true)
    try {
      const response = await fetch(`/api/products/${selectedProduct.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stock: parseInt(quickEditForm.stock),
          price: parseFloat(quickEditForm.price)
        }),
      })

      if (response.ok) {
        showNotification('تم تحديث المنتج بنجاح', 'success')
        setShowPopup(false)
        fetchProducts() // Refresh the list
      } else {
        showNotification('فشل في تحديث المنتج', 'error')
      }
    } catch (error) {
      console.error('Error updating product:', error)
      showNotification('حدث خطأ أثناء تحديث المنتج', 'error')
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showNotification('تم حذف المنتج بنجاح', 'success')
        setShowPopup(false)
        fetchProducts() // Refresh the list
      } else {
        showNotification('فشل في حذف المنتج', 'error')
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      showNotification('حدث خطأ أثناء حذف المنتج', 'error')
    }
  }

  const handleFreezeProduct = async (productId: string) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: false
        }),
      })

      if (response.ok) {
        showNotification('تم تجميد المنتج بنجاح', 'success')
        setShowPopup(false)
        fetchProducts() // Refresh the list
      } else {
        showNotification('فشل في تجميد المنتج', 'error')
      }
    } catch (error) {
      console.error('Error freezing product:', error)
      showNotification('حدث خطأ أثناء تجميد المنتج', 'error')
    }
  }

  const handleUnfreezeProduct = async (productId: string) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: true
        }),
      })

      if (response.ok) {
        showNotification('تم إلغاء تجميد المنتج بنجاح', 'success')
        setShowPopup(false)
        fetchProducts() // Refresh the list
      } else {
        showNotification('فشل في إلغاء تجميد المنتج', 'error')
      }
    } catch (error) {
      console.error('Error unfreezing product:', error)
      showNotification('حدث خطأ أثناء إلغاء تجميد المنتج', 'error')
    }
  }

  const handleBarcodeSearch = (barcode: string) => {
    setSearchTerm(barcode);
    showNotification(`تم البحث عن الباركود: ${barcode}`, 'info');
  }



  return (
    <>
      <FlashNotification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={() => setNotification(prev => ({ ...prev, isVisible: false }))}
      />
      <MainLayout
        navbarTitle="المنتجات المتوفرة في المخزن"
        onBack={() => window.history.back()}
      >
      <div className="space-y-6">

        {/* Search Filter */}
        <div className="bg-white rounded-lg p-4 shadow-sm" dir="rtl">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <BarcodeInput
                value={searchTerm}
                onChange={setSearchTerm}
                onBarcodeDetected={handleBarcodeSearch}
                placeholder="بحث"
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Actions Row */}
        <div className="bg-white rounded-lg p-3 shadow-sm" dir="rtl">
          <div className="grid grid-cols-3 gap-2 w-full">
            <button
              className="w-full py-2 bg-[#DDDDDD] text-gray-900 rounded-md text-sm hover:bg-[#CFCFCF]"
              onClick={() => (window.location.href = '/reports')}
            >
              تقرير
            </button>
            <button
              className="w-full py-2 bg-[#DDDDDD] text-gray-900 rounded-md text-sm hover:bg-[#CFCFCF]"
              onClick={() => (window.location.href = '/barcode-demo')}
            >
              صناعة باركود
            </button>
            <div className="relative">
              <button
                className="w-full py-2 bg-[#DDDDDD] text-gray-900 rounded-md text-sm hover:bg-[#CFCFCF]"
                onClick={() => setShowMoreMenu(v => !v)}
              >
                المزيد
              </button>
              {showMoreMenu && (
                <div className="absolute mt-2 right-0 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                  <button
                    className="block w-full text-right px-3 py-2 text-sm text-gray-900 hover:bg-gray-50"
                    onClick={() => {
                      setShowMoreMenu(false)
                      showNotification('سيتم إضافة تغيير اللون قريباً', 'info')
                    }}
                  >
                    تغير اللون
                  </button>
                  <button
                    className="block w-full text-right px-3 py-2 text-sm text-gray-900 hover:bg-gray-50"
                    onClick={() => {
                      setShowMoreMenu(false)
                      showNotification('سيتم إضافة تغيير التصنيف قريباً', 'info')
                    }}
                  >
                    تغير التصنيف
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden" dir="rtl">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
                <thead className="bg-[#DDDDDD]">
                  <tr>
                    <th className="px-2 py-1.5 text-right text-sm sm:text-base font-medium text-gray-900 uppercase tracking-wider w-8">
                      <div className="w-full flex items-center justify-end">
                        <input
                          type="checkbox"
                          ref={selectAllRef}
                          checked={allVisibleSelected}
                          onChange={toggleSelectAllVisible}
                          className="h-4 w-4"
                        />
                      </div>
                    </th>
                    <th className="px-2 py-1.5 text-right text-sm sm:text-base font-medium text-gray-900 uppercase tracking-wider">المنتج</th>
                    <th className="px-2 py-1.5 text-right text-sm sm:text-base font-medium text-gray-900 uppercase tracking-wider">السعر</th>
                    <th className="px-2 py-1.5 text-right text-sm sm:text-base font-medium text-gray-900 uppercase tracking-wider">الكمية</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      onClick={() => handleProductClick(product)}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-2 py-2 whitespace-nowrap text-right">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(product.id)}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => toggleSelectProduct(product.id)}
                        />
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        <div className="text-[11px] sm:text-xs font-medium text-gray-900 truncate max-w-24 leading-tight">
                          {product.name}
                          {!product.isActive && (
                            <span className="ml-1 text-red-500 text-xs">(مجمد)</span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-[11px] sm:text-xs text-gray-900">
                        <span className="inline-flex items-center justify-center w-20 h-7 sm:w-24 sm:h-8 rounded-md bg-yellow-100 text-gray-900 font-medium">
                          {product.price.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-[11px] sm:text-xs text-gray-900">
                        <span className="inline-flex items-center justify-center w-20 h-7 sm:w-24 sm:h-8 rounded-md bg-yellow-100 text-gray-900 font-medium">
                          {product.stock}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredProducts.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">لا توجد منتجات مطابقة للبحث</p>
              </div>
            )}
          </div>
        )}

      </div>
    </MainLayout>

    {/* Quick Edit Popup - Rendered outside MainLayout to avoid padding issues */}
    {showPopup && selectedProduct && (
      <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-4 w-full max-w-sm mx-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-semibold text-gray-900">تعديل سريع</h3>
            <button
              onClick={() => setShowPopup(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                اسم المنتج
              </label>
              <p className="text-sm text-gray-900 font-medium truncate">{selectedProduct.name}</p>
            </div>
            
            <div>
              <label htmlFor="quick-stock" className="block text-xs font-medium text-gray-700 mb-1">
                الكمية المتوفرة
              </label>
              <input
                type="number"
                id="quick-stock"
                value={quickEditForm.stock}
                onChange={(e) => setQuickEditForm(prev => ({ ...prev, stock: e.target.value }))}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-sm"
                min="0"
              />
            </div>
            
            <div>
              <label htmlFor="quick-price" className="block text-xs font-medium text-gray-700 mb-1">
                السعر
              </label>
              <input
                type="number"
                id="quick-price"
                value={quickEditForm.price}
                onChange={(e) => setQuickEditForm(prev => ({ ...prev, price: e.target.value }))}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-sm"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          
          <div className="flex flex-col space-y-1.5 mt-4">
            <button
              onClick={handleQuickUpdate}
              disabled={updating}
              className="w-full bg-blue-600 text-white py-1.5 px-3 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              {updating ? 'جاري التحديث...' : 'تحديث سريع'}
            </button>
            
            <button
              onClick={() => window.location.href = `/inventory/edit-product/${selectedProduct.id}`}
              className="w-full bg-gray-600 text-white py-1.5 px-3 rounded-md hover:bg-gray-700 text-sm"
            >
              تعديل متقدم
            </button>
            
            {selectedProduct.isActive ? (
              <button
                onClick={() => handleFreezeProduct(selectedProduct.id)}
                className="w-full bg-yellow-600 text-white py-1.5 px-3 rounded-md hover:bg-yellow-700 text-sm"
              >
                تجميد مؤقت
              </button>
            ) : (
              <button
                onClick={() => handleUnfreezeProduct(selectedProduct.id)}
                className="w-full bg-green-600 text-white py-1.5 px-3 rounded-md hover:bg-green-700 text-sm"
              >
                إلغاء التجميد
              </button>
            )}
            
            <button
              onClick={() => handleDeleteProduct(selectedProduct.id)}
              className="w-full bg-red-600 text-white py-1.5 px-3 rounded-md hover:bg-red-700 text-sm"
            >
              حذف المنتج
            </button>
          </div>
        </div>
               </div>
       )}

     </>
   )
} 