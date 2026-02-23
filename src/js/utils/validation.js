// src/js/utils/validation.js

/**
 * Проверяет, является ли пользователь валидным
 * @param {Object} user
 * @returns {boolean}
 */
export function isValidUser(user) {
    return user &&
        typeof user.fullname === 'string' &&
        user.fullname.length > 0 &&
        ['buyer', 'farmer'].includes(user.role);
}

/**
 * Проверяет, является ли продукт валидным
 * @param {Object} product
 * @returns {boolean}
 */
export function isValidProduct(product) {
    return product &&
        typeof product.id === 'number' &&
        typeof product.name === 'string' &&
        typeof product.priceSubscription === 'number' &&
        product.priceSubscription >= 0;
}

/**
 * Проверяет валидность email
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Проверяет минимальную длину пароля
 * @param {string} password
 * @param {number} minLength
 * @returns {boolean}
 */
export function isValidPassword(password, minLength = 8) {
    return password && password.length >= minLength;
}
