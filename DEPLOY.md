# Инструкция по деплою на сервер TimeWeb

## Сервер
- **IP**: 5.129.225.163
- **Домен**: www.color360.ru
- **SSH**: `ssh root@5.129.225.163`

## Подготовка к деплою

### 1. Переменные окружения

#### Backend (.env в `apps/backend/`)
```env
NODE_ENV=production
PORT=3001
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=video_shop
FRONTEND_URL=https://www.color360.ru
```

#### Frontend (.env.local в `apps/frontend/`)
```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://www.color360.ru/api
```

### 2. Сборка проекта

```bash
# Установка зависимостей
pnpm install

# Сборка backend
pnpm --filter backend build

# Сборка frontend
pnpm --filter frontend build
```

### 3. Структура на сервере

```
/var/www/color360/
├── backend/          # Скомпилированный backend
├── frontend/         # Скомпилированный frontend
├── uploads/          # Загруженные файлы
├── .env              # Переменные окружения backend
└── .env.local        # Переменные окружения frontend
```

### 4. Команды для деплоя

#### На сервере (через SSH)

```bash
# 1. Создать директорию проекта
mkdir -p /var/www/color360
cd /var/www/color360

# 2. Клонировать репозиторий (или загрузить файлы)
git clone <your-repo-url> .

# 3. Установить зависимости
pnpm install --prod

# 4. Собрать проект
pnpm --filter backend build
pnpm --filter frontend build

# 5. Настроить переменные окружения
cp apps/backend/.env.example apps/backend/.env
# Отредактировать apps/backend/.env

cp apps/frontend/.env.example apps/frontend/.env.local
# Отредактировать apps/frontend/.env.local

# 6. Создать папку для загрузок
mkdir -p apps/backend/uploads/general
mkdir -p apps/backend/uploads/products

# 7. Настроить PostgreSQL
# Создать базу данных и пользователя

# 8. Запустить миграции (если есть)
cd apps/backend
pnpm run migration:run

# 9. Настроить PM2 для backend
pm2 start apps/backend/dist/main.js --name color360-backend

# 10. Настроить Nginx для frontend и проксирование API
# См. конфигурацию nginx ниже
```

### 5. Конфигурация Nginx

```nginx
server {
    listen 80;
    server_name www.color360.ru color360.ru;

    # Редирект на HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name www.color360.ru color360.ru;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
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
    }

    # Статические файлы frontend
    location /_next/static {
        alias /var/www/color360/apps/frontend/.next/static;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }
}
```

### 6. PM2 конфигурация

Создать файл `ecosystem.config.js` в корне проекта:

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

Запуск:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 7. Проверка работы

```bash
# Проверить статус PM2
pm2 status

# Проверить логи
pm2 logs color360-backend
pm2 logs color360-frontend

# Проверить работу API
curl https://www.color360.ru/api/products

# Проверить работу frontend
curl https://www.color360.ru
```

### 8. Обновление проекта

```bash
# На сервере
cd /var/www/color360
git pull
pnpm install --prod
pnpm --filter backend build
pnpm --filter frontend build
pm2 restart all
```

## Важные замечания

1. **База данных**: Убедитесь, что PostgreSQL настроен и доступен
2. **SSL сертификат**: Настройте SSL сертификат для домена (Let's Encrypt)
3. **Бэкапы**: Настройте регулярные бэкапы базы данных
4. **Мониторинг**: Настройте мониторинг через PM2 или другой инструмент
5. **Логи**: Регулярно проверяйте логи на ошибки

