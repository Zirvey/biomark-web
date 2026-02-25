// src/js/farmer-dashboard.js
import { STORAGE_KEYS } from './utils/constants.js';
import { authManager } from './modules/auth.js';

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initializeDashboard();
});

async function initializeDashboard() {
    // Загрузить отзывы
    loadReviews();

    // Прикрепить обработчики
    attachEventListeners();

    // Загрузить данные фермера (после reviews чтобы не блокировать)
    await loadFarmerData();

    // Показать начальную секцию (overview)
    const hash = window.location.hash.slice(1) || 'overview';
    showSection(hash);
}

// ============================================
// ДАННЫЕ ФЕРМЕРА
// ============================================

async function loadFarmerData() {
    // Используем authManager для получения данных
    const user = await authManager.getUser();
    const userRole = await authManager.getUserRole();

    console.log('Farmer Dashboard - User data:', user);
    console.log('Farmer Dashboard - User role:', userRole);

    if (!user || !user.fullname || userRole !== 'farmer') {
        console.log('Redirecting to index.html - no user or wrong role');
        window.location.href = 'index.html';
        return;
    }

    const firstName = user.fullname.split(' ')[0];

    document.getElementById('user-avatar').textContent = '👨‍🌾';
    document.getElementById('sidebar-user-name').textContent = firstName;
    document.getElementById('sidebar-user-email').textContent = user.email || 'farm@example.com';

    // Заполнить форму настроек (с проверками)
    const farmNameEl = document.getElementById('settings-farm-name');
    const nameEl = document.getElementById('settings-name');
    const emailEl = document.getElementById('settings-email');
    const phoneEl = document.getElementById('settings-phone');
    const locationEl = document.getElementById('settings-location');
    const farmIconEl = document.getElementById('settings-farm-icon');
    const farmDescriptionEl = document.getElementById('settings-farm-description');
    const farmWebsiteEl = document.getElementById('settings-farm-website');

    if (farmNameEl) farmNameEl.value = user.farmName || '';
    if (nameEl) nameEl.value = user.fullname || '';
    if (emailEl) emailEl.value = user.email || '';
    if (phoneEl) phoneEl.value = user.phone || '';
    if (locationEl) locationEl.value = user.address || '';
    if (farmIconEl) farmIconEl.value = user.farmIcon || '🏡';
    if (farmDescriptionEl) farmDescriptionEl.value = user.farmDescription || '';
    if (farmWebsiteEl) farmWebsiteEl.value = user.farmWebsite || '';

    // Обновить адрес забора груза
    const pickupAddressEl = document.getElementById('next-pickup-address');
    if (pickupAddressEl && user.address) {
        pickupAddressEl.textContent = user.address;
    }

    // Загрузить товары
    loadProducts();

    // Загрузить статистику
    loadStats();

    // Загрузить историю заборов
    loadPickupHistory();
}

function updateFarmPreview(user) {
    document.getElementById('preview-farm-name').textContent = user.farmName || 'Название фермы';
    document.getElementById('preview-farm-location').textContent = `📍 ${user.address || 'Расположение'}`;
    document.getElementById('preview-farm-icon').textContent = user.farmIcon || '🏡';
    document.getElementById('preview-farm-description').textContent = user.farmDescription || 'Описание фермы';
    document.getElementById('preview-farm-rating').textContent = user.farmRating || '4.9';
    
    const reviews = JSON.parse(localStorage.getItem('biomarket_farm_reviews') || '[]');
    document.getElementById('preview-farm-reviews').textContent = `(${reviews.length} отзывов)`;
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

let allProducts = [];

function loadProducts() {
    allProducts = JSON.parse(localStorage.getItem('biomarket_farmer_products') || '[]');
    renderProducts(allProducts);
    updateProductsCount(allProducts.length);
}

function filterProducts() {
    const searchTerm = document.getElementById('product-search')?.value.toLowerCase() || '';
    const category = document.getElementById('category-filter')?.value || '';

    let filtered = allProducts;

    // Фильтр по поиску
    if (searchTerm) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm));
    }

    // Фильтр по категории
    if (category) {
        filtered = filtered.filter(p => p.category === category);
    }

    renderProducts(filtered);
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
                <div class="product-meta">${product.quantity} кг • ${getCategoryName(product.category)}</div>
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

function getCategoryName(category) {
    const names = {
        'vegetables': 'Овощи',
        'fruits': 'Фрукты',
        'berries': 'Ягоды',
        'herbs': 'Зелень',
        'potatoes': 'Корнеплоды'
    };
    return names[category] || 'Без категории';
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
        category: document.getElementById('product-category').value,
        description: document.getElementById('product-description').value || ''
    };

    if (!productData.name || !productData.quantity || !productData.price) {
        alert('Заполните название, количество и цену');
        return;
    }

    products.push({
        ...productData,
        id: Date.now(),
        createdAt: new Date().toISOString()
    });

    localStorage.setItem('biomarket_farmer_products', JSON.stringify(products));

    // Очистить форму
    clearProductForm();

    loadProducts();
    loadStats();
    loadReviews(); // Обновить отзывы (товары влияют на отзывы)
};

window.saveEdit = function() {
    const products = JSON.parse(localStorage.getItem('biomarket_farmer_products') || '[]');
    const editIndex = parseInt(document.getElementById('product-edit-index').value);

    if (editIndex < 0 || editIndex >= products.length) {
        alert('Ошибка редактирования');
        return;
    }

    const productData = {
        name: document.getElementById('product-name').value,
        quantity: parseInt(document.getElementById('product-quantity').value),
        price: parseInt(document.getElementById('product-price').value),
        category: document.getElementById('product-category').value,
        description: document.getElementById('product-description').value || ''
    };

    if (!productData.name || !productData.quantity || !productData.price) {
        alert('Заполните название, количество и цену');
        return;
    }

    products[editIndex] = {
        ...products[editIndex],
        ...productData,
        updatedAt: new Date().toISOString()
    };

    localStorage.setItem('biomarket_farmer_products', JSON.stringify(products));

    // Сбросить форму
    clearProductForm();

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
    document.getElementById('product-description').value = product.description || '';
    document.getElementById('product-edit-index').value = index;

    // Переключить UI на режим редактирования
    document.getElementById('form-title').textContent = 'Редактировать товар';
    document.getElementById('add-product-btn').style.display = 'none';
    document.getElementById('save-edit-btn').style.display = 'inline-flex';
    document.getElementById('cancel-edit-btn').classList.remove('hidden');

    // Прокрутить к форме
    document.getElementById('add-product-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
};

window.deleteProduct = function(index) {
    if (!confirm('Вы уверены, что хотите удалить этот товар?')) {
        return;
    }

    const products = JSON.parse(localStorage.getItem('biomarket_farmer_products') || '[]');
    products.splice(index, 1);
    localStorage.setItem('biomarket_farmer_products', JSON.stringify(products));
    loadProducts();
    loadStats();
};

window.cancelEdit = function() {
    clearProductForm();
};

function clearProductForm() {
    document.getElementById('product-name').value = '';
    document.getElementById('product-quantity').value = '';
    document.getElementById('product-price').value = '';
    document.getElementById('product-category').value = 'vegetables';
    document.getElementById('product-description').value = '';
    document.getElementById('product-edit-index').value = '-1';

    document.getElementById('form-title').textContent = 'Добавить товар';
    document.getElementById('add-product-btn').style.display = 'inline-flex';
    document.getElementById('save-edit-btn').style.display = 'none';
    document.getElementById('cancel-edit-btn').classList.add('hidden');
}

// ============================================
// ЗАБОР ГРУЗА
// ============================================

function loadPickupHistory() {
    const history = JSON.parse(localStorage.getItem('biomarket_pickup_history') || '[]');
    renderPickupHistory(history);
}

function renderPickupHistory(history) {
    const container = document.getElementById('pickup-history');

    if (history.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📅</div>
                <div class="empty-title">История пуста</div>
                <div class="empty-text">Здесь появятся записи после первых заборов</div>
            </div>
        `;
        return;
    }

    container.innerHTML = history.map(pickup => `
        <div class="review-item">
            <div class="review-header">
                <div class="reviewer-info">
                    <div class="reviewer-avatar">🚚</div>
                    <div>
                        <div class="reviewer-name">Забор груза #${pickup.id}</div>
                        <div class="review-date">${formatDate(pickup.date)}</div>
                    </div>
                </div>
                <div class="status-badge ${pickup.status === 'completed' ? 'status-confirmed' : 'status-pending'}">
                    ${pickup.status === 'completed' ? '✓ Выполнен' : '⏳ Ожидается'}
                </div>
            </div>
            <div class="review-text">
                <strong>Вес:</strong> ${pickup.weight} кг<br>
                <strong>Время:</strong> ${pickup.time}
            </div>
        </div>
    `).join('');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// ============================================
// ОТЗЫВЫ И РЕЙТИНГИ
// ============================================

function loadReviews() {
    const reviews = JSON.parse(localStorage.getItem('biomarket_farm_reviews') || '[]');
    renderReviews(reviews);
    renderRatingOverview(reviews);
    updateReviewsBadge(reviews);
}

function updateReviewsBadge(reviews) {
    const badge = document.getElementById('reviews-badge');
    if (!badge) return;

    // Показываем бейдж если есть новые отзывы (например, за последнюю неделю)
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const newReviews = reviews.filter(r => new Date(r.date).getTime() > oneWeekAgo);

    if (newReviews.length > 0) {
        badge.textContent = newReviews.length;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

function renderReviews(reviews) {
    const container = document.getElementById('reviews-list');

    if (reviews.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">💬</div>
                <div class="empty-title">Пока нет отзывов</div>
                <div class="empty-text">Отзывы появятся после первых продаж</div>
            </div>
        `;
        return;
    }

    // Сортировать по дате (новые сверху)
    const sortedReviews = [...reviews].sort((a, b) => new Date(b.date) - new Date(a.date));

    container.innerHTML = sortedReviews.map(review => `
        <div class="review-item">
            <div class="review-header">
                <div class="reviewer-info">
                    <div class="reviewer-avatar">👤</div>
                    <div>
                        <div class="reviewer-name">${review.customerName}</div>
                        <div class="review-date">${formatDate(review.date)}</div>
                    </div>
                </div>
                <div class="review-rating">${getStars(review.rating)}</div>
            </div>
            <div class="review-text">${review.text}</div>
            ${review.productName ? `<div class="review-product">🛒 ${review.productName}</div>` : ''}
        </div>
    `).join('');
}

function renderRatingOverview(reviews) {
    if (reviews.length === 0) {
        document.getElementById('overall-rating').textContent = '0.0';
        document.getElementById('rating-stars').textContent = '☆';
        document.getElementById('rating-count').textContent = '0 отзывов';
        
        for (let i = 1; i <= 5; i++) {
            document.getElementById(`rating-${i}`).style.width = '0%';
            document.getElementById(`count-${i}`).textContent = '0';
        }
        return;
    }

    // Посчитать средний рейтинг
    const total = reviews.reduce((sum, r) => sum + r.rating, 0);
    const average = (total / reviews.length).toFixed(1);

    document.getElementById('overall-rating').textContent = average;
    document.getElementById('rating-stars').textContent = getStars(Math.round(average));
    document.getElementById('rating-count').textContent = `${reviews.length} отзывов`;

    // Посчитать распределение
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(r => distribution[r.rating]++);

    for (let i = 1; i <= 5; i++) {
        const percentage = (distribution[i] / reviews.length) * 100;
        document.getElementById(`rating-${i}`).style.width = `${percentage}%`;
        document.getElementById(`count-${i}`).textContent = distribution[i];
    }
}

function getStars(rating) {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
}

// ============================================
// НАВИГАЦИЯ
// ============================================

function updatePageTitle(section) {
    const titles = {
        'overview': 'Обзор — BioMarket',
        'products': 'Товары — BioMarket',
        'pickup': 'Поставки — BioMarket',
        'reviews': 'Отзывы — BioMarket',
        'settings': 'Настройки — BioMarket'
    };
    document.title = titles[section] || 'BioMarket';
}

function showSection(sectionId) {
    // Скрыть все секции
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.classList.remove('active');
    });

    // Показать нужную секцию
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
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

    // Обработчик выхода (только по клику)
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

// ============================================
// ФУНКЦИИ
// ============================================

window.saveSettings = function() {
    const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || '{}');

    // Основная информация
    user.fullname = document.getElementById('settings-name').value;
    user.email = document.getElementById('settings-email').value;
    user.phone = document.getElementById('settings-phone').value;
    user.address = document.getElementById('settings-location').value;

    // Информация о ферме
    user.farmName = document.getElementById('settings-farm-name').value;
    user.farmIcon = document.getElementById('settings-farm-icon')?.value || '🏡';
    user.farmDescription = document.getElementById('settings-farm-description')?.value || '';
    user.farmWebsite = document.getElementById('settings-farm-website')?.value || '';

    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

    // Обновить отображение
    document.getElementById('sidebar-user-name').textContent = user.fullname.split(' ')[0];
    document.getElementById('sidebar-user-email').textContent = user.email;

    // Обновить адрес забора груза
    if (user.address) {
        document.getElementById('next-pickup-address').textContent = user.address;
    }

    // Обновить предпросмотр
    updateFarmPreview(user);

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
window.filterProducts = filterProducts;
