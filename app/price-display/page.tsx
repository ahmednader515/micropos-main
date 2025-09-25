'use client'

import { useState } from 'react'

interface Product {
  id: string
  name: string
  barcode: string
  price: number
  category?: string
}

export default function PriceDisplayPage() {
  const [barcode, setBarcode] = useState('')
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async () => {
    if (!barcode.trim()) {
      setError('يرجى إدخال الباركود')
      return
    }

    setLoading(true)
    setError('')
    setProduct(null)

    try {
      const response = await fetch(`/api/products?barcode=${encodeURIComponent(barcode.trim())}`)
      if (response.ok) {
        const data = await response.json()
        const products = Array.isArray(data) ? data : (data.products || [])
        
        if (products.length > 0) {
          setProduct(products[0])
        } else {
          setError('لم يتم العثور على المنتج')
        }
      } else {
        setError('خطأ في البحث عن المنتج')
      }
    } catch (error) {
      console.error('Error fetching product:', error)
      setError('خطأ في البحث عن المنتج')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Mobile Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 lg:hidden">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => window.history.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-gray-900">عرض الأسعار</h1>
            <div className="w-10"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-4 lg:p-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="hidden lg:block text-2xl font-bold text-gray-900 mb-6">عرض الأسعار</h1>
          
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Barcode Input */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">باركود المنتج</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="أدخل باركود المنتج"
                  className="flex-1 px-2 sm:px-3 py-2 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  autoFocus
                />
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="px-3 sm:px-4 py-2 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-xs sm:text-sm whitespace-nowrap font-medium flex items-center gap-1"
                >
                  {loading && (
                    <svg className="animate-spin h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  بحث
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-red-700 text-sm sm:text-base">{error}</span>
                </div>
              </div>
            )}

            {/* Product Information */}
            {product && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 sm:p-6">
                <div className="text-center">
                  <div className="mb-4">
                    <h3 className="text-lg sm:text-xl font-bold text-green-800 mb-2">سعر المنتج</h3>
                    <div className="text-3xl sm:text-4xl font-bold text-green-600">
                      {formatCurrency(product.price)}
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm sm:text-base">
                    <div className="flex justify-between items-center py-2 border-b border-green-200">
                      <span className="text-green-700 font-medium">اسم المنتج:</span>
                      <span className="text-green-800">{product.name}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-green-200">
                      <span className="text-green-700 font-medium">الباركود:</span>
                      <span className="text-green-800 font-mono">{product.barcode}</span>
                    </div>
                    
                    {product.category && (
                      <div className="flex justify-between items-center py-2">
                        <span className="text-green-700 font-medium">الفئة:</span>
                        <span className="text-green-800">{product.category}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
