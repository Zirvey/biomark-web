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
    // В реальности здесь был бы запрос к API
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

function attachEventListeners() {
    // Навигация по секциям
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Обновить активный класс
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            // Прокрутка к секции
            const sectionId = item.dataset.section;
            const section = document.querySelector(`#${sectionId}`);
            if (section) {
                section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
    
    // Обработчик выхода
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('logout-btn') || e.target.closest('.logout-btn')) {
            e.preventDefault();
            localStorage.removeItem(STORAGE_KEYS.USER);
            localStorage.removeItem(STORAGE_KEYS.USER_ROLE);
            window.location.href = 'index.html';
        }
    });
}
