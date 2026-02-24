// src/js/checkout.js
import { STORAGE_KEYS } from './utils/constants.js';
import { authManager } from './modules/auth.js';

// Планы подписок
const PLANS = {
    '1month': { name: '1 месяц', period: '30 дней', price: 590, savings: 0 },
    '3months': { name: '3 месяца', period: '90 дней', price: 1500, savings: 270 },
    '1year': { name: '1 год', period: '365 дней', price: 4900, savings: 2180 }
};

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initializeCheckout();
});

function initializeCheckout() {
    // Проверка авторизации
    const user = authManager.getUser();
    const userRole = authManager.getUserRole();

    if (!user || userRole !== 'buyer') {
        // Не авторизован или не buyer → редирект на регистрацию
        const selectedPlan = localStorage.getItem('biomarket_selected_plan') || '1month';
        localStorage.setItem('biomarket_redirect_plan', selectedPlan);
        window.location.href = 'register.html';
        return;
    }

    // Получить выбранный план
    const planId = getPlanFromURL() || localStorage.getItem('biomarket_selected_plan') || '1month';
    const plan = PLANS[planId] || PLANS['1month'];

    // Отобразить информацию о плане
    displayPlan(planId, plan);

    // Прикрепить обработчики
    attachEventListeners();
}

// ============================================
// ФУНКЦИИ
// ============================================

function getPlanFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('plan');
}

function displayPlan(planId, plan) {
    document.getElementById('plan-badge').textContent = plan.name;
    document.getElementById('plan-name').textContent = plan.name;
    document.getElementById('plan-period').textContent = plan.period;
    document.getElementById('plan-savings').textContent = `💰 ${plan.savings} Kč`;
    document.getElementById('plan-price').textContent = `${plan.price} Kč`;
    document.getElementById('btn-price').textContent = `${plan.price} Kč`;

    // Сохранить текущий план
    localStorage.setItem('biomarket_checkout_plan', planId);
}

function attachEventListeners() {
    // Выбор способа оплаты
    document.querySelectorAll('input[name="payment"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            document.querySelectorAll('.payment-method').forEach(method => {
                method.classList.remove('selected');
            });
            e.target.closest('.payment-method').classList.add('selected');
        });
    });

    // Форматирование номера карты
    const cardNumber = document.getElementById('card-number');
    cardNumber.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        value = value.replace(/(.{4})/g, '$1 ').trim();
        e.target.value = value.substring(0, 19);
    });

    // Форматирование срока действия
    const cardExpiry = document.getElementById('card-expiry');
    cardExpiry.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        e.target.value = value;
    });

    // Только цифры для CVV
    const cardCvv = document.getElementById('card-cvv');
    cardCvv.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '').substring(0, 3);
    });
}

// ============================================
// ОБРАБОТКА ОПЛАТЫ
// ============================================

window.handlePayment = function(event) {
    event.preventDefault();

    const planId = localStorage.getItem('biomarket_checkout_plan');
    const plan = PLANS[planId];
    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;

    // Получить данные карты
    const cardNumber = document.getElementById('card-number').value;
    const cardName = document.getElementById('card-name').value;
    const cardExpiry = document.getElementById('card-expiry').value;

    // Валидация
    if (!cardNumber || !cardName || !cardExpiry) {
        alert('Пожалуйста, заполните все поля карты');
        return;
    }

    // Имитация обработки платежа
    const btn = event.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span>⏳</span><span>Обработка...</span>';
    btn.disabled = true;

    setTimeout(() => {
        // Успешная оплата
        activateSubscription(planId, plan);

        btn.innerHTML = '<span>✓</span><span>Оплачено!</span>';
        btn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';

        // Редирект через 2 секунды
        setTimeout(() => {
            window.location.href = 'member-dashboard.html#subscription';
        }, 2000);
    }, 2000);
};

function activateSubscription(planId, plan) {
    const user = authManager.getUser();
    const startDate = new Date();
    const endDate = new Date();

    // Рассчитать дату окончания
    if (planId === '1month') {
        endDate.setMonth(endDate.getMonth() + 1);
    } else if (planId === '3months') {
        endDate.setMonth(endDate.getMonth() + 3);
    } else if (planId === '1year') {
        endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Сохранить подписку
    const subscription = {
        plan: planId,
        planName: plan.name,
        price: plan.price,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        status: 'active',
        paymentMethod: document.querySelector('input[name="payment"]:checked').value
    };

    localStorage.setItem('biomarket_subscription', JSON.stringify(subscription));

    // Очистить временные данные
    localStorage.removeItem('biomarket_selected_plan');
    localStorage.removeItem('biomarket_checkout_plan');
}

window.logout = function() {
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.USER_ROLE);
    window.location.href = 'index.html';
};
