// src/js/modules/ui.js
import { createElementWithText, appendElements, setActiveElement } from '../utils/dom.js';
import { SELECTORS, USER_ROLES } from '../utils/constants.js';

/**
 * Рендер карточки продукта
 * @param {Object} product
 * @returns {HTMLElement}
 */
export function createProductCard(product) {
    const card = document.createElement('article');
    card.className = 'product-card bg-white rounded-2xl p-4 shadow-sm flex flex-col';
    card.setAttribute('role', 'listitem');
    card.setAttribute('data-category', product.category);
    card.setAttribute('data-image', product.image);
    card.setAttribute('data-id', product.id);

    const newBadge = product.isNew
        ? '<span class="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">NEW</span>'
        : '';

    card.innerHTML = `
        <div class="h-36 bg-gradient-to-br ${product.gradient} rounded-2xl mb-4 flex items-center justify-center text-5xl relative">
            ${product.image}
            ${newBadge}
        </div>

        <h3 class="font-bold text-gray-900 mb-1">${product.name}</h3>

        <div class="flex items-center space-x-1 mb-2">
            <span class="text-yellow-400" aria-hidden="true">⭐</span>
            <span class="font-semibold text-gray-800">${product.rating}</span>
            <span class="text-gray-400 text-xs">(${product.reviews})</span>
        </div>

        <div class="flex flex-wrap gap-1 mb-3">
            <span class="tag-farm">🏡 ${product.farmTag}</span>
        </div>

        <div class="mb-3 flex-1">
            <div class="flex items-center space-x-2">
                <span class="text-[#84A93C] font-bold text-xl">${product.priceSubscription} Kč/${product.unit}</span>
                <span class="price-badge">Цена клуба</span>
            </div>
            <div class="flex items-center space-x-2 mt-1">
                <span class="text-gray-400 line-through text-xs">${product.priceRegular} Kč/${product.unit}</span>
                <span class="text-gray-500 text-xs">в супермаркетах</span>
            </div>
        </div>

        <button
            onclick="window.addToCart(this)"
            class="w-full btn-accent py-2.5 flex items-center justify-center space-x-2 text-sm mt-auto"
            aria-label="Добавить ${product.name} в корзину"
            data-product-id="${product.id}"
        >
            <span aria-hidden="true">🛒</span>
            <span>В корзину</span>
        </button>
    `;

    return card;
}

/**
 * Рендер продуктов в сетку
 * @param {Array} productsToRender
 */
export function renderProducts(productsToRender) {
    const grid = document.querySelector(SELECTORS.PRODUCTS_GRID);
    if (!grid) return;

    grid.innerHTML = '';

    const cards = productsToRender.map((product, index) => {
        const card = createProductCard(product);
        card.style.animationDelay = `${index * 0.05}s`;
        card.classList.add('animate-fade-in-up');
        return card;
    });

    appendElements(grid, cards);

    // Обновить счётчик
    const countEl = document.querySelector(SELECTORS.VISIBLE_COUNT);
    if (countEl) countEl.textContent = productsToRender.length;
}

/**
 * Обновить UI корзины
 * @param {Object} cartData
 */
export function updateCartUI(cartData) {
    const countEl = document.querySelector(SELECTORS.CART_COUNT);
    const countHeaderEl = document.querySelector(SELECTORS.CART_COUNT_HEADER);
    const totalEl = document.querySelector(SELECTORS.CART_TOTAL);
    const cartItemsEl = document.querySelector(SELECTORS.CART_ITEMS);

    const count = cartData.count || '0';

    if (countEl) {
        countEl.textContent = count;
    }

    if (countHeaderEl) {
        countHeaderEl.textContent = count;
    }

    if (totalEl) {
        totalEl.textContent = `${cartData.total || 0} Kč`;
    }

    // Отрисовать элементы корзины
    if (cartItemsEl && cartData.items) {
        renderCartItems(cartItemsEl, cartData.items);
    }
}

/**
 * Отрисовать элементы корзины
 * @param {HTMLElement} container
 * @param {Array} items
 */
function renderCartItems(container, items) {
    if (!items || items.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-400 mt-20">
                <div class="text-6xl mb-4" aria-hidden="true">🛒</div>
                <p>Корзина пуста</p>
            </div>
        `;
        return;
    }

    container.innerHTML = items.map(item => `
        <div class="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
            <div class="w-16 h-16 bg-gradient-to-br ${item.gradient || 'from-green-100 to-green-200'} rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                ${item.image || '📦'}
            </div>
            <div class="flex-1 min-w-0">
                <h4 class="font-semibold text-gray-900 truncate">${item.name}</h4>
                <p class="text-sm text-gray-500">${item.priceSubscription} Kč/${item.unit}</p>
            </div>
            <div class="flex items-center gap-2">
                <button onclick="window.updateCartQuantity(${item.id}, -1)" class="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100" aria-label="Уменьшить количество">
                    <span aria-hidden="true">−</span>
                </button>
                <span class="font-medium text-gray-900 w-6 text-center">${item.quantity}</span>
                <button onclick="window.updateCartQuantity(${item.id}, 1)" class="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100" aria-label="Увеличить количество">
                    <span aria-hidden="true">+</span>
                </button>
            </div>
            <button onclick="window.removeFromCart(${item.id})" class="text-gray-400 hover:text-red-500 transition-colors" aria-label="Удалить товар">
                <span aria-hidden="true">×</span>
            </button>
        </div>
    `).join('');
}

/**
 * Обновить активную кнопку фильтра
 * @param {string} activeCategory
 */
export function updateFilterButtons(activeCategory) {
    const buttons = document.querySelectorAll(SELECTORS.FILTER_BUTTONS);
    const activeBtn = Array.from(buttons).find(btn => btn.dataset.category === activeCategory);

    if (activeBtn) {
        setActiveElement(
            Array.from(buttons),
            activeBtn,
            'active'
        );
    }
}

/**
 * Обновить UI аутентификации
 * @param {Object} user
 * @param {string} userRole
 */
export function updateAuthUI(user, userRole) {
    const authButtons = document.querySelector(SELECTORS.AUTH_BUTTONS);
    const mobileAuthButtons = document.querySelector(SELECTORS.MOBILE_AUTH_BUTTONS);

    let html = '';

    if (user && userRole === USER_ROLES.BUYER) {
        const firstName = user.fullname.split(' ')[0];
        html = `
            <div class="flex items-center gap-2 sm:gap-3">
                <a href="member-dashboard.html" class="header-btn role-badge">
                    <span aria-hidden="true">🥕</span>
                    <span class="hidden sm:inline">${firstName}</span>
                </a>
                <button class="header-btn btn-logout logout-btn" title="Выйти" aria-label="Выйти из аккаунта">
                    <span aria-hidden="true">↪️</span>
                    <span class="hidden sm:inline">Выйти</span>
                </button>
            </div>
        `;
    } else if (user && userRole === USER_ROLES.FARMER) {
        const firstName = user.fullname.split(' ')[0];
        html = `
            <div class="flex items-center gap-2 sm:gap-3">
                <a href="farmer-dashboard.html" class="header-btn role-badge">
                    <span aria-hidden="true">👨‍🌾</span>
                    <span class="hidden sm:inline">${firstName}</span>
                </a>
                <button class="header-btn btn-logout logout-btn" title="Выйти" aria-label="Выйти из аккаунта">
                    <span aria-hidden="true">↪️</span>
                    <span class="hidden sm:inline">Выйти</span>
                </button>
            </div>
        `;
    } else {
        html = `
            <a href="register.html" class="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all duration-300 border border-[#84A93C]/20 bg-white text-gray-700 hover:border-[#84A93C]/40 hover:bg-[#84A93C]/5 flex-shrink-0">
                <span>Войти</span>
            </a>
        `;
    }

    if (authButtons) authButtons.innerHTML = html;
    if (mobileAuthButtons) mobileAuthButtons.innerHTML = html.replace('hidden sm:inline', '');
}
