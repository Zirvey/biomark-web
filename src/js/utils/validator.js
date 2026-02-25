/**
 * @file validator.js — Валидация данных
 * @description Проверка email, телефонов, карт и других данных
 */

// ============================================
// ТИПЫ (JSDoc)
// ============================================

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Валидно или нет
 * @property {string} [message] - Сообщение об ошибке
 */

// ============================================
// КОНСТАНТЫ
// ============================================

const PATTERNS = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE: /^\+?[\d\s\-()]{10,}$/,
    CARD_NUMBER: /^\d{13,19}$/,
    CARD_EXPIRY: /^(0[1-9]|1[0-2])\/\d{2}$/,
    CVV: /^\d{3,4}$/,
    NAME: /^[a-zA-Zа-яА-ЯёЁ\s'-]{2,100}$/,
    ADDRESS: /^.{5,200}$/,
};

// ============================================
// VALIDATOR
// ============================================

export const validator = {
    /**
     * Валидация email
     * @param {string} email
     * @returns {ValidationResult}
     */
    email(email) {
        if (!email || typeof email !== 'string') {
            return { valid: false, message: 'Email обязателен' };
        }

        const trimmed = email.trim();
        if (!PATTERNS.EMAIL.test(trimmed)) {
            return { valid: false, message: 'Некорректный формат email' };
        }

        if (trimmed.length > 255) {
            return { valid: false, message: 'Email слишком длинный' };
        }

        return { valid: true };
    },

    /**
     * Валидация телефона
     * @param {string} phone
     * @returns {ValidationResult}
     */
    phone(phone) {
        if (!phone || typeof phone !== 'string') {
            return { valid: false, message: 'Телефон обязателен' };
        }

        const trimmed = phone.trim();
        const digitsOnly = trimmed.replace(/\D/g, '');

        if (digitsOnly.length < 10 || digitsOnly.length > 15) {
            return { valid: false, message: 'Телефон должен содержать 10-15 цифр' };
        }

        if (!PATTERNS.PHONE.test(trimmed)) {
            return { valid: false, message: 'Некорректный формат телефона' };
        }

        return { valid: true };
    },

    /**
     * Валидация имени
     * @param {string} name
     * @returns {ValidationResult}
     */
    name(name) {
        if (!name || typeof name !== 'string') {
            return { valid: false, message: 'Имя обязательно' };
        }

        const trimmed = name.trim();

        if (trimmed.length < 2) {
            return { valid: false, message: 'Имя должно содержать минимум 2 символа' };
        }

        if (trimmed.length > 100) {
            return { valid: false, message: 'Имя не должно превышать 100 символов' };
        }

        if (!PATTERNS.NAME.test(trimmed)) {
            return { valid: false, message: 'Имя содержит недопустимые символы' };
        }

        return { valid: true };
    },

    /**
     * Валидация адреса
     * @param {string} address
     * @returns {ValidationResult}
     */
    address(address) {
        if (!address || typeof address !== 'string') {
            return { valid: false, message: 'Адрес обязателен' };
        }

        const trimmed = address.trim();

        if (trimmed.length < 5) {
            return { valid: false, message: 'Адрес должен содержать минимум 5 символов' };
        }

        if (trimmed.length > 200) {
            return { valid: false, message: 'Адрес не должен превышать 200 символов' };
        }

        return { valid: true };
    },

    /**
     * Валидация пароля
     * @param {string} password
     * @param {Object} options
     * @returns {ValidationResult}
     */
    password(password, options = { minLength: 6 }) {
        if (!password || typeof password !== 'string') {
            return { valid: false, message: 'Пароль обязателен' };
        }

        if (password.length < options.minLength) {
            return {
                valid: false,
                message: `Пароль должен содержать минимум ${options.minLength} символов`,
            };
        }

        if (password.length > 128) {
            return { valid: false, message: 'Пароль слишком длинный' };
        }

        // Проверка на сложные пароли (опционально)
        if (options.requireComplex) {
            const hasUppercase = /[A-Z]/.test(password);
            const hasLowercase = /[a-z]/.test(password);
            const hasNumbers = /\d/.test(password);
            const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

            if (!hasUppercase || !hasLowercase || !hasNumbers) {
                return {
                    valid: false,
                    message:
                        'Пароль должен содержать заглавные буквы, строчные буквы и цифры',
                };
            }
        }

        return { valid: true };
    },

    /**
     * Валидация номера карты (алгоритм Луна)
     * @param {string} cardNumber
     * @returns {ValidationResult}
     */
    cardNumber(cardNumber) {
        if (!cardNumber || typeof cardNumber !== 'string') {
            return { valid: false, message: 'Номер карты обязателен' };
        }

        const digitsOnly = cardNumber.replace(/\D/g, '');

        if (!PATTERNS.CARD_NUMBER.test(digitsOnly)) {
            return { valid: false, message: 'Некорректный номер карты' };
        }

        // Алгоритм Луна (Luhn algorithm)
        let sum = 0;
        let isEven = false;

        for (let i = digitsOnly.length - 1; i >= 0; i--) {
            let digit = parseInt(digitsOnly[i], 10);

            if (isEven) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }

            sum += digit;
            isEven = !isEven;
        }

        if (sum % 10 !== 0) {
            return { valid: false, message: 'Некорректный номер карты' };
        }

        // Проверка на известные префиксы
        const prefix = digitsOnly.substring(0, 2);
        const validPrefixes = ['34', '37', '4', '51', '52', '53', '54', '55', '6'];
        const isValidPrefix = validPrefixes.some((p) => digitsOnly.startsWith(p));

        if (!isValidPrefix) {
            return { valid: false, message: 'Неподдерживаемая платёжная система' };
        }

        return { valid: true };
    },

    /**
     * Валидация срока действия карты
     * @param {string} expiry
     * @returns {ValidationResult}
     */
    cardExpiry(expiry) {
        if (!expiry || typeof expiry !== 'string') {
            return { valid: false, message: 'Срок действия обязателен' };
        }

        if (!PATTERNS.CARD_EXPIRY.test(expiry)) {
            return { valid: false, message: 'Некорректный формат (ММ/ГГ)' };
        }

        const [month, year] = expiry.split('/').map((num) => parseInt(num, 10));
        const now = new Date();
        const currentYear = parseInt(now.getFullYear().toString().slice(-2), 10);
        const currentMonth = now.getMonth() + 1;

        if (year < currentYear) {
            return { valid: false, message: 'Карта истекла' };
        }

        if (year === currentYear && month < currentMonth) {
            return { valid: false, message: 'Карта истекла' };
        }

        if (year > currentYear + 10) {
            return { valid: false, message: 'Некорректный срок действия' };
        }

        return { valid: true };
    },

    /**
     * Валидация CVV
     * @param {string} cvv
     * @returns {ValidationResult}
     */
    cvv(cvv) {
        if (!cvv || typeof cvv !== 'string') {
            return { valid: false, message: 'CVV обязателен' };
        }

        if (!PATTERNS.CVV.test(cvv)) {
            return { valid: false, message: 'CVV должен содержать 3-4 цифры' };
        }

        return { valid: true };
    },

    /**
     * Валидация формы целиком
     * @param {Object} data
     * @param {Object} rules
     * @returns {Object} { valid: boolean, errors: Object }
     */
    validateForm(data, rules) {
        const errors = {};
        let isValid = true;

        for (const [field, value] of Object.entries(data)) {
            const rule = rules[field];
            if (!rule) continue;

            const result = rule(value);
            if (!result.valid) {
                errors[field] = result.message;
                isValid = false;
            }
        }

        return { valid: isValid, errors };
    },
};

export default validator;
