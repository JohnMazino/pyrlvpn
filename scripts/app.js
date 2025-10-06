document.addEventListener('DOMContentLoaded', () => {
    // Initialize Telegram Web App
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();

    // Hide loading screen after 2 seconds
    setTimeout(() => {
        document.getElementById('loadingScreen').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('loadingScreen').style.display = 'none';
        }, 500);
    }, 2000);

    // Navigation
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('data-section');
            scrollToSection(sectionId);
        });
    });

    function scrollToSection(sectionId) {
        sections.forEach(section => {
            section.classList.remove('active');
            if (section.id === sectionId) {
                section.classList.add('active');
            }
        });
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-section') === sectionId) {
                link.classList.add('active');
            }
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        document.documentElement.setAttribute('data-theme', currentTheme === 'dark' ? 'light' : 'dark');
        document.querySelector('.theme-icon').textContent = currentTheme === 'dark' ? '☀️' : '🌙';
    });

    // Mobile menu toggle
    document.getElementById('menuToggle').addEventListener('click', () => {
        document.querySelector('.nav-links').classList.toggle('active');
        document.querySelector('.nav-actions').classList.toggle('active');
    });

    // Pricing switcher
    document.querySelectorAll('.switch-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.switch-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelector('.pricing-switcher').classList.toggle('yearly', btn.dataset.period === 'yearly');
        });
    });

    // Telegram auth
    function initTelegramAuth() {
        if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
            handleTelegramAuth(tg.initDataUnsafe.user);
        } else {
            showNotification('error', 'Не удалось получить данные Telegram. Попробуйте снова.');
        }
    }

    function handleTelegramAuth(user) {
        fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                document.getElementById('userName').textContent = data.user.first_name || data.user.username || 'Пользователь';
                document.getElementById('userId').textContent = `ID: ${data.user.id}`;
                document.getElementById('userStatus').textContent = 'Авторизован';
                document.getElementById('userStatus').classList.remove('status-inactive');
                document.getElementById('userStatus').classList.add('status-active');
                document.getElementById('mainActionBtn').style.display = 'none';
                document.getElementById('vpnConfigBtn').style.display = 'block';
                document.getElementById('authBtn').style.display = 'none';
                loadProfileData(data.user.id);
                loadReferralData(data.user.id);
                if (window.location.hash === '#profile') {
                    scrollToSection('profile');
                }
            } else {
                showNotification('error', 'Ошибка авторизации. Попробуйте снова.');
            }
        })
        .catch(error => {
            showNotification('error', 'Ошибка сети. Проверьте подключение.');
            console.error('Auth error:', error);
        });
    }

    // Initialize auth on load if user data is available
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        handleTelegramAuth(tg.initDataUnsafe.user);
    }

    // Select plan
    window.selectPlan = function(plan) {
        const period = document.querySelector('.switch-btn.active').dataset.period;
        const userId = document.getElementById('userId').textContent.replace('ID: ', '');
        
        if (!userId || userId === '---') {
            showNotification('error', 'Пожалуйста, авторизуйтесь через Telegram.');
            tg.showPopup({
                title: 'Авторизация',
                message: 'Для выбора тарифа необходимо авторизоваться.',
                buttons: [{ type: 'ok', text: 'Авторизоваться', id: 'auth' }]
            }, (buttonId) => {
                if (buttonId === 'auth') initTelegramAuth();
            });
            return;
        }
        
        fetch('/api/create_payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, plan, period })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                window.location.href = data.payment_url;
            } else {
                showNotification('error', 'Не удалось создать платеж. Попробуйте снова.');
            }
        })
        .catch(error => {
            showNotification('error', 'Ошибка сети. Проверьте подключение.');
            console.error('Payment error:', error);
        });
    };

    // Referral data
    function loadReferralData(userId) {
        fetch(`/api/referral/${userId}`)
            .then(response => response.json())
            .then(data => {
                document.getElementById('referralLink').value = data.referral_link;
                document.getElementById('referralCount').textContent = data.referrals_count;
                document.getElementById('earnedBonuses').textContent = `${data.referrals_count * 7} дней`;
                
                const leaderboard = document.getElementById('leaderboard');
                leaderboard.innerHTML = data.leaderboard.map((item, index) => `
                    <div class="leaderboard-item">
                        <div class="leaderboard-position">
                            <span class="position-medal">${index < 3 ? ['🥇', '🥈', '🥉'][index] : ''}</span>
                            <span class="position-number">${index + 1}</span>
                            <span class="position-user">Пользователь ${item.user_id}</span>
                        </div>
                        <span class="leaderboard-count">${item.referrals} рефералов</span>
                    </div>
                `).join('');
                
                const userPosition = data.leaderboard.findIndex(item => item.user_id === userId) + 1;
                document.getElementById('leaderPosition').textContent = userPosition > 0 ? userPosition : '-';
            })
            .catch(error => {
                showNotification('error', 'Не удалось загрузить реферальные данные.');
                console.error('Referral error:', error);
            });
    }

    window.copyReferralLink = function() {
        const link = document.getElementById('referralLink');
        link.select();
        document.execCommand('copy');
        showNotification('success', 'Ссылка скопирована!');
        tg.showPopup({
            title: 'Ссылка скопирована',
            message: 'Реферальная ссылка успешно скопирована в буфер обмена.',
            buttons: [{ type: 'ok' }]
        });
    };

    window.shareReferralLink = function() {
        const link = document.getElementById('referralLink').value;
        tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(link)}`);
    };

    window.openTelegramBot = function() {
        tg.openTelegramLink('https://t.me/PYRLVPN_bot');
    };

    // Profile data
    function loadProfileData(userId) {
        fetch(`/api/profile/${userId}`)
            .then(response => response.json())
            .then(data => {
                document.getElementById('daysLeft').textContent = `${data.days_left} дней`;
                document.getElementById('trafficUsed').textContent = `${data.traffic_used} GB`;
                document.getElementById('activeDevices').textContent = data.active_devices;
                document.getElementById('subscriptionUrl').value = data.vpn_url;
                document.getElementById('subscriptionExpiry').textContent = data.days_left > 0 ? new Date(Date.now() + data.days_left * 24 * 60 * 60 * 1000).toLocaleString() : '--.--.---- --:--:--';
                document.getElementById('subscriptionInfo').style.display = data.vpn_url ? 'block' : 'none';
            })
            .catch(error => {
                showNotification('error', 'Не удалось загрузить данные профиля.');
                console.error('Profile error:', error);
            });
    }

    window.copySubscriptionUrl = function() {
        const url = document.getElementById('subscriptionUrl');
        url.select();
        document.execCommand('copy');
        showNotification('success', 'Ссылка VPN скопирована!');
        tg.showPopup({
            title: 'Ссылка скопирована',
            message: 'Ссылка для подключения VPN успешно скопирована.',
            buttons: [{ type: 'ok' }]
        });
    };

    window.getVpnConfig = function() {
        const userId = document.getElementById('userId').textContent.replace('ID: ', '');
        loadProfileData(userId);
    };

    // Notification
    function showNotification(type, message) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">${message}</div>
            <button class="notification-close">✕</button>
        `;
        document.body.appendChild(notification);
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
        setTimeout(() => notification.remove(), 5000);
    }
});
