// Notification Utility Functions
class NotificationUtils {
    static createNotification(type, category, title, message, data = {}) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) return;
        
        const notifications = JSON.parse(localStorage.getItem('notifications') || '{}');
        const preferences = JSON.parse(localStorage.getItem('notificationPreferences') || '{}');
        
        const userPrefs = preferences[currentUser.email] || {
            transactions: { all: true, large: true, declined: true, international: true },
            security: { login: true, passwordChange: true, cardChanges: true, suspicious: true },
            system: { maintenance: true, features: true, marketing: false },
            delivery: { browser: true, email: true, sms: false }
        };
        
        // Check if user wants this type of notification
        if (!NotificationUtils.shouldSendNotification(type, category, userPrefs)) {
            return;
        }
        
        const notification = {
            id: Date.now().toString(),
            type: type,
            category: category,
            title: title,
            message: message,
            timestamp: new Date().toISOString(),
            read: false,
            data: data
        };
        
        // Add to user's notifications
        if (!notifications[currentUser.email]) {
            notifications[currentUser.email] = [];
        }
        
        notifications[currentUser.email].unshift(notification);
        
        // Keep only last 100 notifications
        if (notifications[currentUser.email].length > 100) {
            notifications[currentUser.email] = notifications[currentUser.email].slice(0, 100);
        }
        
        localStorage.setItem('notifications', JSON.stringify(notifications));
        
        // Show browser notification if enabled
        if (userPrefs.delivery.browser && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: message,
                icon: '/favicon.ico'
            });
        }
        
        // Update notification badge
        NotificationUtils.updateNotificationBadge();
    }
    
    static shouldSendNotification(type, category, prefs) {
        switch (category) {
            case 'transactions':
                return prefs.transactions.all || 
                       (type === 'large' && prefs.transactions.large) ||
                       (type === 'declined' && prefs.transactions.declined) ||
                       (type === 'international' && prefs.transactions.international);
            case 'security':
                return prefs.security[type] || false;
            case 'system':
                return prefs.system[type] || false;
            default:
                return true;
        }
    }
    
    static updateNotificationBadge() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) return;
        
        const notifications = JSON.parse(localStorage.getItem('notifications') || '{}');
        const userNotifications = notifications[currentUser.email] || [];
        const unreadCount = userNotifications.filter(n => !n.read).length;
        
        // Update badge in navigation if it exists
        const existingBadge = document.querySelector('.notification-badge');
        if (existingBadge) {
            if (unreadCount > 0) {
                existingBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
                existingBadge.style.display = 'block';
            } else {
                existingBadge.style.display = 'none';
            }
        }
    }
    
    // Specific notification creators
    static notifyTransaction(amount, merchant, cardName, type = 'purchase') {
        const isLarge = amount > 100;
        const title = type === 'purchase' ? 'Card Transaction' : 'Transaction Alert';
        const message = `${type === 'purchase' ? 'Purchase' : 'Transaction'} of $${amount.toFixed(2)} at ${merchant}`;
        
        NotificationUtils.createNotification(
            isLarge ? 'large' : 'transaction',
            'transactions',
            title,
            message,
            { amount, merchant, cardName, type }
        );
    }
    
    static notifyCardStatusChange(cardName, status) {
        NotificationUtils.createNotification(
            'cardChanges',
            'security',
            'Card Status Changed',
            `Card "${cardName}" has been ${status}`,
            { cardName, status }
        );
    }
    
    static notifyLogin(device, location) {
        NotificationUtils.createNotification(
            'login',
            'security',
            'New Login',
            `New login from ${device} in ${location}`,
            { device, location }
        );
    }
    
    static notifyPasswordChange() {
        NotificationUtils.createNotification(
            'passwordChange',
            'security',
            'Password Changed',
            'Your password has been successfully changed',
            {}
        );
    }
    
    static notifyWalletFunding(amount, method) {
        NotificationUtils.createNotification(
            'wallet',
            'transactions',
            'Wallet Funded',
            `$${amount.toFixed(2)} added to wallet via ${method}`,
            { amount, method }
        );
    }
    
    static notifyKYCUpdate(status) {
        const messages = {
            pending: 'Your KYC verification is under review',
            approved: 'Your KYC verification has been approved',
            rejected: 'Your KYC verification requires additional information'
        };
        
        NotificationUtils.createNotification(
            'kyc',
            'system',
            'KYC Status Update',
            messages[status] || 'KYC status updated',
            { status }
        );
    }
}

// Make it globally available
window.NotificationUtils = NotificationUtils;