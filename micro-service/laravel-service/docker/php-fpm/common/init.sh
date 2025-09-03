#!/bin/sh

echo "🚀 Starting Laravel initialization..."

echo "🔄 Checking MySQL connection and creating database..."
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    php -r "
    try {
        \$pdo = new PDO('mysql:host=${DB_HOST};port=${DB_PORT}', '${DB_USERNAME}', '${DB_PASSWORD}', [
            PDO::ATTR_TIMEOUT => 3,
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ]);
        
        // Create database if not exists
        \$pdo->exec('CREATE DATABASE IF NOT EXISTS \`${DB_DATABASE}\`');
        
        // Test connection to the specific database
        \$pdo = new PDO('mysql:host=${DB_HOST};port=${DB_PORT};dbname=${DB_DATABASE}', '${DB_USERNAME}', '${DB_PASSWORD}');
        echo 'Database ${DB_DATABASE} ready.' . PHP_EOL;
        exit(0);
    } catch (PDOException \$e) {
        exit(1);
    }
    " >/dev/null 2>&1

    if [ $? -eq 0 ]; then
        echo "✅ MySQL connection and database OK"
        break
    fi

    echo "⏳ Waiting MySQL and creating database... ($((RETRY_COUNT+1))/$MAX_RETRIES)"
    RETRY_COUNT=$((RETRY_COUNT + 1))
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "❌ MySQL not reachable after $MAX_RETRIES attempts."
    exit 1
fi

echo "🔍 Checking PHP extensions..."

# Method 1: Check critical extensions using PHP
php -r "
\$required = [
    'pdo_mysql', 'mbstring', 'fileinfo', 'tokenizer', 'xml', 
    'gd', 'intl', 'bcmath', 'dom', 'zip', 'ctype', 'json'
];

\$missing = [];
foreach (\$required as \$ext) {
    if (!extension_loaded(\$ext)) {
        \$missing[] = \$ext;
    }
}

if (!empty(\$missing)) {
    echo '❌ Missing PHP extensions: ' . implode(', ', \$missing) . PHP_EOL;
    exit(1);
} else {
    echo '✅ All required PHP extensions are installed.' . PHP_EOL;
    exit(0);
}
"

if [ $? -ne 0 ]; then
    echo "❌ Missing required PHP extensions. Please fix your Dockerfile."
    echo ""
    echo "🔍 Available extensions:"
    php -m | sort
    echo ""
    echo "🔍 Detailed extension check:"
    php -r "
    \$extensions = ['bcmath', 'ctype', 'curl', 'dom', 'fileinfo', 'filter', 
                   'gd', 'hash', 'iconv', 'json', 'mbstring', 'openssl', 
                   'pdo', 'pdo_mysql', 'tokenizer', 'xml', 'zip'];
    foreach (\$extensions as \$ext) {
        echo \$ext . ': ' . (extension_loaded(\$ext) ? '✅' : '❌') . PHP_EOL;
    }
    "
    exit 1
fi

echo "🔍 Checking Laravel installation..."
if [ ! -d "vendor" ] || [ ! -f "artisan" ]; then
    echo "❌ Laravel is not installed. Run composer install."
    exit 1
fi

echo "🔧 Setting up storage and cache directories..."
# Create directories if they don't exist
mkdir -p storage/app/public
mkdir -p storage/framework/cache/data
mkdir -p storage/framework/sessions  
mkdir -p storage/framework/views
mkdir -p storage/logs
mkdir -p bootstrap/cache
mkdir -p /var/run/php

# Fix permissions BEFORE checking
echo "🔧 Fixing storage permissions..."
chown -R www-data:www-data storage bootstrap/cache /var/run/php
chmod -R 775 storage bootstrap/cache
chmod -R 755 /var/run/php

# Test write permission directly instead of using artisan
echo "🔧 Testing storage write permissions..."
STORAGE_TEST_FILE="storage/logs/permission-test.tmp"
CACHE_TEST_FILE="bootstrap/cache/permission-test.tmp"

# Test storage directory
if ! touch "$STORAGE_TEST_FILE" 2>/dev/null; then
    echo "❌ Cannot write to storage directory"
    echo "Current storage permissions:"
    ls -la storage/
    echo "Attempting to fix permissions again..."
    chmod -R 777 storage bootstrap/cache
    chown -R www-data:www-data storage bootstrap/cache
    
    # Try again
    if ! touch "$STORAGE_TEST_FILE" 2>/dev/null; then
        echo "❌ Still cannot write to storage. Check volume mounts and filesystem."
        ls -la /var/www/
        exit 1
    fi
fi

# Test bootstrap/cache directory  
if ! touch "$CACHE_TEST_FILE" 2>/dev/null; then
    echo "❌ Cannot write to bootstrap/cache directory"
    echo "Current bootstrap/cache permissions:"
    ls -la bootstrap/
    chmod -R 777 bootstrap/cache
    chown -R www-data:www-data bootstrap/cache
fi

# Clean up test files
rm -f "$STORAGE_TEST_FILE" "$CACHE_TEST_FILE" 2>/dev/null

echo "✅ Storage permissions OK"

echo "🔨 Running Laravel migration..."
php artisan migrate --force || echo "⚠️  Migration failed, continuing..."

echo "🔧 Setting up cache tables if needed..."
# Check current cache driver and create table if needed
CACHE_DRIVER_CHECK=$(php -r "echo config('cache.default', 'file');")
echo "Cache driver: $CACHE_DRIVER_CHECK"

if [ "$CACHE_DRIVER_CHECK" = "database" ] || [ "${CACHE_DRIVER}" = "database" ]; then
    echo "🔧 Creating cache table for database driver..."
    php artisan cache:table --quiet 2>/dev/null || echo "Cache table already exists or creation failed"
    php artisan queue:table --quiet 2>/dev/null || echo "Queue table already exists or creation failed"
    php artisan session:table --quiet 2>/dev/null || echo "Session table already exists or creation failed"
    php artisan migrate --force || echo "⚠️  Cache tables migration failed, continuing..."
fi

# Now safe to run artisan commands
echo "⚙️ Clearing Laravel caches..."
# Force use file cache for clearing to avoid database dependency
ORIGINAL_CACHE_DRIVER="${CACHE_DRIVER}"
export CACHE_DRIVER=file

php artisan config:clear || echo "⚠️  Config clear failed, continuing..."
php artisan cache:clear || echo "⚠️  Cache clear failed, continuing..."
php artisan view:clear || echo "⚠️  View clear failed, continuing..."

# Restore original cache driver
if [ -n "$ORIGINAL_CACHE_DRIVER" ]; then
    export CACHE_DRIVER="$ORIGINAL_CACHE_DRIVER"
fi

echo "⚙️ Caching Laravel config..."
php artisan config:cache || echo "⚠️  Config cache failed, continuing..."
php artisan route:cache || echo "⚠️  Route cache failed, continuing..."  
php artisan view:cache || echo "⚠️  View cache failed, continuing..."

echo "🔄 Consuming RabbitMQ messages..."
php artisan rabbitmq:consume &

echo "🎉 Laravel ready to run." 
echo "🌐 Running on http://localhost:8000"

exec "$@"