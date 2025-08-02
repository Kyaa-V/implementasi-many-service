FROM nginx:alpine

# Install tools dasar
RUN apk add --no-cache wget tar openssl

ENV DOCKERIZE_VERSION v0.9.4

RUN apk update --no-cache \
    && apk add --no-cache wget openssl \
    && wget -O - https://github.com/jwilder/dockerize/releases/download/$DOCKERIZE_VERSION/dockerize-alpine-linux-amd64-$DOCKERIZE_VERSION.tar.gz | tar xzf - -C /usr/local/bin \
    && apk del wget

COPY nginx.conf /etc/nginx/nginx.conf
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

CMD ["/entrypoint.sh"]
