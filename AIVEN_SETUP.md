# Aiven PostgreSQL Database Setup

## Migration from Neon to Aiven

### 1. Get Your Aiven Connection String

From your Aiven console, get your PostgreSQL connection string. It should look like this:
```
postgresql://avnadmin:your_password@your_host:your_port/defaultdb?sslmode=require
```

### 2. Update Environment Variables

Create a `.env.local` file in your project root with your Aiven connection string:

```env
DATABASE_URL="postgresql://avnadmin:your_password@your_host:your_port/defaultdb?sslmode=require"
NODE_ENV=development
```

### 3. Update Prisma Configuration

Your current Prisma schema is already configured correctly for PostgreSQL. The `datasource db` section in `prisma/schema.prisma` should remain:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 4. Reset and Migrate Database

Run these commands to set up your database with Aiven:

```bash
# Generate Prisma client
npx prisma generate

# Push the schema to your Aiven database
npx prisma db push

# (Optional) If you want to seed your database
npm run seed
```

### 5. Verify Connection

Test your connection by running:
```bash
npx prisma studio
```

### Important Notes

- **SSL Mode**: Aiven requires SSL connections, which is why `sslmode=require` is included in the connection string
- **Database Name**: Make sure your Aiven database name matches what you specify in the connection string
- **Environment Variables**: Use `.env.local` for local development and set the `DATABASE_URL` in your production environment (Vercel, etc.)

### Troubleshooting

If you encounter connection issues:
1. Verify your Aiven connection string is correct
2. Ensure your Aiven database is running
3. Check that your IP is whitelisted in Aiven (if applicable)
4. Verify the database name exists in your Aiven instance 