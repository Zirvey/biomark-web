/**
 * @file OrderService — управление заказами
 * @description Создание, получение, отслеживание заказов
 */

import api, { sanitize } from './api.js';

// ============================================
// ТИПЫ (JSDoc)
// ============================================

/**
 * @typedef {Object} OrderItem
 * @property {number} id - ID продукта
 * @property {string} name - Название продукта
 * @property {number} quantity - Количество
 * @property {number} price - Цена за единицу
 * @property {number} total - Общая стоимость (price * quantity)
 */

/**
 * @typedef {Object} Order
 * @property {number} id - ID заказа
 * @property {string} userId - ID пользователя
 * @property {OrderItem[]} items - Товары в заказе
 * @property {number} total - Общая сумма
 * @property {string} status - Статус (pending | processing | delivered | cancelled)
 * @property {string} deliveryDate - Дата доставки
 * @property {string} createdAt - Дата создания
 * @property {string} [updatedAt] - Дата обновления
 */

/**
 * @typedef {Object} CreateOrderData
 * @property {OrderItem[]} items - Товары
 * @property {string} deliveryDate - Дата доставки
 * @property {string} [address] - Адрес доставки (опционально)
 * @property {string} [comment] - Комментарий к заказу
 */

// ============================================
// КОНСТАНТЫ
// ============================================

/**
 * Статусы заказов с метаданными
 */
export const ORDER_STATUS = {
    PENDING: { key: 'pending', label: 'Ожидает', class: 'pending', color: '#f97316' },
    PROCESSING: { key: 'processing', label: 'В пути', class: 'processing', color: '#3b82f6' },
    DELIVERED: { key: 'delivered', label: 'Доставлен', class: 'delivered', color: '#84A93C' },
    CANCELLED: { key: 'cancelled', label: 'Отменён', class: 'cancelled', color: '#6b7280' },
};

// ============================================
// ORDER SERVICE
// ============================================

export const orderService = {
    /**
     * Получить все заказы пользователя
     * @returns {Promise<Order[]>}
     */
    async getOrders() {
        try {
            const response = await api.request('user/orders');
            
            // Санитизация и нормализация данных
            return response.data.map(order => this.normalizeOrder(order));
        } catch (error) {
            console.error('Get orders error:', error);
            throw error;
        }
    },
    
    /**
     * Получить заказ по ID
     * @param {number} orderId - ID заказа
     * @returns {Promise<Order|null>}
     */
    async getOrder(orderId) {
        try {
            const response = await api.request(`orders/${orderId}`);
            return this.normalizeOrder(response.data);
        } catch (error) {
            if (error.status === 404) {
                return null;
            }
            console.error('Get order error:', error);
            throw error;
        }
    },
    
    /**
     * Создать новый заказ
     * @param {CreateOrderData} data - Данные заказа
     * @returns {Promise<Order>}
     */
    async createOrder(data) {
        try {
            // Валидация
            const validationError = this.validateCreateOrderData(data);
            if (validationError) {
                throw new Error(validationError);
            }
            
            const response = await api.request('orders', {
                method: 'POST',
                body: JSON.stringify({
                    items: data.items,
                    total: data.items.reduce((sum, item) => sum + item.total, 0),
                    deliveryDate: data.deliveryDate,
                    address: data.address,
                    comment: data.comment,
                }),
            });
            
            return this.normalizeOrder(response.data);
        } catch (error) {
            console.error('Create order error:', error);
            throw error;
        }
    },
    
    /**
     * Отменить заказ
     * @param {number} orderId - ID заказа
     * @returns {Promise<Order>}
     */
    async cancelOrder(orderId) {
        try {
            const response = await api.request(`orders/${orderId}/cancel`, {
                method: 'POST',
            });
            
            return this.normalizeOrder(response.data);
        } catch (error) {
            console.error('Cancel order error:', error);
            throw error;
        }
    },
    
    /**
     * Нормализация данных заказа
     * @param {*} order - Сырые данные
     * @returns {Order}
     */
    normalizeOrder(order) {
        return {
            id: order.id,
            userId: sanitize(order.userId),
            items: (order.items || []).map(item => ({
                id: item.id,
                name: sanitize(item.name),
                quantity: item.quantity,
                price: item.price,
                total: item.total,
            })),
            total: order.total,
            status: sanitize(order.status),
            deliveryDate: sanitize(order.deliveryDate),
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
        };
    },
    
    /**
     * Валидация данных для создания заказа
     * @param {CreateOrderData} data
     * @returns {string|null} Сообщение об ошибке или null
     */
    validateCreateOrderData(data) {
        if (!data.items || !Array.isArray(data.items)) {
            return 'Заказ должен содержать товары';
        }
        
        if (data.items.length === 0) {
            return 'Заказ не может быть пустым';
        }
        
        for (const item of data.items) {
            if (!item.id || typeof item.id !== 'number') {
                return 'Некорректный ID товара';
            }
            if (!item.quantity || item.quantity < 1) {
                return 'Количество должно быть больше 0';
            }
            if (!item.price || item.price < 0) {
                return 'Цена должна быть неотрицательной';
            }
        }
        
        if (!data.deliveryDate) {
            return 'Дата доставки обязательна';
        }
        
        // Проверка что дата не в прошлом
        const delivery = new Date(data.deliveryDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (delivery < today) {
            return 'Дата доставки не может быть в прошлом';
        }
        
        return null;
    },
    
    /**
     * Получить статус заказа с метаданными
     * @param {string} statusKey - Ключ статуса
     * @returns {Object}
     */
    getStatusMeta(statusKey) {
        return ORDER_STATUS[statusKey.toUpperCase()] || ORDER_STATUS.PENDING;
    },
    
    /**
     * Отфильтровать заказы по статусу
     * @param {Order[]} orders - Список заказов
     * @param {string} status - Статус для фильтрации
     * @returns {Order[]}
     */
    filterByStatus(orders, status) {
        return orders.filter(order => order.status === status);
    },
    
    /**
     * Получить активные заказы (не доставленные и не отменённые)
     * @param {Order[]} orders
     * @returns {Order[]}
     */
    getActiveOrders(orders) {
        return orders.filter(order => 
            order.status !== 'delivered' && order.status !== 'cancelled'
        );
    },
    
    /**
     * Сортировать заказы по дате (новые сверху)
     * @param {Order[]} orders
     * @returns {Order[]}
     */
    sortByDate(orders) {
        return [...orders].sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
        );
    },
    
    /**
     * Форматировать дату заказа для отображения
     * @param {string} dateString - ISO дата
     * @param {string} locale - Локаль (по умолчанию ru-RU)
     * @returns {string}
     */
    formatDate(dateString, locale = 'ru-RU') {
        const date = new Date(dateString);
        return date.toLocaleDateString(locale, {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    },
    
    /**
     * Получить сумму всех заказов
     * @param {Order[]} orders
     * @returns {number}
     */
    calculateTotalSpent(orders) {
        return orders.reduce((sum, order) => sum + (order.total || 0), 0);
    },
    
    /**
     * Получить количество заказов
     * @param {Order[]} orders
     * @returns {number}
     */
    countOrders(orders) {
        return orders.length;
    },
};

export default orderService;
