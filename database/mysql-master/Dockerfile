FROM mysql:9.3

COPY ./conf.d/mysql-master.cnf /etc/mysql/conf.d/mysql-master.cnf

COPY ./init/init.sql /docker-entrypoint-initdb.d/init.sql

RUN chmod 644 /etc/mysql/conf.d/mysql-master.cnf \
    && chown root:root /etc/mysql/conf.d/mysql-master.cnf
