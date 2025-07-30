#!/bin/sh

echo "🚀 Starting Laravel initialization..."

echo "🔄 Checking MySQL connection..."
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    php -r "
    try {
        new PDO('mysql:host=${DB_HOST};port=${DB_PORT}', '${DB_USERNAME}', '${DB_PASSWORD}', [
            PDO::ATTR_TIMEOUT => 3,
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ]);
        exit(0);
    } catch (PDOException \$e) {
        exit(1);
    }
    " >/dev/null 2>&1

    if [ $? -eq 0 ]; then
        echo "✅ MySQL connection OK"
        break
    fi

    echo "⏳ Waiting MySQL... ($((RETRY_COUNT+1))/$MAX_RETRIES)"
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

echo "🔧 Checking storage permission..."
php artisan config:clear >/dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Storage permission issue. Run: chmod -R 775 storage bootstrap/cache"
    exit 1
fi

echo "🔧 Setting up storage and cache directories..."
mkdir -p /var/run/php
chown -R www-data:www-data /var/run/php
echo "📂 setting perimisions and complete create folder /var/run/php"

echo "⚙️  Caching Laravel config..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "🔨 Running Laravel migration..."
php artisan migrate --force

echo "🎉 Laravel ready to run." 
echo "🌐 Running on http://localhost:8000"

exec "$@"