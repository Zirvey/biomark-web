// src/js/modules/products.js
import { products } from '../data/products.js';

export class ProductManager {
    constructor() {
        this.allProducts = [...products];
    }

    /**
     * Получить все продукты
     * @returns {Array}
     */
    getAllProducts() {
        return this.allProducts;
    }

    /**
     * Получить продукт по ID
     * @param {number} id
     * @returns {Object|undefined}
     */
    getProductById(id) {
        return this.allProducts.find(p => p.id === id);
    }

    /**
     * Получить продукты по категории
     * @param {string} category
     * @returns {Array}
     */
    getByCategory(category) {
        if (category === 'all') return this.allProducts;
        return this.allProducts.filter(p => p.category === category);
    }

    /**
     * Получить только веганские продукты
     * @returns {Array}
     */
    getVeganProducts() {
        return this.allProducts.filter(p => p.isVegan);
    }

    /**
     * Получить новые продукты
     * @returns {Array}
     */
    getNewProducts() {
        return this.allProducts.filter(p => p.isNew);
    }

    /**
     * Получить товары по рейтингу (высокие первыми)
     * @returns {Array}
     */
    getByRating() {
        return [...this.allProducts].sort((a, b) => b.rating - a.rating);
    }

    /**
     * Получить товары по цене (по возрастанию)
     * @returns {Array}
     */
    getByPriceAsc() {
        return [...this.allProducts].sort((a, b) => a.priceSubscription - b.priceSubscription);
    }

    /**
     * Получить товары по цене (по убыванию)
     * @returns {Array}
     */
    getByPriceDesc() {
        return [...this.allProducts].sort((a, b) => b.priceSubscription - a.priceSubscription);
    }

    /**
     * Поиск продуктов по названию
     * @param {string} query
     * @returns {Array}
     */
    search(query) {
        const lowerQuery = query.toLowerCase();
        return this.allProducts.filter(p =>
            p.name.toLowerCase().includes(lowerQuery)
        );
    }
}

export const productManager = new ProductManager();
