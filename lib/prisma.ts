import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'

const globalForPrisma = globalThis as unknown as {
  prisma: any | undefined
}

const basePrisma = new PrismaClient()
const extendedPrisma = basePrisma.$extends(withAccelerate())

export const prisma = globalForPrisma.prisma ?? extendedPrisma

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma 