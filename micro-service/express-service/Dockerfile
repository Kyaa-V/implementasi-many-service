FROM node:21-alpine

WORKDIR /src/app

# install deps dulu biar cache efisien
COPY package*.json ./
RUN npm install -g nodemon ts-node typescript && npm install

# copy semua source code
COPY . .
COPY ./entrypoint.sh ./entrypoint.sh

EXPOSE 3000

RUN chmod +x ./entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]
