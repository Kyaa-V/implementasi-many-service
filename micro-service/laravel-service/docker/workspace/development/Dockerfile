# --------------------------------
# Stage 1: PHP builder development (composer)
# --------------------------------
FROM php:8.2-fpm AS builder

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libzip-dev \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libxml2-dev \
    libonig-dev \
    libsqlite3-dev \
    libicu-dev \
    zip \
    unzip \
    git \
    curl \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install only essential PHP extensions that need compilation
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-configure intl \
    && docker-php-ext-install -j$(nproc) \
        bcmath \
        gd \
        intl \
        pdo_mysql \
        pdo_sqlite \
        zip \
        opcache

# Install xdebug via PECL
RUN pecl install xdebug && docker-php-ext-enable xdebug

WORKDIR /var/www

# Install Composer
RUN curl -sS https://getcomposer.org/installer | php -- \
    --install-dir=/usr/local/bin \
    --filename=composer

# Copy application files
COPY . .

# Install dependencies
RUN composer install --optimize-autoloader \
    --no-interaction \
    --no-progress \
    --prefer-dist

# Set permissions
RUN chown -R www-data:www-data storage bootstrap/cache

# ----------------------------------
# BASE RUNTIME IMAGE
# ----------------------------------
FROM php:8.2-fpm AS base-runtime

# Install runtime system dependencies
RUN apt-get update && apt-get install -y \
    libzip4 \
    libpng16-16 \
    libjpeg62-turbo \
    libfreetype6 \
    libxml2 \
    libonig5 \
    libsqlite3-0 \
    libicu72 \
    git \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy from builder stage
COPY --from=builder /usr/local/etc/php/conf.d /usr/local/etc/php/conf.d
COPY --from=builder /usr/local/lib/php/extensions /usr/local/lib/php/extensions
COPY --from=builder /usr/local/bin/composer /usr/local/bin/composer
COPY --from=builder /var/www /var/www

WORKDIR /var/www

RUN chown -R www-data:www-data bootstrap/cache storage

# ----------------------------------
# Stage 2: Final runtime PHP + Nginx + Supervisor
# ----------------------------------
FROM base-runtime AS development

RUN apt-get update && apt-get install -y \
    nginx \
    supervisor \
    git \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy configuration files
COPY ./docker/supervisor/supervisor-dev.conf /etc/supervisor/conf.d/supervisord.conf
COPY ./docker/workspace/php.ini /usr/local/etc/php/conf.d/php.ini
COPY ./docker/php-fpm/common/init.sh /usr/local/bin/init.sh
COPY ./docker/php-fpm/php-fpm.conf /usr/local/etc/php-fpm.conf
COPY ./docker/php-fpm/www.conf /usr/local/etc/php-fpm.d/zz-www.conf

# Set permissions
WORKDIR /var/www
RUN mkdir -p /var/run/php
RUN chown -R www-data:www-data /var/run/php
RUN chmod -R 755 /var/run/php
RUN chown -R www-data:www-data /var/www/storage
RUN chown -R www-data:www-data storage bootstrap/cache
RUN chmod +x /usr/local/bin/init.sh 

# Debug: Show available PHP extensions
RUN echo "=== Available PHP Extensions ===" && php -m

EXPOSE 80 443

ENTRYPOINT ["/usr/local/bin/init.sh"]
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]