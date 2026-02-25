# 🚀 Railway Backend Integration Guide

**Проект:** BioMarket  
**Статус:** MVP / Тестирование (не продакшен)  
**Локация:** 🇨🇿 Чехия (EU/GDPR)  
**Дата создания:** 2026-02-25

---

## 🇨🇿 ЧЕХИЯ-СПЕЦИФИЧНЫЕ ТРЕБОВАНИЯ

### GDPR (EU Regulation)
- [ ] Право на доступ к данным (GET /api/users/data)
- [ ] Право на удаление (DELETE /api/users/profile)
- [ ] Право на исправление (PUT /api/users/profile)
- [ ] Privacy Policy на сайте

### Чешская локализация
- [ ] Валюта: CZK (Kč) ✅ Уже есть
- [ ] Часовой пояс: Europe/Prague (UTC+1)
- [ ] Даты: dd. MM. yyyy (25. 02. 2026)
- [ ] Телефоны: +420 XXX XXX XXX
- [ ] Адреса: Ulice 123/45, 110 00 Praha 1
- [ ] Районы доставки: Praha 1-10, Holešovice, Vinohrady, etc.

### Продакшен (потом):
- [ ] Чешский язык API (опционально)
- [ ] Bank transfer (převodem)
- [ ] IČO/DIČ для юр лиц
- [ ] EET (Evidence Tržeb) ⏸️ Пока не нужно для подписок

---

## 📋 ЦЕЛИ ЭТАПА (MVP)

### ✅ Сделать сейчас:
- [ ] Базовая аутентификация (register, login, logout)
- [ ] Профиль пользователя (GET, PUT)
- [ ] Подписки (создание, получение)
- [ ] Заказы (создание, получение списка)
- [ ] Платежи (mock для тестирования)
- [ ] PostgreSQL база данных
- [ ] Деплой на Railway

### ⏸️ Отложить на продакшен:
- [ ] Email уведомления
- [ ] Stripe webhooks (реальные платежи)
- [ ] Rate limiting
- [ ] Продвинутый мониторинг (Sentry)
- [ ] HTTPS (Railway даёт автоматически)
- [ ] Domain mapping (кастомный домен)
- [ ] CI/CD pipeline
- [ ] Нагрузочное тестирование

---

## 🏗 СТРУКТУРА ПРОЕКТА

```
biomark-web/
├── src/                          # ФРОНТЕНД (существующий)
│   ├── js/
│   │   ├── services/
│   │   │   ├── api.js            # ← Переключить на real режим
│   │   │   ├── authService.js
│   │   │   └── ...
│   │   └── ...
│   ├── css/
│   └── *.html
│
├── server/                       # ← НОВАЯ ПАПКА (Бэкенд)
│   ├── src/
│   │   ├── index.js              # Точка входа (Express)
│   │   │
│   │   ├── routes/               # API endpoints
│   │   │   ├── auth.js           # POST /api/auth/register, /login, /logout
│   │   │   ├── users.js          # GET/PUT /api/users/profile
│   │   │   ├── orders.js         # GET/POST /api/orders
│   │   │   ├── subscriptions.js  # GET/POST /api/subscriptions
│   │   │   └── payments.js       # POST /api/payments/process
│   │   │
│   │   ├── controllers/          # Логика endpoints
│   │   │   ├── authController.js
│   │   │   ├── userController.js
│   │   │   ├── orderController.js
│   │   │   ├── subscriptionController.js
│   │   │   └── paymentController.js
│   │   │
│   │   ├── models/               # Prisma модели
│   │   │   ├── User.js
│   │   │   ├── Order.js
│   │   │   ├── OrderItem.js
│   │   │   ├── Subscription.js
│   │   │   └── Payment.js
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.js           # JWT проверка
│   │   │   ├── cors.js           # CORS настройки
│   │   │   ├── errorHandler.js   # Глобальная обработка ошибок
│   │   │   └── validate.js       # Валидация запросов (Zod)
│   │   │
│   │   ├── services/             # Бизнес-логика
│   │   │   ├── stripe.js         # ⏸️ MVP: mock, PROD: real Stripe
│   │   │   ├── email.js          # ⏸️ MVP: заглушка, PROD: SendGrid
│   │   │   └── token.js          # JWT генерация/проверка
│   │   │
│   │   └── utils/
│   │       ├── logger.js         # Консоль логирование
│   │       ├── constants.js      # Константы
│   │       └── validators.js     # Валидаторы (дублирование с фронта)
│   │
│   ├── prisma/
│   │   ├── schema.prisma         # Схема БД
│   │   └── migrations/           # ⏸️ Автогенерируются
│   │
│   ├── tests/                    # ⏸️ MVP: можно пропустить
│   │   └── ...
│   │
│   ├── package.json
│   ├── .env.example
│   ├── .env                      # ⚠️ НЕ КОММИТИТЬ!
│   ├── .gitignore
│   └── README.md
│
├── package.json                  # Корневой (опционально)
├── vercel.json                   # Фронтенд
└── README.md
```

---

## 🔧 ШАГ 1: ИНИЦИАЛИЗАЦИЯ BACKEND

### 1.1 Создать папку server

```bash
cd /Users/temirlankakishev/Project/biomark-web
mkdir -p server/src/{routes,controllers,models,middleware,services,utils}
mkdir -p server/prisma
mkdir -p server/tests
```

### 1.2 Инициализировать npm

```bash
cd server
npm init -y
```

### 1.3 Установить зависимости

```bash
# Основные
npm install express cors dotenv

# База данных
npm install prisma @prisma/client
npx prisma init

# Аутентификация
npm install jsonwebtoken bcryptjs

# Валидация
npm install zod

# Платежи (MVP: mock)
npm install stripe

# Для разработки
npm install -D nodemon
```

### 1.4 Обновить package.json

```json
{
  "name": "biomarket-server",
  "version": "1.0.0",
  "description": "BioMarket Backend API",
  "main": "src/index.js",
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "prisma": "^5.8.0",
    "@prisma/client": "^5.8.0",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "zod": "^3.22.4",
    "stripe": "^14.10.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

---

## 📦 ШАГ 2: PRISMA СХЕМА

### 2.1 Создать `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  fullname  String
  phone     String?
  address   String?
  role      String   @default("buyer") // buyer | farmer
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  orders         Order[]
  subscriptions  Subscription[]
  payments       Payment[]
  
  @@map("users")
}

model Subscription {
  id        String   @id @default(uuid())
  userId    String
  plan      String   // 1month | 3months | 1year
  status    String   @default("active") // active | expired | cancelled
  startDate DateTime @default(now())
  endDate   DateTime
  createdAt DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("subscriptions")
}

model Order {
  id            Int      @id @default(autoincrement())
  userId        String
  total         Decimal  @db.Decimal(10, 2)
  status        String   @default("pending") // pending | processing | delivered | cancelled
  deliveryDate  String
  createdAt     DateTime @default(now())
  
  items OrderItem[]
  user  User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("orders")
}

model OrderItem {
  id        Int             @id @default(autoincrement())
  orderId   Int
  productId String
  name      String
  quantity  Int
  price     Decimal         @db.Decimal(10, 2)
  total     Decimal         @db.Decimal(10, 2)
  
  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)
  
  @@map("order_items")
}

model Payment {
  id            String   @id @default(uuid())
  userId        String
  transactionId String   @unique
  amount        Decimal  @db.Decimal(10, 2)
  currency      String   @default("CZK")
  status        String   @default("pending") // pending | success | failed
  createdAt     DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("payments")
}
```

### 2.2 Сгенерировать клиент

```bash
cd server
npx prisma generate
```

### 2.3 Настроить часовой пояс (Чехия)

В `prisma/schema.prisma` добавить:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ✅ Чешский часовой пояс
generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native"]
}
```

В `src/index.js` установить часовой пояс:

```javascript
// Установить чешский часовой пояс
process.env.TZ = 'Europe/Prague';
```

---

## 🌐 ШАГ 3: EXPRESS СЕРВЕР

### 3.1 Создать `src/index.js`

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

// Импорт роутов
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const orderRoutes = require('./routes/orders');
const subscriptionRoutes = require('./routes/subscriptions');
const paymentRoutes = require('./routes/payments');

// Middleware
const errorHandler = require('./middleware/errorHandler');

const app = express();
const prisma = new PrismaClient();

// Глобальные middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/payments', paymentRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});
```

---

## 🔐 ШАГ 4: АУТЕНТИФИКАЦИЯ

### 4.1 Создать `src/controllers/authController.js`

```javascript
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { registerSchema, loginSchema } = require('../utils/validators');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-prod';

/**
 * Регистрация пользователя
 * POST /api/auth/register
 */
exports.register = async (req, res, next) => {
  try {
    // Валидация
    const { email, password, fullname, role = 'buyer' } = registerSchema.parse(req.body);
    
    // Проверка существования
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }
    
    // Хэширование пароля
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Создание пользователя
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullname,
        role,
      },
      select: {
        id: true,
        email: true,
        fullname: true,
        role: true,
        createdAt: true,
      }
    });
    
    // Генерация токена
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      message: 'Registration successful',
      user,
      token
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Логин пользователя
 * POST /api/auth/login
 */
exports.login = async (req, res, next) => {
  try {
    // Валидация
    const { email, password } = loginSchema.parse(req.body);
    
    // Поиск пользователя
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Проверка пароля
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Генерация токена
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        fullname: user.fullname,
        role: user.role,
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout (просто OK, токен на клиенте удаляется)
 * POST /api/auth/logout
 */
exports.logout = async (req, res) => {
  res.json({ message: 'Logout successful' });
};

/**
 * Получить текущего пользователя
 * GET /api/auth/me
 */
exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        fullname: true,
        phone: true,
        address: true,
        role: true,
        createdAt: true,
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    next(error);
  }
};
```

### 4.2 Создать `src/routes/auth.js`

```javascript
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', authMiddleware, authController.getCurrentUser);

module.exports = router;
```

### 4.3 Создать `src/middleware/auth.js`

```javascript
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-prod';

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

---

## 🇨🇿 ШАГ 4.5: ЧЕШСКИЕ ВАЛИДАТОРЫ

### Создать `src/utils/validators.js`

```javascript
const { z } = require('zod');

// Чешский email
const emailSchema = z.string().email('Neplatný email');

// Чешский телефон (+420 XXX XXX XXX)
const czechPhoneSchema = z.string()
  .regex(/^\+420\s?\d{3}\s?\d{3}\s?\d{3}$/, 'Neplatné telefonní číslo')
  .optional();

// Чешский адрес
const czechAddressSchema = z.object({
  street: z.string().min(3, 'Ulice musí mít alespoň 3 znaky'),
  city: z.string().min(2, 'Město musí mít alespoň 2 znaky'),
  zip: z.string().regex(/^\d{3} \d{2}$/, 'PSČ musí být ve formátu XXX XX'),
  district: z.string().optional() // Praha 1, Holešovice, etc.
}).optional();

// Регистрация
const registerSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, 'Heslo musí mít alespoň 6 znaků'),
  fullname: z.string().min(2, 'Jméno musí mít alespoň 2 znaky'),
  phone: czechPhoneSchema,
  address: z.string().optional(), // Ulice 123, Praha
  role: z.enum(['buyer', 'farmer']).default('buyer')
});

// Логин
const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1)
});

// Обновление профиля
const updateProfileSchema = z.object({
  fullname: z.string().min(2).optional(),
  phone: czechPhoneSchema,
  address: z.string().min(5).optional()
});

module.exports = {
  emailSchema,
  czechPhoneSchema,
  czechAddressSchema,
  registerSchema,
  loginSchema,
  updateProfileSchema
};
```

---

## 🔄 ШАГ 5: ОБНОВЛЕНИЕ ФРОНТЕНДА

### 5.1 Переключить API режим

В `src/js/services/api.js`:

```javascript
const API_CONFIG = {
    MODE: import.meta.env.VITE_API_MODE || 'mock',  // ← Изменить на 'real'
    BASE_URL: import.meta.env.VITE_API_URL || 'https://your-railway-app.up.railway.app',
    TIMEOUT: 10000,
    VERSION: 'v1',
};
```

---

## 🇨🇿 ШАГ 5.5: GDPR ENDPOINTS

### Создать `src/routes/users.js` (дополнение)

```javascript
// GET /api/users/data - GDPR: Export всех данных
router.get('/data', authMiddleware, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    include: {
      orders: { include: { items: true } },
      subscriptions: true,
      payments: true
    }
  });
  
  res.json({
    user,
    exportedAt: new Date().toISOString()
  });
});

// DELETE /api/users/profile - GDPR: Право на удаление
router.delete('/profile', authMiddleware, async (req, res) => {
  await prisma.user.delete({
    where: { id: req.user.userId }
  });
  
  res.json({ message: 'Account deleted successfully' });
});
```

### Обновить `src/js/member-dashboard.js`

Добавить функцию экспорта данных:

```javascript
async function exportUserData() {
  try {
    const response = await api.request('users/data');
    const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `biomarket-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showSuccess('Данные экспортированы');
  } catch (error) {
    showError('Не удалось экспортировать данные');
  }
}
```

### 5.2 Создать `.env` для фронта

```bash
# biomark-web/.env
VITE_API_MODE=real
VITE_API_URL=https://your-railway-app.up.railway.app
VITE_ENABLE_DEMO_LOGIN=false
```

---

## 🚀 ШАГ 6: ДЕПЛОЙ НА RAILWAY

### 6.1 Подготовить Railway

1. Зайти на https://railway.app
2. Login через GitHub
3. New Project → Deploy from GitHub repo
4. Выбрать `biomark-web`

### 6.2 Настроить переменные окружения

В Railway Dashboard добавить:

```bash
DATABASE_URL=postgresql://... (Railway создаст автоматически)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
FRONTEND_URL=https://biomark-web.vercel.app
NODE_ENV=production
STRIPE_SECRET_KEY=sk_test_... (MVP: можно mock)
```

### 6.3 Настроить build

В Railway Dashboard:

```
Root Directory: server
Build Command: npm install && npx prisma migrate deploy
Start Command: node src/index.js
```

### 6.4 Добавить PostgreSQL

1. Railway Dashboard → New → Database → PostgreSQL
2. Railway автоматически создаст `DATABASE_URL`

---

## ⏸️ ОТЛОЖИТЬ НА ПРОДАКШЕН

### 1. Email уведомления

```javascript
// MVP: заглушка
exports.sendEmail = async (to, subject, body) => {
  console.log(`[MOCK EMAIL] To: ${to}, Subject: ${subject}`);
  return true;
};

// PROD: подключить SendGrid/Resend
```

### 2. Stripe webhooks

```javascript
// MVP: mock платежи
exports.processPayment = async (req, res) => {
  // Просто создаём запись в БД
};

// PROD: реальный Stripe + webhooks
```

### 3. Rate limiting

```javascript
// MVP: без лимитов
// PROD: добавить express-rate-limit
```

### 4. Продвинутый мониторинг

```javascript
// MVP: console.log
// PROD: Sentry + LogRocket
```

### 5. CI/CD

```bash
# MVP: ручной деплой git push
# PROD: GitHub Actions → автодеплой
```

---

## ✅ ЧЕКЛИСТ ГОТОВНОСТИ

### Backend:
- [ ] Инициализирован npm
- [ ] Установлены зависимости
- [ ] Настроена Prisma схема
- [ ] Создан Express сервер
- [ ] Реализована аутентификация
- [ ] Реализованы CRUD операции
- [ ] Настроен CORS
- [ ] Настроен error handling

### Database:
- [ ] PostgreSQL подключён
- [ ] Миграции созданы
- [ ] Seed данные (опционально)

### Frontend:
- [ ] Переключён API_MODE на 'real'
- [ ] Обновлён API_URL
- [ ] Протестирован логин/регистрация
- [ ] Протестированы заказы
- [ ] Протестированы подписки

### Deploy:
- [ ] Railway проект создан
- [ ] PostgreSQL добавлен
- [ ] Переменные настроены
- [ ] Деплой успешен
- [ ] Health check работает

---

## 📝 ЗАМЕТКИ

- **MVP фокус:** Быстро запустить и тестировать
- **Продакшен:** Добавить оплату, email, мониторинг
- **Безопасность:** JWT секреты хранить в Railway, не в git
- **Тесты:** Можно пропустить для MVP, добавить потом

---

**Готов начинать реализацию по этой инструкции!** 🚀
