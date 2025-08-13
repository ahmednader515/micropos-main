'use client'

import { useState, useEffect } from 'react'
import MainLayout from '@/components/MainLayout'
import BarcodeInput from '@/components/BarcodeInput'

interface Category {
  id: string
  name: string
}

interface NewProductForm {
  name: string
  description: string
  price: string
  price2: string
  price3: string
  costPrice: string
  stock: string
  minStock: string
  barcode: string
  expiryDate: string
  tax: string
  unit: string
  unitPackage: string
  higherPackage: string
  color: string
  imageUrl: string
  categoryId: string
}

export default function NewProductPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<NewProductForm>({
    name: '',
    description: '',
    price: '',
    price2: '',
    price3: '',
    costPrice: '',
    stock: '',
    minStock: '',
    barcode: '',
    expiryDate: '',
    tax: '',
    unit: '',
    unitPackage: '',
    higherPackage: '',
    color: '#3b82f6',
    imageUrl: '',
    categoryId: ''
  })

  const presetColors: string[] = ['#ef4444', '#22c55e', '#3b82f6', '#facc15', '#ffffff']

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          price2: formData.price2 ? parseFloat(formData.price2) : 0,
          price3: formData.price3 ? parseFloat(formData.price3) : 0,
          costPrice: parseFloat(formData.costPrice),
          stock: parseInt(formData.stock),
          minStock: parseInt(formData.minStock),
          tax: formData.tax ? parseFloat(formData.tax) : 0,
          expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : null,
        }),
      })

      if (response.ok) {
        alert('تم إضافة المنتج بنجاح!')
        // Reset form
        setFormData({
          name: '',
          description: '',
          price: '',
          price2: '',
          price3: '',
          costPrice: '',
          stock: '',
          minStock: '',
          barcode: '',
          expiryDate: '',
          tax: '',
          unit: '',
          unitPackage: '',
          higherPackage: '',
          color: '#3b82f6',
          imageUrl: '',
          categoryId: ''
        })
      } else {
        const error = await response.json()
        alert(`خطأ: ${error.error}`)
      }
    } catch (error) {
      console.error('Error creating product:', error)
      alert('حدث خطأ أثناء إضافة المنتج')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleBarcodeDetected = (barcode: string) => {
    setFormData(prev => ({
      ...prev,
      barcode: barcode
    }))
  }



  return (
    <>
      <style jsx>{`
        input[type="text"] {
          color: black !important;
        }
        input[type="number"] {
          color: black !important;
        }
        input[type="date"] {
          color: black !important;
        }
        input[type="date"]::-webkit-datetime-edit {
          color: black !important;
        }
        textarea {
          color: black !important;
        }
        select {
          color: black !important;
        }
        input::placeholder {
          color: #6b7280 !important;
        }
        textarea::placeholder {
          color: #6b7280 !important;
        }
      `}</style>
      <MainLayout
        navbarTitle="إضافة منتج جديد"
        onBack={() => window.history.back()}
      >
      <div className="space-y-6" dir="rtl">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">إضافة منتج جديد</h1>
          <p className="mt-2 text-gray-600">أدخل تفاصيل المنتج الجديد</p>
        </div>

        <div className="bg-white shadow-sm rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1 - Barcode */}
            <div>
              <label htmlFor="barcode" className="block text-sm font-medium text-gray-700 mb-2">
                الباركود
              </label>
              <BarcodeInput
                value={formData.barcode}
                onChange={(value) => setFormData(prev => ({ ...prev, barcode: value }))}
                onBarcodeDetected={handleBarcodeDetected}
                placeholder="ادخل الباركود يدوياً أو اضغط على أيقونة الماسح"
                className="w-full"
              />
            </div>

            {/* 2 - Product Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                اسم المنتج *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="أدخل اسم المنتج"
              />
            </div>

            {/* 3 - Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                الوصف
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="وصف المنتج (اختياري)"
              />
            </div>

            {/* 4 - Three Selling Prices */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                  سعر البيع 1 *
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label htmlFor="price2" className="block text-sm font-medium text-gray-700 mb-2">
                  سعر البيع 2
                </label>
                <input
                  type="number"
                  id="price2"
                  name="price2"
                  value={formData.price2}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label htmlFor="price3" className="block text-sm font-medium text-gray-700 mb-2">
                  سعر البيع 3
                </label>
                <input
                  type="number"
                  id="price3"
                  name="price3"
                  value={formData.price3}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* 5 - Buying Price */}
            <div>
              <label htmlFor="costPrice" className="block text-sm font-medium text-gray-700 mb-2">
                سعر الشراء / التكلفة
              </label>
              <input
                type="number"
                id="costPrice"
                name="costPrice"
                value={formData.costPrice}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>

            {/* 6 - Quantity */}
            <div>
              <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-2">
                الكمية المتوفرة *
              </label>
              <input
                type="number"
                id="stock"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                required
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>

            {/* 7 - Order limit */}
            <div>
              <label htmlFor="minStock" className="block text-sm font-medium text-gray-700 mb-2">
                حد إعادة الطلب
              </label>
              <input
                type="number"
                id="minStock"
                name="minStock"
                value={formData.minStock}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>

            {/* 8 - Expiry Date */}
            <div>
              <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-2">
                تاريخ انتهاء الصلاحية
              </label>
              <input
                type="date"
                id="expiryDate"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 9 - Tax */}
            <div>
              <label htmlFor="tax" className="block text-sm font-medium text-gray-700 mb-2">
                الضريبة (%)
              </label>
              <input
                type="number"
                id="tax"
                name="tax"
                value={formData.tax}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>

            {/* 10 - Category */}
            <div>
              <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-2">
                الفئة
              </label>
              <select
                id="categoryId"
                name="categoryId"
                value={formData.categoryId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">اختر الفئة</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 11 - Unit */}
            <div>
              <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-2">
                الوحدة
              </label>
              <select
                id="unit"
                name="unit"
                value={formData.unit}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">اختر الوحدة</option>
                <option value="gram">جرام</option>
                <option value="kilogram">كيلوجرام</option>
                <option value="liter">لتر</option>
                <option value="milliliter">ملليلتر</option>
                <option value="piece">قطعة</option>
                <option value="box">علبة</option>
              </select>
            </div>

            {/* 12 - عبوة الوحدة */}
            <div>
              <label htmlFor="unitPackage" className="block text-sm font-medium text-gray-700 mb-2">
                عبوة الوحدة
              </label>
              <input
                type="text"
                id="unitPackage"
                name="unitPackage"
                value={formData.unitPackage}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="مثال: 6 قطع"
              />
            </div>

            {/* 13 - العبوة الأعلي */}
            <div>
              <label htmlFor="higherPackage" className="block text-sm font-medium text-gray-700 mb-2">
                العبوة الأعلي
              </label>
              <input
                type="text"
                id="higherPackage"
                name="higherPackage"
                value={formData.higherPackage}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="مثال: كرتونة"
              />
            </div>

            {/* 14 - Product square color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                لون مربع المنتج
              </label>
              <div className="flex items-center gap-3">
                {presetColors.map((color) => {
                  const isSelected = formData.color === color
                  return (
                    <button
                      type="button"
                      key={color}
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                      aria-label={`اختر اللون ${color}`}
                      aria-pressed={isSelected}
                      className={`w-10 h-10 rounded-md border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${isSelected ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-300'}`}
                      style={{ backgroundColor: color }}
                    />
                  )
                })}
              </div>
            </div>

            {/* 15 - Product image (optional) */}
            <div>
              <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-2">
                صورة المنتج (اختياري) - رابط
              </label>
              <input
                type="url"
                id="imageUrl"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3 space-x-reverse">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="px-4 py-2 bg-[#DDDDDD] text-gray-900 rounded-md text-sm font-medium hover:bg-[#CFCFCF] focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-[#DDDDDD] text-gray-900 rounded-md text-sm font-medium hover:bg-[#CFCFCF] focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'جاري الإضافة...' : 'إضافة المنتج'}
              </button>
            </div>
          </form>
        </div>
      </div>

    </MainLayout>
    </>
  )
} 