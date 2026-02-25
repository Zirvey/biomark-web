/**
 * @file UserService — управление профилем пользователя
 * @description Получение, обновление, удаление профиля
 */

import api, { sanitize } from './api.js';

// ============================================
// ТИПЫ (JSDoc)
// ============================================

/**
 * @typedef {Object} UserProfile
 * @property {string} id - ID пользователя
 * @property {string} email - Email
 * @property {string} fullname - ФИО
 * @property {string} [phone] - Телефон
 * @property {string} [address] - Адрес доставки
 * @property {string} [avatarUrl] - URL аватара
 */

/**
 * @typedef {Object} UpdateProfileData
 * @property {string} [fullname] - Новое ФИО
 * @property {string} [phone] - Новый телефон
 * @property {string} [address] - Новый адрес
 */

// ============================================
// USER SERVICE
// ============================================

export const userService = {
    /**
     * Получить профиль пользователя
     * @returns {Promise<UserProfile|null>}
     */
    async getProfile() {
        try {
            const response = await api.request('user/profile');
            const data = response.data;
            
            // Санитизация данных (защита от XSS)
            return {
                id: sanitize(data.id),
                email: sanitize(data.email),
                fullname: sanitize(data.fullname),
                phone: sanitize(data.phone || ''),
                address: sanitize(data.address || ''),
                avatarUrl: data.avatarUrl || null,
            };
        } catch (error) {
            console.error('Get profile error:', error);
            
            if (error.status === 404) {
                return null;
            }
            
            throw error;
        }
    },
    
    /**
     * Обновить профиль пользователя
     * @param {UpdateProfileData} data - Данные для обновления
     * @returns {Promise<UserProfile>}
     */
    async updateProfile(data) {
        try {
            // Валидация данных
            const validationError = this.validateProfileData(data);
            if (validationError) {
                throw new Error(validationError);
            }
            
            const response = await api.request('user/profile', {
                method: 'PUT',
                body: JSON.stringify(data),
            });
            
            const updatedData = response.data;
            
            // Санитизация данных
            return {
                id: sanitize(updatedData.id),
                email: sanitize(updatedData.email),
                fullname: sanitize(updatedData.fullname),
                phone: sanitize(updatedData.phone || ''),
                address: sanitize(updatedData.address || ''),
                avatarUrl: updatedData.avatarUrl || null,
            };
        } catch (error) {
            console.error('Update profile error:', error);
            throw error;
        }
    },
    
    /**
     * Удалить аккаунт пользователя
     * @returns {Promise<void>}
     */
    async deleteAccount() {
        try {
            await api.request('user/profile', {
                method: 'DELETE',
            });
            
            console.log('Account deleted');
        } catch (error) {
            console.error('Delete account error:', error);
            throw error;
        }
    },
    
    /**
     * Валидация данных профиля
     * @param {UpdateProfileData} data
     * @returns {string|null} Сообщение об ошибке или null
     */
    validateProfileData(data) {
        // fullname
        if (data.fullname !== undefined) {
            if (typeof data.fullname !== 'string') {
                return 'ФИО должно быть строкой';
            }
            if (data.fullname.trim().length < 2) {
                return 'ФИО должно содержать минимум 2 символа';
            }
            if (data.fullname.length > 100) {
                return 'ФИО не должно превышать 100 символов';
            }
        }
        
        // phone
        if (data.phone !== undefined && data.phone) {
            if (typeof data.phone !== 'string') {
                return 'Телефон должен быть строкой';
            }
            // Простая валидация формата (можно усилить)
            const phoneRegex = /^\+?[\d\s\-()]{10,}$/;
            if (!phoneRegex.test(data.phone.trim())) {
                return 'Некорректный формат телефона';
            }
        }
        
        // address
        if (data.address !== undefined && data.address) {
            if (typeof data.address !== 'string') {
                return 'Адрес должен быть строкой';
            }
            if (data.address.trim().length < 5) {
                return 'Адрес должен содержать минимум 5 символов';
            }
            if (data.address.length > 200) {
                return 'Адрес не должен превышать 200 символов';
            }
        }
        
        return null;
    },
    
    /**
     * Получить инициалы пользователя
     * @param {UserProfile} user
     * @returns {string}
     */
    getInitials(user) {
        if (!user || !user.fullname) {
            return '??';
        }
        
        const parts = user.fullname.trim().split(/\s+/);
        const initials = parts.slice(0, 2).map(part => part[0]?.toUpperCase());
        return initials.join('') || '??';
    },
    
    /**
     * Получить аватар (emoji или URL)
     * @param {UserProfile} user
     * @returns {string}
     */
    getAvatar(user) {
        if (user?.avatarUrl) {
            return user.avatarUrl;
        }
        
        // Возвращаем emoji по первой букве имени
        const firstName = user?.fullname?.split(/\s+/)[0] || 'User';
        const firstLetter = firstName[0]?.toLowerCase() || 'u';
        
        const emojiMap = {
            'а': '🍎', 'б': '🫐', 'в': '🥕', 'г': '🍇', 'д': '🍈',
            'е': '🍆', 'ж': '🌽', 'з': '🥝', 'и': '🥑', 'й': '🍋',
            'к': '🥬', 'л': '🍐', 'м': '🍊', 'н': '🥦', 'о': '🍅',
            'п': '🥒', 'р': '🌶️', 'с': '🥔', 'т': '🧅', 'у': '🍀',
            'ф': '🍓', 'х': '🍒', 'ц': '🥕', 'ч': '🫛', 'ш': '🌿',
            'щ': '🍄', 'ъ': '🥜', 'ы': '🌰', 'ь': '🥥', 'э': '🍉',
            'ю': '🍌', 'я': '🍑',
            'a': '🍎', 'b': '🫐', 'c': '🥕', 'd': '🍇', 'e': '🍈',
            'f': '🍆', 'g': '🌽', 'h': '🥝', 'i': '🥑', 'j': '🍋',
            'k': '🥬', 'l': '🍐', 'm': '🍊', 'n': '🥦', 'o': '🍅',
            'p': '🥒', 'q': '🌶️', 'r': '🥔', 's': '🧅', 't': '🍀',
            'u': '🍓', 'v': '🍒', 'w': '🫛', 'x': '🌿', 'y': '🍄',
            'z': '🥜',
        };
        
        return emojiMap[firstLetter] || '👤';
    },
    
    /**
     * Получить первое имя из fullname
     * @param {UserProfile} user
     * @returns {string}
     */
    getFirstName(user) {
        if (!user || !user.fullname) {
            return 'Участник';
        }
        
        return user.fullname.split(/\s+/)[0] || 'Участник';
    },
};

export default userService;
