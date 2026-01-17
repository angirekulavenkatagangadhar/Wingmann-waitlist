# Use Node.js 18 LTS
FROM node:18-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Expose port (Cloud Run will set PORT env var)
EXPOSE 8080

# Start the application (uses server-gcp.js which works both locally and on GCP)
CMD ["node", "server-gcp.js"]
