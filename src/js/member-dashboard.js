// src/js/member-dashboard.js
import { STORAGE_KEYS } from './utils/constants.js';
import { cartManager } from './modules/cart.js';
import { productManager } from './modules/products.js';
import { updateCartUI } from './modules/ui.js';
import { authManager } from './modules/auth.js';
import { toggle } from './utils/dom.js';

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initializeDashboard();
});

function initializeDashboard() {
    // Загрузить данные пользователя
    loadUserData();

    // Загрузить подписку
    loadSubscription();

    // Обновить UI корзины
    updateCartUI({
        count: cartManager.getCount(),
        total: cartManager.getTotalPrice(),
        items: cartManager.getCart()
    });

    // Прикрепить обработчики
    attachEventListeners();

    // Показать начальную секцию (overview)
    const hash = window.location.hash.slice(1) || 'overview';
    showSection(hash);
}

// ============================================
// ДАННЫЕ ПОЛЬЗОВАТЕЛЯ
// ============================================

function loadUserData() {
    // Используем authManager для получения данных
    const user = authManager.getUser();
    const userRole = authManager.getUserRole();

    console.log('loadUserData - User:', user, 'Role:', userRole);

    if (!user || !user.fullname || userRole !== 'buyer') {
        // Если нет данных или неправильная роль, перенаправить на главную
        console.log('Redirecting to index.html - no user or wrong role');
        window.location.href = 'index.html';
        return;
    }

    const firstName = user.fullname.split(' ')[0];

    // Обновить UI
    document.getElementById('user-avatar').textContent = getAvatarEmoji(userRole);
    document.getElementById('sidebar-user-name').textContent = firstName;
    document.getElementById('sidebar-user-email').textContent = user.email || 'email@example.com';
    document.getElementById('main-user-name').textContent = firstName;

    // Заполнить форму настроек
    document.getElementById('settings-name').value = user.fullname || '';
    document.getElementById('settings-email').value = user.email || '';
    document.getElementById('settings-phone').value = user.phone || '';
    document.getElementById('settings-address').value = user.address || '';

    // Загрузить статистику
    loadStats();
}

function getAvatarEmoji(role) {
    const emojis = {
        'buyer': '🥕',
        'farmer': '👨‍🌾'
    };
    return emojis[role] || '👤';
}

function loadStats() {
    // Имитация загрузки статистики
    const orders = JSON.parse(localStorage.getItem('biomarket_orders') || '[]');
    const saved = orders.reduce((sum, order) => sum + (order.saved || 0), 0);
    const ecoPoints = orders.length * 10;

    document.getElementById('stat-orders').textContent = orders.length;
    document.getElementById('stat-saved').textContent = `${saved} Kč`;
    document.getElementById('stat-eco').textContent = ecoPoints;
    
    // Загрузить заказы
    loadOrders();
}

function loadOrders() {
    const orders = JSON.parse(localStorage.getItem('biomarket_orders') || '[]');
    const container = document.getElementById('orders-list');
    const recentOrdersContainer = document.getElementById('recent-orders');
    
    if (!container) return;
    
    // Сортировка по дате (новые сверху)
    const sortedOrders = orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    if (sortedOrders.length === 0) {
        const emptyHtml = `
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
        container.innerHTML = emptyHtml;
        if (recentOrdersContainer) recentOrdersContainer.innerHTML = emptyHtml;
        return;
    }
    
    // Статусы заказов
    const statusLabels = {
        'pending': { text: 'Ожидает', class: 'pending' },
        'processing': { text: 'В пути', class: 'processing' },
        'delivered': { text: 'Доставлен', class: 'delivered' }
    };
    
    const ordersHtml = sortedOrders.map(order => {
        const status = statusLabels[order.status] || statusLabels.pending;
        const orderDate = new Date(order.createdAt).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        
        return `
            <div class="order-item">
                <div class="order-icon">📦</div>
                <div class="order-details">
                    <div class="order-name">Заказ #${order.id.toString().slice(-6)}</div>
                    <div class="order-meta">${order.items.length} товаров • ${orderDate}</div>
                    <div class="order-meta">🚚 Доставка: ${order.deliveryDate}</div>
                </div>
                <div class="order-price">${order.total} Kč</div>
                <div class="order-status ${status.class}">${status.text}</div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = ordersHtml;
    
    // Последние 3 заказа для главной
    if (recentOrdersContainer) {
        const recentHtml = sortedOrders.slice(0, 3).map(order => {
            const status = statusLabels[order.status] || statusLabels.pending;
            return `
                <div class="order-item">
                    <div class="order-icon">📦</div>
                    <div class="order-details">
                        <div class="order-name">Заказ #${order.id.toString().slice(-6)}</div>
                        <div class="order-meta">${order.items.length} товаров</div>
                    </div>
                    <div class="order-price">${order.total} Kč</div>
                    <div class="order-status ${status.class}">${status.text}</div>
                </div>
            `;
        }).join('');
        recentOrdersContainer.innerHTML = recentHtml;
    }
}

// ============================================
// ПОДПИСКА
// ============================================

function loadSubscription() {
    const subscription = JSON.parse(localStorage.getItem('biomarket_subscription') || 'null');
    const activeSubscriptionEl = document.getElementById('active-subscription');
    const noSubscriptionEl = document.getElementById('no-subscription-card');

    if (!subscription || subscription.status !== 'active') {
        // Нет активной подписки
        if (activeSubscriptionEl) activeSubscriptionEl.style.display = 'none';
        if (noSubscriptionEl) noSubscriptionEl.style.display = 'block';
        return;
    }

    // Есть активная подписка
    if (activeSubscriptionEl) activeSubscriptionEl.style.display = 'block';
    if (noSubscriptionEl) noSubscriptionEl.style.display = 'none';

    // Отобразить информацию
    const planNames = {
        '1month': '1 месяц',
        '3months': '3 месяца',
        '1year': '1 год'
    };

    document.getElementById('subscription-plan').textContent = planNames[subscription.plan] || subscription.planName;

    // Рассчитать и отобразить дату окончания
    const endDate = new Date(subscription.endDate);
    const now = new Date();

    if (endDate < now) {
        // Подписка истекла
        document.getElementById('subscription-status-badge').innerHTML = '<span>⏰</span><span>Истекла</span>';
        document.getElementById('subscription-status-badge').style.background = 'rgba(249, 115, 22, 0.1)';
        document.getElementById('subscription-status-badge').style.color = '#f97316';
        document.getElementById('subscription-end-date').textContent = 'Истекла';
    } else {
        // Подписка активна
        const formattedDate = endDate.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        document.getElementById('subscription-end-date').textContent = formattedDate;
    }
}

// ============================================
// НАВИГАЦИЯ
// ============================================

function updatePageTitle(section) {
    const titles = {
        'overview': 'Обзор — BioMarket',
        'orders': 'Заказы — BioMarket',
        'subscription': 'Подписка — BioMarket',
        'settings': 'Настройки — BioMarket'
    };
    document.title = titles[section] || 'BioMarket';
}

// ============================================
// ОБРАБОТЧИКИ СОБЫТИЙ
// ============================================

function attachEventListeners() {
    // Навигация по секциям
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
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
            const hash = window.location.hash.slice(1) || 'overview';
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

    // Обработчик выхода
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('logout-btn') || e.target.closest('.logout-btn')) {
            e.preventDefault();
            logout();
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
    console.log('Showing section:', sectionId);
    
    // Скрыть все секции
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.classList.remove('active');
        console.log('Hiding:', section.id);
    });
    
    // Показать нужную секцию
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        console.log('Showing:', sectionId);
    } else {
        console.error('Section not found:', sectionId);
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

function saveSettings() {
    const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || '{}');
    
    user.fullname = document.getElementById('settings-name').value;
    user.email = document.getElementById('settings-email').value;
    user.phone = document.getElementById('settings-phone').value;
    user.address = document.getElementById('settings-address').value;
    
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    
    // Обновить отображение
    document.getElementById('sidebar-user-name').textContent = user.fullname.split(' ')[0];
    document.getElementById('sidebar-user-email').textContent = user.email;
    
    // Анимация успеха
    const btn = document.querySelector('#settings-form .btn-save');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span aria-hidden="true">✓</span><span>Сохранено!</span>';
    btn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    
    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.background = '';
    }, 2000);
}

function toggleSwitch(element) {
    element.classList.toggle('active');
}

function logout() {
    console.log('Logout called from member-dashboard');
    authManager.logout();
    window.location.href = 'index.html';
}

function deleteAccount() {
    if (!confirm('⚠️ Вы уверены, что хотите удалить аккаунт?\n\nЭто действие необратимо удалит:\n• Вашу подписку\n• Историю заказов\n• Все личные данные\n\nПродолжить?')) {
        return;
    }
    
    // Удалить все данные пользователя
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.USER_ROLE);
    localStorage.removeItem('biomarket_cart');
    localStorage.removeItem('biomarket_subscription');
    localStorage.removeItem('biomarket_orders');
    
    console.log('Account deleted');
    window.location.href = 'index.html';
}

// Экспортировать для глобального доступа
window.navigateTo = showSection;
window.saveSettings = saveSettings;
window.toggleSwitch = toggleSwitch;
window.logout = logout;
window.deleteAccount = deleteAccount;

// ============================================
// КОРЗИНА (ГЛОБАЛЬНЫЕ ФУНКЦИИ)
// ============================================

window.toggleCart = function() {
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
            items: cartManager.getCart()
        });
    }
};

window.addToCart = function(button) {
    const productId = parseInt(button.dataset.productId);
    const product = productManager.getProductById(productId);

    if (product && cartManager.addItem(product)) {
        updateCartUI({
            count: cartManager.getCount(),
            total: cartManager.getTotalPrice(),
            items: cartManager.getCart()
        });

        // Визуальная обратная связь
        const originalText = button.innerHTML;
        button.innerHTML = '<span>✓</span><span>Добавлено</span>';
        setTimeout(() => {
            button.innerHTML = originalText;
        }, 1500);
    }
};

window.updateCartQuantity = function(productId, change) {
    const item = cartManager.getCart().find(i => i.id === productId);
    if (!item) return;

    const newQuantity = item.quantity + change;
    cartManager.updateQuantity(productId, newQuantity);

    updateCartUI({
        count: cartManager.getCount(),
        total: cartManager.getTotalPrice(),
        items: cartManager.getCart()
    });
};

window.removeFromCart = function(productId) {
    cartManager.removeItem(productId);

    updateCartUI({
        count: cartManager.getCount(),
        total: cartManager.getTotalPrice(),
        items: cartManager.getCart()
    });
};
