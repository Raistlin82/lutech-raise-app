#!/bin/sh
# RAISE App - Docker Entrypoint Script
# Generates runtime configuration from environment variables

set -e

# Generate config.json from environment variables
cat > /usr/share/nginx/html/config.json <<EOF
{
  "VITE_IAS_AUTHORITY": "${VITE_IAS_AUTHORITY:-}",
  "VITE_IAS_CLIENT_ID": "${VITE_IAS_CLIENT_ID:-}",
  "VITE_SUPABASE_URL": "${VITE_SUPABASE_URL:-}",
  "VITE_SUPABASE_ANON_KEY": "${VITE_SUPABASE_ANON_KEY:-}"
}
EOF

echo "Runtime configuration generated:"
cat /usr/share/nginx/html/config.json

# Start nginx
exec nginx -g 'daemon off;'
