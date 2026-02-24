// src/js/modules/auth.js
import { getFromStorage, setInStorage, removeFromStorage } from '../utils/storage.js';
import { isValidUser } from '../utils/validation.js';
import { STORAGE_KEYS, USER_ROLES } from '../utils/constants.js';

export class AuthManager {
    constructor() {
        // Не кэшируем - всегда читаем из localStorage
    }

    /**
     * Получить текущего пользователя (всегда из localStorage)
     * @returns {Object|null}
     */
    getUser() {
        try {
            const user = localStorage.getItem(STORAGE_KEYS.USER);
            console.log('AuthManager.getUser() raw:', user);
            return user ? JSON.parse(user) : null;
        } catch (error) {
            console.error('Error reading user:', error);
            return null;
        }
    }

    /**
     * Получить роль текущего пользователя (всегда из localStorage)
     * @returns {string|null}
     */
    getUserRole() {
        try {
            const role = localStorage.getItem(STORAGE_KEYS.USER_ROLE);
            console.log('AuthManager.getUserRole() raw:', role);
            // Роль хранится как простая строка, не JSON
            return role || null;
        } catch (error) {
            console.error('Error reading role:', error);
            return null;
        }
    }

    /**
     * Проверить, авторизован ли пользователь
     * @returns {boolean}
     */
    isAuthenticated() {
        const user = this.getUser();
        const userRole = this.getUserRole();
        return user !== null && userRole !== null;
    }

    /**
     * Проверить, является ли текущий пользователь покупателем
     * @returns {boolean}
     */
    isBuyer() {
        return this.getUserRole() === USER_ROLES.BUYER;
    }

    /**
     * Проверить, является ли текущий пользователь фермером
     * @returns {boolean}
     */
    isFarmer() {
        return this.getUserRole() === USER_ROLES.FARMER;
    }

    /**
     * Логин пользователя
     * @param {Object} user
     * @param {string} role
     * @returns {boolean}
     */
    login(user, role) {
        if (!isValidUser({ ...user, role })) {
            console.error('Invalid user data for login');
            return false;
        }

        try {
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
            // Сохраняем роль как простую строку, не JSON
            localStorage.setItem(STORAGE_KEYS.USER_ROLE, role);
            console.log('User logged in:', user, 'Role:', role);
            return true;
        } catch (error) {
            console.error('Error saving user:', error);
            return false;
        }
    }

    /**
     * Логаут пользователя
     */
    logout() {
        try {
            localStorage.removeItem(STORAGE_KEYS.USER);
            localStorage.removeItem(STORAGE_KEYS.USER_ROLE);
            console.log('User logged out');
        } catch (error) {
            console.error('Error during logout:', error);
        }
    }
}

export const authManager = new AuthManager();
