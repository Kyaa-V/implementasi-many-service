FROM redis:latest

RUN apt-get update && apt-get install -y redis-tools && rm -rf /var/lib/apt/lists/*

COPY ./conf.d/redis.conf /usr/local/etc/redis/redis.conf

EXPOSE 6379

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD redis-cli -h localhost -p 6379 -a yourpassword ping || exit 1

CMD ["redis-server", "/usr/local/etc/redis/redis.conf"] 