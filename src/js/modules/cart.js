// src/js/modules/cart.js
import { getFromStorage, setInStorage } from '../utils/storage.js';
import { isValidProduct } from '../utils/validation.js';
import { STORAGE_KEYS } from '../utils/constants.js';

export class CartManager {
    constructor() {
        this.cart = getFromStorage(STORAGE_KEYS.CART) || [];
    }

    /**
     * Получить всю корзину
     * @returns {Array}
     */
    getCart() {
        return this.cart;
    }

    /**
     * Получить количество товаров в корзине
     * @returns {number}
     */
    getCount() {
        return this.cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    }

    /**
     * Получить общую стоимость
     * @returns {number}
     */
    getTotalPrice() {
        return this.cart.reduce((sum, item) => {
            return sum + (item.priceSubscription * (item.quantity || 1));
        }, 0);
    }

    /**
     * Добавить товар в корзину
     * @param {Object} product
     * @returns {boolean}
     */
    addItem(product) {
        if (!isValidProduct(product)) {
            console.error('Invalid product:', product);
            return false;
        }

        const existingItem = this.cart.find(item => item.id === product.id);

        if (existingItem) {
            existingItem.quantity = (existingItem.quantity || 1) + 1;
        } else {
            this.cart.push({ ...product, quantity: 1 });
        }

        this.saveCart();
        return true;
    }

    /**
     * Удалить товар из корзины
     * @param {number} productId
     * @returns {boolean}
     */
    removeItem(productId) {
        const initialLength = this.cart.length;
        this.cart = this.cart.filter(item => item.id !== productId);

        if (this.cart.length < initialLength) {
            this.saveCart();
            return true;
        }
        return false;
    }

    /**
     * Обновить количество товара
     * @param {number} productId
     * @param {number} quantity
     * @returns {boolean}
     */
    updateQuantity(productId, quantity) {
        const item = this.cart.find(item => item.id === productId);

        if (!item) return false;

        if (quantity <= 0) {
            return this.removeItem(productId);
        }

        item.quantity = quantity;
        this.saveCart();
        return true;
    }

    /**
     * Очистить корзину
     */
    clearCart() {
        this.cart = [];
        this.saveCart();
    }

    /**
     * Сохранить корзину в localStorage
     */
    saveCart() {
        setInStorage(STORAGE_KEYS.CART, this.cart);
    }
}

export const cartManager = new CartManager();
