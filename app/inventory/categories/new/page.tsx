'use client'

import React, { useState, useEffect } from 'react'
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
  const [editName, setEditName] = useState('')
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteChecked, setDeleteChecked] = useState(false)
  const [notification, setNotification] = useState<Notification | null>(null)

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message })
  }

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true)
      const res = await fetch('/api/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories || [])
      } else {
        showNotification('error', 'فشل في تحميل التصنيفات')
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      showNotification('error', 'فشل في تحميل التصنيفات')
    } finally {
      setCategoriesLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])


  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category)
    setEditName(category.name)
    setDeleteChecked(false)
    setShowEditModal(true)
  }


  const submitAddCategory = async () => {
    if (!name.trim()) {
      showNotification('error', 'اسم التصنيف مطلوب')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: null
        }),
      })

      if (res.ok) {
        showNotification('success', 'تم إنشاء التصنيف')
        setName('')
        fetchCategories()
      } else {
        const err = await res.json()
        showNotification('error', err.error || 'فشل إنشاء التصنيف')
      }
    } catch (error) {
      showNotification('error', 'فشل إنشاء التصنيف')
    } finally {
      setLoading(false)
    }
  }

  const submitEditCategory = async () => {
    if (!selectedCategory || !editName.trim()) {
      showNotification('error', 'اسم التصنيف مطلوب')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/categories/${selectedCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          description: null
        }),
      })

      if (res.ok) {
        showNotification('success', 'تم تحديث التصنيف')
        setShowEditModal(false)
        setSelectedCategory(null)
        fetchCategories()
      } else {
        const err = await res.json()
        showNotification('error', err.error || 'فشل تحديث التصنيف')
      }
    } catch (error) {
      showNotification('error', 'فشل تحديث التصنيف')
    } finally {
      setLoading(false)
    }
  }

  const submitDeleteCategory = async () => {
    if (!selectedCategory) return

    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/categories/${selectedCategory.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        showNotification('success', 'تم حذف التصنيف')
        setShowEditModal(false)
        setSelectedCategory(null)
        fetchCategories()
      } else {
        const err = await res.json()
        showNotification('error', err.error || 'فشل حذف التصنيف')
      }
    } catch (error) {
      showNotification('error', 'فشل حذف التصنيف')
    } finally {
      setDeleteLoading(false)
    }
  }


  return (
    <MainLayout 
      navbarTitle="إضافة تصنيف جديد" 
      onBack={() => history.back()}
      customRightButton={
        <button
          onClick={submitAddCategory}
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
              <div key={category.id} className="flex items-center justify-between p-3 bg-white border rounded-lg mb-2 cursor-pointer hover:bg-gray-50 transition-colors"
                   onClick={() => handleEditCategory(category)}>
                <div className="font-medium text-gray-900">
                  {category.name}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>


      {/* Edit Category Modal */}
      {showEditModal && selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full" dir="rtl">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">تعديل التصنيف</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">اسم التصنيف *</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="mb-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={deleteChecked}
                      onChange={(e) => setDeleteChecked(e.target.checked)}
                      className="ml-2 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">حذف التصنيف</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedCategory(null)
                    setEditName('')
                    setDeleteChecked(false)
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  إلغاء
                </button>
                <button
                  onClick={deleteChecked ? submitDeleteCategory : submitEditCategory}
                  disabled={loading || deleteLoading}
                  className={`px-4 py-2 rounded text-white transition-colors ${
                    deleteChecked 
                      ? 'bg-red-600 hover:bg-red-700 disabled:opacity-50' 
                      : 'bg-blue-600 hover:bg-blue-700 disabled:opacity-50'
                  }`}
                >
                  {deleteLoading ? 'جاري الحذف...' : deleteChecked ? 'حذف' : (loading ? 'جاري الحفظ...' : 'حفظ')}
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


