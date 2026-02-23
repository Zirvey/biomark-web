// Register page - handles role switching and authentication

// Switch role between buyer (member) and farmer
window.switchRole = function(role) {
    const tabs = document.querySelectorAll('.role-tab');
    const buyerBenefits = document.getElementById('buyer-benefits');
    const farmerBenefits = document.getElementById('farmer-benefits');
    const buyerLoginForm = document.getElementById('buyer-login-form');
    const buyerRegisterForm = document.getElementById('buyer-register-form');
    const farmerLoginForm = document.getElementById('farmer-login-form');
    const farmerRegisterForm = document.getElementById('farmer-register-form');

    // Reset all tabs
    tabs.forEach(tab => {
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
window.showBuyerLogin = function() {
    document.getElementById('buyer-login-form').classList.add('active');
    document.getElementById('buyer-register-form').classList.remove('active');
};

window.showBuyerRegister = function() {
    document.getElementById('buyer-login-form').classList.remove('active');
    document.getElementById('buyer-register-form').classList.add('active');
};

// Farmer form switching
window.showFarmerLogin = function() {
    document.getElementById('farmer-login-form').classList.add('active');
    document.getElementById('farmer-register-form').classList.remove('active');
};

window.showFarmerRegister = function() {
    document.getElementById('farmer-login-form').classList.remove('active');
    document.getElementById('farmer-register-form').classList.add('active');
};

// Handle buyer login
window.handleLogin = function(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    // Demo login: admin@admin.com / admin@ (case-insensitive)
    if (email.toLowerCase().trim() === 'admin@admin.com' && password.toLowerCase() === 'admin@') {
        const demoUser = {
            fullname: 'Иван Петров',
            email: 'admin@admin.com',
            phone: '+420 123 456 789',
            address: 'Прага, Vinohrady, ul. Příčná 15',
            role: 'buyer'
        };

        localStorage.setItem('biomarket_user', JSON.stringify(demoUser));
        localStorage.setItem('biomarket_user_role', 'buyer');

        const btn = e.target.querySelector('button');
        btn.innerHTML = '<span>✓</span><span>Вход выполнен!</span>';

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
        return;
    }

    // Regular login
    const demoUser2 = {
        fullname: 'Участник',
        email: email,
        phone: '+420 000 000 000',
        address: 'Прага',
        role: 'buyer'
    };

    localStorage.setItem('biomarket_user', JSON.stringify(demoUser2));
    localStorage.setItem('biomarket_user_role', 'buyer');

    const btn = e.target.querySelector('button');
    btn.innerHTML = '<span>✓</span><span>Вход выполнен!</span>';

    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
};

// Handle buyer registration
window.handleRegister = function(e) {
    e.preventDefault();

    const formData = {
        fullname: document.getElementById('fullname').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value,
        role: 'buyer'
    };

    localStorage.setItem('biomarket_user', JSON.stringify(formData));
    localStorage.setItem('biomarket_user_role', 'buyer');

    const btn = e.target.querySelector('button');
    btn.innerHTML = '<span>✓</span><span>Регистрация успешна!</span>';

    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1500);
};

// Handle farmer login
window.handleFarmerLogin = function(e) {
    e.preventDefault();
    const email = document.getElementById('farmer-login-email').value;
    const password = document.getElementById('farmer-login-password').value;

    // Demo login: admin@admin.com / admin@ (case-insensitive)
    if (email.toLowerCase().trim() === 'admin@admin.com' && password.toLowerCase() === 'admin@') {
        const demoUser = {
            fullname: 'Ян Новак',
            email: 'admin@admin.com',
            phone: '+420 987 654 321',
            farmName: 'Ферма Новак',
            farmLocation: 'Южная Чехия, Ческе-Будеёвице',
            role: 'farmer'
        };

        localStorage.setItem('biomarket_user', JSON.stringify(demoUser));
        localStorage.setItem('biomarket_user_role', 'farmer');

        const btn = e.target.querySelector('button');
        btn.innerHTML = '<span>✓</span><span>Вход выполнен!</span>';

        setTimeout(() => {
            window.location.href = 'farmer-dashboard.html';
        }, 1000);
        return;
    }

    // Regular login
    const demoUser2 = {
        fullname: 'Фермер',
        email: email,
        phone: '+420 000 000 000',
        farmName: 'Ферма',
        farmLocation: 'Чехия',
        role: 'farmer'
    };

    localStorage.setItem('biomarket_user', JSON.stringify(demoUser2));
    localStorage.setItem('biomarket_user_role', 'farmer');

    const btn = e.target.querySelector('button');
    btn.innerHTML = '<span>✓</span><span>Вход выполнен!</span>';

    setTimeout(() => {
        window.location.href = 'farmer-dashboard.html';
    }, 1000);
};

// Handle farmer registration
window.handleFarmerRegister = function(e) {
    e.preventDefault();

    const formData = {
        fullname: document.getElementById('farmer-fullname').value,
        email: document.getElementById('farmer-email').value,
        phone: document.getElementById('farmer-phone').value,
        farmName: document.getElementById('farm-name').value,
        farmLocation: document.getElementById('farm-location').value,
        role: 'farmer'
    };

    localStorage.setItem('biomarket_user', JSON.stringify(formData));
    localStorage.setItem('biomarket_user_role', 'farmer');

    const btn = e.target.querySelector('button');
    btn.innerHTML = '<span>✓</span><span>Регистрация успешна! Перенаправляем...</span>';

    setTimeout(() => {
        window.location.href = 'farmer-dashboard.html';
    }, 1500);
};

// Check URL for role parameter on page load
const urlParams = new URLSearchParams(window.location.search);
const role = urlParams.get('role');
if (role === 'farmer') {
    switchRole('farmer');
}
