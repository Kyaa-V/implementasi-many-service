#!/bin/sh

echo "🚀 Memulai semua service..."

echo "🛑 Menghentikan dan menghapus service yang sedang berjalan..."
docker-compose -f compose.dev.yml --env-file ./micro-service/laravel-service/.env down -v
echo "✅ Semua service telah dihentikan."

echo "⬆️  Build ulang dan up semua service..."
# docker-compose -f compose.dev.yml --env-file ./micro-service/laravel-service/.env build --no-cache

docker-compose -f compose.dev.yml --env-file ./micro-service/laravel-service/.env up -d --build

echo "🔍 Lihat status container..."
docker ps -a

echo "📜 Melihat log dari semua service..."

docker logs -f express-service &
docker logs -f auth-service-laravel &
docker logs -f gateway-nginx &
docker logs -f nuxt-service &

# Tunggu agar tidak langsung exit
wait
echo "🌐 NGINX akan berjalan di http://localhost:8080"
echo "🔗 Express API:   http://localhost:8080/api/product"
echo "🔗 Laravel API:   http://localhost:8080/api/auth"
echo "✅ Semua service telah siap dan berjalan."
