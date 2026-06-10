#!/bin/sh
set -e

echo "==> Installing npm dependencies..."
npm install --legacy-peer-deps

echo "==> Generating Prisma client..."
npx prisma generate

echo "==> Applying database migrations..."
i=0
until npx prisma migrate deploy; do
  i=$((i + 1))
  if [ "$i" -ge 30 ]; then
    echo "ERROR: Database not available after 30 attempts."
    exit 1
  fi
  echo "    Waiting for database... ($i/30)"
  sleep 2
done

echo "==> Seeding database..."
npx tsx prisma/seed.ts

echo "==> Starting development server..."
exec npm run dev
