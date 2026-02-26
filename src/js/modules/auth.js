// src/js/modules/auth.js
import { STORAGE_KEYS, USER_ROLES } from '../utils/constants.js';
import { authService, checkAuth, initAuthGuard } from '../services/authService.js';
import { userService } from '../services/userService.js';

/**
 * @class AuthManager
 * @description Обёртка над authService для обратной совместимости
 * @deprecated Используйте напрямую authService из services/authService.js
 */
export class AuthManager {
    constructor() {
        // Кэш для данных пользователя
        this._userCache = null;
        this._cacheExpiry = null;
        this._CACHE_TTL = 5 * 60 * 1000; // 5 минут
    }

    /**
     * Получить текущего пользователя
     * @returns {Promise<Object|null>}
     */
    async getUser() {
        // Проверяем кэш
        if (this._userCache && this._cacheExpiry && Date.now() < this._cacheExpiry) {
            return this._userCache;
        }

        // Сначала пробуем синхронно из sessionStorage (для демо-режима)
        const syncUser = this.getUserSync();
        if (syncUser) {
            this._userCache = syncUser;
            this._cacheExpiry = Date.now() + this._CACHE_TTL;
            return syncUser;
        }

        try {
            const user = await authService.getCurrentUser();

            // Кэшируем
            this._userCache = user;
            this._cacheExpiry = Date.now() + this._CACHE_TTL;

            return user;
        } catch (error) {
            console.error('AuthManager.getUser() error:', error);
            return null;
        }
    }

    /**
     * Получить пользователя синхронно (из sessionStorage)
     * @returns {Object|null}
     */
    getUserSync() {
        try {
            const user = sessionStorage.getItem('biomarket_token_data');
            console.log('🔍 authManager.getUserSync() - Raw data:', user);
            
            if (!user) {
                console.log('⚠️ authManager.getUserSync() - No user in sessionStorage');
                return null;
            }
            
            const parsed = JSON.parse(user);
            console.log('✅ authManager.getUserSync() - Parsed user:', parsed);
            return parsed;
        } catch (error) {
            console.error('❌ authManager.getUserSync() - Error:', error);
            return null;
        }
    }

    /**
     * Получить роль текущего пользователя
     * @returns {Promise<string|null>}
     */
    async getUserRole() {
        // Сначала пробуем синхронно из sessionStorage (для демо-режима)
        const syncRole = this.getUserRoleSync();
        if (syncRole) {
            return syncRole;
        }

        try {
            return await authService.getUserRole();
        } catch (error) {
            console.error('AuthManager.getUserRole() error:', error);
            return null;
        }
    }

    /**
     * Получить роль синхронно (из sessionStorage)
     * @returns {string|null}
     */
    getUserRoleSync() {
        return sessionStorage.getItem('biomarket_user_role');
    }

    /**
     * Проверить, авторизован ли пользователь
     * @returns {Promise<boolean>}
     */
    async isAuthenticated() {
        // Сначала пробуем синхронную проверку (для демо-режима)
        const syncAuth = this.isAuthenticatedSync();
        if (syncAuth !== null) {
            return syncAuth;
        }

        try {
            return await authService.isAuthenticated();
        } catch (error) {
            console.error('AuthManager.isAuthenticated() error:', error);
            return false;
        }
    }

    /**
     * Проверить авторизацию синхронно
     * @returns {boolean|null} true/false или null если нужно проверять через API
     */
    isAuthenticatedSync() {
        const token = sessionStorage.getItem('biomarket_token');
        const user = sessionStorage.getItem('biomarket_token_data');
        
        // Если есть токен и данные пользователя - считаем авторизованным
        if (token && user) {
            return true;
        }
        
        // Если ничего нет - проверяем через API
        return null;
    }

    /**
     * Проверить, является ли текущий пользователь покупателем
     * @returns {Promise<boolean>}
     */
    async isBuyer() {
        const role = await this.getUserRole();
        return role === USER_ROLES.BUYER;
    }

    /**
     * Проверить, является ли текущий пользователь фермером
     * @returns {Promise<boolean>}
     */
    async isFarmer() {
        const role = await this.getUserRole();
        return role === USER_ROLES.FARMER;
    }

    /**
     * Логин пользователя
     * @param {string} email
     * @param {string} password
     * @param {boolean} rememberMe
     * @returns {Promise<Object>} Данные пользователя
     */
    async login(email, password, rememberMe = false) {
        try {
            const result = await authService.login({ email, password }, rememberMe);
            
            // Очищаем кэш
            this._userCache = null;
            this._cacheExpiry = null;
            
            console.log('User logged in:', result.user);
            return result.user;
        } catch (error) {
            console.error('AuthManager.login() error:', error);
            throw error;
        }
    }

    /**
     * Регистрация пользователя
     * @param {Object} data - Данные регистрации
     * @param {string} data.email
     * @param {string} data.password
     * @param {string} data.fullname
     * @returns {Promise<Object>} Данные пользователя
     */
    async register(data) {
        try {
            const result = await authService.register(data);
            
            // Очищаем кэш
            this._userCache = null;
            this._cacheExpiry = null;
            
            console.log('User registered:', result.user);
            return result.user;
        } catch (error) {
            console.error('AuthManager.register() error:', error);
            throw error;
        }
    }

    /**
     * Логаут пользователя
     * @returns {Promise<void>}
     */
    async logout() {
        try {
            await authService.logout();
            
            // Очищаем кэш
            this._userCache = null;
            this._cacheExpiry = null;
            
            console.log('User logged out');
        } catch (error) {
            console.error('AuthManager.logout() error:', error);
        }
    }

    /**
     * Обновить данные пользователя в кэше
     * @param {Object} user
     */
    updateUserCache(user) {
        this._userCache = user;
        this._cacheExpiry = Date.now() + this._CACHE_TTL;
    }

    /**
     * Очистить кэш
     */
    clearCache() {
        this._userCache = null;
        this._cacheExpiry = null;
    }
}

// Экземпляр для обратной совместимости
export const authManager = new AuthManager();

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

/**
 * Проверка доступа к странице (для использования в HTML)
 * @param {string} requiredRole - Требуемая роль
 */
window.checkAuth = async (requiredRole = null) => {
    return await checkAuth(requiredRole);
};

/**
 * Инициализация защиты роутов
 * @param {string} requiredRole - Требуемая роль
 */
window.initAuthGuard = (requiredRole = null) => {
    initAuthGuard(requiredRole);
};

/**
 * Получить профиль пользователя
 */
window.getUserProfile = async () => {
    return await userService.getProfile();
};
