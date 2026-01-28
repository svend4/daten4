# 🤖 AI-Powered Динамический Планировщик

Интеллектуальная система управления большими шаблонами с поддержкой AI, chunking и RAG (Retrieval-Augmented Generation).

## 🎯 Возможности

- ✅ **Chunking System** - автоматическое разбиение больших шаблонов (5000+ строк) на части по ~500 строк
- ✅ **AI Assistant** - помощник на базе Claude API для ответов на вопросы
- ✅ **Auto-Fill** - автоматическое заполнение полей на основе контекста
- ✅ **Semantic Search** - умный поиск по содержимому через векторную БД
- ✅ **GitHub Integration** - хранение и версионирование шаблонов
- ✅ **RAG System** - ответы на основе релевантного контекста из документации

## 🏗️ Архитектура

```
Frontend (React)
    ↓
Backend API (Node.js + Express)
    ↓
Vector Database (ChromaDB)
    ↓
AI Models (Claude 3.5 Sonnet)
```

## 📦 Структура проекта

```
ai-planner/
├── frontend/           # React приложение
│   ├── src/
│   │   ├── components/ # UI компоненты
│   │   ├── services/   # API клиенты
│   │   └── utils/      # Утилиты
│   └── package.json
│
├── backend/            # Node.js API
│   ├── src/
│   │   ├── routes/     # API endpoints
│   │   ├── services/   # Бизнес-логика
│   │   └── utils/      # Хелперы
│   └── package.json
│
├── scripts/            # Утилиты для обработки
│   ├── chunk-template.js
│   └── generate-embeddings.js
│
├── templates/          # Примеры шаблонов
│   └── examples/
│
└── docs/              # Документация
```

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

### 2. Настройка переменных окружения

Создайте `.env` файлы:

**backend/.env:**
```env
ANTHROPIC_API_KEY=your_claude_api_key
OPENAI_API_KEY=your_openai_key_for_embeddings
CHROMA_URL=http://localhost:8000
PORT=3001
```

**frontend/.env:**
```env
VITE_API_URL=http://localhost:3001
```

### 3. Запуск ChromaDB (Vector Database)

```bash
docker run -p 8000:8000 ghcr.io/chroma-core/chroma:latest
```

### 4. Запуск приложения

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

Откройте http://localhost:5173

## 📚 Использование

### Создание большого шаблона

```javascript
// Пример: Шаблон документации API на 5000+ строк
{
  "name": "API Documentation",
  "description": "Полная документация API проекта",
  "sections": [
    {
      "name": "Endpoints",
      "fields": [
        {
          "id": "endpoint-url",
          "type": "text",
          "label": "URL endpoint",
          "aiAutoFill": true,
          "aiPrompt": "Предложи стандартный REST URL на основе описания"
        }
      ]
    }
  ]
}
```

### Автоматическое разбиение на чанки

```bash
node scripts/chunk-template.js \
  --input templates/large-doc.json \
  --output templates/large-doc.chunks.json \
  --chunk-size 500
```

### Использование AI помощника

```javascript
// В приложении
import AIAssistant from './components/AIAssistant';

<AIAssistant
  template={template}
  onAutoFill={(fieldId, value) => {
    // Обработка автозаполнения
  }}
/>
```

## 🔧 API Endpoints

### POST /api/search
Семантический поиск по шаблонам

```bash
curl -X POST http://localhost:3001/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Как добавить новый endpoint?", "topK": 3}'
```

### POST /api/ask
Задать вопрос AI помощнику

```bash
curl -X POST http://localhost:3001/api/ask \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Какие поля обязательные?",
    "templateId": "template-123"
  }'
```

### POST /api/autofill
Автозаполнение поля

```bash
curl -X POST http://localhost:3001/api/autofill \
  -H "Content-Type: application/json" \
  -d '{
    "fieldId": "field-description",
    "context": {"projectName": "My API"}
  }'
```

## 🤖 GitHub Actions

Автоматическая индексация при push:

```yaml
# .github/workflows/index-templates.yml
name: Index Templates
on:
  push:
    paths:
      - 'templates/**/*.json'
jobs:
  index:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: node scripts/generate-embeddings.js
```

## 📖 Примеры шаблонов

### 1. API Documentation (5000+ строк)
```bash
templates/examples/api-documentation.json
```

### 2. Knowledge Base (3000+ строк)
```bash
templates/examples/knowledge-base.json
```

### 3. Project Requirements (2000+ строк)
```bash
templates/examples/project-requirements.json
```

## 🔒 Безопасность

- API ключи хранятся в `.env` (не коммитятся)
- CORS настроен для безопасных запросов
- Rate limiting на API endpoints
- Валидация всех входных данных

## 💰 Стоимость использования

**Для шаблона на 5000 строк:**
- Индексация: ~$0.05 (один раз)
- 100 вопросов/день: ~$3/месяц
- 50 автозаполнений/день: ~$2/месяц

**Итого: ~$5-7/месяц**

## 🛠️ Технологии

- **Frontend**: React 18, Vite, TailwindCSS
- **Backend**: Node.js, Express, ChromaDB Client
- **AI**: Anthropic Claude 3.5 Sonnet, OpenAI Embeddings
- **Database**: ChromaDB (Vector DB)
- **DevOps**: Docker, GitHub Actions

## 📄 Лицензия

MIT License

## 🤝 Contributing

См. [CONTRIBUTING.md](docs/CONTRIBUTING.md)

## 📞 Контакты

- GitHub Issues: https://github.com/svend4/daten4/issues
- Email: stefan.engel.de@gmail.com

---

**Версия:** 1.0.0-beta
**Последнее обновление:** 2026-01-26
