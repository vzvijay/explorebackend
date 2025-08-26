# Production Dockerfile for Maharashtra Survey System Frontend
FROM nginx:alpine

# Copy built application files
COPY frontend/ /usr/share/nginx/html/

# Copy nginx configuration
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Create uploads directory
RUN mkdir -p /app/uploads

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
