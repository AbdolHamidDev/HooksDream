FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies including dev dependencies
RUN npm install && npm cache clean --force

# Copy application code
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Start in development mode with hot-reload
CMD ["npm", "run", "dev"]