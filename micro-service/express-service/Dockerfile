FROM node:21-alpine

WORKDIR /src/app

COPY package*.json ./
RUN npm install -g nodemon && npm install

EXPOSE 3000

CMD ["npm", "run", "dev"]
