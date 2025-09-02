#!/bin/sh
set -e

echo "🔄 Running Prisma generate..."
npx prisma generate

echo "📦 Running Prisma migrate deploy..."
npx prisma migrate deploy

echo "🚀 Starting app..."
npm run dev

exec "$@"