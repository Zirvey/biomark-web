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
    
    // Прикрепить обработчики
    attachEventListeners();
    
    // Показать начальную секцию (overview)
    const hash = window.location.hash.slice(1) || 'overview';
    showSection(hash);
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
    
    // Заполнить форму настроек
    document.getElementById('settings-farm-name').value = user.farmName || '';
    document.getElementById('settings-name').value = user.fullname || '';
    document.getElementById('settings-email').value = user.email || '';
    document.getElementById('settings-phone').value = user.phone || '';
    document.getElementById('settings-location').value = user.address || '';
    
    // Загрузить товары
    loadProducts();
    
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
    
    const icons = {
        'vegetables': '🥬',
        'fruits': '🍎',
        'berries': '🍓',
        'herbs': '🌿',
        'potatoes': '🥔'
    };
    
    container.innerHTML = products.map((product, index) => `
        <div class="product-item" data-index="${index}">
            <div class="product-icon">${icons[product.category] || '📦'}</div>
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

window.addProduct = function() {
    const products = JSON.parse(localStorage.getItem('biomarket_farmer_products') || '[]');
    
    const productData = {
        name: document.getElementById('product-name').value,
        quantity: parseInt(document.getElementById('product-quantity').value),
        price: parseInt(document.getElementById('product-price').value),
        category: document.getElementById('product-category').value
    };
    
    if (!productData.name || !productData.quantity || !productData.price) {
        alert('Заполните все поля');
        return;
    }
    
    products.push({
        ...productData,
        createdAt: new Date().toISOString()
    });
    
    localStorage.setItem('biomarket_farmer_products', JSON.stringify(products));
    
    // Очистить форму
    document.getElementById('product-name').value = '';
    document.getElementById('product-quantity').value = '';
    document.getElementById('product-price').value = '';
    
    loadProducts();
    loadStats();
};

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

function updatePageTitle(section) {
    const titles = {
        'overview': 'Обзор — BioMarket',
        'products': 'Товары — BioMarket',
        'pickup': 'Забор груза — BioMarket',
        'settings': 'Настройки — BioMarket'
    };
    document.title = titles[section] || 'BioMarket';
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
    
    // Обработчик выхода
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('logout-btn') || e.target.closest('.logout-btn')) {
            e.preventDefault();
            logout();
        }
    });
}

// ============================================
// ФУНКЦИИ
// ============================================

window.saveSettings = function() {
    const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || '{}');
    
    user.farmName = document.getElementById('settings-farm-name').value;
    user.fullname = document.getElementById('settings-name').value;
    user.email = document.getElementById('settings-email').value;
    user.phone = document.getElementById('settings-phone').value;
    user.address = document.getElementById('settings-location').value;
    
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
};

window.toggleSwitch = function(element) {
    element.classList.toggle('active');
};

window.logout = function() {
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.USER_ROLE);
    localStorage.removeItem('biomarket_farmer_products');
    window.location.href = 'index.html';
};

// Экспортировать для глобального доступа
window.navigateTo = showSection;
window.saveSettings = saveSettings;
window.toggleSwitch = toggleSwitch;
window.logout = logout;
