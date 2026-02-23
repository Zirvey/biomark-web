// src/js/utils/storage.js

/**
 * Безопасно читает и парсит данные из localStorage
 * @param {string} key - Ключ
 * @returns {Object|null} Распарсенные данные или null
 */
export function getFromStorage(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error(`Error reading from storage [${key}]:`, error);
        return null;
    }
}

/**
 * Безопасно сохраняет данные в localStorage
 * @param {string} key - Ключ
 * @param {any} value - Значение для сохранения
 * @returns {boolean} Успех операции
 */
export function setInStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error(`Error writing to storage [${key}]:`, error);
        return false;
    }
}

/**
 * Удаляет ключ из localStorage
 * @param {string} key - Ключ
 */
export function removeFromStorage(key) {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error(`Error removing from storage [${key}]:`, error);
    }
}

/**
 * Очищает весь localStorage
 */
export function clearStorage() {
    try {
        localStorage.clear();
    } catch (error) {
        console.error('Error clearing storage:', error);
    }
}
