#!/bin/bash

# Build script for Vercel deployment
# This ensures Prisma client is generated before Next.js build

echo "🔧 Starting build process..."

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Check if Prisma generation was successful
if [ $? -eq 0 ]; then
    echo "✅ Prisma client generated successfully"
else
    echo "❌ Prisma client generation failed"
    exit 1
fi

# Build Next.js application
echo "🏗️ Building Next.js application..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully"
else
    echo "❌ Build failed"
    exit 1
fi

echo "🎉 Build process completed!" 