FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

# vite requires this to run
ENV HOST=0.0.0.0

EXPOSE 5173

CMD ["npm", "run", "dev"]
