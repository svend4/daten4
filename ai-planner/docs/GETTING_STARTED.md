# 🚀 Getting Started - AI-Powered Dynamic Planner

Полное руководство по установке и запуску AI-Powered Dynamic Planner.

## 📋 Содержание

1. [Требования](#требования)
2. [Быстрый старт](#быстрый-старт)
3. [Установка для разработки](#установка-для-разработки)
4. [Установка для production](#установка-для-production)
5. [Получение API ключей](#получение-api-ключей)
6. [Первый запуск](#первый-запуск)
7. [Troubleshooting](#troubleshooting)

---

## Требования

### Минимальные требования:

- **Node.js:** v18.0.0 или выше
- **npm:** v9.0.0 или выше
- **Docker:** v20.0 или выше (опционально, для ChromaDB)
- **Git:** для клонирования репозитория

### API Ключи:

- **Anthropic API Key** - для Claude 3.5 Sonnet (обязательно)
- **OpenAI API Key** - для embeddings (обязательно)

---

## Быстрый старт

### Вариант 1: Docker Compose (Рекомендуется)

```bash
# 1. Клонируйте репозиторий
git clone https://github.com/svend4/daten4.git
cd daten4/ai-planner

# 2. Создайте .env файл
cp backend/.env.example backend/.env

# 3. Добавьте ваши API ключи в backend/.env
# ANTHROPIC_API_KEY=sk-ant-...
# OPENAI_API_KEY=sk-...

# 4. Запустите всё через Docker
docker-compose up -d

# 5. Проверьте статус
docker-compose ps

# 6. Откройте браузер
# Backend API: http://localhost:3001
# ChromaDB: http://localhost:8000
```

### Вариант 2: Локальная установка

```bash
# 1. Клонируйте репозиторий
git clone https://github.com/svend4/daten4.git
cd daten4/ai-planner

# 2. Установите зависимости backend
cd backend
npm install
cp .env.example .env
# Отредактируйте .env файл

# 3. Установите зависимости frontend
cd ../frontend
npm install

# 4. Запустите ChromaDB (в отдельном терминале)
docker run -p 8000:8000 ghcr.io/chroma-core/chroma:latest

# 5. Запустите backend (в отдельном терминале)
cd backend
npm run dev

# 6. Запустите frontend (в отдельном терминале)
cd frontend
npm run dev
```

---

## Установка для разработки

### 1. Backend

```bash
cd backend

# Установка зависимостей
npm install

# Настройка окружения
cp .env.example .env
nano .env  # или любой другой редактор

# Запуск в режиме разработки (с hot-reload)
npm run dev

# Тесты
npm test

# Линтинг
npm run lint
```

**backend/.env:**
```env
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
OPENAI_API_KEY=sk-xxxxx
PORT=3001
NODE_ENV=development
CHROMA_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
```

### 2. Frontend

```bash
cd frontend

# Установка зависимостей
npm install

# Настройка окружения
cp .env.example .env
nano .env

# Запуск dev сервера
npm run dev

# Build для production
npm run build

# Preview production build
npm run preview
```

**frontend/.env:**
```env
VITE_API_URL=http://localhost:3001
```

### 3. ChromaDB

```bash
# Через Docker (рекомендуется)
docker run -d \
  --name chromadb \
  -p 8000:8000 \
  -v $(pwd)/chroma-data:/chroma/chroma \
  ghcr.io/chroma-core/chroma:latest

# Проверка статуса
curl http://localhost:8000/api/v1/heartbeat
```

---

## Установка для Production

### С использованием Docker Compose

```bash
# 1. Подготовьте окружение
cp backend/.env.example backend/.env
# Заполните production переменные

# 2. Build и запуск
docker-compose -f docker-compose.prod.yml up -d

# 3. Проверка логов
docker-compose logs -f

# 4. Остановка
docker-compose down

# 5. Обновление
git pull
docker-compose up -d --build
```

### Ручная установка на сервере

```bash
# 1. Backend
cd backend
npm ci --only=production
npm start

# 2. Frontend (build и раздача через nginx)
cd frontend
npm ci
npm run build
# Скопируйте dist/ в nginx

# 3. Настройка nginx
# См. docs/nginx-config.md

# 4. Настройка systemd
# См. docs/systemd-setup.md
```

---

## Получение API ключей

### Anthropic API (Claude)

1. Перейдите на https://console.anthropic.com
2. Зарегистрируйтесь или войдите
3. Перейдите в API Keys
4. Создайте новый ключ
5. Скопируйте ключ (начинается с `sk-ant-`)

**Стоимость:**
- Claude 3.5 Sonnet: $3 / 1M input tokens, $15 / 1M output tokens
- Для шаблона на 5000 строк: ~$5-7/месяц при активном использовании

### OpenAI API (Embeddings)

1. Перейдите на https://platform.openai.com
2. Зарегистрируйтесь или войдите
3. Перейдите в API Keys
4. Создайте новый ключ
5. Скопируйте ключ (начинается с `sk-`)

**Стоимость:**
- text-embedding-3-large: $0.13 / 1M tokens
- Для индексации 5000 строк: ~$0.05 (одноразово)

---

## Первый запуск

### 1. Проверка здоровья системы

```bash
# Проверка backend
curl http://localhost:3001/api/health

# Ожидаемый ответ:
# {
#   "status": "ok",
#   "services": {
#     "chunking": "ready",
#     "rag": "ready",
#     "chroma": "http://localhost:8000"
#   }
# }
```

### 2. Загрузка примера шаблона

```bash
# Разбиение на чанки
node scripts/chunk-template.js \
  --input templates/examples/api-documentation.json \
  --output templates/examples/api-documentation.chunks.json

# Индексация (через API)
curl -X POST http://localhost:3001/api/index \
  -H "Content-Type: application/json" \
  -d @templates/examples/api-documentation.chunks.json
```

### 3. Тестирование AI функций

```bash
# Поиск
curl -X POST http://localhost:3001/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Как добавить endpoint?",
    "topK": 3
  }'

# Вопрос AI
curl -X POST http://localhost:3001/api/ask \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Какие поля обязательные?",
    "context": {
      "templateId": "template-api-docs-001"
    }
  }'
```

### 4. Открытие веб-интерфейса

```bash
# Откройте в браузере:
http://localhost:5173
```

---

## Troubleshooting

### Проблема: ChromaDB не запускается

**Симптомы:**
```
Error: Connection refused to http://localhost:8000
```

**Решение:**
```bash
# Проверьте статус Docker контейнера
docker ps | grep chroma

# Перезапустите ChromaDB
docker restart chromadb

# Проверьте логи
docker logs chromadb

# Если не помогает - удалите и создайте заново
docker rm -f chromadb
docker run -d -p 8000:8000 --name chromadb ghcr.io/chroma-core/chroma:latest
```

### Проблема: Backend не может подключиться к ChromaDB

**Симптомы:**
```
Failed to initialize RAG Engine
```

**Решение:**
1. Убедитесь что ChromaDB запущен: `curl http://localhost:8000/api/v1/heartbeat`
2. Проверьте `CHROMA_URL` в `.env`
3. Если в Docker - используйте имя сервиса: `CHROMA_URL=http://chromadb:8000`

### Проблема: AI запросы возвращают ошибки

**Симптомы:**
```
API request failed: 401 Unauthorized
```

**Решение:**
1. Проверьте API ключи в `.env`
2. Убедитесь что ключи не содержат лишних пробелов
3. Проверьте баланс на аккаунтах Anthropic/OpenAI

### Проблема: Rate limiting ошибки

**Симптомы:**
```
Too many AI requests, please slow down
```

**Решение:**
- Подождите 1 минуту
- Или увеличьте лимит в `backend/src/server.js`:
  ```javascript
  const aiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 50  // Было 20
  });
  ```

### Проблема: Большой шаблон не разбивается

**Симптомы:**
```
Memory limit exceeded
```

**Решение:**
```bash
# Увеличьте память Node.js
NODE_OPTIONS="--max-old-space-size=4096" node scripts/chunk-template.js ...

# Или уменьшите chunk size
node scripts/chunk-template.js --chunk-size 300 ...
```

### Проблема: Frontend не может подключиться к Backend

**Симптомы:**
```
Network error or server unavailable
```

**Решение:**
1. Проверьте `VITE_API_URL` в `frontend/.env`
2. Убедитесь что backend запущен: `curl http://localhost:3001/api/health`
3. Проверьте CORS настройки в `backend/src/server.js`

---

## Полезные команды

```bash
# Логи всех сервисов
docker-compose logs -f

# Логи только backend
docker-compose logs -f backend

# Перезапуск сервиса
docker-compose restart backend

# Остановка всего
docker-compose down

# Остановка с удалением volumes
docker-compose down -v

# Проверка занятого места
docker system df

# Очистка
docker system prune -a
```

---

## Следующие шаги

После успешной установки:

1. 📚 Прочитайте [User Guide](./USER_GUIDE.md)
2. 🔧 Изучите [API Reference](./API_REFERENCE.md)
3. 🎨 Создайте свой первый [Custom Template](./TEMPLATE_GUIDE.md)
4. 🤝 Присоединяйтесь к [Community Discord](#)

---

## Поддержка

- 📧 Email: stefan.engel.de@gmail.com
- 🐛 Issues: https://github.com/svend4/daten4/issues
- 💬 Discussions: https://github.com/svend4/daten4/discussions

---

**Документация обновлена:** 2026-01-26
**Версия:** 1.0.0-beta
