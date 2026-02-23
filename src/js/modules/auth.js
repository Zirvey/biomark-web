// src/js/modules/auth.js
import { getFromStorage, setInStorage, removeFromStorage } from '../utils/storage.js';
import { isValidUser } from '../utils/validation.js';
import { STORAGE_KEYS, USER_ROLES } from '../utils/constants.js';

export class AuthManager {
    constructor() {
        this.user = getFromStorage(STORAGE_KEYS.USER);
        this.userRole = getFromStorage(STORAGE_KEYS.USER_ROLE);
    }

    /**
     * Получить текущего пользователя
     * @returns {Object|null}
     */
    getUser() {
        return this.user;
    }

    /**
     * Получить роль текущего пользователя
     * @returns {string|null}
     */
    getUserRole() {
        return this.userRole;
    }

    /**
     * Проверить, авторизован ли пользователь
     * @returns {boolean}
     */
    isAuthenticated() {
        return this.user !== null && this.userRole !== null;
    }

    /**
     * Проверить, является ли текущий пользователь покупателем
     * @returns {boolean}
     */
    isBuyer() {
        return this.userRole === USER_ROLES.BUYER;
    }

    /**
     * Проверить, является ли текущий пользователь фермером
     * @returns {boolean}
     */
    isFarmer() {
        return this.userRole === USER_ROLES.FARMER;
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

        this.user = user;
        this.userRole = role;

        setInStorage(STORAGE_KEYS.USER, user);
        setInStorage(STORAGE_KEYS.USER_ROLE, role);

        return true;
    }

    /**
     * Логаут пользователя
     */
    logout() {
        this.user = null;
        this.userRole = null;
        removeFromStorage(STORAGE_KEYS.USER);
        removeFromStorage(STORAGE_KEYS.USER_ROLE);
    }
}

export const authManager = new AuthManager();
