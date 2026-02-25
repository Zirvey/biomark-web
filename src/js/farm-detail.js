// src/js/farm-detail.js
import { getFarmById, getAllFarms } from './data/farms.js';
import { productManager } from './modules/products.js';
import { cartManager } from './modules/cart.js';
import { updateCartUI, createProductCard, updateAuthUI } from './modules/ui.js';
import { authManager } from './modules/auth.js';
import { toggle } from './utils/dom.js';
import { SELECTORS, STORAGE_KEYS, USER_ROLES } from './utils/constants.js';
import { getFromStorage } from './utils/storage.js';

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initializeFarmPage();
});

async function initializeFarmPage() {
    // Получить ID фермы из URL параметра
    const urlParams = new URLSearchParams(window.location.search);
    const farmId = urlParams.get('id');

    if (!farmId) {
        // Если нет ID, перенаправить на главную
        window.location.href = 'index.html#farmers';
        return;
    }

    // Найти ферму
    const farm = getFarmById(farmId);

    if (!farm) {
        // Если ферма не найдена, перенаправить на главную
        window.location.href = 'index.html#farmers';
        return;
    }

    // Обновить заголовок страницы
    document.title = `${farm.name} — BioMarket`;

    // Заполнить информацию о ферме
    renderFarmInfo(farm);

    // Отрендерить продукты фермы
    renderFarmProducts(farm.name);

    // Обновить корзину
    updateCartUI({
        count: cartManager.getCount(),
        total: cartManager.getTotalPrice(),
        items: cartManager.getCart()
    });

    // Обновить UI авторизации
    const user = await authManager.getUser();
    const userRole = await authManager.getUserRole();
    updateAuthUI(user, userRole);

    // Прикрепить обработчики событий
    attachEventListeners();
}

// ============================================
// РЕНДЕРИНГ
// ============================================

/**
 * Заполнить информацию о ферме
 * @param {Object} farm
 */
function renderFarmInfo(farm) {
    // Название
    const nameEl = document.getElementById('farm-name');
    if (nameEl) nameEl.textContent = farm.name;

    //Breadcrumb
    const breadcrumbEl = document.getElementById('breadcrumb-farm-name');
    if (breadcrumbEl) breadcrumbEl.textContent = farm.name;

    // Иконка и градиент
    const iconEl = document.getElementById('farm-icon');
    if (iconEl) {
        iconEl.textContent = farm.icon;
        iconEl.className = `w-32 h-32 bg-gradient-to-br ${farm.gradient} rounded-2xl flex items-center justify-center text-6xl flex-shrink-0`;
    }

    // Расположение
    const locationEl = document.getElementById('farm-location');
    if (locationEl) locationEl.textContent = farm.location;

    // Рейтинг
    const ratingEl = document.getElementById('farm-rating');
    if (ratingEl) ratingEl.textContent = farm.rating;

    // Отзывы
    const reviewsEl = document.getElementById('farm-reviews');
    if (reviewsEl) reviewsEl.textContent = `(${farm.reviews} отзывов)`;

    // Описание
    const descEl = document.getElementById('farm-description');
    if (descEl) descEl.textContent = farm.description;

    // Статистика
    const productsEl = document.getElementById('stat-products');
    if (productsEl) productsEl.textContent = farm.productsCount;

    const followersEl = document.getElementById('stat-followers');
    if (followersEl) followersEl.textContent = farm.followers;

    const establishedEl = document.getElementById('stat-established');
    if (establishedEl) establishedEl.textContent = farm.established;

    // Контакты
    const emailEl = document.getElementById('farm-email');
    if (emailEl) emailEl.textContent = farm.email;

    const phoneEl = document.getElementById('farm-phone');
    if (phoneEl) phoneEl.textContent = farm.phone;

    const websiteEl = document.getElementById('farm-website');
    if (websiteEl) websiteEl.textContent = farm.website;
}

/**
 * Отрендерить продукты фермы
 * @param {string} farmName
 */
function renderFarmProducts(farmName) {
    const grid = document.getElementById('farm-products-grid');
    if (!grid) return;

    // Получить все продукты и отфильтровать по ферме
    const allProducts = productManager.getAllProducts();
    const farmProducts = allProducts.filter(p => p.farmer === farmName || p.farmTag === farmName);

    if (farmProducts.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="text-6xl mb-4" aria-hidden="true">🥕</div>
                <p class="text-gray-500 text-lg">Продукты от этой фермы временно отсутствуют</p>
                <a href="index.html#marketplace" class="btn-primary inline-flex items-center gap-2 mt-4">
                    <span>Смотреть другие продукты</span>
                </a>
            </div>
        `;
        return;
    }

    // Обновить счётчик продуктов
    const statProductsEl = document.getElementById('stat-products');
    if (statProductsEl) statProductsEl.textContent = farmProducts.length;

    // Отрендерить карточки
    const cards = farmProducts.map((product, index) => {
        const card = createProductCard(product);
        card.style.animationDelay = `${index * 0.05}s`;
        card.classList.add('animate-fade-in-up');
        return card;
    });

    grid.innerHTML = '';
    grid.append(...cards);
}

// ============================================
// ГЛОБАЛЬНЫЕ ФУНКЦИИ
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

// ============================================
// ОБРАБОТЧИКИ СОБЫТИЙ
// ============================================

function attachEventListeners() {
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

    // Обработчик кнопки выхода
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('logout-btn') || e.target.closest('.logout-btn')) {
            e.preventDefault();
            authManager.logout();
            window.location.href = 'index.html';
        }
    });

    // Анимация эко-счетчика
    setupEcoCounter();
}

/**
 * Настроить анимацию эко-счетчика
 */
function setupEcoCounter() {
    const ecoCounter = document.getElementById('eco-counter');
    if (!ecoCounter) return;

    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            animateCounter(ecoCounter);
            observer.disconnect();
        }
    }, { threshold: 0.5 });

    observer.observe(ecoCounter);
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
