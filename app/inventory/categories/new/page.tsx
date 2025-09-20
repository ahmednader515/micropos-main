'use client'

import { useState, useEffect } from 'react'
import MainLayout from '@/components/MainLayout'
import FlashNotification from '@/components/FlashNotification'

interface Category {
  id: string
  name: string
  description: string | null
}

interface Notification {
  type: 'success' | 'error' | 'info'
  message: string
}

export default function NewCategoryPage() {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [showPopup, setShowPopup] = useState(false)
  const [deleteChecked, setDeleteChecked] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [notification, setNotification] = useState<Notification | null>(null)

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message })
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    } finally {
      setCategoriesLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const onSubmit = async () => {
    if (!name.trim()) {
      showNotification('error', 'الاسم مطلوب')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      if (res.ok) {
        showNotification('success', 'تم إنشاء التصنيف')
        setName('')
        // Refresh categories list
        fetchCategories()
      } else {
        const err = await res.json()
        showNotification('error', err.error || 'فشل إنشاء التصنيف')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryClick = (category: Category) => {
    setSelectedCategory(category)
    setDeleteChecked(false)
    setShowPopup(true)
  }

  const handleDeleteCategory = async () => {
    if (!selectedCategory || !deleteChecked) return
    
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/categories?id=${selectedCategory.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        showNotification('success', 'تم حذف التصنيف')
        setShowPopup(false)
        setSelectedCategory(null)
        setDeleteChecked(false)
        // Refresh categories list
        fetchCategories()
      } else {
        const err = await res.json()
        showNotification('error', err.error || 'فشل حذف التصنيف')
      }
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleContinue = () => {
    setShowPopup(false)
    setSelectedCategory(null)
    setDeleteChecked(false)
  }

  const handleCancel = () => {
    setShowPopup(false)
    setSelectedCategory(null)
    setDeleteChecked(false)
  }

  return (
    <MainLayout 
      navbarTitle="إضافة تصنيف جديد" 
      onBack={() => history.back()}
      customRightButton={
        <button
          onClick={onSubmit}
          disabled={loading}
          className="text-blue-600 hover:text-blue-700 focus:outline-none focus:text-blue-700 px-2 disabled:opacity-50"
        >
          {loading ? 'جاري الحفظ...' : 'حفظ'}
        </button>
      }
    >
      <div className="max-w-xl mx-auto" dir="rtl">
        <form className="bg-white p-4 rounded shadow space-y-4">
          <div>
            <label className="block text-sm mb-1">اسم التصنيف *</label>
            <input 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className="w-full border rounded px-3 py-2" 
              required 
            />
          </div>
        </form>
      </div>

      {/* Categories List */}
      <div className="mt-6" dir="rtl">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">التصنيفات الموجودة</h2>
        {categoriesLoading ? (
          <div className="text-center py-4 text-gray-500">جاري التحميل...</div>
        ) : categories.length === 0 ? (
          <div className="text-center py-4 text-gray-500">لا توجد تصنيفات</div>
        ) : (
          <div className="space-y-2">
            {categories.map((category) => (
              <div 
                key={category.id} 
                className="bg-white p-4 rounded shadow cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => handleCategoryClick(category)}
              >
                <div className="font-medium text-gray-900">{category.name}</div>
                {category.description && (
                  <div className="text-sm text-gray-600 mt-1">{category.description}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category Details Popup */}
      {showPopup && selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full" dir="rtl">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">تفاصيل التصنيف</h3>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">اسم التصنيف</label>
                <div className="p-3 bg-gray-50 rounded border text-gray-900">
                  {selectedCategory.name}
                </div>
              </div>

              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={deleteChecked}
                    onChange={(e) => setDeleteChecked(e.target.checked)}
                    className="ml-2 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">إلغاء التصنيف</span>
                </label>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  تراجع
                </button>
                <button
                  onClick={deleteChecked ? handleDeleteCategory : handleContinue}
                  disabled={deleteLoading}
                  className={`px-4 py-2 rounded text-white transition-colors ${
                    deleteChecked 
                      ? 'bg-red-600 hover:bg-red-700 disabled:opacity-50' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {deleteLoading ? 'جاري الحذف...' : deleteChecked ? 'حذف' : 'متابعة'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
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


