/**
 * @file toast.js — Toast уведомления
 * @description Красивые уведомления вместо alert()
 */

// ============================================
// КОНСТАНТЫ
// ============================================

const TOAST_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info',
};

const TOAST_ICONS = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
};

const TOAST_STYLES = {
    success: {
        bg: 'bg-[#10b981]',
        icon: '✓',
    },
    error: {
        bg: 'bg-[#ef4444]',
        icon: '✕',
    },
    warning: {
        bg: 'bg-[#f97316]',
        icon: '⚠',
    },
    info: {
        bg: 'bg-[#3b82f6]',
        icon: 'ℹ',
    },
};

// ============================================
// TOAST MANAGER
// ============================================

export const toastManager = {
    /**
     * Показать toast уведомление
     * @param {string} message - Сообщение
     * @param {string} type - Тип (success | error | warning | info)
     * @param {Object} options - Опции
     * @param {number} options.duration - Длительность (мс)
     * @param {string} options.position - Позиция (top-right | top-center | bottom-right | etc.)
     */
    show(message, type = 'info', options = {}) {
        const {
            duration = 3000,
            position = 'top-right',
            closable = true,
        } = options;

        // Создать контейнер если нет
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = `fixed z-[9999] p-4 ${this.getPositionClasses(position)}`;
            document.body.appendChild(container);
        }

        // Создать toast
        const toast = document.createElement('div');
        toast.className = this.getToastClasses(type);
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');

        const style = TOAST_STYLES[type] || TOAST_STYLES.info;

        toast.innerHTML = `
            <div class="flex items-start gap-3">
                <span class="text-xl flex-shrink-0" aria-hidden="true">${style.icon}</span>
                <div class="flex-1">
                    <p class="text-sm font-medium text-white">${this.escapeHtml(message)}</p>
                </div>
                ${closable ? `<button onclick="this.closest('.toast').remove()" class="text-white/80 hover:text-white text-xl leading-none" aria-label="Закрыть">×</button>` : ''}
            </div>
        `;

        container.appendChild(toast);

        // Автоудаление
        if (duration > 0) {
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(-10px)';
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }

        return toast;
    },

    /**
     * Показать success toast
     * @param {string} message
     * @param {Object} options
     */
    success(message, options = {}) {
        return this.show(message, TOAST_TYPES.SUCCESS, options);
    },

    /**
     * Показать error toast
     * @param {string} message
     * @param {Object} options
     */
    error(message, options = {}) {
        return this.show(message, TOAST_TYPES.ERROR, options);
    },

    /**
     * Показать warning toast
     * @param {string} message
     * @param {Object} options
     */
    warning(message, options = {}) {
        return this.show(message, TOAST_TYPES.WARNING, options);
    },

    /**
     * Показать info toast
     * @param {string} message
     * @param {Object} options
     */
    info(message, options = {}) {
        return this.show(message, TOAST_TYPES.INFO, options);
    },

    /**
     * Удалить все toast уведомления
     */
    clear() {
        const container = document.getElementById('toast-container');
        if (container) {
            container.innerHTML = '';
        }
    },

    /**
     * Получить классы позиции
     * @param {string} position
     * @returns {string}
     */
    getPositionClasses(position) {
        const positions = {
            'top-right': 'top-0 right-0',
            'top-left': 'top-0 left-0',
            'top-center': 'top-0 left-1/2 -translate-x-1/2',
            'bottom-right': 'bottom-0 right-0',
            'bottom-left': 'bottom-0 left-0',
            'bottom-center': 'bottom-0 left-1/2 -translate-x-1/2',
        };
        return positions[position] || positions['top-right'];
    },

    /**
     * Получить классы toast
     * @param {string} type
     * @returns {string}
     */
    getToastClasses(type) {
        const baseClasses =
            'toast mb-3 px-4 py-3 rounded-lg shadow-lg text-white transform transition-all duration-300 ease-out max-w-sm w-full';

        const typeClasses = {
            success: 'bg-[#10b981]',
            error: 'bg-[#ef4444]',
            warning: 'bg-[#f97316]',
            info: 'bg-[#3b82f6]',
        };

        return `${baseClasses} ${typeClasses[type] || typeClasses.info}`;
    },

    /**
     * Escape HTML для безопасности
     * @param {string} str
     * @returns {string}
     */
    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },
};

// ============================================
// ЗАМЕНА ALERT (для постепенной миграции)
// ============================================

/**
 * Заменить window.alert на toast
 * @param {string} message
 * @param {string} type
 */
window.alert = function (message, type = 'info') {
    toastManager.show(message, type, { duration: 5000, closable: true });
};

// ============================================
// ГЛОБАЛЬНЫЙ ЭКСПОРТ
// ============================================

window.toast = toastManager;

export default toastManager;
