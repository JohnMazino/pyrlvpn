// Telegram Web App initialization
let tg = window.Telegram.WebApp;
let user = null;

class VPNMiniApp {
    constructor() {
        this.init();
    }

    async init() {
        // Инициализация Telegram Web App
        tg.expand();
        tg.enableClosingConfirmation();
        
        // Установка цветовой схемы Telegram
        this.setTelegramTheme();
        
        // Загрузка пользовательских данных
        await this.loadUserData();
        
        // Инициализация интерфейса
        this.initNavigation();
        this.initEventListeners();
        
        // Скрытие экрана загрузки
        this.hideLoadingScreen();
    }

    setTelegramTheme() {
        // Используем тему Telegram
        document.documentElement.style.setProperty('--bg-primary', tg.themeParams.bg_color || '#0f0f23');
        document.documentElement.style.setProperty('--text-primary', tg.themeParams.text_color || '#ffffff');
        document.documentElement.style.setProperty('--button-color', tg.themeParams.button_color || '#6366f1');
        document.documentElement.style.setProperty('--button-text-color', tg.themeParams.button_text_color || '#ffffff');
    }

    async loadUserData() {
        try {
            // Получаем данные пользователя из Telegram
            user = tg.initDataUnsafe?.user;
            
            if (user) {
                this.updateUserProfile(user);
                await this.loadSubscriptionData(user.id);
            } else {
                this.showNotification('Для доступа к функциям требуется авторизация', 'error');
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    updateUserProfile(userData) {
        document.getElementById('userName').textContent = 
            userData.first_name + (userData.last_name ? ' ' + userData.last_name : '');
        document.getElementById('userId').textContent = `ID: ${userData.id}`;
        document.getElementById('userStatus').textContent = 'Авторизован';
        document.getElementById('userStatus').className = 'status-active';

        // Аватар пользователя
        if (userData.photo_url) {
            document.getElementById('userAvatar').src = userData.photo_url;
            document.getElementById('userAvatar').style.display = 'block';
            document.getElementById('avatarPlaceholder').style.display = 'none';
        }
    }

    async loadSubscriptionData(userId) {
        try {
            // Здесь будет запрос к вашему боту для получения данных подписки
            const response = await this.makeRequestToBot('get_subscription', { user_id: userId });
            
            if (response.success) {
                this.updateSubscriptionUI(response.data);
            }
        } catch (error) {
            console.error('Error loading subscription data:', error);
        }
    }

    updateSubscriptionUI(data) {
        if (data.is_active) {
            document.getElementById('subscriptionInfo').style.display = 'block';
            document.getElementById('subscriptionUrl').value = data.subscription_url;
            document.getElementById('subscriptionExpiry').textContent = data.expiry_date;
            document.getElementById('daysLeft').textContent = data.days_left + ' дней';
            document.getElementById('trafficUsed').textContent = data.traffic_used + ' GB';
            document.getElementById('activeDevices').textContent = data.active_devices;
            
            document.getElementById('mainActionBtn').style.display = 'none';
            document.getElementById('vpnConfigBtn').style.display = 'block';
        }
    }

    initNavigation() {
        // Навигация по секциям
        const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
        const sections = document.querySelectorAll('section');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetSection = link.getAttribute('data-section');
                
                // Обновление активных ссылок
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                // Показ целевой секции
                sections.forEach(section => {
                    section.classList.remove('active');
                    if (section.id === targetSection) {
                        section.classList.add('active');
                    }
                });
                
                // Закрытие мобильного меню
                this.closeMobileMenu();
            });
        });
    }

    initEventListeners() {
        // Переключение мобильного меню
        document.getElementById('menuToggle').addEventListener('click', () => {
            this.toggleMobileMenu();
        });

        // Переключение периодов тарифов
        document.querySelectorAll('.switch-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.switch-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const period = btn.getAttribute('data-period');
                document.querySelectorAll('.pricing-cards').forEach(cards => {
                    cards.className = `pricing-cards plan-switcher ${period}`;
                });
            });
        });

        // Закрытие мобильного меню при клике на ссылку
        document.querySelectorAll('.mobile-nav-link').forEach(link => {
            link.addEventListener('click', () => {
                this.closeMobileMenu();
            });
        });
    }

    toggleMobileMenu() {
        document.getElementById('mobileMenu').classList.toggle('active');
    }

    closeMobileMenu() {
        document.getElementById('mobileMenu').classList.remove('active');
    }

    hideLoadingScreen() {
        setTimeout(() => {
            document.getElementById('loadingScreen').style.opacity = '0';
            setTimeout(() => {
                document.getElementById('loadingScreen').style.display = 'none';
            }, 500);
        }, 1000);
    }

    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        const notificationText = document.getElementById('notificationText');
        
        notificationText.textContent = message;
        notification.className = `notification ${type}`;
        notification.style.display = 'flex';
        
        setTimeout(() => {
            this.hideNotification();
        }, 5000);
    }

    hideNotification() {
        document.getElementById('notification').style.display = 'none';
    }

    async makeRequestToBot(method, data) {
        // Здесь будет реализация запросов к вашему боту
        // Используйте tg.sendData() или fetch к вашему API
        try {
            const response = await fetch('/api/' + method, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...data,
                    initData: tg.initData
                })
            });
            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }
}

// Глобальные функции для использования в HTML
function scrollToSection(sectionId) {
    document.getElementById(sectionId).scrollIntoView({ behavior: 'smooth' });
}

function selectPlan(planType) {
    const app = new VPNMiniApp();
    if (!user) {
        app.showNotification('Пожалуйста, авторизуйтесь для выбора тарифа', 'error');
        return;
    }
    
    app.showNotification(`Выбран тариф: ${planType}`, 'success');
    // Здесь будет логика обработки выбора тарифа
}

function copyReferralLink() {
    const linkInput = document.getElementById('referralLink');
    linkInput.select();
    document.execCommand('copy');
    
    const app = new VPNMiniApp();
    app.showNotification('Ссылка скопирована в буфер обмена', 'success');
}

function shareReferralLink() {
    if (tg.isVersionAtLeast('6.1')) {
        tg.shareUrl(
            'Присоединяйтесь к PYRL VPN!',
            document.getElementById('referralLink').value
        );
    } else {
        copyReferralLink();
        new VPNMiniApp().showNotification('Ссылка скопирована. Поделитесь ею вручную.', 'info');
    }
}

function copySubscriptionUrl() {
    const urlInput = document.getElementById('subscriptionUrl');
    urlInput.select();
    document.execCommand('copy');
    
    new VPNMiniApp().showNotification('Ссылка подписки скопирована', 'success');
}

function initTelegramAuth() {
    // В Mini App пользователь уже авторизован через Telegram
    new VPNMiniApp().showNotification('Вы уже авторизованы через Telegram', 'info');
}

function getVpnConfig() {
    const app = new VPNMiniApp();
    app.showNotification('Конфигурация VPN загружается...', 'info');
    
    // Здесь будет логика получения конфигурации VPN
    setTimeout(() => {
        app.showNotification('Конфигурация VPN готова к использованию', 'success');
    }, 2000);
}

// Инициализация приложения при загрузке
document.addEventListener('DOMContentLoaded', () => {
    new VPNMiniApp();
});

// Обработка данных от Telegram
tg.ready();
