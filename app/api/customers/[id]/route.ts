import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.$connect()
    
    const customer = await prisma.customer.findUnique({
      where: { id }
    })
    
    await prisma.$disconnect()
    
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }
    
    return NextResponse.json({
      customer: {
        ...customer,
        balance: Number(customer.balance),
        creditLimit: Number(customer.creditLimit),
      }
    })
  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Check if name already exists for another customer
    const existingByName = await prisma.customer.findFirst({
      where: { 
        name,
        id: { not: id }
      }
    })
    
    if (existingByName) {
      await prisma.$disconnect()
      return NextResponse.json({ error: 'Customer with this name already exists' }, { status: 400 })
    }

    // Check if customer number already exists for another customer
    if (customerNumber && String(customerNumber).trim()) {
      const existingByNumber = await prisma.customer.findFirst({
        where: { 
          customerNumber,
          id: { not: id }
        }
      })
      
      if (existingByNumber) {
        await prisma.$disconnect()
        return NextResponse.json({ error: 'Customer number already exists' }, { status: 400 })
      }
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        customerNumber: customerNumber || null,
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
        priceTier: priceTier || 'PRICE1',
        creditLimit: creditLimit ? Number(creditLimit) : 0,
        dueDays: dueDays ? parseInt(String(dueDays), 10) : 0,
      },
    })

    await prisma.$disconnect()

    return NextResponse.json({
      message: 'Customer updated successfully',
      customer: {
        ...updated,
        balance: Number(updated.balance),
        creditLimit: Number(updated.creditLimit),
      },
    })
  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 })
  }
}
