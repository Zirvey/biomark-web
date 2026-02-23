// src/js/member-dashboard.js
import { STORAGE_KEYS } from './utils/constants.js';

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initializeDashboard();
});

function initializeDashboard() {
    // Загрузить данные пользователя
    loadUserData();
    
    // Установить начальную секцию
    const hash = window.location.hash.slice(1) || 'overview';
    const validSections = ['overview', 'orders', 'subscription', 'settings'];
    const initialSection = validSections.includes(hash) ? hash : 'overview';
    
    // Переключить на начальную секцию
    switchSection(initialSection);
    
    // Прикрепить обработчики
    attachEventListeners();
}

// ============================================
// ДАННЫЕ ПОЛЬЗОВАТЕЛЯ
// ============================================

function loadUserData() {
    const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || '{}');
    const userRole = localStorage.getItem(STORAGE_KEYS.USER_ROLE);
    
    if (!user || !user.fullname) {
        // Если нет данных, перенаправить на главную
        window.location.href = 'index.html';
        return;
    }
    
    const firstName = user.fullname.split(' ')[0];
    
    // Обновить UI
    document.getElementById('user-avatar').textContent = getAvatarEmoji(userRole);
    document.getElementById('sidebar-user-name').textContent = firstName;
    document.getElementById('sidebar-user-email').textContent = user.email || 'email@example.com';
    document.getElementById('main-user-name').textContent = firstName;
    
    // Заполнить форму настроек
    document.getElementById('settings-name').value = user.fullname || '';
    document.getElementById('settings-email').value = user.email || '';
    document.getElementById('settings-phone').value = user.phone || '';
    document.getElementById('settings-address').value = user.address || '';
    
    // Загрузить статистику
    loadStats();
}

function getAvatarEmoji(role) {
    const emojis = {
        'buyer': '🥕',
        'farmer': '👨‍🌾'
    };
    return emojis[role] || '👤';
}

function loadStats() {
    // Имитация загрузки статистики
    const orders = JSON.parse(localStorage.getItem('biomarket_orders') || '[]');
    const saved = orders.reduce((sum, order) => sum + (order.saved || 0), 0);
    const ecoPoints = orders.length * 10;
    
    document.getElementById('stat-orders').textContent = orders.length;
    document.getElementById('stat-saved').textContent = `${saved} Kč`;
    document.getElementById('stat-eco').textContent = ecoPoints;
}

// ============================================
// НАВИГАЦИЯ
// ============================================

function navigateTo(section) {
    // Обновить URL hash без вызова hashchange
    window.history.pushState({ section }, '', `#${section}`);
    
    // Переключить секцию
    switchSection(section);
}

function switchSection(sectionId) {
    // Скрыть все секции
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Показать нужную секцию
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Прокрутка вверх
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    // Обновить активный пункт меню
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.section === sectionId) {
            item.classList.add('active');
        }
    });
    
    // Обновить заголовок страницы
    updatePageTitle(sectionId);
}

function updatePageTitle(section) {
    const titles = {
        'overview': 'Обзор — BioMarket',
        'orders': 'Заказы — BioMarket',
        'subscription': 'Подписка — BioMarket',
        'settings': 'Настройки — BioMarket'
    };
    document.title = titles[section] || 'BioMarket';
}

// ============================================
// ОБРАБОТЧИКИ СОБЫТИЙ
// ============================================

function attachEventListeners() {
    // Навигация по секциям
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const sectionId = item.dataset.section;
            navigateTo(sectionId);
        });
    });
    
    // Обработка кнопок назад/вперёд в браузере
    window.addEventListener('popstate', (e) => {
        if (e.state && e.state.section) {
            switchSection(e.state.section);
        } else {
            const hash = window.location.hash.slice(1) || 'overview';
            switchSection(hash);
        }
    });
    
    // Форма настроек - предотвращаем отправку
    document.getElementById('settings-form').addEventListener('submit', (e) => {
        e.preventDefault();
        e.stopPropagation();
        saveSettings();
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

function saveSettings() {
    const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || '{}');
    
    user.fullname = document.getElementById('settings-name').value;
    user.email = document.getElementById('settings-email').value;
    user.phone = document.getElementById('settings-phone').value;
    user.address = document.getElementById('settings-address').value;
    
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
}

function toggleSwitch(element) {
    element.classList.toggle('active');
}

function logout() {
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.USER_ROLE);
    window.location.href = 'index.html';
}

// Экспортировать для глобального доступа
window.navigateTo = navigateTo;
window.toggleSwitch = toggleSwitch;
window.logout = logout;
