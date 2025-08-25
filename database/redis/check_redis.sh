#!/bin/bash
# Parameter koneksi Redis
REDIS_HOST="redis-server"
REDIS_PORT="6379"
REDIS_PASSWORD="yourpassword"
# Mengecek koneksi ke Redis
if [ -z "$REDIS_PASSWORD" ]; then
    if redis-cli -h $REDIS_HOST -p $REDIS_PORT ping | grep -q "PONG"; then
        echo "Redis berjalan dengan baik di $REDIS_HOST:$REDIS_PORT"
        exit 0
    else
        echo "Redis tidak berjalan atau gagal terhubung di $REDIS_HOST:$REDIS_PORT"
        exit 1
    fi
else
    if redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD ping | grep -q "PONG"; then
        echo "Redis berjalan dengan baik di $REDIS_HOST:$REDIS_PORT"
        exit 0
    else
        echo "Redis tidak berjalan atau gagal terhubung di $REDIS_HOST:$REDIS_PORT"
        exit 1
    fi
fi