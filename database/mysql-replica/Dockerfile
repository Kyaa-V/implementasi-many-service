FROM mysql:8.0

# Pastikan direktori konfigurasi ada
RUN mkdir -p /etc/mysql/conf.d

# Salin file konfigurasi
COPY ./conf.d/mysql-replica.cnf /etc/mysql/conf.d/mysql-replica.cnf

# Atur izin file
RUN chmod 644 /etc/mysql/conf.d/mysql-replica.cnf && chown root:root /etc/mysql/conf.d/mysql-replica.cnf