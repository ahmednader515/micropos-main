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
  stock: number
  barcode: string | null
  sku: string | null
  category?: {
    id: string
    name: string
  } | null
  color?: string | null
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

export default function SalesPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [barcodeValue, setBarcodeValue] = useState('')
  const [customerSearchValue, setCustomerSearchValue] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [showCustomerSearch, setShowCustomerSearch] = useState(false)
  const [productSearchValue, setProductSearchValue] = useState('')
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const [modalProductSearch, setModalProductSearch] = useState('')
  const [screenNumber, setScreenNumber] = useState(1)
  const [showScreenModal, setShowScreenModal] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [showInlineProductSelection, setShowInlineProductSelection] = useState(false)
  const [showCategoryView, setShowCategoryView] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  const [showProductDetails, setShowProductDetails] = useState(false)
  const [selectedProductForDetails, setSelectedProductForDetails] = useState<SaleItem | null>(null)
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [invoiceNumber, setInvoiceNumber] = useState<string>('')
  const [checkoutCustomerSearch, setCheckoutCustomerSearch] = useState('')
  const [showCheckoutCustomerDropdown, setShowCheckoutCustomerDropdown] = useState(false)
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
    sellingPrice: 0,
    quantity: 1,
    discountAmount: 0,
    discountPercentage: 0,
    invoiceNote: '',
    removeFromList: false
  })
  const [selectedPriceType, setSelectedPriceType] = useState<'price1' | 'price2' | 'price3'>('price1')
  const [selectedMenuPrice, setSelectedMenuPrice] = useState<number | null>(null)
  const [isPriceFixed, setIsPriceFixed] = useState(false)
  const [checkoutForm, setCheckoutForm] = useState({
    paymentMethod: 'نقدا',
    total: 0,
    paid: 0,
    discount: 0,
    remaining: 0,
    customerAccount: '',
    previousBalance: 0,
    note: '',
    tax: 0
  })
  const [saleItems, setSaleItems] = useState<{[screen: number]: SaleItem[]}>({
    1: [],
    2: [],
    3: [],
    4: []
  })
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info'
    message: string
  } | null>(null)
  const [hideSelectedCustomerDisplay, setHideSelectedCustomerDisplay] = useState(false)

  // Intercept browser/mobile back
  const [showConfirmLeave, setShowConfirmLeave] = useState(false)
  const allowNavigationRef = useRef(false)

  useEffect(() => {
    // Push a dummy state so back triggers popstate here first
    try {
      window.history.pushState({ preventExit: true }, '')
    } catch {}

    const handlePopState = (e: PopStateEvent) => {
      if (allowNavigationRef.current) {
        return
      }
      // Immediately push back to keep user on page and show confirm
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
          !target.closest('.customer-search-container') &&
          !target.closest('.checkout-customer-search-container')) {
        setShowProductDropdown(false)
        setShowCustomerDropdown(false)
        setShowCheckoutCustomerDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Handle edit parameter from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const editInvoiceId = urlParams.get('edit')
    
    if (editInvoiceId) {
      loadInvoiceForEdit(editInvoiceId)
    }
  }, [])

  const loadInvoiceForEdit = async (invoiceNumber: string) => {
    try {
      console.log('Loading invoice for edit:', invoiceNumber)
      const response = await fetch(`/api/sales?invoiceNumber=${invoiceNumber}`)
      console.log('API response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('API response data:', data)
        const invoices = Array.isArray(data) ? data : (data.sales || [])
        console.log('Invoices found:', invoices.length)
        
        if (invoices.length > 0) {
          const invoice = invoices[0]
          console.log('Selected invoice:', invoice)
          
          // Set the selected customer
          if (invoice.customer) {
            try {
              const customerResponse = await fetch(`/api/customers/${invoice.customer.id}`)
              if (customerResponse.ok) {
                const customerData = await customerResponse.json()
                setSelectedCustomer({
                  id: invoice.customer.id,
                  name: invoice.customer.name,
                  balance: customerData.balance || '0'
                })
              } else {
                setSelectedCustomer({
                  id: invoice.customer.id,
                  name: invoice.customer.name,
                  balance: '0'
                })
              }
            } catch (error) {
              console.error('Error fetching customer balance:', error)
              setSelectedCustomer({
                id: invoice.customer.id,
                name: invoice.customer.name,
                balance: '0'
              })
            }
            setCustomerSearchValue(invoice.customer.name)
            setHideSelectedCustomerDisplay(true)
          } else {
            setSelectedCustomer(null)
            setCustomerSearchValue('')
            setHideSelectedCustomerDisplay(false)
          }

          // Convert sale items to the format expected by the sales screen
          if (invoice.items && Array.isArray(invoice.items)) {
            const convertedItems: SaleItem[] = invoice.items.map((item: any) => ({
              productId: item.productId,
              name: item.product.name,
              price: Number(item.price),
              quantity: item.quantity,
              discount: item.discount || 0,
              total: Number(item.total)
            }))

            // Load the products into the current screen
            setSaleItems(prev => ({
              ...prev,
              [screenNumber]: convertedItems
            }))

            showNotification('success', 'تم تحميل الفاتورة للتعديل')
          } else {
            showNotification('error', 'لا توجد منتجات في هذه الفاتورة')
          }
        } else {
          console.log('No invoices found for invoice number:', invoiceNumber)
          showNotification('error', 'لم يتم العثور على الفاتورة')
        }
      } else {
        const errorText = await response.text()
        console.error('API error response:', response.status, errorText)
        showNotification('error', `خطأ في تحميل الفاتورة: ${response.status}`)
      }
    } catch (error) {
      console.error('Error loading invoice for edit:', error)
      showNotification('error', 'خطأ في تحميل الفاتورة')
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        fetchProducts(),
        fetchCustomers()
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

  const fetchCustomers = async () => {
    const response = await fetch('/api/customers')
    if (response.ok) {
      const data = await response.json()
      setCustomers(data.customers || [])
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
    const categories = Array.from(categoryMap.values())
    console.log('Categories found:', categories)
    return categories
  }

  // Filter products by category
  const getFilteredProducts = () => {
    let filtered = products

    // Filter by category if selected
    if (selectedCategory) {
      filtered = filtered.filter(product => product.category?.id === selectedCategory)
    }

    return filtered
  }

  const handleBarcodeDetected = (barcode: string) => {
    setBarcodeValue(barcode)
    setProductSearchValue(barcode)
    // Find product by barcode and add to sale
    const product = products.find(p => p.barcode === barcode)
    if (product) {
      addProductToSale(product)
      } else {
      showNotification('error', 'المنتج غير موجود')
    }
  }

  const addProductToSale = (product: Product) => {
    const currentScreenItems = saleItems[screenNumber] || []
    const existingItem = currentScreenItems.find(item => item.productId === product.id)
    
    // Determine which price to use
    let selectedPrice = product.price
    if (isPriceFixed && selectedMenuPrice) {
      if (selectedMenuPrice === 2) {
        selectedPrice = product.price2 || product.price
      } else if (selectedMenuPrice === 3) {
        selectedPrice = product.price3 || product.price
      }
    }
    
    if (existingItem) {
      setSaleItems(prev => ({
        ...prev,
        [screenNumber]: prev[screenNumber].map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * selectedPrice }
            : item
        )
      }))
    } else {
      const newItem: SaleItem = {
        productId: product.id,
        name: product.name,
        price: selectedPrice,
        quantity: 1,
        discount: 0,
        total: selectedPrice
      }
      setSaleItems(prev => ({
        ...prev,
        [screenNumber]: [...(prev[screenNumber] || []), newItem]
      }))
    }
    
    // Play sound when product is added
    playAddProductSound()
  }

  const removeProductFromSale = (productId: string) => {
    setSaleItems(prev => ({
      ...prev,
      [screenNumber]: prev[screenNumber].filter(item => item.productId !== productId)
    }))
  }

  const calculateTotal = () => {
    const currentScreenItems = saleItems[screenNumber] || []
    return currentScreenItems.reduce((sum, item) => sum + getDisplayTotal(item), 0)
  }

  const calculateTotalQuantity = () => {
    const currentScreenItems = saleItems[screenNumber] || []
    return currentScreenItems.reduce((sum, item) => sum + item.quantity, 0)
  }

  const handleProductClick = (item: SaleItem) => {
    setSelectedProductForDetails(item)
    
    // Use fixed price if available, otherwise default to price1
    const priceType = isPriceFixed && selectedMenuPrice ? `price${selectedMenuPrice}` as 'price1' | 'price2' | 'price3' : 'price1'
    setSelectedPriceType(priceType)
    
    // Get the correct price based on the current display price
    const correctPrice = getDisplayPrice(item)
    
    setProductDetailsForm({
      sellingPrice: correctPrice,
      quantity: item.quantity,
      discountAmount: item.discount,
      discountPercentage: correctPrice > 0 ? (item.discount / correctPrice) * 100 : 0,
      invoiceNote: '',
      removeFromList: false
    })
    setShowProductDetails(true)
  }

  const handleProductDetailsSubmit = () => {
    if (!selectedProductForDetails) return

    if (productDetailsForm.removeFromList) {
      removeProductFromSale(selectedProductForDetails.productId)
    } else {
      const newTotal = (productDetailsForm.sellingPrice * productDetailsForm.quantity) - productDetailsForm.discountAmount
      setSaleItems(prev => ({
      ...prev,
        [screenNumber]: prev[screenNumber].map(item =>
          item.productId === selectedProductForDetails.productId
            ? {
                ...item,
                price: productDetailsForm.sellingPrice,
                quantity: productDetailsForm.quantity,
                discount: productDetailsForm.discountAmount,
                total: newTotal
              }
          : item
      )
    }))
  }

    setShowProductDetails(false)
    setSelectedProductForDetails(null)
  }
    
  const handleDiscountAmountChange = (amount: number) => {
    setProductDetailsForm(prev => ({
      ...prev,
      discountAmount: amount,
      discountPercentage: prev.sellingPrice > 0 ? (amount / prev.sellingPrice) * 100 : 0
    }))
  }

  const handleDiscountPercentageChange = (percentage: number) => {
    setProductDetailsForm(prev => ({
      ...prev,
      discountPercentage: percentage,
      discountAmount: (prev.sellingPrice * prev.quantity * percentage) / 100
    }))
  }

  const handlePriceTypeSelect = (priceType: 'price1' | 'price2' | 'price3') => {
    setSelectedPriceType(priceType)
    if (selectedProductForDetails) {
      const product = products.find(p => p.id === selectedProductForDetails.productId)
      if (product) {
        let newPrice = product.price
        if (priceType === 'price2') {
          newPrice = product.price2 || product.price
        } else if (priceType === 'price3') {
          newPrice = product.price3 || product.price
        }
        setProductDetailsForm(prev => ({
          ...prev,
          sellingPrice: newPrice
        }))
      }
    }
  }

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer)
    setCustomerSearchValue(customer.name)
    setShowCustomerDropdown(false)
    setShowCustomerSearch(false)
    setHideSelectedCustomerDisplay(false)
  }

  const handleCustomerClear = () => {
    setSelectedCustomer(null)
    setCustomerSearchValue('')
    setShowCustomerSearch(false)
    setHideSelectedCustomerDisplay(false)
  }

  const handleCheckoutClick = () => {
    const currentScreenItems = saleItems[screenNumber] || []
    if (currentScreenItems.length === 0) {
      showNotification('error', 'يرجى إضافة منتجات إلى القائمة أولاً')
      return
    }
    
    const total = calculateTotal()
    setCheckoutForm(prev => ({
      ...prev,
      total: total,
      remaining: total - prev.paid - prev.discount + prev.tax,
      customerAccount: selectedCustomer?.name || '',
      previousBalance: selectedCustomer ? parseFloat(selectedCustomer.balance) : 0
    }))
    setCheckoutCustomerSearch('')
    setShowCheckoutCustomerDropdown(false)
    setShowCheckoutModal(true)
  }

  const handleCheckoutSubmit = async () => {
    try {
      const currentScreenItems = saleItems[screenNumber] || []
      
      // Check if this is a price display (fake sale)
      if (checkoutForm.paymentMethod === 'عرض سعر') {
        // For price display, just show the success modal without saving to database
        setInvoiceNumber('عرض سعر')
        setShowCheckoutModal(false)
        setShowSuccessModal(true)
        // Don't clear the sale items for price display
        showNotification('success', 'تم عرض السعر بنجاح')
        return
      }
      
      // Prepare sale items for database
      const saleItemsForDB = currentScreenItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        discount: item.discount || 0,
        total: item.price * item.quantity - (item.discount || 0)
      }))

      // Find customer ID if customer is selected
      let customerId = null
      if (selectedCustomer) {
        customerId = selectedCustomer.id
      } else if (checkoutForm.customerAccount.trim() !== '') {
        // Try to find customer by name
        const customer = customers.find(c => 
          c.name.toLowerCase() === checkoutForm.customerAccount.toLowerCase()
        )
        if (customer) {
          customerId = customer.id
        }
      }

      // Prepare sale data (invoice number will be generated by API)
      const saleData = {
        customerId,
        totalAmount: checkoutForm.total,
        paidAmount: checkoutForm.paid,
        discount: checkoutForm.discount,
        tax: checkoutForm.tax,
        paymentMethod: checkoutForm.paymentMethod,
        notes: checkoutForm.note,
        items: saleItemsForDB
      }

      // Save to database
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saleData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'فشل في حفظ الفاتورة')
      }

      const result = await response.json()
      
      // Update local state with the generated invoice number
      setInvoiceNumber(result.sale.invoiceNumber)
      setShowCheckoutModal(false)
      setShowSuccessModal(true)
      setSaleItems(prev => ({ ...prev, [screenNumber]: [] }))
      
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

      // Handle price display mode
      if (invoiceNumber === 'عرض سعر') {
        // For price display, create a temporary PDF with current sale items
        const currentScreenItems = saleItems[screenNumber] || []
        
        // Prepare temporary sale data for PDF generation
        const tempSaleData = {
          invoiceNumber: 'عرض سعر',
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
          isPriceDisplay: true
        }

        // Generate PDF for price display
        const pdfResponse = await fetch('/api/pdf/invoice', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(tempSaleData)
        })

        if (!pdfResponse.ok) {
          throw new Error('فشل في توليد عرض السعر')
        }

        // Create blob and download
        const blob = await pdfResponse.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `price_display_${new Date().toISOString().split('T')[0]}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        showNotification('success', 'تم تحميل عرض السعر بنجاح')
        return
      }

      // Regular invoice handling
      // First, we need to get the sale ID from the invoice number
      const response = await fetch(`/api/sales?invoiceNumber=${invoiceNumber}`)
      if (!response.ok) {
        throw new Error('فشل في العثور على الفاتورة')
      }

      const data = await response.json()
      if (!data.sales || data.sales.length === 0) {
        throw new Error('الفاتورة غير موجودة')
      }

      const sale = data.sales[0]
      
      // Generate and download PDF
      const pdfResponse = await fetch(`/api/pdf/invoice?id=${sale.id}`)
      if (!pdfResponse.ok) {
        throw new Error('فشل في توليد الفاتورة')
      }

      // Create blob and download
      const blob = await pdfResponse.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `invoice_${invoiceNumber}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      showNotification('success', 'تم تحميل الفاتورة بنجاح')
    } catch (error) {
      console.error('Error generating PDF:', error)
      showNotification('error', error instanceof Error ? error.message : 'حدث خطأ أثناء توليد الفاتورة')
    }
  }

  const handleFinish = () => {
    setShowSuccessModal(false)
    setInvoiceNumber('')
  }

  const handleCheckoutCustomerSelect = (customer: Customer) => {
    setCheckoutForm(prev => ({
      ...prev,
      customerAccount: customer.name,
      previousBalance: parseFloat(customer.balance)
    }))
    setCheckoutCustomerSearch(customer.name)
    setShowCheckoutCustomerDropdown(false)
  }

  const filteredCheckoutCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(checkoutCustomerSearch.toLowerCase())
  )

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearchValue.toLowerCase())
  )

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearchValue.toLowerCase()) ||
    (product.barcode && product.barcode.includes(productSearchValue)) ||
    (product.sku && product.sku.toLowerCase().includes(productSearchValue.toLowerCase()))
  )


  const handleProductSelect = (product: Product) => {
    addProductToSale(product)
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


  const handleCustomerBalanceInquiry = () => {
    if (selectedCustomer) {
      showNotification('info', `رصيد العميل ${selectedCustomer.name}: ${formatCurrency(parseFloat(selectedCustomer.balance))}`)
    } else {
      showNotification('error', 'يرجى اختيار عميل أولاً')
    }
  }

  const handleToggleBarcodeReader = () => {
    setShowBarcodeScanner(true)
  }

  const handleAddNewProduct = () => {
    window.open('/inventory/new-product', '_blank')
  }

  const handleViewInvoices = () => {
    window.location.href = '/reports'
  }

  const handleClearProducts = () => {
    setSaleItems(prev => ({ ...prev, [screenNumber]: [] }))
    showNotification('success', 'تم مسح المنتجات من القائمة')
  }

  // Invoice search and handling functions
  const searchInvoice = async () => {
    if (!invoiceSearchNumber.trim()) {
      showNotification('error', 'يرجى إدخال رقم الفاتورة')
      return
    }

    setLoadingInvoice(true)
    try {
      // Remove # prefix if present, since database stores numbers without prefix
      const cleanInvoiceNumber = invoiceSearchNumber.replace(/^#/, '')
      const response = await fetch(`/api/sales?invoiceNumber=${cleanInvoiceNumber}`)
      if (response.ok) {
        const data = await response.json()
        // Handle both array format and object with sales property
        const invoices = Array.isArray(data) ? data : (data.sales || [])
        if (invoices.length > 0) {
          setSearchedInvoice(invoices[0])
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
      const pdfResponse = await fetch(`/api/pdf/invoice?id=${searchedInvoice.id}`)
      if (!pdfResponse.ok) {
        throw new Error('Failed to generate PDF')
      }
      
      const blob = await pdfResponse.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${searchedInvoice.invoiceNumber}.pdf`
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
      // Set the selected customer
      if (searchedInvoice.customer) {
        // Fetch the customer's current balance
        try {
          const customerResponse = await fetch(`/api/customers/${searchedInvoice.customer.id}`)
          if (customerResponse.ok) {
            const customerData = await customerResponse.json()
            setSelectedCustomer({
              id: searchedInvoice.customer.id,
              name: searchedInvoice.customer.name,
              balance: customerData.balance || '0'
            })
          } else {
            setSelectedCustomer({
              id: searchedInvoice.customer.id,
              name: searchedInvoice.customer.name,
              balance: '0'
            })
          }
        } catch (error) {
          console.error('Error fetching customer balance:', error)
          setSelectedCustomer({
            id: searchedInvoice.customer.id,
            name: searchedInvoice.customer.name,
            balance: '0'
          })
        }
        setCustomerSearchValue(searchedInvoice.customer.name)
      } else {
        setSelectedCustomer(null)
        setCustomerSearchValue('')
      }

      // Convert sale items to the format expected by the sales screen
      console.log('Searched invoice:', searchedInvoice)
      console.log('Sale items:', searchedInvoice.items)
      
      if (!searchedInvoice.items || !Array.isArray(searchedInvoice.items)) {
        showNotification('error', 'لا توجد منتجات في هذه الفاتورة')
        return
      }

      const convertedItems: SaleItem[] = searchedInvoice.items.map((item: any) => ({
        productId: item.productId,
        name: item.product.name,
        price: Number(item.price),
        quantity: item.quantity,
        discount: item.discount || 0,
        total: Number(item.total)
      }))

      // Load the products into the current screen
      setSaleItems(prev => ({
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
    { label: 'اعادة طباعة الفاتورة', onClick: handleReprintInvoice },
    { label: 'تعديل فاتورة البيع', onClick: handleEditInvoice },
    { label: 'تثبيت سعر البيع 1', onClick: () => { setSelectedMenuPrice(1); setIsPriceFixed(true) } },
    { label: 'تثبيت سعر البيع 2', onClick: () => { setSelectedMenuPrice(2); setIsPriceFixed(true) } },
    { label: 'تثبيت سعر البيع 3', onClick: () => { setSelectedMenuPrice(3); setIsPriceFixed(true) } },
    { label: 'الحاسبة', onClick: handleCalculator },
    { label: 'الاستعلام عن الباقي عند العميل', onClick: handleCustomerBalanceInquiry },
    { label: 'قارئ الباركود متضمن / خارج الشاشة', onClick: handleToggleBarcodeReader },
    { label: 'اضافة منتج جديد', onClick: handleAddNewProduct },
    { label: 'عرض الفواتير', onClick: handleViewInvoices },
    { label: 'مسح المنتجات من القائمة', onClick: handleClearProducts }
  ]

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('ar-EG', {
      style: 'currency',
      currency: 'EGP'
    })
  }

  const formatPriceInArabic = (amount: number) => {
    // Convert to Arabic numerals
    const arabicNumerals = amount.toLocaleString('ar-EG')
    return `${arabicNumerals} ج.م`
  }

  const getDisplayPrice = (item: SaleItem) => {
    if (!isPriceFixed || !selectedMenuPrice) {
      return item.price
    }
    
    const product = products.find(p => p.id === item.productId)
    if (!product) return item.price
    
    if (selectedMenuPrice === 2) {
      return product.price2 || product.price
    } else if (selectedMenuPrice === 3) {
      return product.price3 || product.price
    }
    
    return product.price
  }

  const getDisplayTotal = (item: SaleItem) => {
    const displayPrice = getDisplayPrice(item)
    return displayPrice * item.quantity - item.discount
  }

  if (loading) {
    return (
      <MainLayout
        navbarTitle="المبيعات"
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
      navbarTitle={isPriceFixed ? `المبيعات - سعر البيع ${selectedMenuPrice}` : "المبيعات"}
      onBack={() => setShowConfirmLeave(true)}
      menuOptions={menuOptions}
    >
      <div className="h-full flex flex-col -m-4 lg:-m-6" dir="rtl">
        {/* Top Row with Search Bar in Middle and Buttons on Sides */}
        <div className="flex items-center gap-1 p-2 sm:p-4 bg-white border-b flex-shrink-0" dir="rtl">
          {/* Left Side - Barcode Button and Customer Search Button */}
          <div className="flex items-center gap-1">
            {/* Barcode Button (separate from search) */}
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

            {/* Customer Search Button */}
            <div className="relative">
          <button
                onClick={() => setShowCustomerSearch(!showCustomerSearch)}
                className={`p-1.5 transition-colors rounded ${
                  selectedCustomer 
                    ? 'text-blue-600 bg-blue-100 hover:bg-blue-200' 
                    : 'text-gray-500 hover:text-blue-600 bg-gray-100 hover:bg-gray-200'
                }`}
                title={selectedCustomer ? `عميل مختار: ${selectedCustomer.name}` : "البحث عن العميل"}
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
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
          </button>
              {selectedCustomer && (
                <button
                  onClick={handleCustomerClear}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                  title="إلغاء اختيار العميل"
                >
                  ×
                </button>
              )}
            </div>
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
                      السعر: {formatCurrency(product.price)} | {formatCurrency(product.price2)} | {formatCurrency(product.price3)} | المخزون: {product.stock}
                    </div>
                  </button>
                ))}
            </div>
            )}
            </div>

          {/* Right Side - Screen Switcher and Calculator */}
          <div className="flex items-center gap-1">
            {/* Screen Switcher */}
            <button
              onClick={() => setShowScreenModal(true)}
              className="p-1 text-gray-500 hover:text-blue-600 transition-colors bg-gray-100 hover:bg-gray-200 rounded"
              title={`الشاشة ${screenNumber} - ${(saleItems[screenNumber] || []).length} منتج`}
            >
              <div className="grid grid-cols-2 gap-0.5">
                {[1, 2, 3, 4].map((screen) => (
                  <div
                    key={screen}
                    className={`w-2.5 h-2.5 flex items-center justify-center text-xs font-medium border transition-colors ${
                      screenNumber === screen
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    {screen}
            </div>
                ))}
            </div>
            </button>

            {/* Calculator Button */}
            <button
              onClick={handleCheckoutClick}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 px-2 rounded transition-colors text-xs whitespace-nowrap"
            >
              حاسب
            </button>
            </div>

        </div>

        {/* Customer Search Bar - Full width above table */}
        {showCustomerSearch && (
          <div className="w-full bg-white border-b border-gray-200 p-4 customer-search-container" dir="rtl">
            <div className="relative">
              <input
                type="text"
                value={customerSearchValue}
                onChange={(e) => setCustomerSearchValue(e.target.value)}
                placeholder="ابحث عن عميل..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                autoFocus
              />
              {customerSearchValue.trim() !== '' && filteredCustomers.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-40 overflow-y-auto">
                  {filteredCustomers.map(customer => (
                    <button
                      key={customer.id}
                      onClick={() => handleCustomerSelect(customer)}
                      className="w-full text-right px-4 py-2 hover:bg-gray-100 border-b last:border-b-0"
                    >
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-sm text-gray-500">الرصيد: {formatCurrency(parseFloat(customer.balance))}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Selected Customer Display (hidden when invoice loaded for edit) */}
        {selectedCustomer && !showCustomerSearch && !hideSelectedCustomerDisplay && (
          <div className="w-full bg-blue-50 border-b border-blue-200 p-3" dir="rtl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  {selectedCustomer.name.charAt(0)}
            </div>
            <div>
                  <div className="font-medium text-blue-900">{selectedCustomer.name}</div>
                  <div className="text-sm text-blue-700">الرصيد: {formatCurrency(parseFloat(selectedCustomer.balance))}</div>
                </div>
              </div>
              <button
                onClick={handleCustomerClear}
                className="text-blue-600 hover:text-blue-800 p-1"
                title="إلغاء اختيار العميل"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Products Table */}
        <div className="flex-1 overflow-auto min-h-0 bg-gray-50 pb-20">
          <div className="h-full">
            <table className="w-full text-sm" dir="rtl">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 text-right font-medium text-gray-500 text-xs sm:text-sm">المنتج</th>
                  <th className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 text-right font-medium text-gray-500 text-xs sm:text-sm">السعر</th>
                  <th className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 text-right font-medium text-gray-500 text-xs sm:text-sm">الكمية</th>
                  <th className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 text-right font-medium text-gray-500 text-xs sm:text-sm">الاجمالي</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(saleItems[screenNumber] || []).map((item) => (
                  <tr key={item.productId} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleProductClick(item)}>
                    <td className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4 text-gray-900 font-medium">
                      <div className="truncate max-w-xs text-xs sm:text-sm">{item.name}</div>
                    </td>
                    <td className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4 text-gray-900 font-medium">
                      <div className="text-xs sm:text-sm lg:text-base">{formatCurrency(getDisplayPrice(item))}</div>
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

        {/* Inline Product Selection */}
        {showInlineProductSelection && (
          <div className="fixed inset-0 flex items-center justify-center z-40 pt-24 pb-0" dir="rtl">
            <div className="w-full max-w-4xl mx-4 h-[40vh] overflow-hidden flex flex-col">
              {/* Products Grid */}
              <div className="flex-1 p-3 overflow-y-auto min-h-0 max-h-[50vh] flex items-center justify-center">
                <div className="grid grid-cols-4 gap-2 pb-2 w-full">
                  {getFilteredProducts().map(product => (
                    <button
                      key={product.id}
                      onClick={() => {
                        addProductToSale(product)
                        setShowInlineProductSelection(false)
                        setSelectedCategory(null)
                        setShowCategoryView(false)
                      }}
                      className={`p-2 rounded-lg text-center transition-all duration-200 shadow-sm hover:shadow-md ${
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
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories Section */}
              {showCategoryView && (
                <div className="flex-shrink-0 p-3 mt-1">
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`p-2 rounded-lg text-center transition-all duration-200 ${
                        selectedCategory === null
                          ? 'bg-green-100 border-2 border-green-300 text-green-800 shadow-sm'
                          : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 hover:shadow-sm'
                      }`}
                    >
                      <div className="text-sm font-medium">الكل</div>
                    </button>
                    {getCategories().map(category => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`p-2 rounded-lg text-center transition-all duration-200 ${
                          selectedCategory === category.id
                            ? 'bg-green-100 border-2 border-green-300 text-green-800 shadow-sm'
                            : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 hover:shadow-sm'
                        }`}
                      >
                        <div className="text-sm font-medium">{category.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons - Fixed above bottom bar */}
        <div className="flex-shrink-0 fixed bottom-16 left-0 right-0 bg-gray-50 p-2 sm:p-4 z-50">
          <div className="flex items-center justify-between">
            {/* Add Products Button */}
            <button
              onClick={() => setShowInlineProductSelection(!showInlineProductSelection)}
              className="p-2 text-gray-700 hover:text-gray-900 transition-colors bg-white hover:bg-gray-100 rounded-lg border border-gray-300"
              title="إضافة منتجات"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
            </button>
            
            {/* Categories Button - Only show when add button is clicked */}
            {showInlineProductSelection && (
              <button
                onClick={() => setShowCategoryView(!showCategoryView)}
                className={`p-2 text-gray-700 hover:text-gray-900 transition-colors bg-white hover:bg-gray-100 rounded-lg border border-gray-300 ${
                  showCategoryView ? 'bg-gray-100' : ''
                }`}
                title="الفئات"
              >
                <div className="w-5 h-5 border border-gray-400 rounded flex items-center justify-center">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </div>
              </button>
            )}
          </div>
        </div>

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

        {/* Screen Selection Modal */}
        {showScreenModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
            <div className="bg-white w-full max-w-sm mx-4 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">اختيار الشاشة</h3>
                <button
                  onClick={() => setShowScreenModal(false)}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((screen) => (
                    <button
                      key={screen}
                      onClick={() => {
                        setScreenNumber(screen)
                        setShowScreenModal(false)
                      }}
                      className={`w-20 h-20 flex flex-col items-center justify-center text-lg font-medium border transition-colors ${
                        screenNumber === screen
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-xl font-bold">{screen}</div>
                      <div className="text-xs mt-1">
                        {(saleItems[screen] || []).length} منتج
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-4 text-center text-sm text-gray-500">
                  الشاشة المختارة: {screenNumber} - {(saleItems[screenNumber] || []).length} منتج
                </div>
                
                {/* Clear All Screens Button */}
                <div className="mt-4 pt-4 border-t">
                  <button
                    onClick={() => {
                      setSaleItems({
                        1: [],
                        2: [],
                        3: [],
                        4: []
                      })
                      setShowScreenModal(false)
                    }}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    مسح جميع المنتجات من كل الشاشات
                  </button>
                </div>
              </div>
            </div>
                </div>
        )}

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
              

              {/* Main Content */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Products Grid */}
                <div className="flex-1 p-4 overflow-y-auto">
                  <div className="grid grid-cols-3 gap-3">
                    {getFilteredProducts().map(product => (
                      <button
                        key={product.id}
                        onClick={() => {
                          addProductToSale(product)
                          setShowProductModal(false)
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
                      </button>
                    ))}
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
                    <div className="p-4 pt-0">
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => setSelectedCategory(null)}
                          className={`p-3 rounded-lg text-center transition-all duration-200 ${
                            selectedCategory === null
                              ? 'bg-green-100 border-2 border-green-300 text-green-800 shadow-sm'
                              : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 hover:shadow-sm'
                          }`}
                        >
                          <div className="text-sm font-medium">الكل</div>
                        </button>
                        {getCategories().map(category => (
                          <button
                            key={category.id}
                            onClick={() => setSelectedCategory(category.id)}
                            className={`p-3 rounded-lg text-center transition-all duration-200 ${
                              selectedCategory === category.id
                                ? 'bg-green-100 border-2 border-green-300 text-green-800 shadow-sm'
                                : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 hover:shadow-sm'
                            }`}
                          >
                            <div className="text-sm font-medium truncate">{category.name}</div>
                          </button>
                        ))}
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
            <div className="bg-white w-full max-w-md mx-0 sm:mx-4 rounded-t-lg sm:rounded-lg overflow-hidden max-h-[90vh] sm:max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between p-3 sm:p-4 border-b flex-shrink-0">
                <h3 className="text-base sm:text-lg font-semibold">تفاصيل المنتج</h3>
                <button
                  onClick={() => setShowProductDetails(false)}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                        </div>
              
              <div className="p-3 sm:p-6 space-y-3 sm:space-y-4 overflow-y-auto flex-1">
                {/* Product Name */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">اسم المنتج</label>
                  <div className="text-sm sm:text-lg font-semibold text-gray-900 truncate">{selectedProductForDetails.name}</div>
                      </div>

                {/* Selling Price Selection */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">اختيار سعر البيع</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handlePriceTypeSelect('price1')}
                      className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-lg border transition-colors ${
                        selectedPriceType === 'price1'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      السعر 1
                    </button>
                    <button
                      onClick={() => handlePriceTypeSelect('price2')}
                      className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-lg border transition-colors ${
                        selectedPriceType === 'price2'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      السعر 2
                    </button>
                    <button
                      onClick={() => handlePriceTypeSelect('price3')}
                      className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-lg border transition-colors ${
                        selectedPriceType === 'price3'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      السعر 3
                    </button>
                  </div>
                  <div className="mt-2 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium text-center">
                    {formatPriceInArabic(productDetailsForm.sellingPrice)}
                  </div>
                </div>

                {/* Quantity and Total */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">الكمية</label>
                        <input
                          type="number"
                          min="1"
                      value={productDetailsForm.quantity === 1 ? '' : productDetailsForm.quantity}
                      placeholder="1"
                      onChange={(e) => {
                        const value = e.target.value
                        if (value === '') {
                          setProductDetailsForm(prev => ({ ...prev, quantity: 1 }))
                        } else {
                          const numValue = parseInt(value)
                          if (!isNaN(numValue) && numValue >= 1) {
                            setProductDetailsForm(prev => ({ ...prev, quantity: numValue }))
                          }
                        }
                      }}
                      className="w-full px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">المجموع</label>
                    <div className="px-2 sm:px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs sm:text-sm font-medium">
                      {formatCurrency(productDetailsForm.sellingPrice * productDetailsForm.quantity)}
                    </div>
                  </div>
                </div>

                {/* Discount */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">الخصم</label>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">المبلغ</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                        value={productDetailsForm.discountAmount || ''}
                        placeholder="0.00"
                        onChange={(e) => handleDiscountAmountChange(parseFloat(e.target.value) || 0)}
                        className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">النسبة</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={productDetailsForm.discountPercentage || ''}
                        placeholder="0.00"
                        onChange={(e) => handleDiscountPercentageChange(parseFloat(e.target.value) || 0)}
                        className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Invoice Note and Available Stock */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">ملاحظة تظهر في الفاتورة</label>
                    <textarea
                      value={productDetailsForm.invoiceNote}
                      onChange={(e) => setProductDetailsForm(prev => ({ ...prev, invoiceNote: e.target.value }))}
                      className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      rows={2}
                      placeholder="أدخل ملاحظة..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">الكمية المتوفرة</label>
                    <div className="px-2 sm:px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs sm:text-sm">
                      {products.find(p => p.id === selectedProductForDetails.productId)?.stock || 0} قطعة
                    </div>
                  </div>
                </div>

                {/* Remove from List */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="removeFromList"
                    checked={productDetailsForm.removeFromList}
                    onChange={(e) => setProductDetailsForm(prev => ({ ...prev, removeFromList: e.target.checked }))}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <label htmlFor="removeFromList" className="mr-2 text-xs sm:text-sm text-red-600 font-medium">
                    إلغاء المنتج من القائمة
                  </label>
                </div>

                {/* Final Total */}
                <div className="border-t pt-3 sm:pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm sm:text-lg font-semibold">الإجمالي النهائي:</span>
                    <span className="text-sm sm:text-lg font-bold text-blue-600">
                      {formatCurrency((productDetailsForm.sellingPrice * productDetailsForm.quantity) - productDetailsForm.discountAmount)}
                        </span>
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
                <h3 className="text-base sm:text-lg font-semibold">إتمام البيع</h3>
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
                        value="نقدا"
                        checked={checkoutForm.paymentMethod === 'نقدا'}
                        onChange={(e) => setCheckoutForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                        className="ml-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="text-sm text-gray-700">نقدا</span>
                    </label>
                    <label className="flex items-center whitespace-nowrap min-w-fit">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="اجل"
                        checked={checkoutForm.paymentMethod === 'اجل'}
                        onChange={(e) => setCheckoutForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                        className="ml-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="text-sm text-gray-700">اجل</span>
                    </label>
                    <label className="flex items-center whitespace-nowrap min-w-fit">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="بطاقة"
                        checked={checkoutForm.paymentMethod === 'بطاقة'}
                        onChange={(e) => setCheckoutForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                        className="ml-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="text-sm text-gray-700">بطاقة</span>
                    </label>
                    <label className="flex items-center whitespace-nowrap min-w-fit">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="شيك"
                        checked={checkoutForm.paymentMethod === 'شيك'}
                        onChange={(e) => setCheckoutForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                        className="ml-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="text-sm text-gray-700">شيك</span>
                    </label>
                    <label className="flex items-center whitespace-nowrap min-w-fit">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="عرض سعر"
                        checked={checkoutForm.paymentMethod === 'عرض سعر'}
                        onChange={(e) => setCheckoutForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                        className="ml-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="text-sm text-gray-700">عرض سعر</span>
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
                          remaining: prev.total - paid - prev.discount
                        }))
                      }}
                      className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Discount and Remaining Amount */}
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
                          remaining: prev.total - prev.paid - discount
                        }))
                      }}
                      className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">الباقي</label>
                    <div className="px-2 sm:px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium">
                      {formatCurrency(checkoutForm.remaining)}
                    </div>
                </div>
              </div>

                {/* Customer Account */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">حفظ الفاتورة لحساب عميل</label>
                  {selectedCustomer ? (
                    <div className="px-2 sm:px-3 py-2 bg-blue-50 border border-blue-300 rounded-lg text-sm font-medium text-blue-900">
                      {selectedCustomer.name} - الرصيد: {formatCurrency(parseFloat(selectedCustomer.balance))}
                    </div>
                  ) : (
                    <div className="relative checkout-customer-search-container">
                  <input
                        type="text"
                        value={checkoutCustomerSearch}
                        onChange={(e) => {
                          setCheckoutCustomerSearch(e.target.value)
                          setShowCheckoutCustomerDropdown(true)
                        }}
                        onFocus={() => setShowCheckoutCustomerDropdown(true)}
                        className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="ابحث عن عميل..."
                      />
                      {checkoutCustomerSearch.trim() !== '' && filteredCheckoutCustomers.length > 0 && showCheckoutCustomerDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-40 overflow-y-auto">
                          {filteredCheckoutCustomers.map(customer => (
                            <button
                              key={customer.id}
                              onClick={() => handleCheckoutCustomerSelect(customer)}
                              className="w-full text-right px-3 py-2 hover:bg-gray-100 border-b last:border-b-0 text-sm"
                            >
                              <div className="font-medium">{customer.name}</div>
                              <div className="text-xs text-gray-500">الرصيد: {formatCurrency(parseFloat(customer.balance))}</div>
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
                {invoiceNumber === 'عرض سعر' ? (
                  <>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">عرض السعر</h3>
                    <p className="text-sm text-gray-600 mb-4">تم عرض سعر الفاتورة بنجاح</p>
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
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">إعادة طباعة الفاتورة</h3>
                <button
                  onClick={() => setShowReprintModal(false)}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">رقم الفاتورة</label>
                  <input
                    type="text"
                    value={invoiceSearchNumber}
                    onChange={(e) => setInvoiceSearchNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="أدخل رقم الفاتورة..."
                    onKeyPress={(e) => e.key === 'Enter' && searchInvoice()}
                  />
                </div>

                {searchedInvoice && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-gray-900">#{searchedInvoice.invoiceNumber}</div>
                    <div className="text-sm text-gray-500">
                      {searchedInvoice.customer ? searchedInvoice.customer.name : 'عميل نقدي'}
                    </div>
                    <div className="text-sm text-gray-500">
                      المبلغ: {formatCurrency(Number(searchedInvoice.totalAmount))}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(searchedInvoice.createdAt).toLocaleDateString('ar-EG')}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowReprintModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  إلغاء
                </button>
                  <button
                    onClick={searchInvoice}
                    disabled={loadingInvoice || !invoiceSearchNumber.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingInvoice ? 'جاري البحث...' : 'بحث'}
                  </button>
                  {searchedInvoice && (
                    <button
                      onClick={handleReprintSearchedInvoice}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
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
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">تعديل فاتورة البيع</h3>
                <button
                  onClick={() => setShowEditInvoiceModal(false)}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
          </div>
              
              <div className="p-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">رقم الفاتورة</label>
                  <input
                    type="text"
                    value={invoiceSearchNumber}
                    onChange={(e) => setInvoiceSearchNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="أدخل رقم الفاتورة..."
                    onKeyPress={(e) => e.key === 'Enter' && searchInvoice()}
                  />
                </div>

                {searchedInvoice && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-gray-900">#{searchedInvoice.invoiceNumber}</div>
                    <div className="text-sm text-gray-500">
                      {searchedInvoice.customer ? searchedInvoice.customer.name : 'عميل نقدي'}
                    </div>
                    <div className="text-sm text-gray-500">
                      المبلغ: {formatCurrency(Number(searchedInvoice.totalAmount))}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(searchedInvoice.createdAt).toLocaleDateString('ar-EG')}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowEditInvoiceModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={searchInvoice}
                    disabled={loadingInvoice || !invoiceSearchNumber.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingInvoice ? 'جاري البحث...' : 'بحث'}
                  </button>
                  {searchedInvoice && (
                    <button
                      onClick={handleEditSearchedInvoice}
                      className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      تعديل
                    </button>
                  )}
          </div>
        </div>
      </div>
          </div>
        )}

        {/* Barcode Scanner Modal */}
        {showBarcodeScanner && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
            <div className="bg-white w-full max-w-lg mx-4 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">مسح الباركود</h3>
                <button
                  onClick={() => setShowBarcodeScanner(false)}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
          </div>
              <div className="p-6">
                <BarcodeInput
                  value={barcodeValue}
                  onChange={setBarcodeValue}
                  onBarcodeDetected={(barcode) => {
                    handleBarcodeDetected(barcode)
                    setShowBarcodeScanner(false)
                  }}
                  placeholder="مسح الباركود..."
                  className="w-full"
                />
          </div>
        </div>
          </div>
        )}
      </div>

      {/* Calculator Modal */}
      {showCalculator && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50" dir="rtl">
            <div className="bg-white w-full max-w-sm mx-0 sm:mx-4 rounded-t-lg sm:rounded-lg overflow-hidden max-h-[90vh] sm:max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between p-3 sm:p-4 border-b flex-shrink-0">
                <h3 className="text-base sm:text-lg font-semibold">الحاسبة</h3>
                <button
                  onClick={() => setShowCalculator(false)}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-3 sm:p-4 flex-1">
                {/* Expression Display */}
                <div className="mb-2">
                  <div className="w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-right text-sm sm:text-base text-blue-800 min-h-[40px] flex items-center justify-end">
                    {calculatorExpression || '0'}
                  </div>
                </div>
                
                {/* Number Display */}
                <div className="mb-4">
                  <div className="w-full px-3 py-4 bg-gray-50 border border-gray-300 rounded-lg text-right text-2xl sm:text-3xl font-mono font-bold min-h-[60px] flex items-center justify-end">
                    {calculatorDisplay}
                  </div>
                </div>
                
                {/* Buttons */}
                <div className="grid grid-cols-4 gap-2 sm:gap-3">
                  {/* Row 1 */}
                  <button
                    onClick={handleCalculatorClear}
                    className="col-span-2 px-2 py-3 sm:py-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm sm:text-base font-medium"
                  >
                    مسح
                  </button>
                  <button
                    onClick={handleCalculatorDelete}
                    className="px-2 py-3 sm:py-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm sm:text-base font-medium"
                  >
                    ⌫
                  </button>
                  <button
                    onClick={() => handleCalculatorOperation('/')}
                    className="px-2 py-3 sm:py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base font-medium"
                  >
                    ÷
                  </button>
                  
                  {/* Row 2 */}
                  <button
                    onClick={() => handleCalculatorNumber('7')}
                    className="px-2 py-3 sm:py-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-sm sm:text-base font-medium"
                  >
                    7
                  </button>
                  <button
                    onClick={() => handleCalculatorNumber('8')}
                    className="px-2 py-3 sm:py-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-sm sm:text-base font-medium"
                  >
                    8
                  </button>
                  <button
                    onClick={() => handleCalculatorNumber('9')}
                    className="px-2 py-3 sm:py-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-sm sm:text-base font-medium"
                  >
                    9
                  </button>
                  <button
                    onClick={() => handleCalculatorOperation('*')}
                    className="px-2 py-3 sm:py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base font-medium"
                  >
                    ×
                  </button>
                  
                  {/* Row 3 */}
                  <button
                    onClick={() => handleCalculatorNumber('4')}
                    className="px-2 py-3 sm:py-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-sm sm:text-base font-medium"
                  >
                    4
                  </button>
                  <button
                    onClick={() => handleCalculatorNumber('5')}
                    className="px-2 py-3 sm:py-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-sm sm:text-base font-medium"
                  >
                    5
                  </button>
                  <button
                    onClick={() => handleCalculatorNumber('6')}
                    className="px-2 py-3 sm:py-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-sm sm:text-base font-medium"
                  >
                    6
                  </button>
                  <button
                    onClick={() => handleCalculatorOperation('-')}
                    className="px-2 py-3 sm:py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base font-medium"
                  >
                    -
                  </button>
                  
                  {/* Row 4 */}
                  <button
                    onClick={() => handleCalculatorNumber('1')}
                    className="px-2 py-3 sm:py-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-sm sm:text-base font-medium"
                  >
                    1
                  </button>
                  <button
                    onClick={() => handleCalculatorNumber('2')}
                    className="px-2 py-3 sm:py-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-sm sm:text-base font-medium"
                  >
                    2
                  </button>
                  <button
                    onClick={() => handleCalculatorNumber('3')}
                    className="px-2 py-3 sm:py-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-sm sm:text-base font-medium"
                  >
                    3
                  </button>
                  <button
                    onClick={() => handleCalculatorOperation('+')}
                    className="px-2 py-3 sm:py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base font-medium"
                  >
                    +
                  </button>
                  
                  {/* Row 5 */}
                  <button
                    onClick={() => handleCalculatorNumber('0')}
                    className="col-span-2 px-2 py-3 sm:py-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-sm sm:text-base font-medium"
                  >
                    0
                  </button>
                  <button
                    onClick={() => handleCalculatorNumber('.')}
                    className="px-2 py-3 sm:py-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-sm sm:text-base font-medium"
                  >
                    .
                  </button>
                  <button
                    onClick={handleCalculatorCalculate}
                    className="px-2 py-3 sm:py-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm sm:text-base font-medium"
                  >
                    =
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Notification */}
      {notification && (
        <FlashNotification
          type={notification.type}
          message={notification.message}
          isVisible={!!notification}
          onClose={() => setNotification(null)}
        />
      )}
      {/* Confirm Leave Popup */}
      <ConfirmNavigationPopup
        isVisible={showConfirmLeave}
        title="تأكيد الرجوع"
        message="هل تريد الرجوع وترك صفحة المبيعات؟ قد تفقد التغييرات غير المحفوظة."
        confirmLabel="نعم، رجوع"
        cancelLabel="لا"
        onConfirm={() => {
          allowNavigationRef.current = true
          setShowConfirmLeave(false)
            window.location.assign('/')
        }}
        onCancel={() => setShowConfirmLeave(false)}
      />

    </MainLayout>
  )
}