/**
 * @file PaymentService — обработка платежей
 * @description Интеграция с платёжными шлюзами, валидация транзакций
 */

import api, { sanitize } from './api.js';

// ============================================
// ТИПЫ (JSDoc)
// ============================================

/**
 * @typedef {Object} PaymentMethod
 * @property {string} id - ID метода оплаты
 * @property {string} type - Тип (card | bank | googlepay | applepay)
 * @property {string} name - Название
 * @property {string} [icon] - Иконка
 * @property {boolean} available - Доступен ли
 */

/**
 * @typedef {Object} PaymentData
 * @property {string} planId - ID плана подписки
 * @property {string} paymentMethod - Метод оплаты
 * @property {Object} [card] - Данные карты (для card)
 * @property {string} [card.number] - Номер карты
 * @property {string} [card.expiry] - Срок действия
 * @property {string} [card.cvv] - CVV код
 * @property {string} [card.holder] - Владелец карты
 * @property {string} [bankReference] - Референс банковского перевода
 */

/**
 * @typedef {Object} PaymentResponse
 * @property {string} transactionId - ID транзакции
 * @property {string} status - Статус (success | pending | failed)
 * @property {number} amount - Сумма
 * @property {string} currency - Валюта
 * @property {string} [receiptUrl] - URL чека
 * @property {string} [errorMessage] - Сообщение об ошибке
 */

// ============================================
// КОНСТАНТЫ
// ============================================

/**
 * Доступные методы оплаты
 */
export const PAYMENT_METHODS = {
    CARD: {
        id: 'card',
        type: 'card',
        name: 'Банковская карта',
        icon: '💳',
        available: true,
    },
    BANK: {
        id: 'bank',
        type: 'bank',
        name: 'Банковский перевод',
        icon: '🏦',
        available: true,
    },
    GOOGLEPAY: {
        id: 'googlepay',
        type: 'googlepay',
        name: 'Google Pay',
        icon: 'G',
        available: true,
    },
    APPLEPAY: {
        id: 'applepay',
        type: 'applepay',
        name: 'Apple Pay',
        icon: '',
        available: true,
    },
};

/**
 * Статусы платежей
 */
export const PAYMENT_STATUS = {
    SUCCESS: { key: 'success', label: 'Успешно', color: '#10b981' },
    PENDING: { key: 'pending', label: 'Ожидает', color: '#f97316' },
    FAILED: { key: 'failed', label: 'Ошибка', color: '#ef4444' },
};

// ============================================
// PAYMENT SERVICE
// ============================================

export const paymentService = {
    /**
     * Обработать платёж
     * @param {PaymentData} paymentData - Данные платежа
     * @returns {Promise<PaymentResponse>}
     */
    async processPayment(paymentData) {
        try {
            // Валидация данных
            const validationError = this.validatePaymentData(paymentData);
            if (validationError) {
                throw new Error(validationError);
            }

            // ========================================
            // MOCK РЕЖИМ (для разработки без бэка)
            // ========================================
            if (api.getApiMode() === 'mock') {
                return await this.mockProcessPayment(paymentData);
            }

            // ========================================
            // REAL РЕЖИМ (с бэкендом)
            // ========================================
            const response = await api.request('payments/process', {
                method: 'POST',
                body: JSON.stringify(paymentData),
            });

            return this.normalizePaymentResponse(response.data);
        } catch (error) {
            console.error('Process payment error:', error);
            throw error;
        }
    },

    /**
     * Получить статус платежа по ID
     * @param {string} transactionId - ID транзакции
     * @returns {Promise<PaymentResponse>}
     */
    async getPaymentStatus(transactionId) {
        try {
            const response = await api.request(`payments/${transactionId}/status`);
            return this.normalizePaymentResponse(response.data);
        } catch (error) {
            console.error('Get payment status error:', error);
            throw error;
        }
    },

    /**
     * Получить доступные методы оплаты
     * @returns {Promise<PaymentMethod[]>}
     */
    async getAvailablePaymentMethods() {
        try {
            // В mock режиме возвращаем все методы
            if (api.getApiMode() === 'mock') {
                return Object.values(PAYMENT_METHODS);
            }

            // В real режиме запрашиваем с сервера
            const response = await api.request('payments/methods');
            return response.data.map(method => ({
                id: sanitize(method.id),
                type: sanitize(method.type),
                name: sanitize(method.name),
                icon: method.icon,
                available: method.available,
            }));
        } catch (error) {
            console.error('Get payment methods error:', error);
            return Object.values(PAYMENT_METHODS);
        }
    },

    /**
     * Вернуть платёж (refund)
     * @param {string} transactionId - ID транзакции
     * @param {string} [reason] - Причина возврата
     * @returns {Promise<Object>}
     */
    async refundPayment(transactionId, reason = '') {
        try {
            const response = await api.request(`payments/${transactionId}/refund`, {
                method: 'POST',
                body: JSON.stringify({ reason }),
            });

            return {
                success: true,
                refundId: response.data.refundId,
                amount: response.data.amount,
            };
        } catch (error) {
            console.error('Refund payment error:', error);
            throw error;
        }
    },

    /**
     * Получить историю платежей пользователя
     * @returns {Promise<PaymentResponse[]>}
     */
    async getPaymentHistory() {
        try {
            const response = await api.request('user/payments');
            return response.data.map(payment => this.normalizePaymentResponse(payment));
        } catch (error) {
            console.error('Get payment history error:', error);
            throw error;
        }
    },

    /**
     * Mock обработка платежа (для разработки)
     * @param {PaymentData} paymentData
     * @returns {Promise<PaymentResponse>}
     */
    async mockProcessPayment(paymentData) {
        // Имитация задержки обработки
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Валидация данных карты (упрощённая)
        if (paymentData.paymentMethod === 'card' && paymentData.card) {
            const cardNumber = paymentData.card.number.replace(/\D/g, '');
            
            // Проверка на тестовые номера
            if (cardNumber === '4111111111111111') {
                // Успешный платёж (тестовая карта Visa)
                return {
                    transactionId: `mock_txn_${Date.now()}`,
                    status: 'success',
                    amount: 0, // В mock режиме бесплатно
                    currency: 'CZK',
                    receiptUrl: null,
                    isMock: true,
                };
            } else if (cardNumber === '4000000000000002') {
                // Ошибка платежа (тестовая карта для ошибок)
                throw new Error('Карта отклонена. Попробуйте другую карту.');
            }
        }

        // Для остальных методов - успешный платёж
        return {
            transactionId: `mock_txn_${Date.now()}`,
            status: 'success',
            amount: 0,
            currency: 'CZK',
            receiptUrl: null,
            isMock: true,
        };
    },

    /**
     * Нормализация ответа платёжного шлюза
     * @param {*} data - Сырые данные
     * @returns {PaymentResponse}
     */
    normalizePaymentResponse(data) {
        return {
            transactionId: sanitize(data.transactionId || data.id),
            status: sanitize(data.status),
            amount: data.amount,
            currency: sanitize(data.currency || 'CZK'),
            receiptUrl: data.receiptUrl || null,
            errorMessage: data.errorMessage || null,
            createdAt: data.createdAt || new Date().toISOString(),
        };
    },

    /**
     * Валидация данных платежа
     * @param {PaymentData} data
     * @returns {string|null} Сообщение об ошибке или null
     */
    validatePaymentData(data) {
        if (!data.planId) {
            return 'План подписки не выбран';
        }

        if (!data.paymentMethod) {
            return 'Метод оплаты не выбран';
        }

        // Валидация для карт
        if (data.paymentMethod === 'card' && data.card) {
            const card = data.card;

            if (!card.number || card.number.replace(/\D/g, '').length !== 16) {
                return 'Введите корректный номер карты (16 цифр)';
            }

            if (!card.holder || card.holder.trim().length < 2) {
                return 'Введите имя владельца карты';
            }

            if (!card.expiry || !/^\d{2}\/\d{2}$/.test(card.expiry)) {
                return 'Введите срок действия карты в формате ММ/ГГ';
            }

            // Проверка что карта не истекла
            const [month, year] = card.expiry.split('/').map(num => parseInt(num, 10));
            const now = new Date();
            const currentYear = parseInt(now.getFullYear().toString().slice(-2), 10);
            const currentMonth = now.getMonth() + 1;

            if (year < currentYear || (year === currentYear && month < currentMonth)) {
                return 'Срок действия карты истёк';
            }

            if (!card.cvv || card.cvv.replace(/\D/g, '').length !== 3) {
                return 'Введите корректный CVV код (3 цифры)';
            }
        }

        // Валидация для банковского перевода
        if (data.paymentMethod === 'bank' && data.bankReference) {
            if (data.bankReference.trim().length < 5) {
                return 'Введите корректный номер транзакции';
            }
        }

        return null;
    },

    /**
     * Получить статус платежа с метаданными
     * @param {string} statusKey
     * @returns {Object}
     */
    getStatusMeta(statusKey) {
        return PAYMENT_STATUS[statusKey.toUpperCase()] || PAYMENT_STATUS.FAILED;
    },

    /**
     * Форматировать сумму
     * @param {number} amount
     * @param {string} currency
     * @param {string} locale
     * @returns {string}
     */
    formatAmount(amount, currency = 'CZK', locale = 'cs-CZ') {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency,
        }).format(amount);
    },

    /**
     * Маскировать номер карты
     * @param {string} cardNumber
     * @returns {string}
     */
    maskCardNumber(cardNumber) {
        if (!cardNumber) return '';
        const last4 = cardNumber.slice(-4);
        return `**** **** **** ${last4}`;
    },
};

export default paymentService;
