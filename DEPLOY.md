# Déploiement VPS — Job Tracker IA

## Prérequis serveur

- Ubuntu 22.04+ / Debian 12+
- Node.js 20+, pnpm, Docker, nginx, PM2
- PostgreSQL 16, Ollama

## Installation

```bash
git clone git@github.com:Florent-Desallangre/JTK.git
cd JTK
pnpm install
cp .env.example .env  # configurer les variables
docker compose up -d
npx prisma migrate deploy
pnpm nx build api
pnpm nx build web
ollama pull mistral
```

## PM2

```bash
pm2 start ecosystem.config.js
pm2 save
```

## Nginx (exemple)

```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    location / {
        proxy_pass http://localhost:3000;
    }

    location /api/ {
        rewrite ^/api/(.*) /$1 break;
        proxy_pass http://localhost:3001;
    }
}
```

## Checklist MVP

- [ ] `JWT_SECRET` et `TOKEN_ENCRYPTION_KEY` uniques en production
- [ ] HTTPS via certbot
- [ ] PostgreSQL sauvegardé
- [ ] Ollama actif avec modèle quantisé
- [ ] Gmail / Outlook OAuth configurés
- [ ] Telegram bot token configuré
