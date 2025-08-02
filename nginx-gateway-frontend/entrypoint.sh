#!/bin/sh

echo "🕒 Menunggu service NUXT FRONTEND..."

dockerize \
  -wait tcp://nuxt-service:3000 \
  -timeout 60s

echo "✅ Semua service telah siap."
echo "🌐 NGINX akan berjalan di http://localhost:8083"
echo "🔗  NUXT-FRONTEND:   http://localhost:8083/"

echo "🚀 Memulai NGINX..."
nginx -g "daemon off;"
