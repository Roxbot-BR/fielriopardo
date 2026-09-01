#!/bin/bash
DOMAIN="fielriopardo.com.br"
EMAIL="thiago@rochanet.net.br"
LOG="/opt/fielriopardo/logs/ssl-auto.log"
mkdir -p /opt/fielriopardo/logs

# Checa se DNS já resolve para nosso IP
RESOLVED=$(dig +short $DOMAIN @8.8.8.8 2>/dev/null | head -1)
if [ "$RESOLVED" != "143.0.241.55" ]; then
  echo "$(date): DNS ainda propagando ($RESOLVED)" >> $LOG
  exit 0
fi

# Já tem certificado válido?
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
  echo "$(date): Certificado já existe" >> $LOG
  exit 0
fi

echo "$(date): DNS OK ($RESOLVED) — emitindo SSL..." >> $LOG
certbot certonly --webroot -w /var/www/certbot   -d "$DOMAIN" -d "www.$DOMAIN"   --non-interactive --agree-tos -m "$EMAIL" >> $LOG 2>&1

if [ $? -eq 0 ]; then
  # Ativa HTTPS no Nginx
  cat > /opt/fielriopardo/nginx/conf.d/fielriopardo.conf << NGINXEOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$host\$request_uri;
}
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    ssl_certificate     /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-Content-Type-Options nosniff;
    add_header Referrer-Policy no-referrer-when-downgrade;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location /api/ {
        proxy_pass         http://127.0.0.1:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header   Host \$host;
        proxy_set_header   X-Real-IP \$remote_addr;
        proxy_set_header   X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
    }
    location /socket.io/ {
        proxy_pass         http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade \$http_upgrade;
        proxy_set_header   Connection upgrade;
        proxy_set_header   Host \$host;
        proxy_set_header   X-Real-IP \$remote_addr;
    }
    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Host \$host;
        proxy_set_header   X-Real-IP \$remote_addr;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINXEOF
  /usr/sbin/nginx -t && /usr/sbin/nginx -s reload
  echo "$(date): HTTPS ativo!" >> $LOG
  # Remove este cron job
  crontab -l | grep -v ssl-auto | crontab -
fi
