# Database Seed Script

This directory contains the database seeding script for the micropos application.

## Files

- `seed.ts` - Main seed script that populates the database with sample data

## Usage

### Run the seed script:

```bash
npm run seed
```

### What the seed script creates:

1. **Categories (4)**
   - Electronics
   - Accessories  
   - Office Supplies
   - Clothing

2. **Products (6)**
   - Laptop Pro ($1,299.99)
   - Wireless Mouse ($29.99)
   - Mechanical Keyboard ($89.99)
   - USB-C Cable ($12.99)
   - Notebook Set ($19.99)
   - T-Shirt Basic ($24.99)

3. **Customers (4)**
   - Ahmed Hassan
   - Fatima Ali
   - Mohammed Omar
   - Aisha Khalil

4. **Suppliers (4)**
   - Tech Supplies Co.
   - Global Electronics
   - Office Plus
   - Fashion Hub

5. **Expenses (3)**
   - Office Rent ($5,000)
   - Internet Bill ($300)
   - Office Supplies ($150)

6. **Cashbox Transactions (2)**
   - Office rent payment (Expense)
   - Cash sales (Income)

## Prerequisites

Before running the seed script:

1. Make sure your database is set up and running
2. Ensure your `DATABASE_URL` environment variable is configured
3. Run `npx prisma generate` to generate the Prisma client
4. Run `npx prisma db push` to push the schema to your database

## Environment Setup

Create a `.env.local` file with your database connection:

```env
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"
NODE_ENV=development
```

## Complete Setup Process

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma client
npx prisma generate

# 3. Push schema to database
npx prisma db push

# 4. Seed the database
npm run seed

# 5. (Optional) Open Prisma Studio to verify
npx prisma studio
```

## Troubleshooting

If you encounter issues:

1. **Connection errors**: Verify your `DATABASE_URL` is correct
2. **Permission errors**: Ensure your database user has write permissions
3. **Schema errors**: Run `npx prisma db push --force-reset` to reset the database
4. **TypeScript errors**: Make sure `tsx` is installed (`npm install -D tsx`)

## Customization

You can modify the `seed.ts` file to:
- Add more sample data
- Change product prices and descriptions
- Add different categories
- Modify customer/supplier information

The script uses `upsert` operations, so you can run it multiple times safely without creating duplicates. 