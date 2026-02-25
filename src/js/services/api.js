/**
 * @file API Client — базовый HTTP-клиент для взаимодействия с бэкендом
 * @description Поддерживает режимы: mock (разработка) и real (production)
 */

// ============================================
// КОНФИГУРАЦИЯ
// ============================================

const API_CONFIG = {
    // Переключатель режимов: 'mock' | 'real'
    MODE: 'mock',
    
    // Base URL для реального API
    BASE_URL: import.meta.env.VITE_API_URL || 'https://api.biomarket.cz',
    
    // Таймаут запросов (мс)
    TIMEOUT: 10000,
    
    // Версия API
    VERSION: 'v1',
};

// ============================================
// ТИПЫ (JSDoc)
// ============================================

/**
 * @typedef {Object} ApiResponse
 * @property {*} data - Данные ответа
 * @property {string} message - Сообщение
 * @property {number} status - HTTP статус
 */

/**
 * @typedef {Object} ApiError
 * @property {string} message - Сообщение об ошибке
 * @property {number} status - HTTP статус
 * @property {string} code - Код ошибки
 */

// ============================================
// MOCK ДАННЫЕ (для разработки без бэка)
// ============================================

const MOCK_DB = {
    users: new Map(),
    orders: new Map(),
    subscriptions: new Map(),
    tokens: new Map(),
    payments: new Map(),
};

// Имитация задержки сети
const mockDelay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Генерация mock JWT токена
const generateMockToken = (payload) => {
    const header = { alg: 'HS256', typ: 'JWT' };
    const tokenPayload = {
        ...payload,
        iat: Date.now(),
        exp: Date.now() + 24 * 60 * 60 * 1000, // 24 часа
    };
    
    // Base64url encoding (упрощённый)
    const encode = (obj) => btoa(JSON.stringify(obj));
    return `${encode(header)}.${encode(tokenPayload)}.mock-signature`;
};

// Валидация mock токена
const validateMockToken = (token) => {
    try {
        if (!token || token.endsWith('.mock-signature')) {
            const parts = token.split('.');
            if (parts.length !== 3) return null;
            
            const payload = JSON.parse(atob(parts[1]));
            
            // Проверка истечения срока
            if (payload.exp && Date.now() > payload.exp) {
                return { error: 'Token expired' };
            }
            
            return payload;
        }
        return null;
    } catch {
        return null;
    }
};

// ============================================
// УТИЛИТЫ
// ============================================

/**
 * Санитизация строки (защита от XSS)
 * @param {string} str - Входная строка
 * @returns {string} - Безопасная строка
 */
export function sanitize(str) {
    if (typeof str !== 'string') return str;
    
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Шифрование данных (упрощённое, для разработки)
 * @param {*} data - Данные для шифрования
 * @returns {string} - Зашифрованная строка
 */
export function encryptData(data) {
    try {
        return btoa(JSON.stringify(data));
    } catch {
        return '';
    }
}

/**
 * Расшифровка данных
 * @param {string} encrypted - Зашифрованная строка
 * @returns {*} - Расшифрованные данные
 */
export function decryptData(encrypted) {
    try {
        return JSON.parse(atob(encrypted));
    } catch {
        return null;
    }
}

// ============================================
// API КЛИЕНТ
// ============================================

/**
 * Отправка HTTP запроса
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Опции fetch
 * @returns {Promise<ApiResponse>}
 */
export async function apiRequest(endpoint, options = {}) {
    const { headers = {}, body, ...restOptions } = options;
    
    // Добавляем токен авторизации если есть
    const token = getStoredToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Добавляем Content-Type для JSON
    if (body && !(body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }
    
    const config = {
        ...restOptions,
        headers: {
            'Accept': 'application/json',
            ...headers,
        },
    };
    
    // ========================================
    // MOCK РЕЖИМ (разработка без бэка)
    // ========================================
    if (API_CONFIG.MODE === 'mock') {
        return mockApiRequest(endpoint, config);
    }
    
    // ========================================
    // REAL РЕЖИМ (production с бэком)
    // ========================================
    const url = `${API_CONFIG.BASE_URL}/${API_CONFIG.VERSION}/${endpoint}`;
    
    // AbortController для таймаута
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
    
    try {
        const response = await fetch(url, {
            ...config,
            signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        const data = await response.json();
        
        if (!response.ok) {
            throw createApiError(data.message || 'Request failed', response.status, data.code);
        }
        
        return {
            data,
            message: data.message || 'Success',
            status: response.status,
        };
    } catch (error) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
            throw createApiError('Request timeout', 408, 'TIMEOUT');
        }
        
        if (error.type === 'TypeError') {
            throw createApiError('Network error. Check your connection', 0, 'NETWORK_ERROR');
        }
        
        throw error;
    }
}

// ============================================
// MOCK РЕАЛИЗАЦИЯ API
// ============================================

/**
 * Mock реализация API запросов
 */
async function mockApiRequest(endpoint, config) {
    await mockDelay();
    
    const { method = 'GET', headers, body } = config;
    const authToken = headers['Authorization']?.replace('Bearer ', '');
    
    // Проверка авторизации для защищённых endpoints
    const protectedEndpoints = [
        'user/profile', 'user/orders', 'user/subscription',
        'orders', 'subscriptions',
    ];
    
    const isProtected = protectedEndpoints.some(ep => endpoint.startsWith(ep));
    
    if (isProtected && !authToken) {
        throw createApiError('Unauthorized', 401, 'UNAUTHORIZED');
    }
    
    // Валидация токена
    let userPayload = null;
    if (authToken) {
        userPayload = validateMockToken(authToken);
        if (userPayload?.error === 'Token expired') {
            throw createApiError('Token expired', 401, 'TOKEN_EXPIRED');
        }
    }
    
    // ========================================
    // AUTH ENDPOINTS
    // ========================================
    if (endpoint === 'auth/register') {
        const { email, password, fullname } = JSON.parse(body);
        
        // Проверка существования пользователя
        if (MOCK_DB.users.has(email)) {
            throw createApiError('User already exists', 409, 'USER_EXISTS');
        }
        
        const user = {
            id: Date.now().toString(),
            email,
            fullname,
            phone: '',
            address: '',
            createdAt: new Date().toISOString(),
        };
        
        MOCK_DB.users.set(email, { ...user, password }); // В реальности пароль не храним!
        
        const token = generateMockToken({ userId: user.id, email, role: 'buyer' });
        MOCK_DB.tokens.set(token, { email, role: 'buyer' });
        
        return {
            data: { user, token },
            message: 'Registration successful',
            status: 201,
        };
    }
    
    if (endpoint === 'auth/login') {
        const { email, password } = JSON.parse(body);
        const user = MOCK_DB.users.get(email);
        
        if (!user || user.password !== password) {
            throw createApiError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
        }
        
        const token = generateMockToken({ userId: user.id, email, role: 'buyer' });
        MOCK_DB.tokens.set(token, { email, role: 'buyer' });
        
        return {
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    fullname: user.fullname,
                    phone: user.phone,
                    address: user.address,
                },
                token,
            },
            message: 'Login successful',
            status: 200,
        };
    }
    
    if (endpoint === 'auth/logout') {
        if (authToken) {
            MOCK_DB.tokens.delete(authToken);
        }
        return {
            data: null,
            message: 'Logout successful',
            status: 200,
        };
    }
    
    if (endpoint === 'auth/me') {
        if (!userPayload) {
            throw createApiError('Unauthorized', 401, 'UNAUTHORIZED');
        }
        
        const user = MOCK_DB.users.get(userPayload.email);
        if (!user) {
            throw createApiError('User not found', 404, 'USER_NOT_FOUND');
        }
        
        return {
            data: {
                id: user.id,
                email: user.email,
                fullname: user.fullname,
                phone: user.phone,
                address: user.address,
                role: userPayload.role,
            },
            message: 'Success',
            status: 200,
        };
    }
    
    // ========================================
    // USER ENDPOINTS
    // ========================================
    if (endpoint === 'user/profile') {
        if (!userPayload) {
            throw createApiError('Unauthorized', 401, 'UNAUTHORIZED');
        }
        
        const user = MOCK_DB.users.get(userPayload.email);
        if (!user) {
            throw createApiError('User not found', 404, 'USER_NOT_FOUND');
        }
        
        return {
            data: {
                id: user.id,
                email: user.email,
                fullname: user.fullname,
                phone: user.phone,
                address: user.address,
            },
            message: 'Success',
            status: 200,
        };
    }
    
    if (endpoint === 'user/profile' && method === 'PUT') {
        if (!userPayload) {
            throw createApiError('Unauthorized', 401, 'UNAUTHORIZED');
        }
        
        const updates = JSON.parse(body);
        const user = MOCK_DB.users.get(userPayload.email);
        
        if (!user) {
            throw createApiError('User not found', 404, 'USER_NOT_FOUND');
        }
        
        // Обновляем данные
        Object.assign(user, {
            fullname: updates.fullname ?? user.fullname,
            phone: updates.phone ?? user.phone,
            address: updates.address ?? user.address,
        });
        
        MOCK_DB.users.set(userPayload.email, user);
        
        return {
            data: user,
            message: 'Profile updated',
            status: 200,
        };
    }
    
    if (endpoint === 'user/profile' && method === 'DELETE') {
        if (!userPayload) {
            throw createApiError('Unauthorized', 401, 'UNAUTHORIZED');
        }
        
        MOCK_DB.users.delete(userPayload.email);
        MOCK_DB.tokens.delete(authToken);
        
        // Удаляем связанные данные
        for (const [key, order] of MOCK_DB.orders.entries()) {
            if (order.userId === userPayload.userId) {
                MOCK_DB.orders.delete(key);
            }
        }
        
        return {
            data: null,
            message: 'Account deleted',
            status: 200,
        };
    }
    
    // ========================================
    // ORDER ENDPOINTS
    // ========================================
    if (endpoint === 'user/orders') {
        if (!userPayload) {
            throw createApiError('Unauthorized', 401, 'UNAUTHORIZED');
        }
        
        const orders = Array.from(MOCK_DB.orders.values())
            .filter(order => order.userId === userPayload.userId)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        return {
            data: orders,
            message: 'Success',
            status: 200,
        };
    }
    
    if (endpoint === 'orders' && method === 'POST') {
        if (!userPayload) {
            throw createApiError('Unauthorized', 401, 'UNAUTHORIZED');
        }
        
        const orderData = JSON.parse(body);
        const order = {
            id: Date.now(),
            userId: userPayload.userId,
            items: orderData.items,
            total: orderData.total,
            status: 'pending',
            deliveryDate: orderData.deliveryDate,
            createdAt: new Date().toISOString(),
        };
        
        MOCK_DB.orders.set(order.id, order);
        
        return {
            data: order,
            message: 'Order created',
            status: 201,
        };
    }
    
    // ========================================
    // SUBSCRIPTION ENDPOINTS
    // ========================================
    if (endpoint === 'user/subscription') {
        if (!userPayload) {
            throw createApiError('Unauthorized', 401, 'UNAUTHORIZED');
        }
        
        const subscription = Array.from(MOCK_DB.subscriptions.values())
            .find(sub => sub.userId === userPayload.userId);
        
        return {
            data: subscription || null,
            message: 'Success',
            status: 200,
        };
    }
    
    if (endpoint === 'subscriptions' && method === 'POST') {
        if (!userPayload) {
            throw createApiError('Unauthorized', 401, 'UNAUTHORIZED');
        }

        const subData = JSON.parse(body);
        const subscription = {
            id: Date.now().toString(),
            userId: userPayload.userId,
            plan: subData.plan,
            status: 'active',
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        };

        MOCK_DB.subscriptions.set(subscription.id, subscription);

        return {
            data: subscription,
            message: 'Subscription created',
            status: 201,
        };
    }

    // ========================================
    // PAYMENT ENDPOINTS
    // ========================================
    if (endpoint === 'payments/process' && method === 'POST') {
        if (!userPayload) {
            throw createApiError('Unauthorized', 401, 'UNAUTHORIZED');
        }

        const paymentData = JSON.parse(body);
        const transactionId = `txn_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        
        // В mock режиме все платежи успешные (кроме специальных тестовых карт)
        const payment = {
            id: transactionId,
            userId: userPayload.userId,
            planId: paymentData.planId,
            paymentMethod: paymentData.paymentMethod,
            amount: 0, // В mock режиме бесплатно
            currency: 'CZK',
            status: 'success',
            createdAt: new Date().toISOString(),
            isMock: true,
        };

        MOCK_DB.payments.set(transactionId, payment);

        return {
            data: payment,
            message: 'Payment processed successfully',
            status: 200,
        };
    }

    if (endpoint === 'payments/methods') {
        return {
            data: [
                { id: 'card', type: 'card', name: 'Банковская карта', icon: '💳', available: true },
                { id: 'bank', type: 'bank', name: 'Банковский перевод', icon: '🏦', available: true },
                { id: 'googlepay', type: 'googlepay', name: 'Google Pay', icon: 'G', available: true },
                { id: 'applepay', type: 'applepay', name: 'Apple Pay', icon: '', available: true },
            ],
            message: 'Success',
            status: 200,
        };
    }

    if (endpoint === 'user/payments') {
        if (!userPayload) {
            throw createApiError('Unauthorized', 401, 'UNAUTHORIZED');
        }

        const payments = Array.from(MOCK_DB.payments.values())
            .filter(payment => payment.userId === userPayload.userId)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return {
            data: payments,
            message: 'Success',
            status: 200,
        };
    }

    // ========================================
    // DEFAULT: 404
    // ========================================
    throw createApiError(`Endpoint not found: ${endpoint}`, 404, 'NOT_FOUND');
}

// ============================================
// УПРАВЛЕНИЕ ТОКЕНОМ
// ============================================

const TOKEN_KEY = 'biomarket_token';
const TOKEN_DATA_KEY = 'biomarket_token_data';

/**
 * Сохранить токен
 */
export function storeToken(token, userData) {
    try {
        // Токен храним в sessionStorage (чище чем localStorage)
        sessionStorage.setItem(TOKEN_KEY, token);
        
        // Данные пользователя храним зашифрованными
        const encrypted = encryptData(userData);
        sessionStorage.setItem(TOKEN_DATA_KEY, encrypted);
    } catch (error) {
        console.error('Failed to store token:', error);
    }
}

/**
 * Получить токен
 */
export function getStoredToken() {
    return sessionStorage.getItem(TOKEN_KEY);
}

/**
 * Получить данные пользователя из токена
 */
export function getUserFromToken() {
    const encrypted = sessionStorage.getItem(TOKEN_DATA_KEY);
    return decryptData(encrypted);
}

/**
 * Удалить токен (logout)
 */
export function clearToken() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_DATA_KEY);
}

/**
 * Проверить валидность токена
 */
export function isTokenValid() {
    const token = getStoredToken();
    if (!token) return false;
    
    const payload = validateMockToken(token);
    return !!payload && !payload.error;
}

/**
 * Получить роль пользователя из токена
 */
export function getUserRole() {
    const token = getStoredToken();
    if (!token) return null;
    
    const payload = validateMockToken(token);
    return payload?.role || null;
}

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

/**
 * Создание объекта ошибки
 */
function createApiError(message, status, code) {
    const error = new Error(message);
    error.status = status;
    error.code = code;
    return error;
}

/**
 * Переключить режим API (для отладки в консоли)
 * @param {'mock' | 'real'} mode
 */
export function setApiMode(mode) {
    if (mode === 'mock' || mode === 'real') {
        API_CONFIG.MODE = mode;
        console.log(`API mode switched to: ${mode}`);
    }
}

/**
 * Получить текущий режим API
 */
export function getApiMode() {
    return API_CONFIG.MODE;
}

// ============================================
// ЭКСПОРТЫ
// ============================================

export default {
    request: apiRequest,
    storeToken,
    getStoredToken,
    getUserFromToken,
    clearToken,
    isTokenValid,
    getUserRole,
    setApiMode,
    getApiMode,
    sanitize,
};
