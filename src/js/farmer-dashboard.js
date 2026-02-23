// src/js/farmer-dashboard.js
import { STORAGE_KEYS } from './utils/constants.js';

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initializeDashboard();
});

function initializeDashboard() {
    // Загрузить данные фермера
    loadFarmerData();
    
    // Загрузить товары
    loadProducts();
    
    // Прикрепить обработчики
    attachEventListeners();
}

// ============================================
// ДАННЫЕ ФЕРМЕРА
// ============================================

function loadFarmerData() {
    const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || '{}');
    const userRole = localStorage.getItem(STORAGE_KEYS.USER_ROLE);
    
    if (!user || !user.fullname) {
        window.location.href = 'index.html';
        return;
    }
    
    const firstName = user.fullname.split(' ')[0];
    
    document.getElementById('user-avatar').textContent = '👨‍🌾';
    document.getElementById('sidebar-user-name').textContent = firstName;
    document.getElementById('sidebar-user-email').textContent = user.email || 'farm@example.com';
    
    // Загрузить статистику
    loadStats();
}

function loadStats() {
    const products = JSON.parse(localStorage.getItem('biomarket_farmer_products') || '[]');
    const deliveries = JSON.parse(localStorage.getItem('biomarket_farmer_deliveries') || '[]');
    
    const revenue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    
    document.getElementById('stat-revenue').textContent = `${revenue} Kč`;
    document.getElementById('stat-deliveries').textContent = deliveries.length;
    document.getElementById('stat-products').textContent = products.length;
}

// ============================================
// УПРАВЛЕНИЕ ТОВАРАМИ
// ============================================

function loadProducts() {
    const products = JSON.parse(localStorage.getItem('biomarket_farmer_products') || '[]');
    renderProducts(products);
    updateProductsCount(products.length);
}

function renderProducts(products) {
    const container = document.getElementById('products-list');
    
    if (products.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-icon">📦</div>
                <div class="empty-title">Пока нет товаров</div>
                <div class="empty-text">Добавьте первый товар выше</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = products.map((product, index) => `
        <div class="product-item" data-index="${index}">
            <div class="product-icon">${product.icon || '📦'}</div>
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-meta">${product.quantity} кг • ${product.category || 'Без категории'}</div>
            </div>
            <div class="product-price">${product.price} Kč</div>
            <div class="product-actions">
                <button class="btn-icon" onclick="editProduct(${index})" title="Редактировать" aria-label="Редактировать товар">
                    ✏️
                </button>
                <button class="btn-icon delete" onclick="deleteProduct(${index})" title="Удалить" aria-label="Удалить товар">
                    🗑️
                </button>
            </div>
        </div>
    `).join('');
}

function updateProductsCount(count) {
    document.getElementById('products-count').textContent = `${count} позиций`;
    document.getElementById('stat-products').textContent = count;
}

function addProduct(productData) {
    const products = JSON.parse(localStorage.getItem('biomarket_farmer_products') || '[]');
    
    const icons = {
        'vegetables': '🥬',
        'fruits': '🍎',
        'berries': '🍓',
        'herbs': '🌿',
        'potatoes': '🥔'
    };
    
    products.push({
        ...productData,
        icon: icons[productData.category] || '📦',
        createdAt: new Date().toISOString()
    });
    
    localStorage.setItem('biomarket_farmer_products', JSON.stringify(products));
    
    loadProducts();
    loadStats();
}

window.deleteProduct = function(index) {
    const products = JSON.parse(localStorage.getItem('biomarket_farmer_products') || '[]');
    products.splice(index, 1);
    localStorage.setItem('biomarket_farmer_products', JSON.stringify(products));
    loadProducts();
    loadStats();
};

window.editProduct = function(index) {
    const products = JSON.parse(localStorage.getItem('biomarket_farmer_products') || '[]');
    const product = products[index];
    
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-quantity').value = product.quantity;
    document.getElementById('product-price').value = product.price;
    document.getElementById('product-category').value = product.category || 'vegetables';
    
    // Удалить старый товар после заполнения формы
    products.splice(index, 1);
    localStorage.setItem('biomarket_farmer_products', JSON.stringify(products));
    loadProducts();
};

// ============================================
// НАВИГАЦИЯ
// ============================================

function attachEventListeners() {
    // Навигация по секциям
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            const sectionId = item.dataset.section;
            const section = document.querySelector(`#${sectionId}`);
            if (section) {
                section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
    
    // Форма добавления товара
    document.getElementById('add-product-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const productData = {
            name: document.getElementById('product-name').value,
            quantity: parseInt(document.getElementById('product-quantity').value),
            price: parseInt(document.getElementById('product-price').value),
            category: document.getElementById('product-category').value
        };
        
        addProduct(productData);
        
        // Очистить форму
        e.target.reset();
    });
    
    // Обработчик выхода
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('logout-btn') || e.target.closest('.logout-btn')) {
            e.preventDefault();
            localStorage.removeItem(STORAGE_KEYS.USER);
            localStorage.removeItem(STORAGE_KEYS.USER_ROLE);
            localStorage.removeItem('biomarket_farmer_products');
            window.location.href = 'index.html';
        }
    });
}
