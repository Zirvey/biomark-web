# 🔐 Fix Registration — Debug Progress

**Дата:** 2026-02-26  
**Проблема:** Авторизация разлогинивает сразу после редиректа

---

## 📊 ЧТО СДЕЛАНО (исключить эти варианты)

### ✅ Проверено:

1. **`.env` не в git** — ✅ Правильно
2. **Ключи sessionStorage правильные** — ✅ `biomarket_token_data`
3. **`sessionStorage.clear()` не вызывается** — ✅ Найдено только в logout
4. **`authManager.getUserSync()` существует** — ✅ Читает из sessionStorage
5. **`app.js` вызывает `authManager.getUser()`** — ✅ При инициализации

---

## 🛠️ ДОБАВЛЕНО ДЛЯ ОТЛАДКИ

### 1. Логи в `authManager.getUserSync()`

**Файл:** `src/js/modules/auth.js`

```javascript
console.log('🔍 authManager.getUserSync() - Raw data:', user);
console.log('⚠️ authManager.getUserSync() - No user in sessionStorage');
console.log('✅ authManager.getUserSync() - Parsed user:', parsed);
```

**Что покажет:**
- Сохраняются ли данные в sessionStorage
- Читается ли данные правильно
- Есть ли ошибка парсинга

---

### 2. Логи в `app.js`

**Файл:** `src/js/app.js`

```javascript
console.log('🚀 App initializing...');
console.log('📍 Current URL:', window.location.href);
console.log('📦 sessionStorage keys:', Object.keys(sessionStorage));
console.log('🔐 Checking auth before anything...');
console.log('🔐 Sync user result:', syncUser);
```

**Что покажет:**
- На какой странице инициализация
- Какие ключи есть в sessionStorage
- Что возвращает `getUserSync()`

---

### 3. Логи в `handleSuccessfulLogin()`

**Файл:** `src/js/register.js`

```javascript
console.log('💾 handleSuccessfulLogin - Saved to sessionStorage:', {...});
console.log('🔍 handleSuccessfulLogin - CHECK BEFORE REDIRECT:', {...});
```

**Что покажет:**
- Сохранились ли данные
- Исчезли ли данные перед редиректом
- URL до и после редиректа

---

## 📋 СЛЕДУЮЩИЕ ШАГИ

### 1. Запустить локально

```bash
# Терминал 1 — Фронтенд
cd /Users/temirlankakishev/Project/biomark-web
npm run dev

# Терминал 2 — Бэкенд
cd /Users/temirlankakishev/Project/biomark-web/server
npm run dev
```

### 2. Открыть консоль (F12)

1. Открыть `http://localhost:5173/register.html`
2. Войти: `admin@admin.com` / `admin@`
3. Смотреть консоль

### 3. Ожидать вывод:

```
💾 handleSuccessfulLogin - Saved to sessionStorage: {token: "...", user: "...", role: "buyer"}
🔍 handleSuccessfulLogin - CHECK BEFORE REDIRECT: {token: "...", user: "...", role: "buyer"}

🚀 App initializing...
📍 Current URL: http://localhost:5173/index.html
📦 sessionStorage keys: ["biomarket_token", "biomarket_token_data", "biomarket_user_role"]
🔐 Checking auth before anything...
🔍 authManager.getUserSync() - Raw data: {"fullname":"Иван Петров",...}
✅ authManager.getUserSync() - Parsed user: {fullname: "Иван Петров", ...}
🔐 Sync user result: {fullname: "Иван Петров", ...}
```

### 4. Если sessionStorage пустой:

**Возможные причины:**
- Разные домены (localhost vs Vercel)
- Vite кэширует файлы
- sessionStorage очищается где-то ещё

**Решение:**
- Hard Refresh: `Cmd + Shift + R`
- Проверить что тестишь на одном домене
- Искать где ещё вызывается `sessionStorage.clear()`

---

## 🎯 ОЖИДАЕМЫЙ РЕЗУЛЬТАТ

Если логи показывают что:
- ✅ Данные сохраняются
- ✅ Данные читаются
- ✅ Но UI не обновляется

**Проблема:** В `updateAuthUI()` — не правильно отображает

**Решение:** Проверить `src/js/modules/ui.js` → `updateAuthUI()`

---

## 📝 ЗАМЕТКИ

- **Не переписывать код** пока не найдём точную проблему
- **Смотреть логи** — они покажут где проблема
- **Тестировать на одном домене** — localhost или Vercel, не смешивать

---

**Готов к тестированию!** 🚀


## Подсказки
🚨 КРИТИЧЕСКИЕ БАГИ
1. Несоответствие хранилищ: localStorage vs sessionStorage ⚠️
В register.js есть фундаментальная ошибка:
// ✅ handleSuccessfulLogin (при ЛОГИНЕ) — использует sessionStorage
sessionStorage.setItem('biomarket_token', mockToken);
sessionStorage.setItem('biomarket_token_data', JSON.stringify(user));

// ❌ handleRegister (при РЕГИСТРАЦИИ) — использует localStorage!
localStorage.setItem('biomarket_user', JSON.stringify(formData));
localStorage.setItem('biomarket_user_role', 'farmer');

Проблема:
После логина данные в sessionStorage → app.js через authManager их находит ✓
После регистрации данные в localStorage → authManager ищет в sessionStorage → не находит → пользователь "не авторизован" ✗
Решение: Привести к единому хранилищу:

// В handleRegister и handleFarmerRegister заменить localStorage на sessionStorage:
sessionStorage.setItem('biomarket_token', 'mock-token-' + Date.now());
sessionStorage.setItem('biomarket_token_data', JSON.stringify(formData));
sessionStorage.setItem('biomarket_user_role', formData.role);

2. authManager не определён в видимом коде 🔍
В app.js используются методы:

const user = await authManager.getUser();
const userRole = await authManager.getUserRole();

Но в предоставленном коде нет определения authManager. Если он импортируется из services/api.js, убедитесь, что:
Файл экспортирует authManager
Методы getUser() и getUserRole() читают из того же хранилища, куда сохраняет register.js
Проверьте src/js/services/api.js — там должен быть код типа:

export const authManager = {
  getUser: () => {
    const data = sessionStorage.getItem('biomarket_token_data');
    return data ? JSON.parse(data) : null;
  },
  getUserRole: () => sessionStorage.getItem('biomarket_user_role'),
  // ...
};

3. Сравнение паролей в нижнем регистре 🔐
В register.js:

const passwordLower = password.toLowerCase(); // ❌
if (passwordLower === DEMO_CREDENTIALS.ADMIN.password.toLowerCase()) { ... }

Проблема: Пароли становятся нечувствительными к регистру (Admin@ = admin@). Это снижает безопасность.
Решение: Убрать .toLowerCase() для паролей (для email — оставить):

// ✅ Только email приводим к нижнему регистру
const emailLower = email.toLowerCase().trim();
// ❌ Пароль сравниваем как есть:
if (password === DEMO_CREDENTIALS.ADMIN.password) { ... }

##UPDATE FIX КРИТИЧЕСКИЙ БАГ: Разные хранилища и ключи при логине и регистрации
Что происходит в коде:
✅ При ЛОГИНЕ (handleSuccessfulLogin в register.js):
// Сохраняет в sessionStorage с ключами:
sessionStorage.setItem('biomarket_token', mockToken);
sessionStorage.setItem('biomarket_token_data', JSON.stringify(user)); // ← ключ: biomarket_token_data
sessionStorage.setItem('biomarket_user_role', user.role);
❌ При РЕГИСТРАЦИИ (handleRegister в register.js):
// Сохраняет в localStorage с ДРУГИМИ ключами:
localStorage.setItem('biomarket_user', JSON.stringify(formData)); // ← ключ: biomarket_user (ДРУГОЙ!)
localStorage.setItem('biomarket_user_role', 'buyer');
В app.js:
import { authManager } from './modules/auth.js';
const user = await authManager.getUser(); // ← скорее всего читает из sessionStorage['biomarket_token_data']
🎯 Результат:
Действие
Где сохраняется
Ключ
authManager.getUser() находит?
Логин
sessionStorage
biomarket_token_data
✅ Да
Регистрация
localStorage
biomarket_user
❌ Нет!
Поэтому после регистрации пользователя "выкидывает" — данные есть, но в другом месте и под другим именем!

✅ РЕШЕНИЕ: Унифицировать хранение данных
Замените код в функциях handleRegister и handleFarmerRegister в файле src/js/register.js:
📝 Исправленная функция handleRegister:
javascript
// Было ❌:
localStorage.setItem('biomarket_user', JSON.stringify(formData));
localStorage.setItem('biomarket_user_role', 'buyer');

// Стало ✅:
const TOKEN_KEY = 'biomarket_token';
const TOKEN_DATA_KEY = 'biomarket_token_data';

const mockToken = 'mock-token-' + Date.now();
sessionStorage.setItem(TOKEN_KEY, mockToken);
sessionStorage.setItem(TOKEN_DATA_KEY, JSON.stringify(formData));
sessionStorage.setItem('biomarket_user_role', 'buyer');
🔧 Дополнительно: проверьте src/js/modules/auth.js
Убедитесь, что authManager читает из того же хранилища и с теми же ключами:
// src/js/modules/auth.js (пример правильной реализации)
export const authManager = {
  getUser: async () => {
    const data = sessionStorage.getItem('biomarket_token_data');
    return data ? JSON.parse(data) : null;
  },
  
  getUserRole: async () => {
    return sessionStorage.getItem('biomarket_user_role');
  },
  
  logout: () => {
    sessionStorage.removeItem('biomarket_token');
    sessionStorage.removeItem('biomarket_token_data');
    sessionStorage.removeItem('biomarket_user_role');
  }
};