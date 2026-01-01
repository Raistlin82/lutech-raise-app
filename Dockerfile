# RAISE App - SAP BTP Kyma Deployment
# Multi-stage build for optimized production image

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Build arguments for Vite environment variables (optional - will be loaded at runtime)
ARG VITE_SUPABASE_URL=RUNTIME_INJECTED
ARG VITE_SUPABASE_ANON_KEY=RUNTIME_INJECTED
ARG VITE_IAS_AUTHORITY=RUNTIME_INJECTED
ARG VITE_IAS_CLIENT_ID=RUNTIME_INJECTED

# Set environment variables for build (placeholder values - will be replaced at runtime)
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_IAS_AUTHORITY=$VITE_IAS_AUTHORITY
ENV VITE_IAS_CLIENT_ID=$VITE_IAS_CLIENT_ID
# Override base path for Kyma (root instead of /lutech-raise-app/)
ENV VITE_BASE_PATH=/

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Replace GitHub Pages base path with root for Kyma
RUN sed -i 's|/lutech-raise-app/|/|g' index.html

# Build the application with explicit base path for Kyma
RUN npm run build -- --base=/

# Stage 2: Production
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy docker entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Create non-root user for security and set up permissions
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup && \
    chown -R appuser:appgroup /usr/share/nginx/html && \
    chown -R appuser:appgroup /var/cache/nginx && \
    chown -R appuser:appgroup /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R appuser:appgroup /var/run/nginx.pid && \
    chmod +x /docker-entrypoint.sh && \
    chown appuser:appgroup /docker-entrypoint.sh

# Switch to non-root user
USER appuser

# Expose port 8080 (non-privileged)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Start with entrypoint script (generates config.json from env vars, then starts nginx)
CMD ["/docker-entrypoint.sh"]
