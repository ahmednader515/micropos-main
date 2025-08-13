import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { safeDatabaseOperation, buildTimeResponses, isBuildTime, isVercelBuild } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  return safeDatabaseOperation(
    async () => {
      await prisma.$connect()

      const customers = await prisma.customer.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      })

      await prisma.$disconnect()

      return {
        customers: customers.map((c) => ({
          ...c,
          balance: Number(c.balance),
          creditLimit: Number(c.creditLimit),
        })),
      }
    },
    buildTimeResponses.customers,
    'Failed to fetch customers'
  )
}

type IncomingPriceTier = 'price1' | 'price2' | 'price3'

function mapPriceTier(tier: IncomingPriceTier | undefined): 'PRICE1' | 'PRICE2' | 'PRICE3' {
  if (tier === 'price2') return 'PRICE2'
  if (tier === 'price3') return 'PRICE3'
  return 'PRICE1'
}

async function generateUniqueCustomerNumber(): Promise<string> {
  // Simple unique number generator with retry on collisions
  // Format: CUST-YYYYMMDDHHmmss-XXX
  for (let attempt = 0; attempt < 5; attempt++) {
    const now = new Date()
    const dateStr = now
      .toISOString()
      .replace(/[-:TZ.]/g, '')
      .slice(0, 14) // YYYYMMDDHHmmss
    const suffix = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0')
    const candidate = `CUST-${dateStr}-${suffix}`
    const existing = await prisma.customer.findUnique({ where: { customerNumber: candidate } })
    if (!existing) return candidate
  }
  // Fallback to cuid if too many collisions (very unlikely)
  return `CUST-${Date.now()}`
}

export async function POST(request: Request) {
  try {
    await prisma.$connect()

    const body = await request.json()
    const {
      customerNumber,
      barcode,
      name,
      email,
      phone,
      address,
      city,
      streetName,
      buildingNumber,
      postalCode,
      taxRegistration,
      commercialRegistration,
      cardType,
      cardNumber,
      notes,
      priceTier,
      creditLimit,
      dueDays,
    } = body as Record<string, any>

    if (!name || !String(name).trim()) {
      return NextResponse.json({ error: 'Customer name is required' }, { status: 400 })
    }

    const existingByName = await prisma.customer.findUnique({ where: { name } })
    if (existingByName) {
      await prisma.$disconnect()
      return NextResponse.json({ error: 'Customer with this name already exists' }, { status: 400 })
    }

    let finalCustomerNumber: string | null = null
    if (customerNumber && String(customerNumber).trim()) {
      // Ensure uniqueness if provided
      const existsNum = await prisma.customer.findUnique({ where: { customerNumber } })
      if (existsNum) {
        await prisma.$disconnect()
        return NextResponse.json({ error: 'Customer number already exists' }, { status: 400 })
      }
      finalCustomerNumber = customerNumber
    } else {
      finalCustomerNumber = await generateUniqueCustomerNumber()
    }

    const created = await prisma.customer.create({
      data: {
        customerNumber: finalCustomerNumber,
        barcode: barcode || null,
        name,
        email: email || null,
        phone: phone || null,
        address: address || null,
        city: city || null,
        streetName: streetName || null,
        buildingNumber: buildingNumber || null,
        postalCode: postalCode || null,
        taxRegistration: taxRegistration || null,
        commercialRegistration: commercialRegistration || null,
        cardType: cardType || null,
        cardNumber: cardNumber || null,
        notes: notes || null,
        priceTier: mapPriceTier(priceTier),
        creditLimit: creditLimit ? Number(creditLimit) : 0,
        dueDays: dueDays ? parseInt(String(dueDays), 10) : 0,
        balance: 0,
        isActive: true,
      },
    })

    await prisma.$disconnect()

    return NextResponse.json({
      message: 'Customer created successfully',
      customer: {
        ...created,
        balance: Number(created.balance),
        creditLimit: Number(created.creditLimit),
      },
    })
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
  }
}
