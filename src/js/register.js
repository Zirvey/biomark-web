/**
 * @file register.js — Регистрация и вход пользователей
 * @description Переключение ролей, логин, регистрация
 *
 * ⚠️ WARNING: Demo credentials are for DEVELOPMENT ONLY!
 * Remove before production deployment.
 */

// ============================================
// КОНФИГУРАЦИЯ (Environment Variables)
// ============================================

const DEMO_CREDENTIALS = {
    ADMIN: {
        email: import.meta.env.VITE_DEMO_ADMIN_EMAIL || 'admin@admin.com',
        password: import.meta.env.VITE_DEMO_ADMIN_PASSWORD || 'admin@',
    },
    FARMER: {
        email: import.meta.env.VITE_DEMO_FARMER_EMAIL || 'farmer@demo.com',
        password: import.meta.env.VITE_DEMO_FARMER_PASSWORD || 'farmer@',
    },
};

// ⚠️ Проверка: включён ли демо-режим (только для разработки!)
const ENABLE_DEMO_LOGIN = import.meta.env.VITE_ENABLE_DEMO_LOGIN === 'true';

// ============================================
// ПЕРЕКЛЮЧЕНИЕ РОЛЕЙ
// ============================================

window.switchRole = function (role) {
    const tabs = document.querySelectorAll('.role-tab');
    const buyerBenefits = document.getElementById('buyer-benefits');
    const farmerBenefits = document.getElementById('farmer-benefits');
    const buyerLoginForm = document.getElementById('buyer-login-form');
    const buyerRegisterForm = document.getElementById('buyer-register-form');
    const farmerLoginForm = document.getElementById('farmer-login-form');
    const farmerRegisterForm = document.getElementById('farmer-register-form');

    // Reset all tabs
    tabs.forEach((tab) => {
        tab.classList.remove('active', 'buyer', 'farmer');
    });

    // Hide all forms
    buyerLoginForm.classList.remove('active');
    buyerRegisterForm.classList.remove('active');
    farmerLoginForm.classList.remove('active');
    farmerRegisterForm.classList.remove('active');

    if (role === 'buyer') {
        tabs[0].classList.add('active', 'buyer');
        buyerBenefits.classList.add('active');
        farmerBenefits.classList.remove('active');
        buyerLoginForm.classList.add('active');
    } else {
        tabs[1].classList.add('active', 'farmer');
        buyerBenefits.classList.remove('active');
        farmerBenefits.classList.add('active');
        farmerLoginForm.classList.add('active');
    }
};

// Buyer form switching
window.showBuyerLogin = function () {
    document.getElementById('buyer-login-form').classList.add('active');
    document.getElementById('buyer-register-form').classList.remove('active');
};

window.showBuyerRegister = function () {
    document.getElementById('buyer-login-form').classList.remove('active');
    document.getElementById('buyer-register-form').classList.add('active');
};

// Farmer form switching
window.showFarmerLogin = function () {
    document.getElementById('farmer-login-form').classList.add('active');
    document.getElementById('farmer-register-form').classList.remove('active');
};

window.showFarmerRegister = function () {
    document.getElementById('farmer-login-form').classList.remove('active');
    document.getElementById('farmer-register-form').classList.add('active');
};

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

/**
 * Проверка демо-кредов
 * @param {string} email
 * @param {string} password
 * @returns {Object|null} Данные пользователя или null
 */
function checkDemoCredentials(email, password) {
    // ⚠️ Демо-логин только для разработки!
    console.log('🔍 checkDemoCredentials - ENABLE_DEMO_LOGIN:', ENABLE_DEMO_LOGIN);
    console.log('🔍 checkDemoCredentials - Email:', email, 'Password:', password);
    console.log('🔍 checkDemoCredentials - DEMO_CREDENTIALS:', DEMO_CREDENTIALS);
    
    if (!ENABLE_DEMO_LOGIN) {
        console.warn('⚠️ Demo login is disabled. This is expected in production.');
        return null;
    }

    const emailLower = email.toLowerCase().trim();
    const passwordLower = password.toLowerCase();
    
    console.log('🔍 checkDemoCredentials - emailLower:', emailLower, 'passwordLower:', passwordLower);

    // Проверка на admin
    if (
        emailLower === DEMO_CREDENTIALS.ADMIN.email.toLowerCase() &&
        passwordLower === DEMO_CREDENTIALS.ADMIN.password.toLowerCase()
    ) {
        console.log('✅ checkDemoCredentials - Admin match!');
        return {
            fullname: 'Иван Петров',
            email: DEMO_CREDENTIALS.ADMIN.email,
            phone: '+420 123 456 789',
            address: 'Прага, Vinohrady, ul. Příčná 15',
            role: 'buyer',
            isDemo: true,
        };
    }

    // Проверка на farmer demo
    if (
        emailLower === DEMO_CREDENTIALS.FARMER.email.toLowerCase() &&
        passwordLower === DEMO_CREDENTIALS.FARMER.password.toLowerCase()
    ) {
        console.log('✅ checkDemoCredentials - Farmer match!');
        return {
            fullname: 'Ян Новак',
            email: DEMO_CREDENTIALS.FARMER.email,
            phone: '+420 987 654 321',
            farmName: 'Ферма Новак',
            farmLocation: 'Южная Чехия, Ческе-Будеёвице',
            role: 'farmer',
            isDemo: true,
        };
    }
    
    console.log('❌ checkDemoCredentials - No match');

    return null;
}

/**
 * Успешный вход
 * @param {Object} user
 * @param {string} redirectUrl
 */
function handleSuccessfulLogin(user, redirectUrl) {
    // Используем те же ключи что и в api.js для консистентности
    const TOKEN_KEY = 'biomarket_token';
    const TOKEN_DATA_KEY = 'biomarket_token_data';

    // Создаём mock токен
    const mockToken = 'mock-token-' + Date.now();

    // Сохраняем токен и данные пользователя
    sessionStorage.setItem(TOKEN_KEY, mockToken);
    sessionStorage.setItem(TOKEN_DATA_KEY, JSON.stringify(user));
    sessionStorage.setItem('biomarket_user_role', user.role);

    // Логирование для отладки
    console.log('💾 handleSuccessfulLogin - Saved to sessionStorage:', {
        token: sessionStorage.getItem(TOKEN_KEY),
        user: sessionStorage.getItem(TOKEN_DATA_KEY),
        role: sessionStorage.getItem('biomarket_user_role'),
        url: window.location.href
    });
    
    // Проверка через 100ms (перед редиректом)
    setTimeout(() => {
        console.log('🔍 handleSuccessfulLogin - CHECK BEFORE REDIRECT:', {
            token: sessionStorage.getItem(TOKEN_KEY),
            user: sessionStorage.getItem(TOKEN_DATA_KEY),
            role: sessionStorage.getItem('biomarket_user_role'),
            url: window.location.href
        });
    }, 100);

    return redirectUrl;
}

// ============================================
// ОБРАБОТКА ВХОДА (BUYER)
// ============================================

window.handleLogin = async function (e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const btn = e.target.querySelector('button');
    const form = e.target;

    // ========================================
    // LOADING STATE
    // ========================================
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `
        <span style="display: inline-block; animation: spin 1s linear infinite;" aria-hidden="true">⏳</span>
        <span>Вход...</span>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;

    // Очистить предыдущие ошибки
    form.querySelectorAll('.field-error').forEach(el => el.remove());

    try {
        // ⚠️ Проверка демо-кредов (ТОЛЬКО ДЛЯ РАЗРАБОТКИ!)
        const demoUser = checkDemoCredentials(email, password);

        if (demoUser) {
            console.warn(
                '⚠️ DEMO LOGIN USED - Remove before production!',
                demoUser.email
            );
            
            console.log('Before handleSuccessfulLogin - sessionStorage:', {
                length: sessionStorage.length,
                keys: Object.keys(sessionStorage)
            });

            const redirectUrl = handleSuccessfulLogin(demoUser, 'index.html');
            
            console.log('After handleSuccessfulLogin - sessionStorage:', {
                length: sessionStorage.length,
                keys: Object.keys(sessionStorage),
                token: sessionStorage.getItem('biomarket_token'),
                user: sessionStorage.getItem('biomarket_token_data'),
                role: sessionStorage.getItem('biomarket_user_role')
            });

            btn.innerHTML = '<span>✓</span><span>Вход выполнен!</span>';

            setTimeout(() => {
                console.log('Before redirect - sessionStorage:', {
                    token: sessionStorage.getItem('biomarket_token'),
                    user: sessionStorage.getItem('biomarket_token_data'),
                    role: sessionStorage.getItem('biomarket_user_role')
                });
                window.location.href = redirectUrl;
            }, 1000);
            return;
        }

        // ========================================
        // REAL LOGIN (когда будет бэк)
        // ========================================
        // Здесь будет вызов:
        // const result = await authService.login({ email, password });
        // window.location.href = 'index.html';

        // Временно - просто пускаем с любыми данными
        const regularUser = {
            fullname: 'Участник',
            email: email,
            phone: '+420 000 000 000',
            address: 'Прага',
            role: 'buyer',
        };

        const redirectUrl = handleSuccessfulLogin(regularUser, 'index.html');

        btn.innerHTML = '<span>✓</span><span>Вход выполнен!</span>';

        setTimeout(() => {
            window.location.href = redirectUrl;
        }, 1000);
    } catch (error) {
        console.error('Login error:', error);
        
        // Восстановление кнопки
        btn.innerHTML = originalText;
        btn.disabled = false;
        
        // Разные сообщения для разных ошибок
        let errorMessage = 'Не удалось войти. ';
        
        if (error.code === 'INVALID_CREDENTIALS' || error.status === 401) {
            errorMessage = 'Неверный email или пароль';
            // Добавить ошибку к полям
            addFieldError(form, 'login-email', errorMessage);
            addFieldError(form, 'login-password', errorMessage);
        } else if (error.code === 'USER_NOT_FOUND' || error.status === 404) {
            errorMessage = 'Пользователь с таким email не найден';
            addFieldError(form, 'login-email', errorMessage);
        } else if (error.code === 'NETWORK_ERROR') {
            errorMessage += 'Проверьте подключение к интернету';
            showToastError(errorMessage);
        } else {
            errorMessage += 'Попробуйте ещё раз';
            showToastError(errorMessage);
        }
    }
};

/**
 * Добавить ошибку к полю ввода
 * @param {HTMLFormElement} form
 * @param {string} fieldId
 * @param {string} message
 */
function addFieldError(form, fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;

    field.style.borderColor = '#ef4444';
    field.style.backgroundColor = 'rgba(239, 68, 68, 0.05)';

    const errorEl = document.createElement('div');
    errorEl.className = 'field-error';
    errorEl.style.color = '#ef4444';
    errorEl.style.fontSize = '0.875rem';
    errorEl.style.marginTop = '0.25rem';
    errorEl.textContent = message;

    field.parentNode.appendChild(errorEl);
}

/**
 * Показать toast ошибку
 * @param {string} message
 */
function showToastError(message) {
    if (window.toastManager) {
        window.toastManager.error(message, { duration: 5000 });
    } else {
        alert('Ошибка: ' + message);
    }
}

// ============================================
// ОБРАБОТКА РЕГИСТРАЦИИ (BUYER)
// ============================================

window.handleRegister = async function (e) {
    e.preventDefault();

    // ✅ Правильные ID полей из HTML
    const formData = {
        fullname: document.getElementById('register-name')?.value,
        email: document.getElementById('register-email')?.value,
        phone: document.getElementById('register-phone')?.value,
        address: document.getElementById('register-farm')?.value, // Используем ферму как адрес
        password: document.getElementById('register-password')?.value || 'defaultpassword123', // Добавляем пароль
        role: 'buyer',
    };

    const btn = e.target.querySelector('button');
    const form = e.target;

    // ========================================
    // LOADING STATE
    // ========================================
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `
        <span style="display: inline-block; animation: spin 1s linear infinite;" aria-hidden="true">⏳</span>
        <span>Регистрация...</span>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;

    // Очистить предыдущие ошибки
    form.querySelectorAll('.field-error').forEach(el => el.remove());

    try {
        // ========================================
        // REAL REGISTRATION - API вызов
        // ========================================
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const apiMode = import.meta.env.VITE_API_MODE || 'mock';
        
        if (apiMode === 'real') {
            // Реальная регистрация через API
            const response = await fetch(`${apiUrl}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Registration failed');
            }
            
            const result = await response.json();
            
            // ✅ Сохраняем в sessionStorage (правильные ключи!)
            sessionStorage.setItem('biomarket_token', result.token);
            sessionStorage.setItem('biomarket_token_data', JSON.stringify(result.user));
            sessionStorage.setItem('biomarket_user_role', result.user.role);
            
            console.log('✅ Registration successful - saved to sessionStorage:', {
                token: sessionStorage.getItem('biomarket_token'),
                user: sessionStorage.getItem('biomarket_token_data'),
                role: sessionStorage.getItem('biomarket_user_role')
            });
            
            btn.innerHTML = '<span>✓</span><span>Регистрация успешна!</span>';
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
            return;
        }

        // ========================================
        // MOCK REGISTRATION (локально)
        // ========================================
        const mockToken = 'mock-token-' + Date.now();
        
        // ✅ Сохраняем в sessionStorage (правильные ключи!)
        sessionStorage.setItem('biomarket_token', mockToken);
        sessionStorage.setItem('biomarket_token_data', JSON.stringify(formData));
        sessionStorage.setItem('biomarket_user_role', 'buyer');
        
        console.log('✅ Mock registration - saved to sessionStorage');

        btn.innerHTML = '<span>✓</span><span>Регистрация успешна!</span>';

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    } catch (error) {
        console.error('Registration error:', error);

        // Восстановление кнопки
        btn.innerHTML = originalText;
        btn.disabled = false;

        // Разные сообщения для разных ошибок
        let errorMessage = 'Не удалось зарегистрироваться. ';
        
        if (error.code === 'USER_EXISTS' || error.status === 409) {
            errorMessage = 'Пользователь с таким email уже существует';
            addFieldError(form, 'email', errorMessage);
        } else if (error.code === 'INVALID_EMAIL') {
            errorMessage = 'Некорректный формат email';
            addFieldError(form, 'email', errorMessage);
        } else if (error.code === 'WEAK_PASSWORD') {
            errorMessage = 'Пароль должен содержать минимум 6 символов';
            addFieldError(form, 'password', errorMessage);
        } else if (error.code === 'NETWORK_ERROR') {
            errorMessage += 'Проверьте подключение к интернету';
            showToastError(errorMessage);
        } else {
            errorMessage += 'Попробуйте ещё раз';
            showToastError(errorMessage);
        }
    }
};

// ============================================
// ОБРАБОТКА ВХОДА (FARMER)
// ============================================

window.handleFarmerLogin = function (e) {
    e.preventDefault();
    const email = document.getElementById('farmer-login-email').value;
    const password = document.getElementById('farmer-login-password').value;
    const btn = e.target.querySelector('button');

    // ⚠️ Проверка демо-кредов (ТОЛЬКО ДЛЯ РАЗРАБОТКИ!)
    const demoUser = checkDemoCredentials(email, password);

    if (demoUser && demoUser.role === 'farmer') {
        console.warn(
            '⚠️ DEMO LOGIN USED - Remove before production!',
            demoUser.email
        );

        const redirectUrl = handleSuccessfulLogin(demoUser, 'farmer-dashboard.html');

        btn.innerHTML = '<span>✓</span><span>Вход выполнен!</span>';

        setTimeout(() => {
            window.location.href = redirectUrl;
        }, 1000);
        return;
    }

    // ========================================
    // REAL LOGIN (когда будет бэк)
    // ========================================
    // Здесь будет вызов:
    // const result = await authService.login({ email, password });
    // window.location.href = 'farmer-dashboard.html';

    // Временно - просто пускаем с любыми данными
    const regularUser = {
        fullname: 'Фермер',
        email: email,
        phone: '+420 000 000 000',
        farmName: 'Ферма',
        farmLocation: 'Чехия',
        role: 'farmer',
    };

    const redirectUrl = handleSuccessfulLogin(regularUser, 'farmer-dashboard.html');

    btn.innerHTML = '<span>✓</span><span>Вход выполнен!</span>';

    setTimeout(() => {
        window.location.href = redirectUrl;
    }, 1000);
};

// ============================================
// ОБРАБОТКА РЕГИСТРАЦИИ (FARMER)
// ============================================

window.handleFarmerRegister = function (e) {
    e.preventDefault();

    const formData = {
        fullname: document.getElementById('farmer-fullname').value,
        email: document.getElementById('farmer-email').value,
        phone: document.getElementById('farmer-phone').value,
        farmName: document.getElementById('farm-name').value,
        farmLocation: document.getElementById('farm-location').value,
        role: 'farmer',
    };

    // ========================================
    // REAL REGISTRATION (когда будет бэк)
    // ========================================
    // Здесь будет вызов:
    // const result = await authService.register(formData);
    // window.location.href = 'farmer-dashboard.html';

    // Временно - просто сохраняем
    localStorage.setItem('biomarket_user', JSON.stringify(formData));
    localStorage.setItem('biomarket_user_role', 'farmer');

    const btn = e.target.querySelector('button');
    btn.innerHTML =
        '<span>✓</span><span>Регистрация успешна! Перенаправляем...</span>';

    setTimeout(() => {
        window.location.href = 'farmer-dashboard.html';
    }, 1500);
};

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================

// Check URL for role parameter on page load
const urlParams = new URLSearchParams(window.location.search);
const role = urlParams.get('role');
if (role === 'farmer') {
    switchRole('farmer');
}

// ============================================
// ПРЕДУПРЕЖДЕНИЕ ДЛЯ ПРОДАКШЕНА
// ============================================

if (ENABLE_DEMO_LOGIN && import.meta.env.PROD) {
    console.error(
        '⚠️⚠️⚠️ WARNING: Demo login is enabled in production! ⚠️⚠️⚠️',
        'This is a critical security issue!',
        'Set VITE_ENABLE_DEMO_LOGIN=false in your environment variables.'
    );
}
