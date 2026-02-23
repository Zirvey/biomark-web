// src/js/utils/constants.js

// Селекторы DOM
export const SELECTORS = {
    PRODUCTS_GRID: '#products-grid',
    SORT_SELECT: '#sort-select',
    VISIBLE_COUNT: '#visible-count',
    CART_ITEMS: '#cart-items',
    CART_TOTAL: '#cart-total',
    CART_COUNT: '#cart-count',
    CART_COUNT_HEADER: '#mobile-cart-count-header',
    FILTER_BUTTONS: '.filter-btn',
    MOBILE_MENU_BTN: '#mobile-menu-btn',
    MOBILE_MENU: '#mobile-menu',
    AUTH_BUTTONS: '#auth-buttons',
    MOBILE_AUTH_BUTTONS: '#mobile-auth-buttons',
    CART_SIDEBAR: '#cart-sidebar',
    OVERLAY: '#overlay',
    ECO_COUNTER: '#eco-counter',
};

// Ключи localStorage
export const STORAGE_KEYS = {
    CART: 'biomarket_cart',
    USER: 'biomarket_user',
    USER_ROLE: 'biomarket_user_role',
};

// Роли пользователей
export const USER_ROLES = {
    BUYER: 'buyer',
    FARMER: 'farmer',
};

// Категории продуктов
export const PRODUCT_CATEGORIES = {
    ALL: 'all',
    POTATOES: 'potatoes',
    VEGETABLES: 'vegetables',
    FRUITS: 'fruits',
    BERRIES: 'berries',
    HERBS: 'herbs',
    EGGS: 'eggs',
    MEAT: 'meat',
};

// Сортировка
export const SORT_OPTIONS = {
    RATING: 'rating',
    PRICE_ASC: 'price-asc',
    PRICE_DESC: 'price-desc',
    NEWEST: 'newest',
};

// Цвета (CSS переменные)
export const COLORS = {
    OLIVE: '#84A93C',
    OLIVE_DARK: '#6B8A31',
    EARTH: '#5C4D3A',
};

// Сообщения об ошибках
export const ERROR_MESSAGES = {
    INVALID_USER: 'Некорректные данные пользователя',
    INVALID_PRODUCT: 'Некорректные данные продукта',
    STORAGE_ERROR: 'Ошибка сохранения данных',
    PARSE_ERROR: 'Ошибка разбора данных',
};
