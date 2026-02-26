// src/js/app.js
import { productManager } from './modules/products.js';
import { cartManager } from './modules/cart.js';
import { filterManager } from './modules/filters.js';
import { authManager } from './modules/auth.js';
import { renderProducts, updateAuthUI, updateFilterButtons, updateCartUI } from './modules/ui.js';
import { setActiveElement, toggle } from './utils/dom.js';
import { SELECTORS, PRODUCT_CATEGORIES, SORT_OPTIONS } from './utils/constants.js';

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    console.log('🚀 App initializing...');
    console.log('📍 Current URL:', window.location.href);
    console.log('📦 sessionStorage keys:', Object.keys(sessionStorage));
    
    // Проверка авторизации ПЕРЕД всем остальным
    console.log('🔐 Checking auth before anything...');
    const syncUser = authManager.getUserSync();
    console.log('🔐 Sync user result:', syncUser);
    
    // Инициализировать фильтрацию
    const allProducts = productManager.getAllProducts();
    filterManager.allProducts = allProducts;

    // Рендер начальных продуктов
    const initialProducts = filterManager.applyFilters();
    renderProducts(initialProducts);

    // Обновить UI авторизации (с проверкой что пользователь есть)
    console.log('🔐 Getting user via authManager.getUser()...');
    const user = await authManager.getUser();
    const userRole = await authManager.getUserRole();
    console.log('🔐 App initialized - User:', user, 'Role:', userRole);
    updateAuthUI(user, userRole);

    // Обновить UI корзины с элементами
    updateCartUI({
        count: cartManager.getCount(),
        total: cartManager.getTotalPrice(),
        items: cartManager.getCart()
    });

    // Прикрепить обработчики событий
    attachEventListeners();
    
    console.log('✅ App initialization complete');
}

// ============================================
// ОБРАБОТЧИКИ СОБЫТИЙ
// ============================================

function attachEventListeners() {
    // Фильтры по категориям
    document.querySelectorAll(SELECTORS.FILTER_BUTTONS).forEach(btn => {
        btn.addEventListener('click', (e) => {
            const category = e.target.dataset.category || e.currentTarget.dataset.category;
            filterManager.setCategory(category);
            applyAndRenderFilters();
            updateFilterButtons(category);
        });
    });

    // Сортировка
    const sortSelect = document.querySelector(SELECTORS.SORT_SELECT);
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            filterManager.setSort(e.target.value);
            applyAndRenderFilters();
        });
    }

    // Мобильное меню
    const mobileMenuBtn = document.querySelector(SELECTORS.MOBILE_MENU_BTN);
    const mobileMenu = document.querySelector(SELECTORS.MOBILE_MENU);

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

    // Корзина sidebar
    const cartSidebar = document.querySelector(SELECTORS.CART_SIDEBAR);
    const overlay = document.querySelector(SELECTORS.OVERLAY);

    window.toggleCart = function() {
        const isClosed = cartSidebar?.classList.contains('translate-x-full');
        
        if (cartSidebar) {
            cartSidebar.classList.toggle('translate-x-full');
        }
        if (overlay) {
            overlay.classList.toggle('hidden');
        }
        // Обновить отображение корзины при открытии
        if (isClosed) {
            updateCartUI({
                count: cartManager.getCount(),
                total: cartManager.getTotalPrice(),
                items: cartManager.getCart()
            });
        }
    };

    // Анимация на скролл
    setupScrollAnimations();
}

// ============================================
// ГЛОБАЛЬНЫЕ ФУНКЦИИ (для onclick handlers)
// ============================================

/**
 * Добавить товар в корзину (глобальная функция)
 */
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

/**
 * Обновить количество товара в корзине
 */
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

/**
 * Удалить товар из корзины
 */
window.removeFromCart = function(productId) {
    cartManager.removeItem(productId);

    updateCartUI({
        count: cartManager.getCount(),
        total: cartManager.getTotalPrice(),
        items: cartManager.getCart()
    });
};

/**
 * Применить фильтры и рендер продуктов
 */
function applyAndRenderFilters() {
    const filtered = filterManager.applyFilters();
    renderProducts(filtered);
}

/**
 * Настроить анимации на скролл
 */
function setupScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('[data-animate]').forEach(el => {
        observer.observe(el);
    });

    // Анимировать счётчик эко
    const ecoCounter = document.querySelector(SELECTORS.ECO_COUNTER);
    if (ecoCounter) {
        const counterObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                animateCounter(ecoCounter);
                counterObserver.disconnect();
            }
        });
        counterObserver.observe(ecoCounter);
    }

    // Обработчик кнопки выхода (только по клику)
    document.addEventListener('click', (e) => {
        const logoutBtn = e.target.closest('.logout-btn');
        if (logoutBtn) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Logout button clicked');
            authManager.logout();
            window.location.href = 'index.html';
        }
    });
}

/**
 * Анимировать счётчик с числами
 * @param {HTMLElement} element
 */
function animateCounter(element) {
    const target = 12450;
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;

    const timer = setInterval(() => {
        current += step;
        if (current >= target) {
            element.textContent = target.toLocaleString();
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current).toLocaleString();
        }
    }, 16);
}

// Экспортировать для использования если нужно
export { productManager, cartManager, filterManager, authManager };

// ============================================
// ГЛОБАЛЬНЫЕ ФУНКЦИИ
// ============================================

/**
 * Выбор плана подписки
 * @param {string} planId - ID плана (1month, 3months, 1year)
 */
window.selectPlan = async function(planId) {
    const user = await authManager.getUser();
    const userRole = await authManager.getUserRole();

    console.log('selectPlan called - User:', user, 'Role:', userRole);

    if (!user || userRole !== 'buyer') {
        console.log('Not authenticated, redirecting to register');
        // Не авторизован → сохранить план и редирект на регистрацию
        localStorage.setItem('biomarket_selected_plan', planId);
        window.location.href = 'register.html';
    } else {
        console.log('Authenticated, redirecting to checkout');
        // Авторизован → переход на оплату
        window.location.href = `checkout.html?plan=${planId}`;
    }
};

/**
 * Оформление заказа из корзины
 */
window.checkoutOrder = async function() {
    const user = await authManager.getUser();
    const userRole = await authManager.getUserRole();

    console.log('checkoutOrder called - User:', user, 'Role:', userRole);

    // Проверка авторизации
    if (!user || userRole !== 'buyer') {
        alert('Пожалуйста, войдите как участник клуба для оформления заказа');
        window.location.href = 'register.html';
        return;
    }
    
    // Проверка корзины
    const cartItems = cartManager.getCart();
    if (!cartItems || cartItems.length === 0) {
        alert('Ваша корзина пуста');
        return;
    }
    
    // Подтверждение заказа
    const total = cartManager.getTotalPrice();
    if (!confirm(`🛒 Оформить заказ на сумму ${total} Kč?\n\nТовары:\n${cartItems.map(i => `• ${i.name} (${i.quantity} кг)`).join('\n')}\n\nДоставка в пятницу!`)) {
        return;
    }
    
    // Создание заказа
    const order = {
        id: Date.now(),
        userId: user.email,
        items: cartItems.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.priceSubscription,
            image: item.image
        })),
        total: total,
        status: 'pending', // pending, processing, delivered
        deliveryDate: getNextFriday(),
        createdAt: new Date().toISOString()
    };
    
    // Сохранение заказа
    const orders = JSON.parse(localStorage.getItem('biomarket_orders') || '[]');
    orders.push(order);
    localStorage.setItem('biomarket_orders', JSON.stringify(orders));
    
    console.log('Order created:', order);
    
    // Очистка корзины
    cartManager.clearCart();
    updateCartUI({
        count: 0,
        total: 0,
        items: []
    });
    
    // Закрытие корзины
    const cartSidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('overlay');
    if (cartSidebar) cartSidebar.classList.add('translate-x-full');
    if (overlay) overlay.classList.add('hidden');
    
    // Уведомление
    alert('✅ Заказ оформлен!\n\nДоставка в пятницу: ' + order.deliveryDate + '\n\nСумма: ' + total + ' Kč');
    
    // Редирект в кабинет
    window.location.href = 'member-dashboard.html#orders';
};

/**
 * Получить дату следующей пятницы
 */
function getNextFriday() {
    const date = new Date();
    const day = date.getDay();
    
    // Если сегодня пятница или позже, то следующая пятница
    const daysUntilFriday = day === 5 ? 0 : (5 + 7 - day) % 7 || 7;
    date.setDate(date.getDate() + daysUntilFriday);
    
    return date.toLocaleDateString('ru-RU', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    });
}
