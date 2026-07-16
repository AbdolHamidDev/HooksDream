FROM node:26-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev dependencies for nodemon)
RUN npm install && npm cache clean --force

# Copy application code
COPY . .

# Expose the port
EXPOSE 5000

# Start in development mode with nodemon hot-reload
CMD ["npm", "run", "dev"]