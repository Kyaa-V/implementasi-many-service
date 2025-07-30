# Gunakan image resmi Nginx yang ringan
FROM nginx:alpine

# Copy file konfigurasi nginx.conf ke dalam container
COPY nginx.conf /etc/nginx/nginx.conf

# (Opsional) Tambah konfigurasi site khusus
# COPY sites/default.conf /etc/nginx/conf.d/default.conf

# Port default Nginx
EXPOSE 80
