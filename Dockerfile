FROM node:24-alpine

# Build deps needed for better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

# Data directory for SQLite (mount a volume here in production if you want persistence)
RUN mkdir -p /app/data

EXPOSE 3000

CMD ["node", "--no-warnings=ExperimentalWarning", "server.js"]
