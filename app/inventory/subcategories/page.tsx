'use client'

import { useState, useEffect } from 'react'
import MainLayout from '@/components/MainLayout'
import FlashNotification from '@/components/FlashNotification'

interface Category {
  id: string
  name: string
  description: string | null
  parentId: string | null
  level: number
  path: string | null
  children?: Category[]
  productCount?: number
}

interface Notification {
  type: 'success' | 'error' | 'info'
  message: string
}

export default function SubcategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryDescription, setNewCategoryDescription] = useState('')
  const [parentCategoryId, setParentCategoryId] = useState<string | null>(null)
  const [notification, setNotification] = useState<Notification | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message })
  }

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/categories/hierarchy')
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
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleAddSubcategory = (parentCategory: Category) => {
    setParentCategoryId(parentCategory.id)
    setNewCategoryName('')
    setNewCategoryDescription('')
    setShowAddModal(true)
  }

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category)
    setNewCategoryName(category.name)
    setNewCategoryDescription(category.description || '')
    setShowEditModal(true)
  }

  const handleDeleteCategory = (category: Category) => {
    setSelectedCategory(category)
    setShowDeleteModal(true)
  }

  const submitAddCategory = async () => {
    if (!newCategoryName.trim()) {
      showNotification('error', 'اسم التصنيف مطلوب')
      return
    }

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          description: newCategoryDescription.trim() || null,
          parentId: parentCategoryId
        }),
      })

      if (res.ok) {
        showNotification('success', 'تم إنشاء التصنيف الفرعي')
        setShowAddModal(false)
        setNewCategoryName('')
        setNewCategoryDescription('')
        setParentCategoryId(null)
        fetchCategories()
      } else {
        const err = await res.json()
        showNotification('error', err.error || 'فشل إنشاء التصنيف الفرعي')
      }
    } catch (error) {
      showNotification('error', 'فشل إنشاء التصنيف الفرعي')
    }
  }

  const submitEditCategory = async () => {
    if (!selectedCategory || !newCategoryName.trim()) {
      showNotification('error', 'اسم التصنيف مطلوب')
      return
    }

    try {
      const res = await fetch(`/api/categories/${selectedCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          description: newCategoryDescription.trim() || null
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
    }
  }

  const submitDeleteCategory = async () => {
    if (!selectedCategory) return

    try {
      const res = await fetch(`/api/categories/${selectedCategory.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        showNotification('success', 'تم حذف التصنيف')
        setShowDeleteModal(false)
        setSelectedCategory(null)
        fetchCategories()
      } else {
        const err = await res.json()
        showNotification('error', err.error || 'فشل حذف التصنيف')
      }
    } catch (error) {
      showNotification('error', 'فشل حذف التصنيف')
    }
  }

  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const renderCategoryTree = (categories: Category[], level = 0) => {
    return categories.map((category) => (
      <div key={category.id} className="ml-4">
        <div className={`flex items-center justify-between p-3 bg-white border rounded-lg mb-2 ${level > 0 ? 'border-l-4 border-l-blue-400' : ''}`}>
          <div className="flex items-center space-x-2 space-x-reverse">
            {category.children && category.children.length > 0 && (
              <button
                onClick={() => toggleExpanded(category.id)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <svg
                  className={`w-4 h-4 transition-transform ${expandedCategories.has(category.id) ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
            <div>
              <div className="font-medium text-gray-900">
                {level > 0 && '└─ '}
                {category.name}
              </div>
              {category.description && (
                <div className="text-sm text-gray-600">{category.description}</div>
              )}
              <div className="text-xs text-gray-500">
                المستوى: {category.level} | المنتجات: {category.productCount || 0}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <button
              onClick={() => handleAddSubcategory(category)}
              className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
            >
              إضافة فرعي
            </button>
            <button
              onClick={() => handleEditCategory(category)}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              تعديل
            </button>
            <button
              onClick={() => handleDeleteCategory(category)}
              className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
              حذف
            </button>
          </div>
        </div>
        {category.children && category.children.length > 0 && expandedCategories.has(category.id) && (
          <div className="ml-4">
            {renderCategoryTree(category.children, level + 1)}
          </div>
        )}
      </div>
    ))
  }

  return (
    <MainLayout 
      navbarTitle="إدارة التصنيفات الفرعية" 
      onBack={() => history.back()}
      customRightButton={
        <button
          onClick={() => {
            setParentCategoryId(null)
            setNewCategoryName('')
            setNewCategoryDescription('')
            setShowAddModal(true)
          }}
          className="text-blue-600 hover:text-blue-700 focus:outline-none focus:text-blue-700 px-2"
        >
          إضافة تصنيف
        </button>
      }
    >
      <div className="max-w-4xl mx-auto" dir="rtl">
        {loading ? (
          <div className="text-center py-8 text-gray-500">جاري التحميل...</div>
        ) : categories.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-4">لا توجد تصنيفات</div>
            <button
              onClick={() => {
                setParentCategoryId(null)
                setNewCategoryName('')
                setNewCategoryDescription('')
                setShowAddModal(true)
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              إضافة أول تصنيف
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {renderCategoryTree(categories)}
          </div>
        )}
      </div>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full" dir="rtl">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {parentCategoryId ? 'إضافة تصنيف فرعي' : 'إضافة تصنيف رئيسي'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">اسم التصنيف *</label>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="أدخل اسم التصنيف"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
                  <textarea
                    value={newCategoryDescription}
                    onChange={(e) => setNewCategoryDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="أدخل وصف التصنيف (اختياري)"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  إلغاء
                </button>
                <button
                  onClick={submitAddCategory}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  إضافة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
                  <textarea
                    value={newCategoryDescription}
                    onChange={(e) => setNewCategoryDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  إلغاء
                </button>
                <button
                  onClick={submitEditCategory}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  حفظ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Category Modal */}
      {showDeleteModal && selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full" dir="rtl">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">حذف التصنيف</h3>
              
              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  هل أنت متأكد من حذف التصنيف "{selectedCategory.name}"؟
                </p>
                {selectedCategory.children && selectedCategory.children.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-yellow-800 text-sm">
                      ⚠️ هذا التصنيف يحتوي على {selectedCategory.children.length} تصنيف فرعي. سيتم حذفها أيضاً.
                    </p>
                  </div>
                )}
                {selectedCategory.productCount && selectedCategory.productCount > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
                    <p className="text-red-800 text-sm">
                      ⚠️ هذا التصنيف يحتوي على {selectedCategory.productCount} منتج. يجب نقلها إلى تصنيف آخر أولاً.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  إلغاء
                </button>
                <button
                  onClick={submitDeleteCategory}
                  disabled={!!(selectedCategory.productCount && selectedCategory.productCount > 0)}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  حذف
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
