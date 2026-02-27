/**
 * @file checkout.js — Оформление подписки и оплата
 * @description Выбор плана, оплата, активация подписки
 */

import { STORAGE_KEYS } from './utils/constants.js';
import { authManager } from './modules/auth.js';
import { paymentService, PAYMENT_STATUS } from './services/paymentService.js';
import { subscriptionService } from './services/subscriptionService.js';
import { sanitize } from './services/api.js';
import { validator } from './utils/validator.js';
import { toastManager } from './utils/toast.js';
import { getStripeManager } from './services/stripe.js';
import { setTextContent } from './utils/dom.js';

// ============================================
// КОНСТАНТЫ
// ============================================

const PLANS = {
    '1month': { name: '1 месяц', period: '30 дней', price: 590, savings: 0 },
    '3months': { name: '3 месяца', period: '90 дней', price: 1500, savings: 270 },
    '1year': { name: '1 год', period: '365 дней', price: 4900, savings: 2180 },
};

// Stripe manager (mock или real)
const stripeManager = getStripeManager();
let cardElement = null;

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initializeCheckout();
});

async function initializeCheckout() {
    try {
        // ========================================
        // ПРОВЕРКА АВТОРИЗАЦИИ
        // ========================================
        const isAuthenticated = await authManager.isAuthenticated();
        const userRole = await authManager.getUserRole();

        if (!isAuthenticated) {
            // Не авторизован → редирект на регистрацию с сохранением плана
            const selectedPlan = localStorage.getItem('biomarket_selected_plan') || '1month';
            localStorage.setItem('biomarket_redirect_plan', selectedPlan);
            window.location.href = 'register.html';
            return;
        }

        if (userRole !== 'buyer') {
            // Не buyer → редирект на главную
            toastManager.warning('Доступно только для участников клуба', { duration: 3000 });
            window.location.href = 'index.html';
            return;
        }

        // ========================================
        // ПРОВЕРКА ПОДПИСКИ (не должна быть активна)
        // ========================================
        const subscription = await subscriptionService.getSubscription();
        
        if (subscriptionService.isActive(subscription)) {
            // Уже есть активная подписка → редирект в dashboard
            toastManager.info('У вас уже есть активная подписка', { duration: 3000 });
            window.location.href = 'member-dashboard.html#subscription';
            return;
        }

        // ========================================
        // Получить выбранный план
        // ========================================
        const planId = getPlanFromURL() || localStorage.getItem('biomarket_selected_plan') || '1month';
        const plan = PLANS[planId] || PLANS['1month'];

        // Отобразить информацию о плане
        displayPlan(planId, plan);

        // Инициализация Stripe
        await initializeStripe();

        // Загрузить доступные методы оплаты
        await loadPaymentMethods();

        // Прикрепить обработчики
        attachEventListeners();
    } catch (error) {
        console.error('Checkout initialization error:', error);
        showError('Не удалось загрузить страницу оплаты');
    }
}

// ============================================
// ФУНКЦИИ
// ============================================

function getPlanFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('plan');
}

function displayPlan(planId, plan) {
    const elements = {
        'plan-badge': plan.name,
        'plan-name': plan.name,
        'plan-period': plan.period,
        'plan-savings': `💰 ${plan.savings} Kč`,
        'plan-price': `${plan.price} Kč`,
        'btn-price': `${plan.price} Kč`,
    };

    Object.entries(elements).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) setTextContent(el, value);
    });

    // Сохранить текущий план
    localStorage.setItem('biomarket_checkout_plan', planId);
}

/**
 * Инициализация Stripe Elements
 */
async function initializeStripe() {
    try {
        await stripeManager.initialize();
        cardElement = await stripeManager.createCardElement('card-element');

        // Обработка ошибок Stripe (только если cardElement существует)
        if (cardElement && cardElement.on) {
            cardElement.on('change', (event) => {
                const errorDisplay = document.getElementById('card-errors');
                if (event.error) {
                    setTextContent(errorDisplay, event.error.message);
                    errorDisplay.classList.add('visible');
                } else {
                    errorDisplay.classList.remove('visible');
                }
            });
        }
    } catch (error) {
        console.error('Stripe initialization error:', error);
        showError('Не удалось загрузить форму оплаты');
    }
}

async function loadPaymentMethods() {
    try {
        const methods = await paymentService.getAvailablePaymentMethods();
        renderPaymentMethods(methods);
    } catch (error) {
        console.error('Load payment methods error:', error);
        // Используем дефолтные методы
        renderPaymentMethods(Object.values(paymentService.PAYMENT_METHODS));
    }
}

function renderPaymentMethods(methods) {
    methods.forEach(method => {
        const radio = document.querySelector(`input[name="payment"][value="${method.id}"]`);
        if (radio) {
            radio.disabled = !method.available;
            const label = radio.closest('.payment-method');
            if (label && !method.available) {
                label.style.opacity = '0.5';
                label.style.pointerEvents = 'none';
            }
        }
    });
}

function attachEventListeners() {
    // Выбор способа оплаты
    document.querySelectorAll('input[name="payment"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const paymentMethod = e.target.value;
            updatePaymentForm(paymentMethod);
        });
    });

    // Форматирование номера карты
    const cardNumber = document.getElementById('card-number');
    if (cardNumber) {
        cardNumber.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            value = value.replace(/(.{4})/g, '$1 ').trim();
            e.target.value = value.substring(0, 19);
        });
    }

    // Форматирование срока действия
    const cardExpiry = document.getElementById('card-expiry');
    if (cardExpiry) {
        cardExpiry.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            e.target.value = value;
        });
    }

    // Только цифры для CVV
    const cardCvv = document.getElementById('card-cvv');
    if (cardCvv) {
        cardCvv.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').substring(0, 3);
        });
    }

    // Обработка формы оплаты
    const paymentForm = document.getElementById('payment-form');
    if (paymentForm) {
        paymentForm.addEventListener('submit', handlePayment);
    }
}

function updatePaymentForm(paymentMethod) {
    const cardFields = document.getElementById('card-fields');
    const bankFields = document.getElementById('bank-fields');
    const walletFields = document.getElementById('wallet-fields');
    const btnText = document.getElementById('btn-text');
    const walletName = document.getElementById('wallet-name');
    const bankAmount = document.getElementById('bank-amount');
    const planPrice = document.getElementById('plan-price');

    // Скрыть все формы
    if (cardFields) cardFields.style.display = 'none';
    if (bankFields) bankFields.style.display = 'none';
    if (walletFields) walletFields.style.display = 'none';

    // Показать нужную форму
    if (paymentMethod === 'card') {
        if (cardFields) cardFields.style.display = 'block';
        if (btnText) btnText.innerHTML = `Оплатить <span id="btn-price">${planPrice ? planPrice.textContent : '0 Kč'}</span>`;
    } else if (paymentMethod === 'bank') {
        if (bankFields) bankFields.style.display = 'block';
        if (bankAmount && planPrice) bankAmount.textContent = planPrice.textContent;
        if (btnText) btnText.innerHTML = 'Подтвердить';
    } else if (paymentMethod === 'googlepay' || paymentMethod === 'applepay') {
        if (walletFields) walletFields.style.display = 'block';
        if (walletName) walletName.textContent = paymentMethod === 'googlepay' ? 'Google Pay' : 'Apple Pay';
        if (btnText) btnText.innerHTML = `Оплатить через ${paymentMethod === 'googlepay' ? 'Google Pay' : 'Apple Pay'}`;
    }
}

// ============================================
// ОБРАБОТКА ОПЛАТЫ
// ============================================

async function handlePayment(event) {
    event.preventDefault();

    const planId = localStorage.getItem('biomarket_checkout_plan');
    const plan = PLANS[planId];
    const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value;

    // 🔍 DEBUG: Логируем что отправляется
    console.log('🔍 handlePayment - planId:', planId, typeof planId);
    console.log('🔍 handlePayment - plan:', plan);
    console.log('🔍 handlePayment - paymentMethod:', paymentMethod);

    if (!paymentMethod) {
        showError('Выберите способ оплаты');
        return;
    }

    // ========================================
    // ВАЛИДАЦИЯ ДЛЯ КАРТЫ (STRIPE)
    // ========================================
    if (paymentMethod === 'card') {
        // Валидация через Stripe
        const validation = await stripeManager.validateCard();
        if (!validation.valid) {
            showError(validation.message);
            return;
        }

        // Валидация имени владельца
        const cardName = document.getElementById('card-name')?.value;
        const nameValidation = validator.name(cardName);
        if (!nameValidation.valid) {
            showError(nameValidation.message);
            return;
        }
    }

    // ========================================
    // LOADING STATE
    // ========================================
    const btn = event.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    
    // Блокировка кнопки + спиннер
    btn.disabled = true;
    btn.innerHTML = `
        <span style="display: inline-block; animation: spin 1s linear infinite;" aria-hidden="true">⏳</span>
        <span>Обработка платежа...</span>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;

    try {
        // ========================================
        // ОБРАБОТКА ЧЕРЕЗ STRIPE
        // ========================================
        let paymentResponse;

        if (paymentMethod === 'card') {
            // Создаём Payment Intent на бэкенде
            const paymentIntent = await stripeManager.createPaymentIntent({
                amount: plan.price * 100, // Копейки
                currency: 'czk',
                planId,
            });

            // Подтверждаем платёж через Stripe
            const result = await stripeManager.confirmPayment({
                returnUrl: window.location.origin + '/payment-success',
                paymentIntentClientSecret: paymentIntent.client_secret,
            });

            paymentResponse = {
                status: 'success',
                transactionId: result.paymentIntent.id,
                isMock: !result.paymentIntent.id.startsWith('pi_'),
            };
        } else {
            // Другие методы оплаты (через paymentService)
            paymentResponse = await paymentService.processPayment({
                planId,
                paymentMethod,
            });
        }

        // Проверка статуса платежа
        if (paymentResponse.status !== 'success') {
            throw new Error('Платёж не прошёл. Попробуйте ещё раз.');
        }

        // Активация подписки после успешного платежа
        await activateSubscription(planId, plan, paymentResponse);

        // Успех
        showSuccess('Оплата прошла успешно!');
        btn.innerHTML = '<span>✓</span><span>Оплачено!</span>';
        btn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';

        // Редирект через 2 секунды
        setTimeout(() => {
            window.location.href = 'member-dashboard.html#subscription';
        }, 2000);
    } catch (error) {
        console.error('Payment error:', error);

        // Восстановление кнопки
        btn.innerHTML = originalText;
        btn.disabled = false;

        // Показать ошибку
        showError(error.message || 'Не удалось обработать платёж. Попробуйте ещё раз.');
    }
}

async function activateSubscription(planId, plan, paymentResponse) {
    try {
        // Создаём подписку через сервис
        const subscription = await subscriptionService.createSubscription(planId);

        // Сохраняем информацию о платеже
        const subscriptionData = {
            ...subscription,
            transactionId: paymentResponse.transactionId,
            paymentMethod: document.querySelector('input[name="payment"]:checked')?.value,
            amount: paymentResponse.amount,
            currency: paymentResponse.currency,
        };

        // В mock режиме сохраняем в localStorage для совместимости
        if (paymentResponse.isMock) {
            localStorage.setItem('biomarket_subscription', JSON.stringify(subscriptionData));
        }

        // Очистить временные данные
        localStorage.removeItem('biomarket_selected_plan');
        localStorage.removeItem('biomarket_checkout_plan');

        console.log('Subscription activated:', subscriptionData);
    } catch (error) {
        console.error('Activate subscription error:', error);
        throw new Error('Не удалось активировать подписку. Обратитесь в поддержку.');
    }
}

/**
 * Показать ошибку пользователю
 * @param {string} message
 */
function showError(message) {
    toastManager.error(message, { duration: 5000, closable: true });
}

/**
 * Показать успех
 * @param {string} message
 */
function showSuccess(message) {
    toastManager.success(message, { duration: 3000, closable: true });
}

// ============================================
// ВЫХОД
// ============================================

window.logout = async function() {
    try {
        await authManager.logout();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = 'index.html';
    }
};

// ============================================
// ЭКСПОРТ ДЛЯ HTML
// ============================================

// Сделать handlePayment доступной для HTML формы
window.handlePayment = handlePayment;
