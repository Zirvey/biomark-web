/**
 * @file AuthService — управление аутентификацией и сессиями
 * @description Регистрация, логин, logout, валидация токена
 */

import api, { storeToken, getStoredToken, getUserFromToken, clearToken, isTokenValid } from './api.js';

// ============================================
// ТИПЫ (JSDoc)
// ============================================

/**
 * @typedef {Object} User
 * @property {string} id - ID пользователя
 * @property {string} email - Email
 * @property {string} fullname - ФИО
 * @property {string} [phone] - Телефон
 * @property {string} [address] - Адрес
 * @property {string} role - Роль (buyer | farmer)
 */

/**
 * @typedef {Object} LoginCredentials
 * @property {string} email - Email
 * @property {string} password - Пароль
 */

/**
 * @typedef {Object} RegisterData
 * @property {string} email - Email
 * @property {string} password - Пароль
 * @property {string} fullname - ФИО
 */

/**
 * @typedef {Object} AuthResponse
 * @property {User} user - Данные пользователя
 * @property {string} token - JWT токен
 */

// ============================================
// КОНСТАНТЫ
// ============================================

const STORAGE_KEYS = {
    REMEMBER_ME: 'biomarket_remember_me',
    LAST_EMAIL: 'biomarket_last_email',
};

// ============================================
// AUTH SERVICE
// ============================================

export const authService = {
    /**
     * Регистрация нового пользователя
     * @param {RegisterData} data - Данные для регистрации
     * @returns {Promise<AuthResponse>}
     */
    async register(data) {
        try {
            // Валидация данных
            const validationError = this.validateRegisterData(data);
            if (validationError) {
                throw new Error(validationError);
            }
            
            const response = await api.request('auth/register', {
                method: 'POST',
                body: JSON.stringify(data),
            });
            
            // Сохраняем токен и данные
            storeToken(response.data.token, response.data.user);
            
            // Сохраняем email для удобства
            localStorage.setItem(STORAGE_KEYS.LAST_EMAIL, data.email);
            
            return response.data;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    },
    
    /**
     * Логин пользователя
     * @param {LoginCredentials} credentials - Учётные данные
     * @param {boolean} rememberMe - Запомнить меня
     * @returns {Promise<AuthResponse>}
     */
    async login(credentials, rememberMe = false) {
        try {
            // Валидация
            if (!credentials.email || !credentials.password) {
                throw new Error('Email и пароль обязательны');
            }
            
            const response = await api.request('auth/login', {
                method: 'POST',
                body: JSON.stringify(credentials),
            });
            
            // Сохраняем токен и данные
            storeToken(response.data.token, response.data.user);
            
            // Запомнить выбор rememberMe
            if (rememberMe) {
                localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'true');
                localStorage.setItem(STORAGE_KEYS.LAST_EMAIL, credentials.email);
            } else {
                localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
            }
            
            return response.data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },
    
    /**
     * Logout пользователя
     * @returns {Promise<void>}
     */
    async logout() {
        try {
            // Пытаемся вызвать logout на сервере (не блокирующе)
            api.request('auth/logout', {
                method: 'POST',
            }).catch(() => {
                // Игнорируем ошибки сервера при logout
            });
            
            // Очищаем локальные данные
            clearToken();
            
            console.log('User logged out');
        } catch (error) {
            console.error('Logout error:', error);
            // Всё равно очищаем токен локально
            clearToken();
        }
    },
    
    /**
     * Получить текущего пользователя
     * @returns {Promise<User|null>}
     */
    async getCurrentUser() {
        try {
            // Проверяем валидность токена
            if (!isTokenValid()) {
                return null;
            }
            
            // Получаем данные из токена
            const cachedUser = getUserFromToken();
            if (cachedUser) {
                return cachedUser;
            }
            
            // Запрашиваем свежие данные с сервера
            const response = await api.request('auth/me');
            return response.data;
        } catch (error) {
            console.error('Get current user error:', error);
            
            // Если токен невалиден, очищаем его
            if (error.status === 401 || error.code === 'TOKEN_EXPIRED') {
                clearToken();
            }
            
            return null;
        }
    },
    
    /**
     * Проверка авторизации
     * @returns {Promise<boolean>}
     */
    async isAuthenticated() {
        const user = await this.getCurrentUser();
        return !!user;
    },
    
    /**
     * Получить роль пользователя
     * @returns {Promise<string|null>}
     */
    async getUserRole() {
        const user = await this.getCurrentUser();
        return user?.role || null;
    },
    
    /**
     * Валидация данных регистрации
     * @param {RegisterData} data
     * @returns {string|null} Сообщение об ошибке или null
     */
    validateRegisterData(data) {
        if (!data.email || !data.email.includes('@')) {
            return 'Некорректный email';
        }
        
        if (!data.password || data.password.length < 6) {
            return 'Пароль должен быть не менее 6 символов';
        }
        
        if (!data.fullname || data.fullname.trim().length < 2) {
            return 'ФИО должно содержать минимум 2 символа';
        }
        
        return null;
    },
    
    /**
     * Валидация данных логина
     * @param {LoginCredentials} credentials
     * @returns {string|null} Сообщение об ошибке или null
     */
    validateLoginCredentials(credentials) {
        if (!credentials.email) {
            return 'Email обязателен';
        }
        
        if (!credentials.password) {
            return 'Пароль обязателен';
        }
        
        return null;
    },
    
    /**
     * Получить запомненный email
     * @returns {string|null}
     */
    getRememberedEmail() {
        return localStorage.getItem(STORAGE_KEYS.LAST_EMAIL);
    },
    
    /**
     * Нужно ли запомнить пользователя
     * @returns {boolean}
     */
    shouldRememberMe() {
        return localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true';
    },
    
    /**
     * Проверка токена без запроса к серверу
     * @returns {boolean}
     */
    isTokenValidSync() {
        return isTokenValid();
    },
    
    /**
     * Получить данные пользователя из токена синхронно
     * @returns {User|null}
     */
    getUserFromTokenSync() {
        return getUserFromToken();
    },
};

// ============================================
// ЗАЩИЩЁННЫЕ РОУТЫ
// ============================================

/**
 * Список защищённых путей
 * @type {string[]}
 */
const PROTECTED_ROUTES = [
    'member-dashboard.html',
    'farmer-dashboard.html',
    'checkout.html',
];

/**
 * Проверка доступа к странице
 * @param {string} [requiredRole] - Требуемая роль (опционально)
 * @returns {Promise<boolean>} true если доступ разрешён
 */
export async function checkAuth(requiredRole = null) {
    const currentPage = window.location.pathname.split('/').pop();
    
    // Проверяем, защищённая ли это страница
    const isProtected = PROTECTED_ROUTES.some(route => currentPage === route);
    
    if (!isProtected) {
        return true;
    }
    
    try {
        // Проверяем авторизацию
        const isAuthenticated = await authService.isAuthenticated();
        
        if (!isAuthenticated) {
            // Редирект на главную с параметром redirect
            const redirectUrl = encodeURIComponent(currentPage + window.location.search);
            window.location.href = `index.html?redirect=${redirectUrl}`;
            return false;
        }
        
        // Проверяем роль если требуется
        if (requiredRole) {
            const role = await authService.getUserRole();
            if (role !== requiredRole) {
                // Неправильная роль — редирект на соответствующий dashboard
                if (role === 'buyer') {
                    window.location.href = 'member-dashboard.html';
                } else if (role === 'farmer') {
                    window.location.href = 'farmer-dashboard.html';
                } else {
                    window.location.href = 'index.html';
                }
                return false;
            }
        }
        
        return true;
    } catch (error) {
        console.error('Auth check error:', error);
        window.location.href = 'index.html';
        return false;
    }
}

/**
 * Инициализация защиты роутов
 * Вызывать при загрузке страницы
 * @param {string} [requiredRole] - Требуемая роль
 */
export function initAuthGuard(requiredRole = null) {
    document.addEventListener('DOMContentLoaded', async () => {
        const isAllowed = await checkAuth(requiredRole);
        
        if (isAllowed) {
            // Диспатчим событие что авторизация прошла
            window.dispatchEvent(new CustomEvent('auth:verified', {
                detail: { role: requiredRole },
            }));
        }
    });
}

// ============================================
// ЭКСПОРТЫ
// ============================================

export default authService;
