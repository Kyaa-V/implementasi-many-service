FROM node:21-slim

WORKDIR /src/app

COPY package*.json ./

RUN npm install

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--port", "3000", "--host", "0.0.0.0", "--https", "false"]