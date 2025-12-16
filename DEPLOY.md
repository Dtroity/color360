# Инструкция по деплою на сервер TimeWeb

## Сервер
- **IP**: 5.129.225.163
- **Домен**: www.color360.ru
- **SSH**: `ssh root@5.129.225.163`

## Подготовка к деплою

### Шаг 1: Подготовка локального проекта

Перед деплоем убедитесь, что проект готов:

```bash
# 1. Убедитесь, что все изменения закоммичены
git status

# 2. Проверьте, что проект собирается без ошибок
pnpm install
pnpm --filter backend build
pnpm --filter frontend build

# 3. Запушите изменения в репозиторий
git push origin main
```

### Шаг 2: Подключение к серверу

```bash
# Подключитесь к серверу по SSH
# ssh root@5.129.225.163
```

### Шаг 3: Установка необходимого ПО на сервере

```bash
# Обновление системы (для Ubuntu/Debian)
apt update && apt upgrade -y

# Установка Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Установка pnpm
npm install -g pnpm

# Установка PM2 для управления процессами
npm install -g pm2

# Установка PostgreSQL (если еще не установлен)
apt install -y postgresql postgresql-contrib

# Установка Nginx (если еще не установлен)
apt install -y nginx

# Установка Git (если еще не установлен)
apt install -y git

# Установка certbot для SSL сертификатов
apt install -y certbot python3-certbot-nginx
```

### Шаг 4: Настройка PostgreSQL

```bash
# Переключиться на пользователя postgres
su - postgres

# Создать базу данных и пользователя
psql

# В psql выполнить:
CREATE DATABASE video_shop;
CREATE USER postgres WITH PASSWORD 'your_secure_password';
ALTER ROLE postgres SET client_encoding TO 'utf8';
ALTER ROLE postgres SET default_transaction_isolation TO 'read committed';
ALTER ROLE postgres SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE video_shop TO postgres;
\q

# Выйти из пользователя postgres
exit
```

### Шаг 5: Клонирование проекта на сервер

```bash
# Создать директорию проекта
mkdir -p /var/www/color360
cd /var/www/color360

# Клонировать репозиторий (замените на ваш URL)
git clone <your-repo-url> .

# Или если репозиторий уже существует, обновить его
git pull origin main
```

### Шаг 6: Настройка переменных окружения

#### Backend (.env в `apps/backend/`)

```bash
cd /var/www/color360/apps/backend
nano .env
```

Содержимое файла `.env`:
```env
NODE_ENV=production
PORT=3001
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your_secure_password
DATABASE_NAME=video_shop
FRONTEND_URL=https://www.color360.ru
JWT_SECRET=your_jwt_secret_key_here
```

#### Frontend (.env.local в `apps/frontend/`)

```bash
cd /var/www/color360/apps/frontend
nano .env.local
```

Содержимое файла `.env.local`:
```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://www.color360.ru/api
```

### Шаг 7: Установка зависимостей и сборка

```bash
cd /var/www/color360

# Установка зависимостей
pnpm install --prod

# Сборка backend
pnpm --filter backend build

# Сборка frontend
pnpm --filter frontend build
```

### Шаг 8: Создание необходимых директорий

```bash
# Создать папки для загрузок
mkdir -p /var/www/color360/apps/backend/uploads/products
mkdir -p /var/www/color360/apps/backend/uploads/general

# Установить правильные права доступа
chmod -R 755 /var/www/color360/apps/backend/uploads
chown -R www-data:www-data /var/www/color360/apps/backend/uploads

# Создать папку для логов PM2
mkdir -p /var/www/color360/logs
```

### Шаг 9: Запуск миграций базы данных

```bash
cd /var/www/color360/apps/backend
pnpm run migration:run
```

### Шаг 10: Настройка PM2

Создать файл `ecosystem.config.js` в корне проекта:

```bash
cd /var/www/color360
nano ecosystem.config.js
```

Содержимое файла:

```javascript
module.exports = {
  apps: [
    {
      name: 'color360-backend',
      script: './apps/backend/dist/main.js',
      cwd: '/var/www/color360',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '1G',
    },
    {
      name: 'color360-frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: '/var/www/color360/apps/frontend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '1G',
    },
  ],
};
```

Запуск приложений через PM2:

```bash
# Запустить приложения
pm2 start ecosystem.config.js

# Сохранить конфигурацию PM2
pm2 save

# Настроить автозапуск при перезагрузке сервера
pm2 startup
# Выполните команду, которую выведет PM2 (обычно что-то вроде: sudo env PATH=... pm2 startup systemd -u root --hp /root)
```

### Шаг 11: Настройка Nginx

Создать конфигурационный файл Nginx:

```bash
nano /etc/nginx/sites-available/color360
```

Содержимое файла:

```nginx
# Редирект HTTP на HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name www.color360.ru color360.ru;

    # Редирект на HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS конфигурация
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.color360.ru color360.ru;

    # SSL сертификаты (будут настроены через certbot)
    ssl_certificate /etc/letsencrypt/live/www.color360.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/www.color360.ru/privkey.pem;
    
    # SSL настройки
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Увеличение размера загружаемых файлов
    client_max_body_size 50M;

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API Backend
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Статические файлы (uploads)
    location /uploads {
        alias /var/www/color360/apps/backend/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Статические файлы frontend
    location /_next/static {
        alias /var/www/color360/apps/frontend/.next/static;
        expires 365d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Favicon и другие статические файлы
    location /favicon.ico {
        alias /var/www/color360/apps/frontend/public/favicon.ico;
        access_log off;
    }
}
```

Активировать конфигурацию:

```bash
# Создать символическую ссылку
ln -s /etc/nginx/sites-available/color360 /etc/nginx/sites-enabled/

# Удалить дефолтную конфигурацию (если есть)
rm /etc/nginx/sites-enabled/default

# Проверить конфигурацию Nginx
nginx -t

# Перезагрузить Nginx
systemctl reload nginx
```

### Шаг 12: Настройка SSL сертификата (Let's Encrypt)

```bash
# Получить SSL сертификат
certbot --nginx -d www.color360.ru -d color360.ru

# Certbot автоматически обновит конфигурацию Nginx
# Проверить автопродление сертификата
certbot renew --dry-run
```

### Шаг 13: Настройка файрвола

```bash
# Установить UFW (если еще не установлен)
apt install -y ufw

# Разрешить SSH
ufw allow 22/tcp

# Разрешить HTTP и HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Включить файрвол
ufw enable

# Проверить статус
ufw status
```

### Шаг 14: Проверка работы

```bash
# Проверить статус PM2
pm2 status

# Проверить логи backend
pm2 logs color360-backend --lines 50

# Проверить логи frontend
pm2 logs color360-frontend --lines 50

# Проверить работу API
curl http://localhost:3001/api/products

# Проверить работу frontend
curl http://localhost:3000

# Проверить статус Nginx
systemctl status nginx

# Проверить статус PostgreSQL
systemctl status postgresql
```

Откройте в браузере:
- https://www.color360.ru
- https://www.color360.ru/api/products

## Обновление проекта

Для обновления проекта после изменений:

```bash
# 1. Подключиться к серверу
ssh root@5.129.225.163

# 2. Перейти в директорию проекта
cd /var/www/color360

# 3. Получить последние изменения
git pull origin main

# 4. Установить новые зависимости (если есть)
pnpm install --prod

# 5. Пересобрать проект
pnpm --filter backend build
pnpm --filter frontend build

# 6. Запустить миграции (если есть новые)
cd apps/backend
pnpm run migration:run
cd ../..

# 7. Перезапустить приложения
pm2 restart all

# 8. Проверить логи
pm2 logs --lines 50
```

## Настройка автоматических бэкапов

Создать скрипт для бэкапа базы данных:

```bash
nano /var/www/color360/backup-db.sh
```

Содержимое:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/color360"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="video_shop"
DB_USER="postgres"

mkdir -p $BACKUP_DIR
pg_dump -U $DB_USER $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# Удалить бэкапы старше 30 дней
find $BACKUP_DIR -name "db_backup_*.sql" -mtime +30 -delete
```

Сделать скрипт исполняемым:

```bash
chmod +x /var/www/color360/backup-db.sh
```

Настроить cron для ежедневных бэкапов:

```bash
crontab -e
```

Добавить строку (бэкап каждый день в 3:00):

```
0 3 * * * /var/www/color360/backup-db.sh
```

## Мониторинг и обслуживание

### Полезные команды PM2

```bash
# Просмотр статуса всех приложений
pm2 status

# Просмотр мониторинга в реальном времени
pm2 monit

# Просмотр логов всех приложений
pm2 logs

# Перезапуск конкретного приложения
pm2 restart color360-backend

# Остановка приложения
pm2 stop color360-backend

# Удаление приложения из PM2
pm2 delete color360-backend
```

### Полезные команды для диагностики

```bash
# Проверить использование диска
df -h

# Проверить использование памяти
free -h

# Проверить использование CPU
top

# Проверить активные соединения
netstat -tulpn

# Проверить логи Nginx
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log

# Проверить логи PostgreSQL
tail -f /var/log/postgresql/postgresql-*.log
```

## Важные замечания

1. **Безопасность**:
   - Используйте сильные пароли для базы данных
   - Регулярно обновляйте систему и зависимости
   - Настройте регулярные бэкапы
   - Ограничьте доступ к серверу по SSH (используйте ключи вместо паролей)

2. **Производительность**:
   - Настройте кэширование в Nginx
   - Используйте CDN для статических файлов
   - Настройте мониторинг производительности

3. **Масштабирование**:
   - При необходимости увеличьте количество инстансов в PM2
   - Рассмотрите использование балансировщика нагрузки
   - Настройте репликацию базы данных

4. **Обновления**:
   - Регулярно обновляйте зависимости проекта
   - Следите за обновлениями безопасности
   - Тестируйте обновления на staging окружении перед продакшеном

## Альтернативный вариант: Docker деплой

Если предпочитаете использовать Docker, можно использовать готовые Dockerfile:

```bash
cd /var/www/color360
docker-compose -f docker/docker-compose.prod.yml up -d
```

Этот вариант требует установки Docker и Docker Compose на сервере.

