# Dynamic Planner — динамический планировщик и AI-Planner (`daten4`)

## Назначение проекта

Репозиторий `daten4` представляет собой проект **Dynamic Planner** — динамического планировщика на русском языке для управления шаблонами, формами, проектами, мероприятиями и документацией. В ветке `main` совмещены два формата поставки:

1. **Автономные однофайловые HTML-приложения (корень репозитория)** — готовые SPA-сборки на React, работающие локально в браузере без сервера (данные сохраняются в `localStorage`).
2. **Клиент-серверный модуль `ai-planner/`** — расширяемая система для работы с крупными шаблонами (5000+ строк), включающая разбиение на чанки (chunking), векторный поиск в ChromaDB, RAG-помощника и автозаполнение полей через Claude 3.5 Sonnet.

---

## Архитектура и основные компоненты

### 1. Автономные HTML-сборки (корень `main`)
Самодостаточные веб-приложения без серверных зависимостей (HTML + CSS с custom properties + встроенный JS-бандл React и `localStorage`):
- `dynamic-planner (1).html` (~450 КБ) — основная минифицированная сборка.
- `dynamic-planner(8).html` (~453 КБ) — альтернативная сборка.
- `dynamic-planner-DEMO.html` (~459 КБ) — демо-версия с предзагруженными примерами данных.
- `dynamic-planner-v2.html` (~245 КБ) — облегчённая версия 2.0.

*(По описанию в `CLAUDE.md` из ветки PR #2, автономные сборки используют React 19, Vite-бандл, Drag-and-Drop перестановку секций/полей, условные поля и автодополнение.)*

### 2. Подсистема `ai-planner/`
- **Backend API (`ai-planner/backend/`, пакет `ai-planner-backend` v1.0.0):**
  - `src/server.js` — Express-сервер (порт `PORT`, по умолчанию `3001`) с защитой `helmet`, `cors` (`FRONTEND_URL`, по умолчанию `http://localhost:5173`), лимитом тела запроса `10mb`, общим rate limiting (`100` запросов / 15 мин для `/api/`) и ограничением ИИ-запросов (`20` запросов / мин для `/api/ask` и `/api/autofill`).
  - `src/routes/api.js` — маршрутизация API (`GET /`, `GET /api/health`, `POST /api/chunk`, `POST /api/index`, `DELETE /api/index/:templateId`, `POST /api/search`, `POST /api/ask`, `POST /api/autofill`).
  - `src/services/chunking-engine.js` — движок разбиения крупных шаблонов на фрагменты.
  - `src/services/rag-engine.js` — логика векторного поиска (ChromaDB) и генерации ответов/автозаполнения (`@anthropic-ai/sdk`).
- **Frontend-компоненты (`ai-planner/frontend/src/`):**
  - `components/AIAssistant.jsx` — React-компонент интерфейса ИИ-помощника.
  - `services/api.js` — клиент для взаимодействия с Backend API.
  *(В ветке `main` внутри `ai-planner/frontend/` размещена папка `src/` без отдельного `package.json`; сервис `frontend` в `ai-planner/docker-compose.yml` закомментирован.)*
- **Скрипты, шаблоны, документация и Docker (`ai-planner/`):**
  - `scripts/chunk-template.js` — CLI-скрипт разбиения больших JSON-шаблонов на чанки.
  - `templates/`, `docs/`, `.github/`, `README.md`, `DEPLOYMENT.md`, `PROJECT_SUMMARY.md`.
  - `docker-compose.yml` — оркестрация сервисов `chromadb` (`ghcr.io/chroma-core/chroma:latest`, порт `8000`), `backend` (порт `3001`) и опционального `redis` (`redis:7-alpine`, порт `6379`).

---

## Стек технологий и структура каталогов

- **Автономные сборки:** HTML5, CSS3, React (однофайловая сборка), `localStorage`.
- **Модуль `ai-planner/backend`:** Node.js `>=18.0.0` (`npm >=9.0.0`), Express `^4.18.2`, `@anthropic-ai/sdk` `^0.27.0`, `chromadb` `^1.8.1`, `cors`, `dotenv`, `express-rate-limit`, `helmet`; для разработки и тестов — `jest`, `supertest`, `eslint`, `nodemon`.
- **Инфраструктура:** Docker / Docker Compose (ChromaDB, Node.js API, Redis).

```text
.
├── LICENSE
├── README.md
├── dynamic-planner (1).html
├── dynamic-planner(8).html
├── dynamic-planner-DEMO.html
├── dynamic-planner-v2.html
└── ai-planner/
    ├── .github/
    ├── DEPLOYMENT.md / PROJECT_SUMMARY.md / README.md
    ├── docker-compose.yml
    ├── docs/
    ├── scripts/chunk-template.js
    ├── templates/
    ├── backend/
    │   ├── .env.example
    │   ├── package.json
    │   └── src/{server.js, routes/api.js, services/}
    └── frontend/
        └── src/{components/AIAssistant.jsx, services/api.js}
```

---

## Ветки и статус разработки

- `main` *(защищённая ветка по умолчанию)* — содержит автономные HTML-файлы в корне, каталог `ai-planner/` и файл `LICENSE`.
- `claude/claude-md-mkux32w1dijtop14-tcSow` *(защищённая ветка, не влита в `main`)* — открыт Pull Request [#2](https://github.com/svend4/daten4/pull/2) (*«Add CLAUDE.md with comprehensive codebase documentation for AI assistants»*), добавляющий `CLAUDE.md` с документацией для однофайловых HTML-сборок (ветка ответвлена до добавления `ai-planner/`).
- `claude/review-repository-BWvEy` *(защищённая ветка, не влита в `main`)* — вспомогательная ветка без открытых PR.

---

## Установка и запуск

### Вариант 1: Автономные HTML-сборки (без сервера)
Клонируйте репозиторий и откройте любой из файлов (`dynamic-planner-DEMO.html`, `dynamic-planner (1).html`, `dynamic-planner-v2.html` или `dynamic-planner(8).html`) непосредственно в современном браузере.

### Вариант 2: Backend и инфраструктура `ai-planner/`
Требуются Node.js `>=18.0.0` и Docker (для ChromaDB):

```bash
git clone https://github.com/svend4/daten4.git
cd daten4/ai-planner

# Запуск векторной БД ChromaDB (или поднять стек через docker compose up)
docker run -p 8000:8000 ghcr.io/chroma-core/chroma:latest

# Установка и запуск Backend API
cd backend
npm install
# Настройте backend/.env (ANTHROPIC_API_KEY, OPENAI_API_KEY, CHROMA_URL=http://localhost:8000, PORT=3001)
npm run dev      # режим разработки (nodemon src/server.js)
# npm start      # обычный запуск (node src/server.js)
# npm test       # запуск тестов (jest --coverage)
# npm run lint   # проверка линтером (eslint src/**/*.js)
```

Для разбиения большого JSON-шаблона на фрагменты из `ai-planner/`:
```bash
node scripts/chunk-template.js \
  --input templates/large-doc.json \
  --output templates/large-doc.chunks.json \
  --chunk-size 500
```

---

## Лицензия

- В корне ветки `main` размещён файл [LICENSE](LICENSE) с лицензией **GNU Affero General Public License v3.0 (AGPL-3.0)**.
- Внутри модуля `ai-planner/` (`ai-planner/backend/package.json` и `ai-planner/README.md`) дополнительно указана лицензия **MIT**.
