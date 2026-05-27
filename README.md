# ЦОД — Система управления КП

Внутренняя web-система для формирования коммерческих предложений (КП) из актуального прайс-листа ЦОД, с подписью ЭЦП и отправкой клиентам.

## Роли и тестовые аккаунты

| Роль | Email | Пароль |
|------|-------|--------|
| Менеджер | manager@cod.kz | manager123 |
| Менеджер 2 | manager2@cod.kz | manager123 |
| Руководитель | head@cod.kz | head123 |
| Администратор | admin@cod.kz | admin123 |

## Быстрый старт

### Бэкенд (Python + FastAPI)
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
python seed.py                # Заполнить БД начальными данными
uvicorn app.main:app --reload # Запустить на http://localhost:8000
```

### Фронтенд (React + Vite)
```bash
cd frontend
npm install
npm run dev                   # Запустить на http://localhost:5173
```

## Структура проекта

```
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI приложение
│   │   ├── models.py         # SQLAlchemy модели
│   │   ├── schemas.py        # Pydantic схемы
│   │   ├── auth.py           # JWT авторизация
│   │   ├── routers/          # API роутеры
│   │   └── services/         # PDF, Email сервисы
│   ├── seed.py               # Начальные данные
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/            # Страницы приложения
│   │   ├── components/       # Переиспользуемые компоненты
│   │   ├── store/            # Zustand (корзина, авторизация)
│   │   └── api/              # API клиент и типы
│   └── package.json
└── PRD.md                    # Техническое задание
```

## Workflow КП

```
[Сформировано] → [Подписано менеджером] → [На согласовании]
    → [Подписано руководителем] → [Отправлено клиенту]
```

## Технологии

- **Бэкенд:** Python, FastAPI, SQLAlchemy, SQLite, JWT, fpdf2
- **Фронтенд:** React 18, TypeScript, Vite, Tailwind CSS, Zustand
- **Интеграции:** NCALayer ЭЦП (mock), Email (mock → SMTP)
