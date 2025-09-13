# Use Node.js LTS version
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Verify package files are copied
RUN ls -la package*.json

# Install dependencies
RUN npm ci --omit=dev --ignore-scripts

# Copy source code
COPY src/ ./src/

# Copy environment file (production or local)
COPY env.production.template .env
# For local testing, you can override with: COPY env.local .env

# Create uploads directory
RUN mkdir -p src/uploads

# Expose port
EXPOSE 3000

# Set user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S surveyor -u 1001
RUN chown -R surveyor:nodejs /app
USER surveyor

# Health check - more lenient for free tier
HEALTHCHECK --interval=60s --timeout=10s --start-period=30s --retries=5 \
  CMD node -e "const http = require('http'); \
    const options = { hostname: 'localhost', port: 3000, path: '/health', timeout: 5000 }; \
    const req = http.request(options, (res) => { \
      process.exit(res.statusCode === 200 ? 0 : 1); \
    }); \
    req.on('error', () => process.exit(1)); \
    req.end();"

# Start the application
CMD ["npm", "start"] 