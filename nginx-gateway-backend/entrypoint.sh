#!/bin/sh

echo "🕒 Menunggu service php-fpm (Laravel) dan express-service (Express)..."

dockerize \
  -wait tcp://nginx-laravel:80 \
  -wait tcp://express-service:3000 \
  -timeout 60s

echo "✅ Semua service telah siap."
echo "🌐 NGINX akan berjalan di http://localhost:8080"
echo "🔗 Laravel API:   http://localhost:8080/api/auth"
echo "🔗 Express API:   http://localhost:8080/api/product"

echo "🚀 Memulai NGINX..."
nginx -g "daemon off;"
