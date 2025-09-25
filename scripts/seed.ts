import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  try {
    // Create sample categories
    console.log('📂 Creating categories...')
    
    // Create root categories
    const electronicsCategory = await prisma.category.upsert({
      where: { id: 'electronics-cat' },
      update: {},
      create: {
        id: 'electronics-cat',
        name: 'Electronics',
        description: 'Electronic devices and accessories'
      }
    })

    const accessoriesCategory = await prisma.category.upsert({
      where: { id: 'accessories-cat' },
      update: {},
      create: {
        id: 'accessories-cat',
        name: 'Accessories',
        description: 'Computer and mobile accessories'
      }
    })

    const officeCategory = await prisma.category.upsert({
      where: { id: 'office-cat' },
      update: {},
      create: {
        id: 'office-cat',
        name: 'Office Supplies',
        description: 'Office and stationery items'
      }
    })

    const clothingCategory = await prisma.category.upsert({
      where: { id: 'clothing-cat' },
      update: {},
      create: {
        id: 'clothing-cat',
        name: 'Clothing',
        description: 'Apparel and fashion items'
      }
    })

    console.log('✅ Categories created successfully')

    // Create sample products
    console.log('📦 Creating products...')
    const products = await Promise.all([
      prisma.product.upsert({
        where: { name: 'Laptop Pro' },
        update: {},
        create: {
          name: 'Laptop Pro',
          description: 'High-performance laptop for professionals',
          price: 1299.99,
          costPrice: 900.00,
          stock: 15,
          minStock: 5,
          barcode: 'LP001',
          sku: 'LAPTOP-PRO-001',
          categoryId: electronicsCategory.id
        }
      }),
      prisma.product.upsert({
        where: { name: 'Wireless Mouse' },
        update: {},
        create: {
          name: 'Wireless Mouse',
          description: 'Ergonomic wireless mouse',
          price: 29.99,
          costPrice: 15.00,
          stock: 45,
          minStock: 10,
          barcode: 'WM001',
          sku: 'MOUSE-WIRELESS-001',
          categoryId: accessoriesCategory.id
        }
      }),
      prisma.product.upsert({
        where: { name: 'Mechanical Keyboard' },
        update: {},
        create: {
          name: 'Mechanical Keyboard',
          description: 'Premium mechanical keyboard with RGB',
          price: 89.99,
          costPrice: 45.00,
          stock: 23,
          minStock: 8,
          barcode: 'MK001',
          sku: 'KEYBOARD-MECH-001',
          categoryId: accessoriesCategory.id
        }
      }),
      prisma.product.upsert({
        where: { name: 'USB-C Cable' },
        update: {},
        create: {
          name: 'USB-C Cable',
          description: 'High-speed USB-C charging cable',
          price: 12.99,
          costPrice: 6.00,
          stock: 100,
          minStock: 20,
          barcode: 'UC001',
          sku: 'CABLE-USB-C-001',
          categoryId: accessoriesCategory.id
        }
      }),
      prisma.product.upsert({
        where: { name: 'Notebook Set' },
        update: {},
        create: {
          name: 'Notebook Set',
          description: 'Premium notebooks and pens set',
          price: 19.99,
          costPrice: 8.00,
          stock: 50,
          minStock: 15,
          barcode: 'NS001',
          sku: 'NOTEBOOK-SET-001',
          categoryId: officeCategory.id
        }
      }),
      prisma.product.upsert({
        where: { name: 'T-Shirt Basic' },
        update: {},
        create: {
          name: 'T-Shirt Basic',
          description: 'Comfortable cotton t-shirt',
          price: 24.99,
          costPrice: 12.00,
          stock: 75,
          minStock: 25,
          barcode: 'TS001',
          sku: 'TSHIRT-BASIC-001',
          categoryId: clothingCategory.id
        }
      })
    ])

    console.log('✅ Products created successfully')

    // Create sample customers
    console.log('👥 Creating customers...')
    const customers = await Promise.all([
      prisma.customer.upsert({
        where: { name: 'Ahmed Hassan' },
        update: {},
        create: {
          name: 'Ahmed Hassan',
          email: 'ahmed@example.com',
          phone: '+201234567890',
          address: 'Cairo, Egypt'
        }
      }),
      prisma.customer.upsert({
        where: { name: 'Fatima Ali' },
        update: {},
        create: {
          name: 'Fatima Ali',
          email: 'fatima@example.com',
          phone: '+201234567891',
          address: 'Alexandria, Egypt'
        }
      }),
      prisma.customer.upsert({
        where: { name: 'Mohammed Omar' },
        update: {},
        create: {
          name: 'Mohammed Omar',
          email: 'mohammed@example.com',
          phone: '+201234567892',
          address: 'Giza, Egypt'
        }
      }),
      prisma.customer.upsert({
        where: { name: 'Aisha Khalil' },
        update: {},
        create: {
          name: 'Aisha Khalil',
          email: 'aisha@example.com',
          phone: '+201234567893',
          address: 'Luxor, Egypt'
        }
      })
    ])

    console.log('✅ Customers created successfully')

    // Create sample suppliers
    console.log('🏢 Creating suppliers...')
    const suppliers = await Promise.all([
      prisma.supplier.upsert({
        where: { name: 'Tech Supplies Co.' },
        update: {},
        create: {
          name: 'Tech Supplies Co.',
          email: 'info@techsupplies.com',
          phone: '+201234567894',
          address: 'Cairo, Egypt'
        }
      }),
      prisma.supplier.upsert({
        where: { name: 'Global Electronics' },
        update: {},
        create: {
          name: 'Global Electronics',
          email: 'contact@globalelec.com',
          phone: '+201234567895',
          address: 'Giza, Egypt'
        }
      }),
      prisma.supplier.upsert({
        where: { name: 'Office Plus' },
        update: {},
        create: {
          name: 'Office Plus',
          email: 'sales@officeplus.com',
          phone: '+201234567896',
          address: 'Alexandria, Egypt'
        }
      }),
      prisma.supplier.upsert({
        where: { name: 'Fashion Hub' },
        update: {},
        create: {
          name: 'Fashion Hub',
          email: 'orders@fashionhub.com',
          phone: '+201234567897',
          address: 'Cairo, Egypt'
        }
      })
    ])

    console.log('✅ Suppliers created successfully')

    // Create sample expenses
    console.log('💰 Creating sample expenses...')
    const expenses = await Promise.all([
      prisma.expense.create({
        data: {
          title: 'Office Rent',
          description: 'Monthly office rent payment',
          amount: 5000.00,
          category: 'Rent',
          paymentMethod: 'BANK_TRANSFER'
        }
      }),
      prisma.expense.create({
        data: {
          title: 'Internet Bill',
          description: 'Monthly internet service',
          amount: 300.00,
          category: 'Utilities',
          paymentMethod: 'BANK_TRANSFER'
        }
      }),
      prisma.expense.create({
        data: {
          title: 'Office Supplies',
          description: 'Paper, pens, and other supplies',
          amount: 150.00,
          category: 'Supplies',
          paymentMethod: 'CASH'
        }
      })
    ])

    console.log('✅ Expenses created successfully')

    // Create sample cashbox transactions
    console.log('💼 Creating cashbox transactions...')
    const transactions = await Promise.all([
      prisma.cashboxTransaction.create({
        data: {
          type: 'EXPENSE',
          amount: 5000.00,
          description: 'Office rent payment',
          reference: 'EXP-001',
          paymentMethod: 'BANK_TRANSFER'
        }
      }),
      prisma.cashboxTransaction.create({
        data: {
          type: 'INCOME',
          amount: 2500.00,
          description: 'Cash sales',
          reference: 'SALES-001',
          paymentMethod: 'CASH'
        }
      })
    ])

    console.log('✅ Cashbox transactions created successfully')

    console.log('\n🎉 Database seeding completed successfully!')
    console.log('\n📊 Summary:')
    console.log(`   • Categories: 4`)
    console.log(`   • Products: ${products.length}`)
    console.log(`   • Customers: ${customers.length}`)
    console.log(`   • Suppliers: ${suppliers.length}`)
    console.log(`   • Expenses: ${expenses.length}`)
    console.log(`   • Transactions: ${transactions.length}`)

  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  }) 