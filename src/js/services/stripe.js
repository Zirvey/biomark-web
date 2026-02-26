/**
 * @file stripe.js — Интеграция со Stripe
 * @description Безопасная обработка платежей через Stripe Elements
 * 
 * @see https://stripe.com/docs/js
 * @see https://stripe.com/docs/security/guide
 */

// ============================================
// КОНФИГУРАЦИЯ
// ============================================

const STRIPE_CONFIG = {
    // Публичный ключ (безопасно хранить на клиенте)
    publicKey: import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_YOUR_PUBLIC_KEY',
    
    // Настройки внешнего вида
    appearance: {
        theme: 'stripe',
        variables: {
            fontFamily: 'Inter, system-ui, sans-serif',
            spacingUnit: '4px',
            borderRadius: '8px',
            colorPrimary: '#84A93C',
        },
    },
};

// ============================================
// STRIPE MANAGER
// ============================================

let stripe = null;
let elements = null;
let cardElement = null;

export const stripeManager = {
    /**
     * Инициализация Stripe
     * @returns {Promise<Object>}
     */
    async initialize() {
        if (stripe) return { stripe, elements };

        // Загружаем Stripe.js динамически
        if (!window.Stripe) {
            await this.loadStripeScript();
        }

        // Создаём экземпляр Stripe
        stripe = window.Stripe(STRIPE_CONFIG.publicKey);

        // Создаём Elements
        elements = stripe.elements({
            appearance: STRIPE_CONFIG.appearance,
        });

        return { stripe, elements };
    },

    /**
     * Создать Card Element
     * @param {string} containerId - ID контейнера
     * @returns {Promise<Object>}
     */
    async createCardElement(containerId = 'card-element') {
        if (!stripe || !elements) {
            await this.initialize();
        }

        // Создаём Card Element
        cardElement = elements.create('card', {
            hidePostalCode: true,
            style: {
                base: {
                    fontSize: '16px',
                    color: '#1a1a1a',
                    '::placeholder': {
                        color: '#9ca3af',
                    },
                },
                invalid: {
                    color: '#ef4444',
                    iconColor: '#ef4444',
                },
            },
        });

        // Монтируем в DOM
        const container = document.getElementById(containerId);
        if (container) {
            cardElement.mount(container);
        } else {
            throw new Error(`Container #${containerId} not found`);
        }

        return cardElement;
    },

    /**
     * Создать Payment Intent через API
     * @param {Object} paymentData
     * @returns {Promise<Object>}
     */
    async createPaymentIntent(paymentData) {
        try {
            const response = await fetch('/api/payments/create-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(paymentData),
            });

            if (!response.ok) {
                throw new Error('Failed to create payment intent');
            }

            return await response.json();
        } catch (error) {
            console.error('Create payment intent error:', error);
            throw error;
        }
    },

    /**
     * Подтвердить платёж
     * @param {Object} options
     * @returns {Promise<Object>}
     */
    async confirmPayment(options = {}) {
        if (!stripe || !cardElement) {
            throw new Error('Stripe not initialized');
        }

        const { returnUrl, paymentIntentClientSecret } = options;

        try {
            const result = await stripe.confirmCardPayment(paymentIntentClientSecret, {
                payment_method: {
                    card: cardElement,
                },
                return_url: returnUrl || window.location.origin + '/payment-success',
            });

            if (result.error) {
                throw new Error(result.error.message);
            }

            return result;
        } catch (error) {
            console.error('Confirm payment error:', error);
            throw error;
        }
    },

    /**
     * Получить данные карты для токенизации
     * @returns {Promise<Object>}
     */
    async createToken() {
        if (!stripe || !cardElement) {
            throw new Error('Stripe not initialized');
        }

        const result = await stripe.createToken(cardElement);

        if (result.error) {
            throw new Error(result.error.message);
        }

        return result;
    },

    /**
     * Загрузить Stripe.js скрипт
     * @returns {Promise<void>}
     */
    loadStripeScript() {
        return new Promise((resolve, reject) => {
            if (window.Stripe) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://js.stripe.com/v3/';
            script.async = true;
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load Stripe.js'));

            document.head.appendChild(script);
        });
    },

    /**
     * Очистить элементы (при размонтировании)
     */
    destroy() {
        if (cardElement) {
            cardElement.destroy();
            cardElement = null;
        }
    },

    /**
     * Проверить валидность карты
     * @returns {Promise<Object>}
     */
    async validateCard() {
        if (!cardElement) {
            throw new Error('Card element not initialized');
        }

        const { error } = await stripe.validateCardElement(cardElement);

        if (error) {
            return { valid: false, message: error.message };
        }

        return { valid: true };
    },
};

// ============================================
// ЗАГЛУШКА ДЛЯ MOCK РЕЖИМА
// ============================================

/**
 * Mock Stripe для разработки без реального аккаунта
 */
export const mockStripeManager = {
    async initialize() {
        console.warn('⚠️ Using Mock Stripe - no real payments will be processed');
        return { stripe: null, elements: null };
    },

    async createCardElement(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            // Создаём фейковые инпуты для демонстрации
            container.innerHTML = `
                <div class="mock-card-element" style="
                    display: grid;
                    gap: 12px;
                    padding: 16px;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    background: #f9fafb;
                ">
                    <input 
                        type="text" 
                        placeholder="Номер карты (тестовый)" 
                        style="padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;"
                        maxlength="19"
                    />
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <input 
                            type="text" 
                            placeholder="ММ/ГГ" 
                            style="padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;"
                            maxlength="5"
                        />
                        <input 
                            type="text" 
                            placeholder="CVC" 
                            style="padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;"
                            maxlength="4"
                        />
                    </div>
                    <p style="font-size: 12px; color: #f97316; margin: 0;">
                        ⚠️ Mock режим - не используйте реальные карты
                    </p>
                </div>
            `;
        }
        return { on: () => {} }; // Mock event listener
    },

    async createPaymentIntent(paymentData) {
        // Mock Payment Intent
        return {
            client_secret: 'mock_client_secret_' + Date.now(),
            id: 'mock_pi_' + Date.now()
        };
    },

    async confirmPayment(options) {
        // Имитация успешного платежа
        await new Promise(resolve => setTimeout(resolve, 2000));
        return {
            paymentIntent: {
                id: 'mock_pi_' + Date.now(),
                status: 'succeeded',
            },
        };
    },

    async validateCard() {
        return { valid: true };
    },

    destroy() {},
};

// ============================================
// ЭКСПОРТ
// ============================================

/**
 * Получить менеджер в зависимости от режима
 * @returns {Object}
 */
export function getStripeManager() {
    const useMock = import.meta.env.VITE_STRIPE_MODE === 'mock' || !import.meta.env.VITE_STRIPE_PUBLIC_KEY;
    return useMock ? mockStripeManager : stripeManager;
}

export default stripeManager;
