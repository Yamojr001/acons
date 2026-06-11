#!/bin/bash
# scripts/provision_domain.sh
# Automatically provision SSL certificate and Nginx config for a custom school domain.
# Called by Laravel after a domain is verified via DNS TXT record.
#
# Usage: sudo bash scripts/provision_domain.sh greenfield.edu.ng
#
# Requirements: certbot installed, Nginx running, EduSaaS at /var/www/edusaas

set -euo pipefail

DOMAIN="${1:-}"
APP_ROOT="/var/www/edusaas"
SSL_EMAIL="ssl@yourdomain.com"

if [[ -z "$DOMAIN" ]]; then
  echo "❌ Error: Domain required. Usage: $0 example.edu.ng" >&2
  exit 1
fi

echo "🔐 Provisioning SSL for: $DOMAIN"

# ─── 1. Request Let's Encrypt SSL ──────────────────────────────────────────
certbot certonly \
  --webroot \
  -d "$DOMAIN" \
  -w "${APP_ROOT}/public" \
  --non-interactive \
  --agree-tos \
  --email "$SSL_EMAIL" \
  --expand

echo "✅ SSL certificate issued"

# ─── 2. Create Nginx server block ──────────────────────────────────────────
NGINX_CONF="/etc/nginx/sites-enabled/${DOMAIN}.conf"

cat > "$NGINX_CONF" << NGINX
server {
    listen 80;
    server_name ${DOMAIN};
    location /.well-known/acme-challenge/ { root ${APP_ROOT}/public; }
    location / { return 301 https://\$host\$request_uri; }
}

server {
    listen 443 ssl http2;
    server_name ${DOMAIN};

    ssl_certificate     /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;

    root  ${APP_ROOT}/public;
    index index.php;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    server_tokens off;
    client_max_body_size 10M;

    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }

    location ~ \.php\$ {
        fastcgi_pass   unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_index  index.php;
        fastcgi_param  SCRIPT_FILENAME \$realpath_root\$fastcgi_script_name;
        include        fastcgi_params;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location ~ /\. { deny all; }
}
NGINX

echo "✅ Nginx config created: $NGINX_CONF"

# ─── 3. Test and reload Nginx ──────────────────────────────────────────────
nginx -t && systemctl reload nginx

echo "✅ Nginx reloaded"
echo "🎉 Domain ${DOMAIN} is now live with SSL!"
