/**
 * @file SubscriptionService — управление подписками
 * @description Получение, создание, продление подписок
 */

import api, { sanitize } from './api.js';

// ============================================
// ТИПЫ (JSDoc)
// ============================================

/**
 * @typedef {Object} Subscription
 * @property {string} id - ID подписки
 * @property {string} userId - ID пользователя
 * @property {string} plan - Тип плана (1month | 3months | 1year)
 * @property {string} status - Статус (active | expired | cancelled)
 * @property {string} startDate - Дата начала
 * @property {string} endDate - Дата окончания
 * @property {number} [deliveriesRemaining] - Осталось доставок
 * @property {string} [nextDeliveryDate] - Дата следующей доставки
 */

/**
 * @typedef {Object} SubscriptionPlan
 * @property {string} id - ID плана
 * @property {string} name - Название
 * @property {string} duration - Длительность
 * @property {number} price - Цена
 * @property {number} deliveries - Количество доставок в месяц
 * @property {string} [description] - Описание
 */

// ============================================
// КОНСТАНТЫ
// ============================================

/**
 * Планы подписок
 */
export const SUBSCRIPTION_PLANS = {
    '1month': {
        id: '1month',
        name: '1 месяц',
        duration: '1 месяц',
        price: 299,
        deliveries: 4,
        description: 'Пробный период',
    },
    '3months': {
        id: '3months',
        name: '3 месяца',
        duration: '3 месяца',
        price: 799,
        deliveries: 4,
        description: 'Выгода 15%',
    },
    '1year': {
        id: '1year',
        name: '1 год',
        duration: '12 месяцев',
        price: 2499,
        deliveries: 4,
        description: 'Максимальная выгода 40%',
    },
};

/**
 * Статусы подписок
 */
export const SUBSCRIPTION_STATUS = {
    ACTIVE: { key: 'active', label: 'Активна', color: '#84A93C' },
    EXPIRED: { key: 'expired', label: 'Истекла', color: '#f97316' },
    CANCELLED: { key: 'cancelled', label: 'Отменена', color: '#6b7280' },
};

// ============================================
// SUBSCRIPTION SERVICE
// ============================================

export const subscriptionService = {
    /**
     * Получить подписку пользователя
     * @returns {Promise<Subscription|null>}
     */
    async getSubscription() {
        try {
            const response = await api.request('subscriptions');

            if (!response.data) {
                return null;
            }

            return this.normalizeSubscription(response.data);
        } catch (error) {
            if (error.status === 404) {
                return null;
            }
            console.error('Get subscription error:', error);
            throw error;
        }
    },
    
    /**
     * Создать новую подписку
     * @param {string} planId - ID плана подписки
     * @returns {Promise<Subscription>}
     */
    async createSubscription(planId) {
        try {
            console.log('createSubscription called with planId:', planId, typeof planId);
            
            // Валидация плана
            if (!SUBSCRIPTION_PLANS[planId]) {
                console.error('Invalid planId:', planId);
                throw new Error('Некорректный план подписки: ' + planId);
            }

            const response = await api.request('subscriptions', {
                method: 'POST',
                body: JSON.stringify({
                    plan: planId,
                }),
            });

            return this.normalizeSubscription(response.data);
        } catch (error) {
            console.error('Create subscription error:', error);
            throw error;
        }
    },
    
    /**
     * Продлить подписку
     * @param {string} planId - ID плана
     * @returns {Promise<Subscription>}
     */
    async renewSubscription(planId) {
        try {
            // Получаем текущую подписку
            const current = await this.getSubscription();
            
            if (current && current.status === 'active') {
                // Обновляем существующую (продлеваем)
                const response = await api.request(`subscriptions/${current.id}/renew`, {
                    method: 'POST',
                    body: JSON.stringify({ plan: planId }),
                });
                
                return this.normalizeSubscription(response.data);
            } else {
                // Создаём новую
                return await this.createSubscription(planId);
            }
        } catch (error) {
            console.error('Renew subscription error:', error);
            throw error;
        }
    },
    
    /**
     * Отменить подписку
     * @returns {Promise<Subscription>}
     */
    async cancelSubscription() {
        try {
            const current = await this.getSubscription();
            
            if (!current) {
                throw new Error('Подписка не найдена');
            }
            
            const response = await api.request(`subscriptions/${current.id}/cancel`, {
                method: 'POST',
            });
            
            return this.normalizeSubscription(response.data);
        } catch (error) {
            console.error('Cancel subscription error:', error);
            throw error;
        }
    },
    
    /**
     * Нормализация данных подписки
     * @param {*} sub - Сырые данные
     * @returns {Subscription}
     */
    normalizeSubscription(sub) {
        const now = new Date();
        const endDate = new Date(sub.endDate);
        
        // Рассчитываем остаток доставок (упрощённо)
        const totalDays = Math.ceil((endDate - new Date(sub.startDate)) / (1000 * 60 * 60 * 24));
        const remainingDays = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
        const deliveriesPerMonth = 4;
        
        let deliveriesRemaining = 0;
        if (sub.status === 'active' && remainingDays > 0) {
            deliveriesRemaining = Math.ceil((remainingDays / 30) * deliveriesPerMonth);
        }
        
        // Следующая доставка (каждую пятницу, упрощённо)
        let nextDeliveryDate = null;
        if (sub.status === 'active' && remainingDays > 0) {
            const nextFriday = this.getNextFriday();
            if (nextFriday <= endDate) {
                nextDeliveryDate = nextFriday.toISOString().split('T')[0];
            }
        }
        
        return {
            id: sanitize(sub.id),
            userId: sanitize(sub.userId),
            plan: sanitize(sub.plan),
            status: sanitize(sub.status),
            startDate: sub.startDate,
            endDate: sub.endDate,
            deliveriesRemaining,
            nextDeliveryDate,
        };
    },
    
    /**
     * Получить следующий Friday
     * @returns {Date}
     */
    getNextFriday() {
        const date = new Date();
        const day = date.getDay();
        const daysUntilFriday = (5 - day + 7) % 7 || 7;
        date.setDate(date.getDate() + daysUntilFriday);
        return date;
    },
    
    /**
     * Получить план по ID
     * @param {string} planId
     * @returns {SubscriptionPlan|null}
     */
    getPlan(planId) {
        return SUBSCRIPTION_PLANS[planId] || null;
    },
    
    /**
     * Получить все планы
     * @returns {SubscriptionPlan[]}
     */
    getAllPlans() {
        return Object.values(SUBSCRIPTION_PLANS);
    },
    
    /**
     * Получить статус подписки с метаданными
     * @param {string} statusKey
     * @returns {Object}
     */
    getStatusMeta(statusKey) {
        return SUBSCRIPTION_STATUS[statusKey.toUpperCase()] || SUBSCRIPTION_STATUS.CANCELLED;
    },
    
    /**
     * Проверка активности подписки
     * @param {Subscription} subscription
     * @returns {boolean}
     */
    isActive(subscription) {
        if (!subscription) return false;
        
        if (subscription.status !== 'active') return false;
        
        const endDate = new Date(subscription.endDate);
        return endDate > new Date();
    },
    
    /**
     * Получить оставшиеся дни подписки
     * @param {Subscription} subscription
     * @returns {number|null}
     */
    getDaysRemaining(subscription) {
        if (!subscription || !subscription.endDate) return null;
        
        const endDate = new Date(subscription.endDate);
        const now = new Date();
        const diff = endDate - now;
        
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    },
    
    /**
     * Форматировать дату окончания
     * @param {string} dateString
     * @param {string} locale
     * @returns {string}
     */
    formatEndDate(dateString, locale = 'ru-RU') {
        const date = new Date(dateString);
        return date.toLocaleDateString(locale, {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    },
    
    /**
     * Рассчитать выгоду от плана
     * @param {string} planId
     * @returns {number} Процент выгоды
     */
    calculateSavings(planId) {
        const basePrice = SUBSCRIPTION_PLANS['1month'].price;
        const plan = SUBSCRIPTION_PLANS[planId];
        
        if (!plan) return 0;
        
        let months = 1;
        if (planId === '3months') months = 3;
        if (planId === '1year') months = 12;
        
        const fullPrice = basePrice * months;
        const savings = ((fullPrice - plan.price) / fullPrice) * 100;
        
        return Math.round(savings);
    },
};

export default subscriptionService;
