// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.ready();

// Получение данных пользователя
const user = tg.initDataUnsafe.user;
if (user) {
    document.getElementById('userName').textContent = user.first_name || 'Пользователь';
    document.getElementById('userId').textContent = `ID: ${user.id}`;
    document.getElementById('userStatus').textContent = 'Авторизован';
    document.getElementById('userStatus').classList.remove('status-inactive');
    document.getElementById('userStatus').classList.add('status-active');
    if (user.photo_url) {
        document.getElementById('userAvatar').src = user.photo_url;
        document.getElementById('userAvatar').style.display = 'block';
        document.getElementById('avatarPlaceholder').style.display = 'none';
    }
    // Отправка user_id боту для проверки подписки
    fetchSubscriptionData(user.id);
}

// Загрузка данных подписки
async function fetchSubscriptionData(userId) {
    try {
        // Запрос к вашему серверу или напрямую к Marzban API
        const response = await fetch(`https://pyrlvpn.mooo.com/api/subscription?user_id=${userId}`);
        const data = await response.json();
        if (data.success && data.subscription) {
            document.getElementById('subscriptionInfo').style.display = 'block';
            document.getElementById('subscriptionUrl').value = data.subscription.url;
            document.getElementById('subscriptionExpiry').textContent = data.subscription.expiry;
            document.getElementById('daysLeft').textContent = `${data.subscription.days_left} дней`;
            document.getElementById('mainActionBtn').style.display = 'none';
            document.getElementById('vpnConfigBtn').style.display = 'block';
        }
    } catch (error) {
        console.error('Ошибка загрузки данных подписки:', error);
        showNotification('Ошибка загрузки данных. Попробуйте позже.', 'error');
    }
}

// Копирование реферальной ссылки
function copyReferralLink() {
    const referralLink = `https://t.me/PYRLVPN_bot?start=ref_${user.id}`;
    navigator.clipboard.writeText(referralLink).then(() => {
        showNotification('Ссылка скопирована!', 'success');
    });
    document.getElementById('referralLink').value = referralLink;
}

// Копирование ссылки подписки
function copySubscriptionUrl() {
    const subscriptionUrl = document.getElementById('subscriptionUrl').value;
    navigator.clipboard.writeText(subscriptionUrl).then(() => {
        showNotification('Ссылка на подписку скопирована!', 'success');
    });
}

// Поделиться реферальной ссылкой
function shareReferralLink() {
    const referralLink = `https://t.me/PYRLVPN_bot?start=ref_${user.id}`;
    tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=Присоединяйтесь к PYRL VPN!`);
}

// Выбор тарифа
function selectPlan(plan) {
    tg.MainButton.setText(`Оплатить тариф ${plan}`);
    tg.MainButton.show();
    tg.MainButton.onClick(() => {
        // Отправка команды боту для создания платежа
        tg.sendData(JSON.stringify({ action: 'subscribe', plan: plan }));
    });
}

// Переключение секций
function scrollToSection(sectionId) {
    document.querySelectorAll('section').forEach(section => section.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    document.querySelector(`.nav-link[data-section="${sectionId}"]`).classList.add('active');
    tg.MainButton.hide();
}

// Переключение темы
document.getElementById('themeToggle').addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    document.documentElement.setAttribute('data-theme', currentTheme === 'dark' ? 'light' : 'dark');
});

// Уведомления
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">${message}</div>
        <button class="notification-close">✕</button>
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
    notification.querySelector('.notification-close').addEventListener('click', () => notification.remove());
}

// Скрытие загрузочного экрана
setTimeout(() => {
    document.getElementById('loadingScreen').style.opacity = '0';
    setTimeout(() => document.getElementById('loadingScreen').remove(), 500);
}, 2000);

// Обработка сообщений от бота
tg.onEvent('web_app_data', (data) => {
    const message = JSON.parse(data);
    if (message.action === 'subscription_updated') {
        fetchSubscriptionData(user.id);
    }
});
