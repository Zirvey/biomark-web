/**
 * @file member-dashboard.js — Личный кабинет участника
 * @description Отображение заказов, подписки, настроек профиля
 */

import { cartManager } from './modules/cart.js';
import { productManager } from './modules/products.js';
import { updateCartUI } from './modules/ui.js';
import { authManager } from './modules/auth.js';
import { userService } from './services/userService.js';
import { orderService, ORDER_STATUS } from './services/orderService.js';
import { subscriptionService, SUBSCRIPTION_STATUS } from './services/subscriptionService.js';
import { sanitize } from './services/api.js';
import { validator } from './utils/validator.js';
import { toastManager } from './utils/toast.js';
import { parseISO, format, formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

// ============================================
// КОНСТАНТЫ
// ============================================

const SECTIONS = {
    OVERVIEW: 'overview',
    ORDERS: 'orders',
    SUBSCRIPTION: 'subscription',
    SETTINGS: 'settings',
};

const UI_STATE = {
    isLoading: false,
    user: null,
    orders: [],
    subscription: null,
};

// ============================================
// LOADING STATES
// ============================================

/**
 * Показать skeleton loader
 * @param {string} containerId
 */
function showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div class="loading-skeleton" style="
            display: grid;
            gap: 1rem;
            padding: 1.5rem;
        ">
            <div class="skeleton-line" style="
                height: 24px;
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 200% 100%;
                animation: shimmer 1.5s infinite;
                border-radius: 0.5rem;
                width: 60%;
            "></div>
            <div class="skeleton-line" style="
                height: 16px;
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 200% 100%;
                animation: shimmer 1.5s infinite;
                border-radius: 0.5rem;
                width: 40%;
            "></div>
            <style>
                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            </style>
        </div>
    `;
}

/**
 * Скрыть skeleton loader
 * @param {string} containerId
 */
function hideLoading(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const skeleton = container.querySelector('.loading-skeleton');
    if (skeleton) {
        skeleton.remove();
    }
}

/**
 * Показать состояние загрузки для кнопки
 * @param {HTMLButtonElement} button
 * @param {string} loadingText
 */
function setButtonLoading(button, loadingText = 'Загрузка...') {
    if (!button) return;

    button.disabled = true;
    button.dataset.originalText = button.innerHTML;
    button.innerHTML = `<span aria-hidden="true">⏳</span><span>${loadingText}</span>`;
}

/**
 * Восстановить кнопку после загрузки
 * @param {HTMLButtonElement} button
 */
function resetButton(button) {
    if (!button) return;

    button.disabled = false;
    if (button.dataset.originalText) {
        button.innerHTML = button.dataset.originalText;
        delete button.dataset.originalText;
    }
}

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    await initializeDashboard();
});

async function initializeDashboard() {
    try {
        // Показать loading state
        UI_STATE.isLoading = true;

        // Проверка авторизации
        const isAuthenticated = await authManager.isAuthenticated();
        const userRole = await authManager.getUserRole();

        if (!isAuthenticated || userRole !== 'buyer') {
            window.location.href = 'index.html';
            return;
        }

        // Загрузка данных пользователя (с loading state)
        await loadUserData();

        // Загрузка подписки (с loading state)
        await loadSubscription();

        // Загрузка заказов (с loading state)
        await loadOrders();

        // Обновление UI корзины
        updateCartUI({
            count: cartManager.getCount(),
            total: cartManager.getTotalPrice(),
            items: cartManager.getCart(),
        });

        // Прикрепление обработчиков
        attachEventListeners();

        // Показать начальную секцию
        const hash = window.location.hash.slice(1) || SECTIONS.OVERVIEW;
        showSection(hash);

        // Скрыть loading state
        UI_STATE.isLoading = false;
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        showError('Не удалось загрузить страницу. Перезагрузите...');
    }
}

// ============================================
// ДАННЫЕ ПОЛЬЗОВАТЕЛЯ
// ============================================

async function loadUserData() {
    try {
        const user = await userService.getProfile();

        if (!user) {
            console.warn('User not found, redirecting...');
            window.location.href = 'index.html';
            return;
        }

        UI_STATE.user = user;
        const firstName = userService.getFirstName(user);

        // Обновление UI
        document.getElementById('user-avatar').textContent = userService.getAvatar(user);
        document.getElementById('sidebar-user-name').textContent = sanitize(firstName);
        document.getElementById('sidebar-user-email').textContent = sanitize(user.email || 'email@example.com');
        document.getElementById('main-user-name').textContent = sanitize(firstName);

        // Заполнение формы настроек
        document.getElementById('settings-name').value = sanitize(user.fullname || '');
        document.getElementById('settings-email').value = sanitize(user.email || '');
        document.getElementById('settings-phone').value = sanitize(user.phone || '');
        document.getElementById('settings-address').value = sanitize(user.address || '');

        // Загрузка статистики
        await loadStats();
    } catch (error) {
        console.error('loadUserData error:', error);
        
        // Разные сообщения для разных ошибок
        let errorMessage = 'Не удалось загрузить профиль. ';
        
        if (error.code === 'UNAUTHORIZED' || error.status === 401) {
            errorMessage += 'Сессия истекла. Выполните вход заново.';
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } else if (error.code === 'NETWORK_ERROR') {
            errorMessage += 'Проверьте подключение к интернету.';
        } else if (error.code === 'USER_NOT_FOUND' || error.status === 404) {
            errorMessage += 'Пользователь не найден.';
        } else {
            errorMessage += 'Попробуйте обновить страницу.';
        }
        
        showError(errorMessage);
        
        // Показать error state для профиля
        const avatarEl = document.getElementById('user-avatar');
        if (avatarEl) {
            avatarEl.textContent = '⚠️';
        }
    }
}

async function loadStats() {
    try {
        const orders = UI_STATE.orders;
        const totalSpent = orderService.calculateTotalSpent(orders);
        const orderCount = orderService.countOrders(orders);
        
        // Эко-очки (упрощённо: 10 за каждый заказ)
        const ecoPoints = orderCount * 10;

        // Примерная экономия (15% от суммы)
        const saved = Math.round(totalSpent * 0.15);

        document.getElementById('stat-orders').textContent = orderCount;
        document.getElementById('stat-saved').textContent = `${saved} Kč`;
        document.getElementById('stat-eco').textContent = ecoPoints;
    } catch (error) {
        console.error('loadStats error:', error);
    }
}

// ============================================
// ЗАКАЗЫ
// ============================================

async function loadOrders() {
    const container = document.getElementById('orders-list');
    const recentOrdersContainer = document.getElementById('recent-orders');

    if (!container) return;

    // Показать loading state
    showLoading('orders-list');

    try {
        // Загрузка заказов через сервис
        const orders = await orderService.getOrders();
        UI_STATE.orders = orders;

        // Сортировка по дате (новые сверху)
        const sortedOrders = orderService.sortByDate(orders);

        if (sortedOrders.length === 0) {
            const emptyHtml = createEmptyStateHTML();
            container.innerHTML = emptyHtml;
            if (recentOrdersContainer) recentOrdersContainer.innerHTML = emptyHtml;
            return;
        }

        // Отображение всех заказов
        const ordersHtml = sortedOrders.map(order => createOrderItemHTML(order)).join('');
        container.innerHTML = ordersHtml;

        // Последние 3 заказа для главной
        if (recentOrdersContainer) {
            const recentHtml = sortedOrders.slice(0, 3).map(order => createOrderItemHTML(order, true)).join('');
            recentOrdersContainer.innerHTML = recentHtml;
        }
    } catch (error) {
        console.error('loadOrders error:', error);
        showError('Не удалось загрузить заказы. Попробуйте снова.');
        
        // Показать error state
        if (container) {
            container.innerHTML = `
                <div class="error-state" style="text-align: center; padding: 3rem 1rem;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;" aria-hidden="true">⚠️</div>
                    <div style="font-weight: 600; color: #1a1a1a; margin-bottom: 0.5rem;">Не удалось загрузить заказы</div>
                    <div style="color: #6b7280; font-size: 0.9375rem; margin-bottom: 1.5rem;">Проверьте подключение к интернету</div>
                    <button onclick="loadOrders()" class="btn-save" style="display: inline-flex; align-items: center; gap: 0.5rem;">
                        <span aria-hidden="true">🔄</span>
                        <span>Попробовать снова</span>
                    </button>
                </div>
            `;
        }
    }
}

/**
 * Создать HTML для заказа
 * @param {Object} order
 * @param {boolean} isCompact - Компактный режим для recent
 * @returns {string}
 */
function createOrderItemHTML(order, isCompact = false) {
    const statusMeta = orderService.getStatusMeta(order.status);
    
    // Форматирование даты с помощью date-fns
    const orderDate = format(parseISO(order.createdAt), 'dd MMMM yyyy', { locale: ru });
    const orderDistance = formatDistanceToNow(parseISO(order.createdAt), { locale: ru, addSuffix: true });

    return `
        <div class="order-item">
            <div class="order-icon">📦</div>
            <div class="order-details">
                <div class="order-name">${sanitize(`Заказ #${order.id.toString().slice(-6)}`)}</div>
                <div class="order-meta">${sanitize(order.items.length)} товаров • ${sanitize(orderDistance)}</div>
                <div class="order-meta" style="font-size: 0.8125rem; color: #9ca3af;">${sanitize(orderDate)}</div>
                ${!isCompact ? `<div class="order-meta">🚚 Доставка: ${sanitize(order.deliveryDate)}</div>` : ''}
            </div>
            <div class="order-price">${sanitize(order.total)} Kč</div>
            <div class="order-status ${sanitize(statusMeta.class)}" style="color: ${sanitize(statusMeta.color)}">${sanitize(statusMeta.label)}</div>
        </div>
    `;
}

/**
 * Создать HTML пустого состояния
 * @returns {string}
 */
function createEmptyStateHTML() {
    return `
        <div class="empty-state">
            <div class="empty-icon">📦</div>
            <div class="empty-title">Пока нет заказов</div>
            <div class="empty-text">Закажите продукты из витрины</div>
            <a href="index.html#marketplace" class="btn-save" style="margin-top: 1rem; display: inline-flex;">
                <span aria-hidden="true">🛒</span>
                <span>В магазин</span>
            </a>
        </div>
    `;
}

// ============================================
// ПОДПИСКА
// ============================================

async function loadSubscription() {
    try {
        const activeSubscriptionEl = document.getElementById('active-subscription-card');
        const noSubscriptionEl = document.getElementById('no-subscription-card');

        // Загрузка подписки через сервис
        const subscription = await subscriptionService.getSubscription();
        UI_STATE.subscription = subscription;

        const isActive = subscriptionService.isActive(subscription);

        if (!isActive) {
            // Нет активной подписки
            if (activeSubscriptionEl) activeSubscriptionEl.style.display = 'none';
            if (noSubscriptionEl) noSubscriptionEl.style.display = 'block';
            return;
        }

        // Есть активная подписка
        if (activeSubscriptionEl) activeSubscriptionEl.style.display = 'block';
        if (noSubscriptionEl) noSubscriptionEl.style.display = 'none';

        // Отобразить информацию
        const plan = subscriptionService.getPlan(subscription.plan);
        document.getElementById('subscription-plan').textContent = plan?.name || subscription.plan;

        // Дата окончания с помощью date-fns
        const endDate = parseISO(subscription.endDate);
        const daysRemaining = subscriptionService.getDaysRemaining(subscription);
        
        if (daysRemaining !== null && daysRemaining <= 0) {
            // Подписка истекла
            const statusBadgeEl = document.getElementById('subscription-status-badge');
            if (statusBadgeEl) {
                statusBadgeEl.innerHTML = '<span>⏰</span><span>Истекла</span>';
                statusBadgeEl.style.background = 'rgba(249, 115, 22, 0.1)';
                statusBadgeEl.style.color = '#f97316';
            }
            document.getElementById('subscription-end-date').textContent = 'Истекла';
        } else {
            // Подписка активна - показываем дату и сколько осталось
            const formattedDate = format(endDate, 'dd MMMM yyyy', { locale: ru });
            const distanceText = formatDistanceToNow(endDate, { locale: ru, addSuffix: true });
            document.getElementById('subscription-end-date').innerHTML = `
                <span>${formattedDate}</span>
                <span style="font-size: 0.875rem; color: #6b7280; display: block; margin-top: 0.25rem;">
                    (ещё ${daysRemaining} дн. / ${distanceText})
                </span>
            `;
        }
    } catch (error) {
        console.error('loadSubscription error:', error);
        
        // Разные сообщения для разных ошибок
        let errorMessage = 'Не удалось загрузить подписку. ';
        
        if (error.code === 'UNAUTHORIZED' || error.status === 401) {
            errorMessage += 'Сессия истекла.';
        } else if (error.code === 'NETWORK_ERROR') {
            errorMessage += 'Проверьте подключение к интернету.';
        } else {
            errorMessage += 'Попробуйте обновить страницу.';
        }
        
        showError(errorMessage);
        
        // Показать error state
        const activeSubscriptionEl = document.getElementById('active-subscription-card');
        if (activeSubscriptionEl) {
            activeSubscriptionEl.innerHTML = `
                <div class="error-state" style="text-align: center; padding: 2rem 1rem;">
                    <div style="font-size: 2.5rem; margin-bottom: 0.75rem;" aria-hidden="true">⚠️</div>
                    <div style="font-weight: 600; color: #1a1a1a; margin-bottom: 0.5rem;">Не удалось загрузить подписку</div>
                    <div style="color: #6b7280; font-size: 0.875rem;">${errorMessage}</div>
                </div>
            `;
        }
    }
}

// ============================================
// НАВИГАЦИЯ
// ============================================

function updatePageTitle(section) {
    const titles = {
        [SECTIONS.OVERVIEW]: 'Обзор — BioMarket',
        [SECTIONS.ORDERS]: 'Заказы — BioMarket',
        [SECTIONS.SUBSCRIPTION]: 'Подписка — BioMarket',
        [SECTIONS.SETTINGS]: 'Настройки — BioMarket',
    };
    document.title = titles[section] || 'BioMarket';
}

// ============================================
// ОБРАБОТЧИКИ СОБЫТИЙ
// ============================================

function attachEventListeners() {
    // Навигация по секциям
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            const sectionId = this.dataset.section;
            showSection(sectionId);
        });
    });

    // Обработка кнопок назад/вперёд в браузере
    window.addEventListener('popstate', (e) => {
        if (e.state && e.state.section) {
            showSection(e.state.section);
        } else {
            const hash = window.location.hash.slice(1) || SECTIONS.OVERVIEW;
            showSection(hash);
        }
    });

    // Мобильное меню
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            const isExpanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
            mobileMenuBtn.setAttribute('aria-expanded', !isExpanded);
            mobileMenu.classList.toggle('hidden');
        });

        // Закрыть меню при клике на ссылку
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenuBtn.setAttribute('aria-expanded', 'false');
                mobileMenu.classList.add('hidden');
            });
        });
    }

    // Глобальный обработчик действий (data-action)
    document.addEventListener('click', function (e) {
        const target = e.target.closest('[data-action]');
        if (!target) return;

        const action = target.dataset.action;

        switch (action) {
            case 'toggle-cart':
                e.preventDefault();
                window.toggleCart();
                break;
            case 'logout':
                e.preventDefault();
                window.logout();
                break;
            case 'navigate':
                e.preventDefault();
                if (target.dataset.target) {
                    showSection(target.dataset.target);
                }
                break;
            case 'save-settings':
                e.preventDefault();
                window.saveSettings();
                break;
            case 'toggle-switch':
                e.preventDefault();
                window.toggleSwitch(target);
                break;
            case 'delete-account':
                e.preventDefault();
                window.deleteAccount();
                break;
        }
    });

    // Закрыть корзину при нажатии на Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const cartSidebar = document.getElementById('cart-sidebar');
            const overlay = document.getElementById('overlay');

            if (cartSidebar && overlay && !cartSidebar.classList.contains('translate-x-full')) {
                cartSidebar.classList.add('translate-x-full');
                overlay.classList.add('hidden');
            }
        }
    });
}

function showSection(sectionId) {
    // Скрыть все секции
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.classList.remove('active');
    });

    // Показать нужную секцию
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    } else {
        console.error('Section not found:', sectionId);
        return;
    }

    // Обновить активный пункт меню
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.section === sectionId) {
            item.classList.add('active');
        }
    });

    // Обновить URL
    window.history.pushState({ section: sectionId }, '', `#${sectionId}`);

    // Обновить заголовок
    updatePageTitle(sectionId);

    // Прокрутка вверх
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// ФУНКЦИИ
// ============================================

async function saveSettings() {
    const btn = document.querySelector('#settings-form .btn-save');
    const originalText = btn.innerHTML;

    // Сбор данных формы
    const formData = {
        fullname: document.getElementById('settings-name').value,
        phone: document.getElementById('settings-phone').value,
        address: document.getElementById('settings-address').value,
    };

    // Валидация
    const validationRules = {
        fullname: (value) => validator.name(value),
        address: (value) => validator.address(value),
    };

    // Phone опционален, но если заполнен — должен быть валидным
    if (formData.phone && formData.phone.trim()) {
        validationRules.phone = (value) => validator.phone(value);
    }

    const validation = validator.validateForm(formData, validationRules);

    if (!validation.valid) {
        // Показать первую ошибку
        const firstError = Object.values(validation.errors)[0];
        showError(firstError);
        return;
    }

    // Блокировка кнопки
    btn.disabled = true;
    btn.innerHTML = '<span aria-hidden="true">⏳</span><span>Сохранение...</span>';

    try {
        // Обновление через сервис
        const updatedUser = await userService.updateProfile({
            fullname: formData.fullname,
            phone: formData.phone,
            address: formData.address,
        });

        UI_STATE.user = updatedUser;

        // Обновление отображения
        const firstName = userService.getFirstName(updatedUser);
        document.getElementById('sidebar-user-name').textContent = sanitize(firstName);
        document.getElementById('sidebar-user-email').textContent = sanitize(updatedUser.email);

        // Успех
        showSuccess('Настройки сохранены!');

        btn.innerHTML = '<span aria-hidden="true">✓</span><span>Сохранено!</span>';
        btn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';

        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '';
            btn.disabled = false;
        }, 2000);
    } catch (error) {
        console.error('saveSettings error:', error);
        btn.innerHTML = '<span aria-hidden="true">✗</span><span>Ошибка</span>';
        btn.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';

        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '';
            btn.disabled = false;
        }, 2000);

        showError(error.message || 'Не удалось сохранить настройки');
    }
}

function toggleSwitch(element) {
    element.classList.toggle('active');
    // Здесь можно добавить отправку предпочтений на сервер
}

async function logout() {
    try {
        await authManager.logout();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = 'index.html';
    }
}

async function deleteAccount() {
    const confirmed = confirm(
        '⚠️ Вы уверены, что хотите удалить аккаунт?\n\n' +
            'Это действие необратимо удалит:\n' +
            '• Вашу подписку\n' +
            '• Историю заказов\n' +
            '• Все личные данные\n\n' +
            'Продолжить?'
    );

    if (!confirmed) return;

    try {
        // Удаление через сервис
        await userService.deleteAccount();

        // Очистка локальных данных
        localStorage.removeItem('biomarket_cart');

        console.log('Account deleted');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Delete account error:', error);
        showError('Не удалось удалить аккаунт. Попробуйте позже.');
    }
}

/**
 * Показать ошибку пользователю
 * @param {string} message
 */
function showError(message) {
    toastManager.error(message, { duration: 5000, closable: true });
}

/**
 * Показать успех
 * @param {string} message
 */
function showSuccess(message) {
    toastManager.success(message, { duration: 3000, closable: true });
}

// ============================================
// ГЛОБАЛЬНЫЕ ФУНКЦИИ
// ============================================

window.navigateTo = showSection;
window.saveSettings = saveSettings;
window.toggleSwitch = toggleSwitch;
window.logout = logout;
window.deleteAccount = deleteAccount;

window.toggleCart = function () {
    const cartSidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('overlay');

    if (!cartSidebar || !overlay) return;

    const isClosed = cartSidebar.classList.contains('translate-x-full');

    cartSidebar.classList.toggle('translate-x-full');
    overlay.classList.toggle('hidden');

    // Обновить отображение корзины при открытии
    if (isClosed) {
        updateCartUI({
            count: cartManager.getCount(),
            total: cartManager.getTotalPrice(),
            items: cartManager.getCart(),
        });
    }
};

window.addToCart = function (button) {
    const productId = parseInt(button.dataset.productId);
    const product = productManager.getProductById(productId);

    if (product && cartManager.addItem(product)) {
        updateCartUI({
            count: cartManager.getCount(),
            total: cartManager.getTotalPrice(),
            items: cartManager.getCart(),
        });

        // Визуальная обратная связь
        const originalText = button.innerHTML;
        button.innerHTML = '<span>✓</span><span>Добавлено</span>';
        setTimeout(() => {
            button.innerHTML = originalText;
        }, 1500);
    }
};

window.updateCartQuantity = function (productId, change) {
    const item = cartManager.getCart().find((i) => i.id === productId);
    if (!item) return;

    const newQuantity = item.quantity + change;
    cartManager.updateQuantity(productId, newQuantity);

    updateCartUI({
        count: cartManager.getCount(),
        total: cartManager.getTotalPrice(),
        items: cartManager.getCart(),
    });
};

window.removeFromCart = function (productId) {
    cartManager.removeItem(productId);

    updateCartUI({
        count: cartManager.getCount(),
        total: cartManager.getTotalPrice(),
        items: cartManager.getCart(),
    });
};
