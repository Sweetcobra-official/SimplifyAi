# Simplify AI

Современная полнофункциональная платформа-агрегатор нейросетей с жидким неоновым стеклом (Liquid Glass), потоковым SSE-ответом, контекстной памятью диалогов и каскадной отказоустойчивостью моделей

---

## Стек технологий

- **Фронтенд:** React 19, Vite 6, Tailwind CSS 4, Motion, Lucide Icons
- **Бэкенд:** Node.js, Express, esbuild, `@google/genai` SDK
- **CI/CD:** GitHub Actions (`.github/workflows/ci.yml`)

---

## Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка переменных окружения

Скопируйте пример файла конфигурации:

```bash
cp .env.example .env
```

Заполните переменные:
- `IO_INTELLIGENCE_API_KEY`: **Обязателен** (основной API-ключ платформы IO Intelligence для генерации ответов и доступа к каталогу моделей)
- `IO_INTELLIGENCE_BASE_URL`: Опционален (по умолчанию: `https://api.intelligence.io.net/v1`)
- `GEMINI_API_KEY`: **Опционален** (резервный шлюз отказоустойчивости)

### 3. Запуск в режиме разработки

```bash
npm run dev
```

Приложение будет доступно по адресу: [http://localhost:3000](http://localhost:3000)

### 4. Продакшн сборка и запуск

```bash
# Сборка фронтенда (Vite) и бандла сервера (esbuild CommonJS)
npm run build

# Запуск скомпилированного сервера
npm start
```

---

## GitHub Actions CI

В проекте настроен пайплайн непрерывной интеграции в `.github/workflows/ci.yml`.

### Что проверяет CI:
1. **Lint & Typecheck**: валидация TypeScript типов через `npm run lint` (`tsc --noEmit`).
2. **Build**: полная компиляция фронтенда и бандла сервера через `npm run build`.
3. **Smoke Test**: запуск скомпилированного сервера в изолированной среде и проверка доступности эндпоинта `/api/models`.

### Секреты в GitHub (Repository Secrets):
Для запуска или деплоя добавьте в настройках репозитория (`Settings` -> `Secrets and variables` -> `Actions`):
- `IO_INTELLIGENCE_API_KEY` (обязателен)
- `GEMINI_API_KEY` (опционален)
