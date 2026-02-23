// src/js/modules/filters.js
import { SORT_OPTIONS, PRODUCT_CATEGORIES } from '../utils/constants.js';

export class FilterManager {
    constructor(products) {
        this.allProducts = products || [];
        this.activeCategory = PRODUCT_CATEGORIES.ALL;
        this.sortBy = SORT_OPTIONS.RATING;
    }

    /**
     * Установить активную категорию
     * @param {string} category
     */
    setCategory(category) {
        this.activeCategory = category;
    }

    /**
     * Установить способ сортировки
     * @param {string} sortOption
     */
    setSort(sortOption) {
        this.sortBy = sortOption;
    }

    /**
     * Применить все фильтры и вернуть отфильтрованные продукты
     * @returns {Array}
     */
    applyFilters() {
        let filtered = [...this.allProducts];

        // Категория
        if (this.activeCategory !== PRODUCT_CATEGORIES.ALL) {
            filtered = filtered.filter(p => p.category === this.activeCategory);
        }

        // Сортировка
        switch (this.sortBy) {
            case SORT_OPTIONS.RATING:
                filtered.sort((a, b) => b.rating - a.rating);
                break;
            case SORT_OPTIONS.PRICE_ASC:
                filtered.sort((a, b) => a.priceSubscription - b.priceSubscription);
                break;
            case SORT_OPTIONS.PRICE_DESC:
                filtered.sort((a, b) => b.priceSubscription - a.priceSubscription);
                break;
            case SORT_OPTIONS.NEWEST:
                filtered.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
                break;
        }

        return filtered;
    }
}

export const filterManager = new FilterManager([]);
