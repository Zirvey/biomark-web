# 🚀 Railway Integration Guide

**Проект:** BioMarket  
**Статус:** ✅ **ЗАВЕРШЕНО**  
**Дата:** 2026-02-26

---

## ✅ ДЕПЛОЙ ЗАВЕРШЁН

**Бэкенд:** `https://biomark-web-production.up.railway.app`  
**Фронтенд:** `https://biomark-web.vercel.app`

---

## 📋 НАСТРОЙКИ RAILWAY

### Service Configuration

| Параметр | Значение |
|----------|----------|
| **Root Directory** | `/server` |
| **Start Command** | `node src/index.js` |
| **PORT** | `8080` |

### Environment Variables

```
DATABASE_URL=postgresql://postgres:...@postgres.railway.internal:5432/railway
JWT_SECRET=your-secret-key
FRONTEND_URL=https://biomark-web.vercel.app
NODE_ENV=production
```

---

## 🗄️ POSTGRESQL

**Автоматически создаётся Railway:**

1. New → Database → PostgreSQL
2. Выбрать тот же регион что бэкенд
3. `DATABASE_URL` добавится автоматически

---

## 📊 API ENDPOINTS

### Auth
- `POST /api/auth/register` — регистрация
- `POST /api/auth/login` — логин
- `POST /api/auth/logout` — logout
- `GET /api/auth/me` — текущий пользователь

### Users (GDPR)
- `GET /api/users/profile` — получить профиль
- `PUT /api/users/profile` — обновить профиль
- `DELETE /api/users/profile` — удалить аккаунт
- `GET /api/users/data` — export данных (GDPR)

### Orders
- `GET /api/orders` — список заказов
- `POST /api/orders` — создать заказ

### Subscriptions
- `GET /api/subscriptions` — получить подписку
- `POST /api/subscriptions` — создать подписку

### Payments
- `GET /api/payments` — история платежей
- `POST /api/payments/process` — обработать платёж

---

## ✅ ПРОВЕРКА

```bash
# Health check
curl https://biomark-web-production.up.railway.app/health

# Ожидаемый ответ:
{"status":"ok","environment":"production","timezone":"Europe/Prague"}
```

---

## 📝 VERCEL INTEGRATION

### Environment Variables (Vercel)

```
VITE_API_MODE=real
VITE_API_URL=https://biomark-web-production.up.railway.app
VITE_ENABLE_DEMO_LOGIN=false
```

---

**Интеграция завершена!** 🎉
