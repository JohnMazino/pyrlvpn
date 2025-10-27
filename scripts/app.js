// Ждём полной загрузки страницы и Telegram SDK
document.addEventListener('DOMContentLoaded', () => {
    // Проверяем, доступен ли Telegram WebApp
    if (window.Telegram && window.Telegram.WebApp) {
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
            // Запрос данных подписки
            fetchSubscriptionData(user.id);
        } else {
            console.warn('Пользователь не авторизован в Telegram');
            showNotification('Пожалуйста, откройте приложение в Telegram', 'error');
        }
    } else {
        console.warn('Telegram WebApp SDK не загружен. Открыто вне Telegram?');
        showNotification('Это приложение работает только в Telegram', 'error');
    }
});

// Функция загрузки данных подписки
async function fetchSubscriptionData(userId) {
    try {
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

// Функция уведомлений
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

// Другие функции (копирование ссылок, выбор тарифа и т.д.)...
function copyReferralLink() {
    const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if (user) {
        const referralLink = `https://t.me/PYRLVPN_bot?start=ref_${user.id}`;
        navigator.clipboard.writeText(referralLink).then(() => {
            showNotification('Ссылка скопирована!', 'success');
        });
        document.getElementById('referralLink').value = referralLink;
    }
}

function selectPlan(plan) {
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.MainButton.setText(`Оплатить тариф ${plan}`);
        tg.MainButton.show();
        tg.MainButton.onClick(() => {
            tg.sendData(JSON.stringify({ action: 'subscribe', plan: plan }));
        });
    } else {
        showNotification('Откройте приложение в Telegram для оплаты', 'error');
    }
}
