#!/bin/sh
clear 

echo "🚀 Memulai semua service..."

# Waktu mulai script
script_start_time=$(date +%s)

echo "🛑 Menghentikan dan menghapus service yang sedang berjalan..."
docker-compose -f compose.dev.yml down -v
echo "✅ Semua service telah dihentikan."

echo "⬆️  Build ulang dan up semua service..."
if ! docker-compose -f compose.dev.yml up -d --build; then
    echo "❌ Build atau up service gagal. Periksa error di atas."
    exit 1
fi

echo "🔍 Lihat status container..."
docker ps -a

# Fungsi menunggu dengan streaming log
wait_for_service_log() {
    local name="$1"
    local success_msg="$2"
    local retries=120
    local count=0

    echo "⏳ Menunggu container '$name' berjalan..."
    while [ $count -lt $retries ]; do
        if docker ps --format '{{.Names}}' | grep -q "^${name}$"; then
            echo "✅ $name sudah berjalan."
            break
        fi
        count=$((count+1))
        sleep 2
    done

    echo "📜 Mengikuti log dari $name sampai '$success_msg' muncul..."
    (
        docker logs -f --since "${script_start_time}" "$name" 2>&1 &
        log_pid=$!

        while read -r line; do
            echo "$line"
            if echo "$line" | grep -iq "$success_msg"; then
                echo "✅ $name siap digunakan."
                kill "$log_pid" 2>/dev/null
                break
            fi
        done < <(docker logs -f --since "${script_start_time}" "$name" 2>&1)
    )
}


###########################################################
# 🔄 Setup MySQL Replication
###########################################################
echo "🔄 Setup MySQL Replication..."
chmod +x ./database/setup-replication-db.sh
./database/setup-replication-db.sh

echo "✅ Replication setup complete."


# Tunggu dan ikuti log tiap service
wait_for_service_log "auth-service-laravel" "Laravel ready to run"
wait_for_service_log "express-service" "server is running on"
wait_for_service_log "nuxt-service" "Nuxt Nitro server built"
wait_for_service_log "next-service" "Ready in"

echo "🌐 Gateway Backend: http://localhost:8080"
echo "🔗 Express API:   http://localhost:8080/api/product"
echo "🔗 Laravel API:   http://localhost:8080/api/auth"
echo "🌐 Gateway Frontend: http://localhost:8083"
echo "🔗 NUXT:   http://localhost:8083/dashboard"
echo "🔗 NEXT:   http://localhost:8083/"
echo "✅ Semua service telah siap dan berjalan."


echo ""
echo ""
echo ""
echo "======================= 🔄 Memulai Prosses debugging-replication db.... ================================"
echo ""
echo ""

./config/debug-replication.sh

echo "✅ Proses debugging-replication db selesai."

echo ""
echo ""
echo ""
echo "======================= 🔄 Memulai Prosses verify-cluster replication db....  ================================"
echo ""

./config/verify-cluster.sh

echo "✅ Proses verify-cluster db selesai."