'use client'

import { useState, useEffect, useRef } from 'react'
import MainLayout from '@/components/MainLayout'
import FlashNotification from '@/components/FlashNotification'
import BarcodeInput from '@/components/BarcodeInput'
import ConfirmNavigationPopup from '@/components/ConfirmNavigationPopup'

interface Product {
  id: string
  name: string
  price: number
  price2: number
  price3: number
  costPrice: number
  stock: number
  barcode: string | null
  sku: string | null
  expiryDate: string | null
  category?: {
    id: string
    name: string
  } | null
  color?: string | null
}

interface Supplier {
  id: string
  name: string
  balance: string
  phone?: string
}

interface PurchaseItem {
  productId: string
  name: string
  price: number
  quantity: number
  discount: number
  total: number
}

export default function PurchasesPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [barcodeValue, setBarcodeValue] = useState('')
  const [supplierSearchValue, setSupplierSearchValue] = useState('')
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false)
  const [showSupplierSearch, setShowSupplierSearch] = useState(false)
  const [productSearchValue, setProductSearchValue] = useState('')
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const [modalProductSearch, setModalProductSearch] = useState('')
  const [screenNumber, setScreenNumber] = useState(1)
  const [showScreenModal, setShowScreenModal] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [showInlineProductSelection, setShowInlineProductSelection] = useState(false)
  const [showCategoryView, setShowCategoryView] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [selectedParentCategory, setSelectedParentCategory] = useState<string | null>(null)
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  const [showProductDetails, setShowProductDetails] = useState(false)
  const [selectedProductForDetails, setSelectedProductForDetails] = useState<PurchaseItem | null>(null)
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [invoiceNumber, setInvoiceNumber] = useState<string>('')
  const [successModalSupplier, setSuccessModalSupplier] = useState<Supplier | null>(null)
  const [successModalItems, setSuccessModalItems] = useState<PurchaseItem[]>([])
  const [successModalTotal, setSuccessModalTotal] = useState(0)
  const [successModalTax, setSuccessModalTax] = useState(0)
  const [checkoutSupplierSearch, setCheckoutSupplierSearch] = useState('')
  const [showCheckoutSupplierDropdown, setShowCheckoutSupplierDropdown] = useState(false)
  const [showReprintModal, setShowReprintModal] = useState(false)
  const [showEditInvoiceModal, setShowEditInvoiceModal] = useState(false)
  const [invoiceSearchNumber, setInvoiceSearchNumber] = useState('')
  const [searchedInvoice, setSearchedInvoice] = useState<any>(null)
  const [loadingInvoice, setLoadingInvoice] = useState(false)
  const [showCalculator, setShowCalculator] = useState(false)
  const [calculatorDisplay, setCalculatorDisplay] = useState('0')
  const [calculatorPreviousValue, setCalculatorPreviousValue] = useState<number | null>(null)
  const [calculatorOperation, setCalculatorOperation] = useState<string | null>(null)
  const [calculatorWaitingForNewValue, setCalculatorWaitingForNewValue] = useState(false)
  const [calculatorExpression, setCalculatorExpression] = useState('')
  const [productDetailsForm, setProductDetailsForm] = useState({
    currentQuantity: 0,
    newQuantity: 1,
    totalCost: 0,
    oldPurchasePrice: 0,
    newPurchasePrice: 0,
    purchaseAverage: 0,
    oldSellingPrice: 0,
    sellingPrice1: 0,
    sellingPrice2: 0,
    sellingPrice3: 0,
    sellingAverage: 0,
    expiryDate: '',
    removeFromList: false
  })
  const [checkoutForm, setCheckoutForm] = useState({
    paymentMethod: 'CASH',
    total: 0,
    paid: 0,
    discount: 0,
    remaining: 0,
    supplierAccount: '',
    previousBalance: 0,
    note: '',
    tax: 0
  })
  const [purchaseItems, setPurchaseItems] = useState<{[screen: number]: PurchaseItem[]}>({
    1: [],
    2: [],
    3: [],
    4: []
  })
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info'
    message: string
  } | null>(null)
  const [invoiceDate, setInvoiceDate] = useState<string>(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [hideSelectedSupplierDisplay, setHideSelectedSupplierDisplay] = useState(false)

  // Intercept browser/mobile back
  const [showConfirmLeave, setShowConfirmLeave] = useState(false)
  const allowNavigationRef = useRef(false)

  useEffect(() => {
    try {
      window.history.pushState({ preventExit: true }, '')
    } catch {}

    const handlePopState = (e: PopStateEvent) => {
      if (allowNavigationRef.current) {
        return
      }
      try {
        window.history.pushState({ preventExit: true }, '')
      } catch {}
      setShowConfirmLeave(true)
    }

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  // Function to play sound when product is added
  const playAddProductSound = () => {
    try {
      const audio = new Audio('/sounds/peep.mp3')
      audio.volume = 0.5 // Set volume to 50%
      audio.play().catch(error => {
        console.log('Could not play sound:', error)
      })
    } catch (error) {
      console.log('Error playing sound:', error)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.product-search-container') && 
          !target.closest('.supplier-search-container') &&
          !target.closest('.checkout-supplier-search-container')) {
        setShowProductDropdown(false)
        setShowSupplierDropdown(false)
        setShowCheckoutSupplierDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        fetchProducts(),
        fetchSuppliers(),
        fetchCategories()
      ])
    } catch (error) {
      showNotification('error', 'فشل في جلب البيانات')
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    const response = await fetch('/api/products')
    if (response.ok) {
      const data = await response.json()
      setProducts(data.products || [])
    }
  }

  const fetchSuppliers = async () => {
    const response = await fetch('/api/suppliers')
    if (response.ok) {
      const data = await response.json()
      setSuppliers(data.suppliers || [])
    }
  }

  const fetchCategories = async () => {
    const response = await fetch('/api/categories/hierarchy')
    if (response.ok) {
      const data = await response.json()
      setCategories(data.categories || [])
    }
  }

  // Get unique categories from products
  const getCategories = () => {
    const categoryMap = new Map()
    products.forEach(product => {
      if (product.category) {
        categoryMap.set(product.category.id, product.category)
      }
    })
    return Array.from(categoryMap.values())
  }

  // Flatten all categories into a single array
  const flattenCategories = (categories: any[]): any[] => {
    const result: any[] = []
    
    const flatten = (cats: any[]) => {
      cats.forEach(cat => {
        result.push(cat)
        if (cat.children && cat.children.length > 0) {
          flatten(cat.children)
        }
      })
    }
    
    flatten(categories)
    return result
  }

  // Get all category IDs including subcategories
  const getAllCategoryIds = (categories: any[], targetId: string): string[] => {
    const result: string[] = [targetId]
    const allCategories = flattenCategories(categories)
    
    const findSubcategories = (parentId: string) => {
      allCategories.forEach(cat => {
        if (cat.parentId === parentId) {
          result.push(cat.id)
          findSubcategories(cat.id) // Recursively find deeper subcategories
        }
      })
    }
    
    findSubcategories(targetId)
    return result
  }

  const toggleCategoryExpansion = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  // Render hierarchical categories
  const renderCategoryTree = (categories: any[], level = 0) => {
    return categories.map((category) => (
      <div key={category.id} className="w-full">
        <button
          onClick={() => setSelectedCategory(category.id)}
          className={`w-full p-2 rounded-lg text-center transition-all duration-200 ${
            selectedCategory === category.id
              ? 'bg-green-100 border-2 border-green-300 text-green-800 shadow-sm'
              : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 hover:shadow-sm'
          }`}
          style={{ marginLeft: `${level * 8}px` }}
        >
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium truncate">{category.name}</div>
            {category.children && category.children.length > 0 && (
              <div
                onClick={(e) => {
                  e.stopPropagation()
                  toggleCategoryExpansion(category.id)
                }}
                className="p-1 hover:bg-gray-200 rounded cursor-pointer"
              >
                <svg
                  className={`w-4 h-4 transition-transform ${expandedCategories.has(category.id) ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            )}
          </div>
        </button>
        {category.children && category.children.length > 0 && expandedCategories.has(category.id) && (
          <div className="ml-2">
            {renderCategoryTree(category.children, level + 1)}
          </div>
        )}
      </div>
    ))
  }

  // Render categories in grid layout (flat structure for grid display)
  const renderCategoryGrid = (categories: any[], isSubcategoryView = false) => {
    return categories.map((category) => (
      <button
        key={category.id}
        onClick={() => {
          if (category.children && category.children.length > 0) {
            // If it's a parent category, show only its subcategories
            setSelectedParentCategory(category.id)
            setSelectedCategory(null) // Clear any selected category
          } else {
            // If it's a leaf category, select it and show its products
            setSelectedCategory(category.id)
            // Don't clear parent selection if we're in subcategory view
            if (!isSubcategoryView) {
              setSelectedParentCategory(null)
            }
          }
        }}
        className={`p-1 rounded text-center transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center ${
          selectedCategory === category.id
            ? 'bg-green-100 border border-green-300 text-green-800'
            : 'bg-gray-200 border border-black hover:bg-gray-300 text-gray-800'
        }`}
        style={{
          height: 'calc((100vh - 12rem) / 9)'
        }}
      >
        <div className="font-medium text-gray-900 text-xs leading-tight">{category.name}</div>
      </button>
    ))
  }

  // Filter products by category and search
  const getFilteredProducts = () => {
    let filtered = products

    // Filter by category if selected
    if (selectedCategory) {
      // Get all category IDs including subcategories
      const allCategoryIds = getAllCategoryIds(categories, selectedCategory)
      filtered = filtered.filter(product => 
        product.category?.id && allCategoryIds.includes(product.category.id)
      )
    }

    // Filter by search term
    if (modalProductSearch.trim()) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(modalProductSearch.toLowerCase()) ||
        (product.barcode && product.barcode.includes(modalProductSearch)) ||
        (product.sku && product.sku.includes(modalProductSearch))
      )
    }

    return filtered
  }

  const handleBarcodeDetected = (barcode: string) => {
    setBarcodeValue(barcode)
    setProductSearchValue(barcode)
    // Find product by barcode and add to purchase
    const product = products.find(p => p.barcode === barcode)
    if (product) {
      addProductToPurchase(product)
    } else {
      showNotification('error', 'المنتج غير موجود')
    }
  }

  const addProductToPurchase = (product: Product) => {
    const currentScreenItems = purchaseItems[screenNumber] || []
    const existingItem = currentScreenItems.find(item => item.productId === product.id)
    
    // Use cost price for purchases
    const selectedPrice = product.costPrice || product.price
    
    if (existingItem) {
      setPurchaseItems(prev => ({
        ...prev,
        [screenNumber]: prev[screenNumber].map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * selectedPrice }
            : item
        )
      }))
    } else {
      const newItem: PurchaseItem = {
        productId: product.id,
        name: product.name,
        price: selectedPrice,
        quantity: 1,
        discount: 0,
        total: selectedPrice
      }
      setPurchaseItems(prev => ({
        ...prev,
        [screenNumber]: [...(prev[screenNumber] || []), newItem]
      }))
    }
    
    // Play sound when product is added
    playAddProductSound()
  }

  const removeProductFromPurchase = (productId: string) => {
    setPurchaseItems(prev => ({
      ...prev,
      [screenNumber]: prev[screenNumber].filter(item => item.productId !== productId)
    }))
  }

  const calculateTotal = () => {
    const currentScreenItems = purchaseItems[screenNumber] || []
    return currentScreenItems.reduce((sum, item) => sum + getDisplayTotal(item), 0)
  }

  const calculateTotalQuantity = () => {
    const currentScreenItems = purchaseItems[screenNumber] || []
    return currentScreenItems.reduce((sum, item) => sum + item.quantity, 0)
  }

  const calculateTax = (screen?: number) => {
    // Use the tax from checkout form if available, otherwise calculate 14% of total
    if (checkoutForm.tax > 0) {
      return checkoutForm.tax
    }
    const total = calculateTotal()
    return total * 0.14 // 14% tax rate
  }

  const handleProductClick = (item: PurchaseItem) => {
    setSelectedProductForDetails(item)
    
    const product = products.find(p => p.id === item.productId)
    setProductDetailsForm({
      currentQuantity: product?.stock || 0,
      newQuantity: item.quantity,
      totalCost: item.price * item.quantity,
      oldPurchasePrice: product?.costPrice || 0,
      newPurchasePrice: item.price,
      purchaseAverage: 0,
      oldSellingPrice: product?.price || 0,
      sellingPrice1: product?.price || 0,
      sellingPrice2: product?.price2 || 0,
      sellingPrice3: product?.price3 || 0,
      sellingAverage: 0,
      expiryDate: product?.expiryDate || '',
      removeFromList: false
    })
    setShowProductDetails(true)
  }

  const handleProductDetailsSubmit = () => {
    if (!selectedProductForDetails) return

    if (productDetailsForm.removeFromList) {
      removeProductFromPurchase(selectedProductForDetails.productId)
    } else {
      const newTotal = productDetailsForm.newPurchasePrice * productDetailsForm.newQuantity
      setPurchaseItems(prev => ({
        ...prev,
        [screenNumber]: prev[screenNumber].map(item =>
          item.productId === selectedProductForDetails.productId
            ? {
                ...item,
                price: productDetailsForm.newPurchasePrice,
                quantity: productDetailsForm.newQuantity,
                total: newTotal
              }
            : item
        )
      }))
    }

    setShowProductDetails(false)
    setSelectedProductForDetails(null)
  }
    
  const calculatePurchaseAverage = () => {
    const { oldPurchasePrice, newPurchasePrice, currentQuantity, newQuantity } = productDetailsForm
    const totalQuantity = currentQuantity + newQuantity
    if (totalQuantity === 0) return 0
    
    const totalValue = (oldPurchasePrice * currentQuantity) + (newPurchasePrice * newQuantity)
    const average = totalValue / totalQuantity
    
    setProductDetailsForm(prev => ({
      ...prev,
      purchaseAverage: average,
      totalCost: newPurchasePrice * newQuantity
    }))
  }

  const calculateSellingAverage = () => {
    const { sellingPrice1, sellingPrice2, sellingPrice3 } = productDetailsForm
    const average = (sellingPrice1 + sellingPrice2 + sellingPrice3) / 3
    
    setProductDetailsForm(prev => ({
      ...prev,
      sellingAverage: average
    }))
  }

  const handleSupplierSelect = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setSupplierSearchValue(supplier.name)
    setShowSupplierDropdown(false)
    setShowSupplierSearch(false)
    setHideSelectedSupplierDisplay(false)
  }

  const handleSupplierClear = () => {
    setSelectedSupplier(null)
    setSupplierSearchValue('')
    setShowSupplierSearch(false)
    setHideSelectedSupplierDisplay(false)
  }

  const handleCheckoutClick = () => {
    const currentScreenItems = purchaseItems[screenNumber] || []
    if (currentScreenItems.length === 0) {
      showNotification('error', 'يرجى إضافة منتجات إلى القائمة أولاً')
      return
    }
    
    const total = calculateTotal()
    setCheckoutForm(prev => ({
      ...prev,
      total: total,
      paid: total, // default paid equals total on open
      remaining: total - total - prev.discount + prev.tax,
      supplierAccount: selectedSupplier?.name || '',
      previousBalance: selectedSupplier ? parseFloat(selectedSupplier.balance) : 0
    }))
    setCheckoutSupplierSearch('')
    setShowCheckoutSupplierDropdown(false)
    setShowCheckoutModal(true)
  }

  const handleCheckoutSubmit = async () => {
    try {
      const currentScreenItems = purchaseItems[screenNumber] || []
      
      // Check if this is a purchase request (fake purchase)
      if (checkoutForm.paymentMethod === 'طلب شراء') {
        // For purchase request, just show the success modal without saving to database
        setInvoiceNumber('طلب شراء')
        setSuccessModalSupplier(selectedSupplier)
        setSuccessModalItems(currentScreenItems)
        setSuccessModalTotal(calculateTotal())
        setSuccessModalTax(calculateTax())
        setShowCheckoutModal(false)
        setShowSuccessModal(true)
        // Don't clear the purchase items for purchase request
        showNotification('success', 'تم إنشاء طلب الشراء بنجاح')
        return
      }
      
      // Validate that we have items
      if (currentScreenItems.length === 0) {
        showNotification('error', 'يرجى إضافة منتجات إلى القائمة أولاً')
        return
      }
      
      // Prepare purchase items for database
      const purchaseItemsForDB = currentScreenItems.map(item => {
        const product = products.find(p => p.id === item.productId)
        if (!product) {
          throw new Error(`المنتج ${item.name} غير موجود في قاعدة البيانات`)
        }
        return {
          productId: item.productId,
          name: product.name,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount || 0,
          total: item.price * item.quantity - (item.discount || 0)
        }
      })

      // Find supplier ID if supplier is selected
      let supplierId = null
      if (selectedSupplier) {
        supplierId = selectedSupplier.id
      } else if (checkoutForm.supplierAccount.trim() !== '') {
        // Try to find supplier by name
        const supplier = suppliers.find(s => 
          s.name.toLowerCase() === checkoutForm.supplierAccount.toLowerCase()
        )
        if (supplier) {
          supplierId = supplier.id
        }
      }

      // Validate purchase data
      if (!checkoutForm.total || checkoutForm.total <= 0) {
        showNotification('error', 'المبلغ الإجمالي يجب أن يكون أكبر من صفر')
        return
      }

      if (!checkoutForm.paymentMethod) {
        showNotification('error', 'يرجى اختيار طريقة الدفع')
        return
      }

      // Prepare purchase data (invoice number will be generated by API)
      const purchaseData = {
        supplierId: supplierId || null,
        totalAmount: parseFloat(checkoutForm.total.toString()),
        paidAmount: checkoutForm.paymentMethod === 'اذن استلام' ? 0 : (parseFloat(checkoutForm.paid.toString()) || 0),
        discount: parseFloat(checkoutForm.discount.toString()) || 0,
        tax: parseFloat(checkoutForm.tax.toString()) || 0,
        paymentMethod: checkoutForm.paymentMethod,
        notes: checkoutForm.note || '',
        items: purchaseItemsForDB,
        isReceiptNote: checkoutForm.paymentMethod === 'اذن استلام'
      }

      // Log the data being sent
      console.log('Sending purchase data:', purchaseData)

      // Save to database
      const response = await fetch('/api/purchases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(purchaseData)
      })

      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)

      if (!response.ok) {
        let errorData
        try {
          errorData = await response.json()
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError)
          throw new Error(`فشل في حفظ الفاتورة - HTTP ${response.status}`)
        }
        console.error('API Error:', errorData)
        throw new Error(errorData.error || `فشل في حفظ الفاتورة - HTTP ${response.status}`)
      }

      let result
      try {
        result = await response.json()
      } catch (parseError) {
        console.error('Failed to parse success response:', parseError)
        throw new Error('فشل في قراءة استجابة الخادم')
      }
      
      console.log('Success response:', result)
      
      // Validate response structure
      if (!result.purchase || !result.purchase.invoiceNumber) {
        console.error('Invalid response structure:', result)
        throw new Error('استجابة غير صحيحة من الخادم')
      }
      
      // Update local state with the generated invoice number
      setInvoiceNumber(result.purchase.invoiceNumber)
      setSuccessModalSupplier(selectedSupplier)
      setSuccessModalItems(currentScreenItems)
      setSuccessModalTotal(calculateTotal())
      setSuccessModalTax(calculateTax())
      setShowCheckoutModal(false)
      setShowSuccessModal(true)
      setPurchaseItems(prev => ({ ...prev, [screenNumber]: [] }))
      
      // Show success notification
      showNotification('success', result.message || 'تم حفظ الفاتورة بنجاح')

    } catch (error) {
      console.error('Error saving invoice:', error)
      showNotification('error', error instanceof Error ? error.message : 'حدث خطأ أثناء حفظ الفاتورة')
    }
  }

  const handlePrintPDF = async () => {
    try {
      if (!invoiceNumber) {
        showNotification('error', 'رقم الفاتورة غير متوفر')
        return
      }

      // Handle purchase request mode
      if (invoiceNumber === 'طلب شراء') {
        // For purchase request, create a temporary PDF with current purchase items
        const currentScreenItems = purchaseItems[screenNumber] || []
        
        // Prepare temporary purchase data for PDF generation
        const tempPurchaseData = {
          invoiceNumber: 'طلب شراء',
          totalAmount: checkoutForm.total,
          paidAmount: checkoutForm.paid,
          discount: checkoutForm.discount,
          tax: checkoutForm.tax,
          paymentMethod: checkoutForm.paymentMethod,
          notes: checkoutForm.note,
          items: currentScreenItems.map(item => ({
            productName: item.name,
            quantity: item.quantity,
            price: item.price,
            discount: item.discount || 0,
            total: item.price * item.quantity - (item.discount || 0)
          })),
          isPurchaseRequest: true
        }

        // Generate PDF for purchase request
        const pdfResponse = await fetch('/api/pdf/purchase', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(tempPurchaseData)
        })

        if (!pdfResponse.ok) {
          const errorData = await pdfResponse.json().catch(() => ({}))
          console.error('PDF generation failed:', errorData)
          throw new Error(errorData.error || 'فشل في توليد طلب الشراء')
        }

        // Create blob and download
        const blob = await pdfResponse.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `purchase_request_${new Date().toISOString().split('T')[0]}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        showNotification('success', 'تم تحميل طلب الشراء بنجاح')
        return
      }

      console.log('Searching for invoice:', invoiceNumber)

      // Regular purchase handling
      // First, we need to get the purchase ID from the invoice number
      const response = await fetch(`/api/purchases?invoiceNumber=${invoiceNumber}`)
      console.log('API response status:', response.status)
      
      if (!response.ok) {
        throw new Error('فشل في العثور على الفاتورة')
      }

      const data = await response.json()
      console.log('API response data:', data)
      
      if (!data.purchases || data.purchases.length === 0) {
        throw new Error('الفاتورة غير موجودة')
      }

      const purchase = data.purchases[0]
      console.log('Found purchase:', purchase)
      
      // Generate and download PDF
      const pdfResponse = await fetch(`/api/pdf/purchase?id=${purchase.id}`)
      if (!pdfResponse.ok) {
        throw new Error('فشل في توليد الفاتورة')
      }

      // Create blob and download
      const blob = await pdfResponse.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `purchase_${invoiceNumber}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      // PDF downloaded successfully - no notification needed
    } catch (error) {
      console.error('Error generating PDF:', error)
      showNotification('error', error instanceof Error ? error.message : 'حدث خطأ أثناء توليد الفاتورة')
    }
  }

  const handleSendToWhatsApp = async () => {
    if (!successModalSupplier || !successModalSupplier.phone) {
      showNotification('error', 'لا يوجد رقم هاتف للمورد')
      return
    }

    try {
      // Show loading notification
      showNotification('info', 'جاري إعداد الفاتورة...')

      // Generate PDF first - use same logic as print button
      let response
      
      if (invoiceNumber === 'طلب شراء') {
        // For purchase request, use the same logic as print button
        const tempPurchaseData = {
          invoiceNumber: 'طلب شراء',
          totalAmount: checkoutForm.total,
          paidAmount: checkoutForm.paid,
          discount: checkoutForm.discount,
          tax: checkoutForm.tax,
          paymentMethod: checkoutForm.paymentMethod,
          notes: checkoutForm.note,
          items: successModalItems.map(item => ({
            productName: item.name,
            quantity: item.quantity,
            price: item.price,
            discount: item.discount || 0,
            total: item.price * item.quantity - (item.discount || 0)
          })),
          isPurchaseRequest: true
        }

        response = await fetch('/api/pdf/purchase', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(tempPurchaseData)
        })
      } else {
        // For regular purchases, fetch from database like print button
        const purchaseResponse = await fetch(`/api/purchases?invoiceNumber=${invoiceNumber}`)
        if (!purchaseResponse.ok) {
          throw new Error('فشل في العثور على الفاتورة')
        }

        const purchaseData = await purchaseResponse.json()
        if (!purchaseData.purchases || purchaseData.purchases.length === 0) {
          throw new Error('الفاتورة غير موجودة')
        }

        const purchase = purchaseData.purchases[0]
        response = await fetch(`/api/pdf/purchase?id=${purchase.id}`)
      }

      if (!response.ok) {
        throw new Error('فشل في توليد الفاتورة')
      }

      // Get the PDF blob
      const pdfBlob = await response.blob()
      
      // Create a temporary URL for the PDF
      const pdfUrl = URL.createObjectURL(pdfBlob)
      
      // Clean phone number (remove spaces, dashes, etc.)
      const cleanPhone = successModalSupplier.phone.replace(/[\s\-\(\)]/g, '')
      
      // Add country code if not present (assuming Egypt +20)
      let phoneNumber = cleanPhone
      if (!phoneNumber.startsWith('+20') && !phoneNumber.startsWith('20')) {
        if (phoneNumber.startsWith('0')) {
          phoneNumber = '+20' + phoneNumber.substring(1)
        } else {
          phoneNumber = '+20' + phoneNumber
        }
      } else if (phoneNumber.startsWith('20')) {
        phoneNumber = '+' + phoneNumber
      }

      // Create WhatsApp URL with instructions
      const message = `مرحباً ${successModalSupplier.name}،\n\nتم إنشاء فاتورة مشتريات جديدة برقم: ${invoiceNumber}\n\nيرجى إرفاق الفاتورة المرفقة أدناه:`
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
      
      // Download the PDF first
      const tempLink = document.createElement('a')
      tempLink.href = pdfUrl
      tempLink.download = `فاتورة_${invoiceNumber}.pdf`
      document.body.appendChild(tempLink)
      tempLink.click()
      document.body.removeChild(tempLink)
      
      // Show instruction notification
      showNotification('info', 'تم تحميل الفاتورة. سيتم فتح واتساب الآن...')
      
      // Open WhatsApp after a short delay
      setTimeout(() => {
        window.open(whatsappUrl, '_blank')
        showNotification('success', 'تم فتح واتساب. يرجى إرفاق الفاتورة المحملة وإرسالها')
      }, 1500)
      
      // Clean up the temporary URL
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 5000)

    } catch (error) {
      console.error('Error sending to WhatsApp:', error)
      showNotification('error', 'حدث خطأ أثناء إرسال الفاتورة')
    }
  }

  const handleFinish = () => {
    setShowSuccessModal(false)
    setInvoiceNumber('')
    setSuccessModalSupplier(null)
    setSuccessModalItems([])
    setSuccessModalTotal(0)
    setSuccessModalTax(0)
  }

  const handleCheckoutSupplierSelect = (supplier: Supplier) => {
    setCheckoutForm(prev => ({
      ...prev,
      supplierAccount: supplier.name,
      previousBalance: parseFloat(supplier.balance)
    }))
    setCheckoutSupplierSearch(supplier.name)
    setShowCheckoutSupplierDropdown(false)
  }

  const filteredCheckoutSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(checkoutSupplierSearch.toLowerCase())
  )

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(supplierSearchValue.toLowerCase())
  )

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearchValue.toLowerCase()) ||
    (product.barcode && product.barcode.includes(productSearchValue)) ||
    (product.sku && product.sku.toLowerCase().includes(productSearchValue.toLowerCase()))
  )


  const handleProductSelect = (product: Product) => {
    addProductToPurchase(product)
    setProductSearchValue('')
    setShowProductDropdown(false)
  }

  // Menu option handlers
  const handleReprintInvoice = () => {
    setShowReprintModal(true)
    setInvoiceSearchNumber('')
    setSearchedInvoice(null)
  }

  const handleEditInvoice = () => {
    setShowEditInvoiceModal(true)
    setInvoiceSearchNumber('')
    setSearchedInvoice(null)
  }

  const handleCalculator = () => {
    setShowCalculator(true)
  }

  const handleCalculatorNumber = (num: string) => {
    if (calculatorWaitingForNewValue) {
      setCalculatorDisplay(num)
      setCalculatorWaitingForNewValue(false)
      setCalculatorExpression(prev => prev + num)
    } else {
      setCalculatorDisplay(prev => prev === '0' ? num : prev + num)
      setCalculatorExpression(prev => prev === '' ? num : prev + num)
    }
  }

  const handleCalculatorOperation = (op: string) => {
    if (calculatorOperation && !calculatorWaitingForNewValue) {
      handleCalculatorCalculate()
    }
    setCalculatorPreviousValue(parseFloat(calculatorDisplay))
    setCalculatorOperation(op)
    setCalculatorWaitingForNewValue(true)
    
    // Add operator to expression
    const operatorSymbol = op === '+' ? '+' : op === '-' ? '-' : op === '*' ? '×' : op === '/' ? '÷' : op
    setCalculatorExpression(prev => prev + ' ' + operatorSymbol + ' ')
  }

  const handleCalculatorCalculate = () => {
    if (calculatorOperation && calculatorPreviousValue !== null) {
      const prev = calculatorPreviousValue
      const current = parseFloat(calculatorDisplay)
      let result: number

      switch (calculatorOperation) {
        case '+': result = prev + current; break
        case '-': result = prev - current; break
        case '*': result = prev * current; break
        case '/': result = current !== 0 ? prev / current : 0; break
        default: return
      }

      setCalculatorDisplay(result.toString())
      setCalculatorExpression(prev => prev + ' = ' + result.toString())
      setCalculatorOperation(null)
      setCalculatorPreviousValue(null)
      setCalculatorWaitingForNewValue(true)
    }
  }

  const handleCalculatorClear = () => {
    setCalculatorDisplay('0')
    setCalculatorPreviousValue(null)
    setCalculatorOperation(null)
    setCalculatorWaitingForNewValue(false)
    setCalculatorExpression('')
  }

  const handleCalculatorDelete = () => {
    if (calculatorDisplay.length > 1) {
      setCalculatorDisplay(prev => prev.slice(0, -1))
      setCalculatorExpression(prev => {
        // Remove the last character from the expression
        if (prev.endsWith(' ')) {
          return prev.slice(0, -3) // Remove " X " pattern
        } else {
          return prev.slice(0, -1)
        }
      })
    } else {
      setCalculatorDisplay('0')
      setCalculatorExpression('')
    }
  }

  const handleSupplierBalanceInquiry = () => {
    if (selectedSupplier) {
      showNotification('info', `رصيد المورد ${selectedSupplier.name}: ${formatCurrency(parseFloat(selectedSupplier.balance))}`)
    } else {
      showNotification('error', 'يرجى اختيار مورد أولاً')
    }
  }

  const handleToggleBarcodeReader = () => {
    setShowBarcodeScanner(true)
  }

  const handleAddNewProduct = () => {
    window.location.href = '/inventory/new-product'
  }

  const handleViewInvoices = () => {
    window.location.href = '/reports'
  }

  const handleClearProducts = () => {
    setPurchaseItems(prev => ({ ...prev, [screenNumber]: [] }))
    showNotification('success', 'تم مسح المنتجات من القائمة')
  }

  // Invoice search and handling functions
  const handleSearchInvoice = async () => {
    if (!invoiceSearchNumber.trim()) {
      showNotification('error', 'يرجى إدخال رقم الفاتورة')
      return
    }

    setLoadingInvoice(true)
    try {
      // Remove # prefix if present, since database stores numbers without prefix
      const cleanInvoiceNumber = invoiceSearchNumber.replace(/^#/, '')
      const response = await fetch(`/api/purchases?invoiceNumber=${cleanInvoiceNumber}`)
      if (response.ok) {
        const data = await response.json()
        // Handle both array format and object with purchases property
        const purchases = Array.isArray(data) ? data : (data.purchases || [])
        if (purchases.length > 0) {
          setSearchedInvoice(purchases[0])
          showNotification('success', 'تم العثور على الفاتورة')
        } else {
          showNotification('error', 'لم يتم العثور على الفاتورة')
          setSearchedInvoice(null)
        }
      } else {
        showNotification('error', 'خطأ في البحث عن الفاتورة')
        setSearchedInvoice(null)
      }
    } catch (error) {
      showNotification('error', 'خطأ في البحث عن الفاتورة')
      setSearchedInvoice(null)
    } finally {
      setLoadingInvoice(false)
    }
  }

  const handleReprintSearchedInvoice = async () => {
    if (!searchedInvoice) {
      showNotification('error', 'يرجى البحث عن الفاتورة أولاً')
      return
    }

    try {
      const pdfResponse = await fetch(`/api/pdf/purchase?id=${searchedInvoice.id}`)
      if (!pdfResponse.ok) {
        throw new Error('Failed to generate PDF')
      }
      
      const blob = await pdfResponse.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `purchase-${searchedInvoice.invoiceNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      showNotification('success', 'تم طباعة الفاتورة')
      setShowReprintModal(false)
    } catch (error) {
      showNotification('error', 'خطأ في طباعة الفاتورة')
    }
  }

  const handleEditSearchedInvoice = async () => {
    if (!searchedInvoice) {
      showNotification('error', 'يرجى البحث عن الفاتورة أولاً')
      return
    }

    try {
      // Set the selected supplier
      if (searchedInvoice.supplier) {
        // Fetch the supplier's current balance
        try {
          const supplierResponse = await fetch(`/api/suppliers/${searchedInvoice.supplier.id}`)
          if (supplierResponse.ok) {
            const supplierData = await supplierResponse.json()
            setSelectedSupplier({
              id: searchedInvoice.supplier.id,
              name: searchedInvoice.supplier.name,
              balance: supplierData.balance || '0'
            })
          } else {
            setSelectedSupplier({
              id: searchedInvoice.supplier.id,
              name: searchedInvoice.supplier.name,
              balance: '0'
            })
          }
        } catch (error) {
          console.error('Error fetching supplier balance:', error)
          setSelectedSupplier({
            id: searchedInvoice.supplier.id,
            name: searchedInvoice.supplier.name,
            balance: '0'
          })
        }
        setSupplierSearchValue(searchedInvoice.supplier.name)
        setHideSelectedSupplierDisplay(true)
      } else {
        setSelectedSupplier(null)
        setSupplierSearchValue('')
        setHideSelectedSupplierDisplay(false)
      }

      // Convert purchase items to the format expected by the purchase screen
      console.log('Searched invoice:', searchedInvoice)
      console.log('Purchase items:', searchedInvoice.items)
      
      if (!searchedInvoice.items || !Array.isArray(searchedInvoice.items)) {
        showNotification('error', 'لا توجد منتجات في هذه الفاتورة')
        return
      }

      const convertedItems: PurchaseItem[] = searchedInvoice.items.map((item: any) => ({
        productId: item.productId,
        name: item.name, // The API already flattens the product name
        price: Number(item.price),
        quantity: item.quantity,
        discount: item.discount || 0,
        total: Number(item.total)
      }))

      // Load the products into the current screen
      setPurchaseItems(prev => ({
        ...prev,
        [screenNumber]: convertedItems
      }))

      // Close the modal and show success message
      setShowEditInvoiceModal(false)
      setSearchedInvoice(null)
      setInvoiceSearchNumber('')
      showNotification('success', 'تم تحميل الفاتورة للتعديل')
    } catch (error) {
      console.error('Error loading invoice for editing:', error)
      showNotification('error', 'خطأ في تحميل الفاتورة للتعديل')
    }
  }

  const menuOptions = [
    { label: 'اضافة منتج جديد', onClick: handleAddNewProduct },
    { label: 'اعادة طباعة الفاتورة', onClick: handleReprintInvoice },
    { label: 'تعديل فاتورة مشتريات', onClick: handleEditInvoice }
  ]

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  const formatCurrency = (amount: number) => {
    const englishNumerals = amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
    return `${englishNumerals}`
  }

  const formatPriceInArabic = (amount: number) => {
    // Convert to English numerals
    const englishNumerals = amount.toLocaleString('en-US')
    return `${englishNumerals}`
  }

  const getDisplayTotal = (item: PurchaseItem) => {
    return item.price * item.quantity - item.discount
  }

  if (loading) {
    return (
      <MainLayout
        navbarTitle="المشتريات"
        onBack={() => setShowConfirmLeave(true)}
        menuOptions={menuOptions}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">جاري التحميل...</div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout
      navbarTitle="المشتريات"
      onBack={() => setShowConfirmLeave(true)}
      menuOptions={menuOptions}
    >
      <div className="h-full flex flex-col -m-4 lg:-m-6" dir="rtl">
        {/* Date Input Field */}
        <div className="bg-white border-b flex-shrink-0" dir="rtl">
          <div className="flex items-center">
            <label className="w-[35%] text-sm font-medium text-gray-700 px-3 py-2">تاريخ الفاتورة:</label>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-[65%] py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-center"
            />
          </div>
        </div>

        {/* Top Row with Search Bar and Buttons */}
        <div className="flex items-center gap-1 p-2 sm:p-4 bg-white border-b flex-shrink-0" dir="rtl">
          {/* Left Side - Barcode Button */}
          <div className="flex items-center gap-1">
            {/* Barcode Button */}
            <button
              onClick={() => setShowBarcodeScanner(true)}
              className="p-1.5 text-gray-500 hover:text-blue-600 transition-colors bg-gray-100 hover:bg-gray-200 rounded"
              title="مسح الباركود"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z"
                />
              </svg>
            </button>
          </div>

          {/* Middle - Search Bar */}
          <div className="flex-1 min-w-0 max-w-lg mx-1 relative product-search-container">
            <input
              type="text"
              value={productSearchValue}
              onChange={(e) => {
                setProductSearchValue(e.target.value)
                setShowProductDropdown(true)
              }}
              onFocus={() => setShowProductDropdown(true)}
              placeholder="ابحث عن منتج او استخدم الكاميرا"
              className="w-full px-2 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm placeholder:text-xs sm:placeholder:text-sm"
            />
            {productSearchValue.trim() !== '' && filteredProducts.length > 0 && showProductDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-40 overflow-y-auto">
                {filteredProducts.map(product => (
                  <button
                    key={product.id}
                    onClick={() => handleProductSelect(product)}
                    className="w-full text-right px-4 py-2 hover:bg-gray-100 border-b last:border-b-0"
                  >
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-gray-500">
                      السعر: {formatCurrency(product.costPrice || product.price)} | المخزون: {product.stock}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Side - Save Button */}
          <div className="flex items-center gap-1">
            {/* Save Button */}
            <button
              onClick={handleCheckoutClick}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 px-4 rounded transition-colors text-sm whitespace-nowrap"
            >
              حفظ
            </button>
          </div>
        </div>


        {/* Products Table */}
        <div 
          className="overflow-auto min-h-0 bg-gray-50"
          style={{
            height: showInlineProductSelection 
              ? (showCategoryView && showInlineProductSelection
                  ? 'calc((100vh - 12rem) / 2.5)'
                  : 'calc((100vh - 8rem) / 2.5)'
                )
              : 'calc(80vh)'
          }}
        >
          <div className="h-full overflow-y-auto">
            <table className="w-full text-sm" dir="rtl">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 text-right font-medium text-gray-500 text-xs sm:text-sm">المنتج</th>
                  <th className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 text-right font-medium text-gray-500 text-xs sm:text-sm">التكلفة</th>
                  <th className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 text-right font-medium text-gray-500 text-xs sm:text-sm">الكمية</th>
                  <th className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 text-right font-medium text-gray-500 text-xs sm:text-sm">الاجمالي</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(purchaseItems[screenNumber] || []).map((item) => (
                  <tr key={item.productId} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleProductClick(item)} style={{ height: showInlineProductSelection ? (showCategoryView ? 'calc((100vh - 12rem) / 9)' : 'calc((100vh - 8rem) / 9)') : '100px' }}>
                    <td className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4 text-gray-900 font-medium">
                      <div className="truncate max-w-xs text-xs sm:text-sm">{item.name}</div>
                    </td>
                    <td className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4 text-gray-900 font-medium">
                      <div className="text-xs sm:text-sm lg:text-base">{formatCurrency(item.price)}</div>
                    </td>
                    <td className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4 text-gray-900 font-medium">
                      <div className="text-xs sm:text-sm lg:text-base">{item.quantity}</div>
                    </td>
                    <td className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4 text-gray-900 font-medium">
                      <div className="text-xs sm:text-sm lg:text-base">{formatCurrency(getDisplayTotal(item))}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Products and Categories Section - Slightly increased height */}
        {showInlineProductSelection && (
          <div className="fixed bottom-12 left-0 right-0 z-30" dir="rtl">
            {/* Products Selection */}
            <div className="bg-white">
              <div 
                className="overflow-y-auto flex-shrink-0"
                style={{ 
                  height: showCategoryView 
                    ? 'calc((100vh - 12rem) / 4.1)'
                    : 'calc((100vh - 8rem) / 1.9)'
                }}
              >
                <div className="p-1">
                  <div className="grid grid-cols-3 gap-1">
                    {getFilteredProducts().map(product => (
                      <button
                        key={product.id}
                        onClick={() => addProductToPurchase(product)}
                        className={`p-1 rounded text-center transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center ${
                          product.color 
                            ? `bg-${product.color}-100 border border-${product.color}-300 hover:bg-${product.color}-200`
                            : 'bg-white border border-gray-200 hover:bg-gray-50'
                        }`}
                        style={{
                          height: showCategoryView 
                            ? 'calc((100vh - 12rem) / 9)'
                            : 'calc((100vh - 8rem) / 6)',
                          backgroundColor: product.color ? `${product.color}15` : undefined,
                          borderColor: product.color ? `${product.color}40` : undefined
                        }}
                      >
                        <div className="font-medium text-gray-900 text-xs leading-tight">
                          {product.name}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {/* Categories Section */}
              {showCategoryView && (
                <div className="bg-gray-50 border-t border-gray-200 flex-shrink-0 overflow-y-auto" style={{ height: 'calc((100vh - 12rem) / 4.1)' }}>
                  <div className="p-1">
                    <div className="grid grid-cols-3 gap-1">
                      {!selectedParentCategory && (
                        <button
                          onClick={() => {
                            setSelectedCategory(null)
                            setSelectedParentCategory(null)
                          }}
                          className={`p-1 rounded text-center transition-all duration-200 shadow-sm hover:shadow-md ${
                            selectedCategory === null && selectedParentCategory === null
                              ? 'bg-green-100 border border-green-300 text-green-800'
                              : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <div className="font-medium text-gray-900 text-xs leading-tight">الكل</div>
                        </button>
                      )}
                      
                      {selectedParentCategory ? (
                        // Show only subcategories of selected parent
                        <>
                          {renderCategoryGrid(categories.find(cat => cat.id === selectedParentCategory)?.children || [], true)}
                          <button
                            onClick={() => setSelectedParentCategory(null)}
                            className="p-1 rounded text-center transition-all duration-200 shadow-sm hover:shadow-md bg-blue-100 border border-blue-300 text-blue-800"
                          >
                            <div className="font-medium text-gray-900 text-xs leading-tight">← العودة</div>
                          </button>
                        </>
                      ) : (
                        // Show all parent categories
                        renderCategoryGrid(categories, false)
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons - Fixed above bottom bar */}
        {/* Bottom toggle buttons to match sales */}
        <div className="fixed bottom-12 right-2 z-40">
          <button
            onClick={() => {
              const newShow = !showInlineProductSelection
              setShowInlineProductSelection(newShow)
              if (newShow) setShowCategoryView(true)
            }}
            className="p-2 text-gray-700 hover:text-gray-900 transition-colors bg-white hover:bg-gray-100 rounded-lg border border-gray-300 min-h-[36px] min-w-[36px] flex items-center justify-center opacity-65"
            title="إضافة منتجات"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
        </div>
        {showInlineProductSelection && (
          <div className="fixed bottom-12 left-2 z-40">
            <button
              onClick={() => setShowCategoryView(!showCategoryView)}
              className={`p-2 text-gray-700 hover:text-gray-900 transition-colors bg-white hover:bg-gray-100 rounded-lg border border-gray-300 min-h-[36px] min-w-[36px] flex items-center justify-center opacity-65 ${showCategoryView ? 'bg-gray-100' : ''}`}
              title="الفئات"
            >
              <div className="w-5 h-5 border border-gray-400 rounded flex items-center justify-center">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </div>
            </button>
          </div>
        )}

        {/* Bottom Section - Fixed at bottom */}
        <div className="flex-shrink-0 fixed bottom-0 left-0 right-0 bg-white z-50">
          {/* Bottom Bar with Totals */}
          <div className="flex items-center gap-4 p-2 sm:p-4 bg-gray-50 border-t">
            <div className="text-base sm:text-lg font-semibold">
              الإجمالي: {formatCurrency(calculateTotal())}
            </div>
            <div className="text-sm text-gray-600">
              ع.ق: {calculateTotalQuantity()}
            </div>
          </div>
        </div>


        {/* Product Selection Modal */}
        {showProductModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50" dir="rtl">
            <div className="bg-white w-full h-[85vh] rounded-t-lg overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">اختيار المنتجات</h3>
                <button
                  onClick={() => {
                    setShowProductModal(false)
                    setModalProductSearch('')
                    setSelectedCategory(null)
                    setShowCategoryView(false)
                  }}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Search Bar */}
              <div className="p-4 border-b">
                <input
                  type="text"
                  value={modalProductSearch}
                  onChange={(e) => setModalProductSearch(e.target.value)}
                  placeholder="ابحث عن منتج..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Main Content */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Products Grid */}
                <div className="flex-1 p-4 overflow-y-auto">
                  <div className="grid grid-cols-3 gap-3">
                    {getFilteredProducts().map(product => (
                      <button
                        key={product.id}
                        onClick={() => {
                          addProductToPurchase(product)
                          setShowProductModal(false)
                          setModalProductSearch('')
                          setSelectedCategory(null)
                          setShowCategoryView(false)
                        }}
                        className={`p-3 rounded-lg text-center transition-all duration-200 shadow-sm hover:shadow-md ${
                          product.color 
                            ? `bg-${product.color}-100 border-2 border-${product.color}-300 hover:bg-${product.color}-200`
                            : 'bg-white border-2 border-gray-200 hover:bg-gray-50'
                        }`}
                        style={{
                          backgroundColor: product.color ? `${product.color}15` : undefined,
                          borderColor: product.color ? `${product.color}40` : undefined
                        }}
                      >
                        <div className="font-medium text-gray-900 text-xs leading-tight">
                          {product.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatCurrency(product.costPrice || product.price)}
                        </div>
                      </button>
                    ))}
                    {getFilteredProducts().length === 0 && modalProductSearch.trim() !== '' && (
                      <div className="col-span-3 text-center text-gray-500 py-8">
                        لا توجد منتجات تطابق البحث
                      </div>
                    )}
                  </div>
                </div>

                {/* Category Toggle and Categories Section */}
                <div className="border-t bg-gray-50">
                  {/* Category Toggle Button */}
                  <div className="p-4">
                    <button
                      onClick={() => setShowCategoryView(!showCategoryView)}
                      className="w-full flex items-center justify-center p-3 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                      <span className="text-sm font-medium text-gray-700">
                        {showCategoryView ? 'إخفاء الفئات' : 'عرض الفئات'}
                      </span>
                    </button>
                  </div>

                  {/* Categories Grid */}
                  {showCategoryView && (
                    <div className="p-4 pt-0 max-h-80 overflow-y-auto">
                      <div className="space-y-2">
                        <button
                          onClick={() => setSelectedCategory(null)}
                          className={`w-full p-3 rounded-lg text-center transition-all duration-200 ${
                            selectedCategory === null
                              ? 'bg-green-100 border-2 border-green-300 text-green-800 shadow-sm'
                              : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 hover:shadow-sm'
                          }`}
                        >
                          <div className="text-sm font-medium">الكل</div>
                        </button>
                        {renderCategoryTree(categories)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Product Details Modal */}
        {showProductDetails && selectedProductForDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50" dir="rtl">
            <div className="bg-white w-full max-w-6xl mx-0 sm:mx-4 rounded-t-lg sm:rounded-lg overflow-hidden max-h-[90vh] sm:max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between p-3 sm:p-4 border-b flex-shrink-0">
                <h3 className="text-sm sm:text-lg font-semibold truncate">تفاصيل المنتج - {selectedProductForDetails.name}</h3>
                <button
                  onClick={() => setShowProductDetails(false)}
                  className="text-gray-500 hover:text-gray-700 p-1 flex-shrink-0"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-2 sm:p-6 space-y-2 sm:space-y-4 overflow-y-auto flex-1">
                {/* Row 1: Quantities and Total Cost */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1 sm:gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1 leading-tight overflow-hidden text-ellipsis">الكمية الموجودة</label>
                    <div className="px-1 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs font-medium">
                      {productDetailsForm.currentQuantity}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1 leading-tight overflow-hidden text-ellipsis">الكمية الجديدة</label>
                    <input
                      type="number"
                      min="1"
                      value={productDetailsForm.newQuantity}
                      onChange={(e) => setProductDetailsForm(prev => ({ ...prev, newQuantity: parseInt(e.target.value) || 1 }))}
                      className="w-full px-1 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-xs"
                    />
                  </div>
                  <div className="col-span-1 sm:col-span-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1 leading-tight overflow-hidden text-ellipsis">اجمالي التكلفة</label>
                    <div className="px-1 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs font-medium">
                      {formatCurrency(productDetailsForm.totalCost)}
                    </div>
                  </div>
                  <div className="hidden sm:block"></div>
                </div>

                {/* Row 2: Purchase Prices and Average */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1 sm:gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1 leading-tight overflow-hidden text-ellipsis">سعر الشراء القديم</label>
                    <div className="px-1 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs font-medium">
                      {formatCurrency(productDetailsForm.oldPurchasePrice)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1 leading-tight overflow-hidden text-ellipsis">سعر الشراء الجديد</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={productDetailsForm.newPurchasePrice}
                      onChange={(e) => setProductDetailsForm(prev => ({ 
                        ...prev, 
                        newPurchasePrice: parseFloat(e.target.value) || 0,
                        totalCost: (parseFloat(e.target.value) || 0) * prev.newQuantity
                      }))}
                      className="w-full px-1 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1 leading-tight overflow-hidden text-ellipsis">المتوسط الحسابي</label>
                    <div className="px-1 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs font-medium">
                      {formatCurrency(productDetailsForm.purchaseAverage)}
                    </div>
                  </div>
                  <div>
                    <div className="h-3 mb-1"></div>
                    <button
                      onClick={calculatePurchaseAverage}
                      className="w-full px-1 sm:px-3 py-1.5 sm:py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs"
                    >
                      احسب
                    </button>
                  </div>
                </div>

                {/* Row 3: Selling Prices and Average */}
                <div className="grid grid-cols-5 sm:grid-cols-3 lg:grid-cols-6 gap-0.5 sm:gap-3">
                  <div>
                    <div className="h-6 flex items-end mb-1">
                      <label className="text-xs font-medium text-gray-700 leading-tight overflow-hidden text-ellipsis">سعر البيع القديم</label>
                    </div>
                    <div className="px-0.5 py-1 bg-gray-50 border border-gray-300 rounded text-xs font-medium">
                      {formatCurrency(productDetailsForm.oldSellingPrice)}
                    </div>
                  </div>
                  <div>
                    <div className="h-6 flex items-end mb-1">
                      <label className="text-xs font-medium text-gray-700 leading-tight overflow-hidden text-ellipsis">سعر البيع 1</label>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={productDetailsForm.sellingPrice1}
                      onChange={(e) => setProductDetailsForm(prev => ({ ...prev, sellingPrice1: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-0.5 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-xs"
                    />
                  </div>
                  <div>
                    <div className="h-6 flex items-end mb-1">
                      <label className="text-xs font-medium text-gray-700 leading-tight overflow-hidden text-ellipsis">سعر البيع 2</label>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={productDetailsForm.sellingPrice2}
                      onChange={(e) => setProductDetailsForm(prev => ({ ...prev, sellingPrice2: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-0.5 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-xs"
                    />
                  </div>
                  <div>
                    <div className="h-6 flex items-end mb-1">
                      <label className="text-xs font-medium text-gray-700 leading-tight overflow-hidden text-ellipsis">سعر البيع 3</label>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={productDetailsForm.sellingPrice3}
                      onChange={(e) => setProductDetailsForm(prev => ({ ...prev, sellingPrice3: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-0.5 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-xs"
                    />
                  </div>
                  <div>
                    <div className="h-6 flex items-end mb-1">
                      <label className="text-xs font-medium text-gray-700 leading-tight overflow-hidden text-ellipsis">المتوسط الحسابي</label>
                    </div>
                    <div className="px-0.5 py-1 bg-gray-50 border border-gray-300 rounded text-xs font-medium">
                      {formatCurrency(productDetailsForm.sellingAverage)}
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    <div className="h-6 flex items-end mb-1">
                      <div></div>
                    </div>
                    <button
                      onClick={calculateSellingAverage}
                      className="w-full px-1 sm:px-3 py-1 sm:py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs"
                    >
                      احسب
                    </button>
                  </div>
                </div>

                {/* Calculate Button Row for Mobile */}
                <div className="sm:hidden">
                  <button
                    onClick={calculateSellingAverage}
                    className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs"
                  >
                    احسب المتوسط الحسابي
                  </button>
                </div>

                {/* Row 4: Expiry Date and Remove Option */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">تاريخ الانتهاء</label>
                    <div className="px-2 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs sm:text-sm font-medium">
                      {productDetailsForm.expiryDate ? new Date(productDetailsForm.expiryDate).toLocaleDateString('ar-EG') : 'غير محدد'}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="removeFromList"
                      checked={productDetailsForm.removeFromList}
                      onChange={(e) => setProductDetailsForm(prev => ({ ...prev, removeFromList: e.target.checked }))}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                    <label htmlFor="removeFromList" className="mr-2 text-xs sm:text-sm text-red-600 font-medium">
                      الغاء من القائمة
                    </label>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 sm:gap-3 p-3 sm:p-4 border-t bg-gray-50 flex-shrink-0">
                <button
                  onClick={() => setShowProductDetails(false)}
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm sm:text-base"
                >
                  رجوع
                </button>
                <button
                  onClick={handleProductDetailsSubmit}
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                >
                  حفظ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Checkout Modal */}
        {showCheckoutModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50" dir="rtl">
            <div className="bg-white w-full max-w-lg mx-0 sm:mx-4 rounded-t-lg sm:rounded-lg overflow-hidden max-h-[90vh] sm:max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between p-3 sm:p-4 border-b flex-shrink-0">
                <h3 className="text-base sm:text-lg font-semibold">إتمام المشتريات</h3>
                <button
                  onClick={() => setShowCheckoutModal(false)}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-3 sm:p-6 space-y-3 sm:space-y-4 overflow-y-auto flex-1">
                {/* Payment Method */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">طريقة الدفع</label>
                  <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    <label className="flex items-center whitespace-nowrap min-w-fit">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="CASH"
                        checked={checkoutForm.paymentMethod === 'CASH'}
                        onChange={(e) => setCheckoutForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                        className="ml-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="text-sm text-gray-700">نقدا</span>
                    </label>
                    <label className="flex items-center whitespace-nowrap min-w-fit">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="CREDIT"
                        checked={checkoutForm.paymentMethod === 'CREDIT'}
                        onChange={(e) => setCheckoutForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                        className="ml-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="text-sm text-gray-700">اجل</span>
                    </label>
                    <label className="flex items-center whitespace-nowrap min-w-fit">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="CARD"
                        checked={checkoutForm.paymentMethod === 'CARD'}
                        onChange={(e) => setCheckoutForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                        className="ml-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="text-sm text-gray-700">بطاقة</span>
                    </label>
                    <label className="flex items-center whitespace-nowrap min-w-fit">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="CHECK"
                        checked={checkoutForm.paymentMethod === 'CHECK'}
                        onChange={(e) => setCheckoutForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                        className="ml-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="text-sm text-gray-700">شيك</span>
                    </label>
                    <label className="flex items-center whitespace-nowrap min-w-fit">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="طلب شراء"
                        checked={checkoutForm.paymentMethod === 'طلب شراء'}
                        onChange={(e) => setCheckoutForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                        className="ml-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="text-sm text-gray-700">طلب شراء</span>
                    </label>
                    <label className="flex items-center whitespace-nowrap min-w-fit">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="اذن استلام"
                        checked={checkoutForm.paymentMethod === 'اذن استلام'}
                        onChange={(e) => setCheckoutForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                        className="ml-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="text-sm text-gray-700">اذن استلام</span>
                    </label>
                  </div>
                </div>

                {/* Total Amount */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">الإجمالي</label>
                  <div className="px-2 sm:px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium">
                    {formatCurrency(checkoutForm.total)}
                  </div>
                </div>

                {/* Paid Amount */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">المدفوع</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={checkoutForm.paid || ''}
                    placeholder="0.00"
                    onChange={(e) => {
                      const paid = parseFloat(e.target.value) || 0
                      setCheckoutForm(prev => ({
                        ...prev,
                        paid: paid,
                        remaining: prev.total - paid - prev.discount + prev.tax
                      }))
                    }}
                    className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Remaining Amount */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">الباقي</label>
                  <div className="px-2 sm:px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium">
                    {formatCurrency(checkoutForm.remaining)}
                  </div>
                </div>

                {/* Discount and Tax */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">الخصم</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={checkoutForm.discount || ''}
                      placeholder="0.00"
                      onChange={(e) => {
                        const discount = parseFloat(e.target.value) || 0
                        setCheckoutForm(prev => ({ 
                          ...prev, 
                          discount,
                          remaining: prev.total - prev.paid - discount + prev.tax
                        }))
                      }}
                      className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">الضريبة</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={checkoutForm.tax || ''}
                      placeholder="0.00"
                      onChange={(e) => {
                        const tax = parseFloat(e.target.value) || 0
                        setCheckoutForm(prev => ({ 
                          ...prev, 
                          tax,
                          remaining: prev.total - prev.paid - prev.discount + tax
                        }))
                      }}
                      className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>

                {/* Supplier Account (hidden when invoice loaded for edit) */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">حفظ الفاتورة لحساب مورد</label>
                  {selectedSupplier && !hideSelectedSupplierDisplay ? (
                    <div className="px-2 sm:px-3 py-2 bg-blue-50 border border-blue-300 rounded-lg text-sm font-medium text-blue-900">
                      {selectedSupplier.name} - الرصيد: {formatCurrency(parseFloat(selectedSupplier.balance))}
                    </div>
                  ) : (
                    <div className="relative checkout-supplier-search-container">
                      <input
                        type="text"
                        value={checkoutSupplierSearch}
                        onChange={(e) => {
                          setCheckoutSupplierSearch(e.target.value)
                          setShowCheckoutSupplierDropdown(true)
                        }}
                        onFocus={() => setShowCheckoutSupplierDropdown(true)}
                        className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="ابحث عن مورد..."
                      />
                      {checkoutSupplierSearch.trim() !== '' && filteredCheckoutSuppliers.length > 0 && showCheckoutSupplierDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-40 overflow-y-auto">
                          {filteredCheckoutSuppliers.map(supplier => (
                            <button
                              key={supplier.id}
                              onClick={() => handleCheckoutSupplierSelect(supplier)}
                              className="w-full text-right px-3 py-2 hover:bg-gray-100 border-b last:border-b-0 text-sm"
                            >
                              <div className="font-medium">{supplier.name}</div>
                              <div className="text-xs text-gray-500">الرصيد: {formatCurrency(parseFloat(supplier.balance))}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>


                {/* Note */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">ملاحظة</label>
                  <textarea
                    value={checkoutForm.note}
                    onChange={(e) => setCheckoutForm(prev => ({ ...prev, note: e.target.value }))}
                    className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    rows={2}
                    placeholder="أدخل ملاحظة..."
                  />
                </div>
              </div>
              
              {/* Buttons */}
              <div className="flex gap-2 sm:gap-3 p-3 sm:p-4 border-t bg-gray-50 flex-shrink-0">
                <button
                  onClick={() => setShowCheckoutModal(false)}
                  className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm sm:text-base"
                >
                  رجوع
                </button>
                <button
                  onClick={handleCheckoutSubmit}
                  className="flex-1 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                >
                  حفظ الفاتورة
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
            <div className="bg-white w-full max-w-md mx-4 rounded-lg overflow-hidden">
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                {invoiceNumber === 'طلب شراء' ? (
                  <>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">طلب شراء</h3>
                    <p className="text-sm text-gray-600 mb-4">تم إنشاء طلب الشراء بنجاح</p>
                    <div className="flex gap-3">
                      <button
                        onClick={handlePrintPDF}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        طباعة
                      </button>
                      <button
                        onClick={handleFinish}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                      >
                        انهاء
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">تم حفظ الفاتورة</h3>
                    <p className="text-sm text-gray-600 mb-4">رقم الفاتورة: {invoiceNumber}</p>
                    <div className="flex gap-3">
                      <button
                        onClick={handlePrintPDF}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        طباعة
                      </button>
                      {successModalSupplier && successModalSupplier.phone && (
                        <button
                          onClick={handleSendToWhatsApp}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                          </svg>
                          واتساب
                        </button>
                      )}
                      <button
                        onClick={handleFinish}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                      >
                        انهاء
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Reprint Invoice Modal */}
        {showReprintModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
            <div className="bg-white w-full max-w-md mx-4 rounded-lg overflow-hidden">
              <div className="p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">اعادة طباعة الفاتورة</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">رقم الفاتورة</label>
                    <input
                      type="text"
                      value={invoiceSearchNumber}
                      onChange={(e) => setInvoiceSearchNumber(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="أدخل رقم الفاتورة..."
                    />
                  </div>

                  {searchedInvoice && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">تفاصيل الفاتورة</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>رقم الفاتورة: {searchedInvoice.invoiceNumber}</p>
                        <p>المورد: {searchedInvoice.supplier?.name || 'غير محدد'}</p>
                        <p>المجموع: {formatCurrency(parseFloat(searchedInvoice.totalAmount))}</p>
                        <p>التاريخ: {new Date(searchedInvoice.createdAt).toLocaleDateString('ar-EG')}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowReprintModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                  >
                    رجوع
                  </button>
                  <button
                    onClick={handleSearchInvoice}
                    disabled={!invoiceSearchNumber.trim() || loadingInvoice}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    {loadingInvoice ? 'جاري البحث...' : 'بحث'}
                  </button>
                  {searchedInvoice && (
                    <button
                      onClick={handleReprintSearchedInvoice}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      طباعة
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Invoice Modal */}
        {showEditInvoiceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
            <div className="bg-white w-full max-w-md mx-4 rounded-lg overflow-hidden">
              <div className="p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">تعديل فاتورة مشتريات</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">رقم الفاتورة</label>
                    <input
                      type="text"
                      value={invoiceSearchNumber}
                      onChange={(e) => setInvoiceSearchNumber(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="أدخل رقم الفاتورة..."
                    />
                  </div>

                  {searchedInvoice && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">تفاصيل الفاتورة</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>رقم الفاتورة: {searchedInvoice.invoiceNumber}</p>
                        <p>المورد: {searchedInvoice.supplier?.name || 'غير محدد'}</p>
                        <p>المجموع: {formatCurrency(parseFloat(searchedInvoice.totalAmount))}</p>
                        <p>التاريخ: {new Date(searchedInvoice.createdAt).toLocaleDateString('ar-EG')}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowEditInvoiceModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                  >
                    رجوع
                  </button>
                  <button
                    onClick={handleSearchInvoice}
                    disabled={!invoiceSearchNumber.trim() || loadingInvoice}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    {loadingInvoice ? 'جاري البحث...' : 'بحث'}
                  </button>
                  {searchedInvoice && (
                    <button
                      onClick={handleEditSearchedInvoice}
                      className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                    >
                      تعديل
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Leave Popup */}
        <ConfirmNavigationPopup
          isVisible={showConfirmLeave}
          title="تأكيد الرجوع"
          message="هل تريد الرجوع وترك صفحة المشتريات؟ قد تفقد التغييرات غير المحفوظة."
          confirmLabel="نعم، رجوع"
          cancelLabel="لا"
          onConfirm={() => {
            allowNavigationRef.current = true
            setShowConfirmLeave(false)
            window.location.assign('/')
          }}
          onCancel={() => setShowConfirmLeave(false)}
        />

        {/* Notification */}
        {notification && (
          <FlashNotification
            type={notification.type}
            message={notification.message}
            isVisible={!!notification}
            onClose={() => setNotification(null)}
          />
        )}
      </div>
    </MainLayout>
  )
}