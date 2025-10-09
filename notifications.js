// Notification System
class NotificationManager {
    constructor() {
        this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
        this.notifications = JSON.parse(localStorage.getItem('notifications') || '{}');
        this.preferences = JSON.parse(localStorage.getItem('notificationPreferences') || '{}');
        this.currentTab = 'all';
        
        this.checkAuth();
        this.initializeEventListeners();
        this.loadNotifications();
        this.loadPreferences();
        this.requestNotificationPermission();
    }

    checkAuth() {
        if (!this.currentUser) {
            window.location.href = 'login.html';
            return;
        }
        document.getElementById('user-name').textContent = this.currentUser.name;
    }

    initializeEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.textContent.toLowerCase();
                this.showTab(tab);
            });
        });
    }

    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }

    getUserNotifications() {
        return this.notifications[this.currentUser.email] || [];
    }

    getUserPreferences() {
        return this.preferences[this.currentUser.email] || {
            transactions: {
                all: true,
                large: true,
                declined: true,
                international: true
            },
            security: {
                login: true,
                passwordChange: true,
                cardChanges: true,
                suspicious: true
            },
            system: {
                maintenance: true,
                features: true,
                marketing: false
            },
            delivery: {
                browser: true,
                email: true,
                sms: false
            }
        };
    }

    loadNotifications() {
        const notifications = this.getUserNotifications();
        const filteredNotifications = this.filterNotifications(notifications);
        
        const notificationsList = document.getElementById('notifications-list');
        const emptyState = document.getElementById('empty-notifications');
        
        if (filteredNotifications.length === 0) {
            notificationsList.classList.add('hidden');
            emptyState.classList.remove('hidden');
            return;
        }
        
        notificationsList.classList.remove('hidden');
        emptyState.classList.add('hidden');
        
        notificationsList.innerHTML = filteredNotifications.map(notification => 
            this.createNotificationHTML(notification)
        ).join('');
    }

    filterNotifications(notifications) {
        if (this.currentTab === 'all') {
            return notifications;
        }
        return notifications.filter(n => n.category === this.currentTab);
    }

    createNotificationHTML(notification) {
        const timeAgo = this.getTimeAgo(notification.timestamp);
        const readClass = notification.read ? 'read' : 'unread';
        const icon = this.getNotificationIcon(notification.type);
        
        return `
            <div class="notification-item ${readClass}" data-id="${notification.id}">
                <div class="notification-icon">${icon}</div>
                <div class="notification-content">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-time">${timeAgo}</div>
                </div>
                <div class="notification-actions">
                    ${!notification.read ? '<button onclick="markAsRead(\'' + notification.id + '\')" class="btn-link">Mark as read</button>' : ''}
                    <button onclick="deleteNotification('${notification.id}')" class="btn-link delete">×</button>
                </div>
            </div>
        `;
    }

    getNotificationIcon(type) {
        const icons = {
            transaction: '💳',
            security: '🔒',
            system: '⚙️',
            card: '💳',
            wallet: '💰',
            kyc: '📋',
            login: '🔐',
            maintenance: '🔧'
        };
        return icons[type] || '🔔';
    }

    getTimeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffInSeconds = Math.floor((now - time) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return time.toLocaleDateString();
    }

    showTab(tab) {
        this.currentTab = tab;
        
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.textContent.toLowerCase() === tab) {
                btn.classList.add('active');
            }
        });
        
        this.loadNotifications();
    }

    markAsRead(notificationId) {
        const userNotifications = this.getUserNotifications();
        const notification = userNotifications.find(n => n.id === notificationId);
        
        if (notification) {
            notification.read = true;
            this.notifications[this.currentUser.email] = userNotifications;
            localStorage.setItem('notifications', JSON.stringify(this.notifications));
            this.loadNotifications();
        }
    }

    markAllRead() {
        const userNotifications = this.getUserNotifications();
        userNotifications.forEach(n => n.read = true);
        
        this.notifications[this.currentUser.email] = userNotifications;
        localStorage.setItem('notifications', JSON.stringify(this.notifications));
        this.loadNotifications();
        
        this.showSuccess('All notifications marked as read');
    }

    deleteNotification(notificationId) {
        const userNotifications = this.getUserNotifications();
        const filteredNotifications = userNotifications.filter(n => n.id !== notificationId);
        
        this.notifications[this.currentUser.email] = filteredNotifications;
        localStorage.setItem('notifications', JSON.stringify(this.notifications));
        this.loadNotifications();
    }

    openPreferences() {
        document.getElementById('preferences-modal').classList.remove('hidden');
        this.loadPreferences();
    }

    closePreferences() {
        document.getElementById('preferences-modal').classList.add('hidden');
    }

    loadPreferences() {
        const prefs = this.getUserPreferences();
        
        // Transaction preferences
        document.getElementById('notify-all-transactions').checked = prefs.transactions.all;
        document.getElementById('notify-large-transactions').checked = prefs.transactions.large;
        document.getElementById('notify-declined-transactions').checked = prefs.transactions.declined;
        document.getElementById('notify-international').checked = prefs.transactions.international;
        
        // Security preferences
        document.getElementById('notify-login').checked = prefs.security.login;
        document.getElementById('notify-password-change').checked = prefs.security.passwordChange;
        document.getElementById('notify-card-changes').checked = prefs.security.cardChanges;
        document.getElementById('notify-suspicious').checked = prefs.security.suspicious;
        
        // System preferences
        document.getElementById('notify-maintenance').checked = prefs.system.maintenance;
        document.getElementById('notify-features').checked = prefs.system.features;
        document.getElementById('notify-marketing').checked = prefs.system.marketing;
        
        // Delivery preferences
        document.getElementById('delivery-browser').checked = prefs.delivery.browser;
        document.getElementById('delivery-email').checked = prefs.delivery.email;
        document.getElementById('delivery-sms').checked = prefs.delivery.sms;
    }

    savePreferences() {
        const preferences = {
            transactions: {
                all: document.getElementById('notify-all-transactions').checked,
                large: document.getElementById('notify-large-transactions').checked,
                declined: document.getElementById('notify-declined-transactions').checked,
                international: document.getElementById('notify-international').checked
            },
            security: {
                login: document.getElementById('notify-login').checked,
                passwordChange: document.getElementById('notify-password-change').checked,
                cardChanges: document.getElementById('notify-card-changes').checked,
                suspicious: document.getElementById('notify-suspicious').checked
            },
            system: {
                maintenance: document.getElementById('notify-maintenance').checked,
                features: document.getElementById('notify-features').checked,
                marketing: document.getElementById('notify-marketing').checked
            },
            delivery: {
                browser: document.getElementById('delivery-browser').checked,
                email: document.getElementById('delivery-email').checked,
                sms: document.getElementById('delivery-sms').checked
            }
        };
        
        this.preferences[this.currentUser.email] = preferences;
        localStorage.setItem('notificationPreferences', JSON.stringify(this.preferences));
        
        this.closePreferences();
        this.showSuccess('Notification preferences saved successfully!');
    }

    resetPreferences() {
        if (!confirm('Reset all notification preferences to default?')) {
            return;
        }
        
        delete this.preferences[this.currentUser.email];
        localStorage.setItem('notificationPreferences', JSON.stringify(this.preferences));
        
        this.loadPreferences();
        this.showSuccess('Preferences reset to default!');
    }

    // Create notification (called by other parts of the app)
    createNotification(type, category, title, message, data = {}) {
        const userPrefs = this.getUserPreferences();
        
        // Check if user wants this type of notification
        if (!this.shouldSendNotification(type, category, userPrefs)) {
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
        if (!this.notifications[this.currentUser.email]) {
            this.notifications[this.currentUser.email] = [];
        }
        
        this.notifications[this.currentUser.email].unshift(notification);
        
        // Keep only last 100 notifications
        if (this.notifications[this.currentUser.email].length > 100) {
            this.notifications[this.currentUser.email] = this.notifications[this.currentUser.email].slice(0, 100);
        }
        
        localStorage.setItem('notifications', JSON.stringify(this.notifications));
        
        // Show browser notification if enabled
        if (userPrefs.delivery.browser && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: message,
                icon: '/favicon.ico'
            });
        }
        
        // Refresh notifications if on notifications page
        if (window.location.pathname.includes('notifications.html')) {
            this.loadNotifications();
        }
    }

    shouldSendNotification(type, category, prefs) {
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

    showSuccess(message) {
        const toast = document.createElement('div');
        toast.className = 'toast success';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #059669;
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            z-index: 10000;
        `;
        
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}

// Global functions
function showTab(tab) {
    notificationManager.showTab(tab);
}

function markAsRead(id) {
    notificationManager.markAsRead(id);
}

function markAllRead() {
    notificationManager.markAllRead();
}

function deleteNotification(id) {
    notificationManager.deleteNotification(id);
}

function openPreferences() {
    notificationManager.openPreferences();
}

function closePreferences() {
    notificationManager.closePreferences();
}

function savePreferences() {
    notificationManager.savePreferences();
}

function resetPreferences() {
    notificationManager.resetPreferences();
}

function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    window.location.href = 'index.html';
}

function toggleMobileMenu() {
    const navMenu = document.getElementById('nav-menu');
    const toggle = document.querySelector('.mobile-menu-toggle');
    navMenu.classList.toggle('mobile-active');
    toggle.classList.toggle('active');
}

function toggleUserMenu() {
    const dropdown = document.getElementById('user-dropdown-menu');
    dropdown.classList.toggle('hidden');
}

// Initialize
const notificationManager = new NotificationManager();

// Demo notifications for testing
if (notificationManager.getUserNotifications().length === 0) {
    notificationManager.createNotification('transaction', 'transactions', 'Card Transaction', 'Purchase of $25.99 at Amazon', {amount: 25.99, merchant: 'Amazon'});
    notificationManager.createNotification('security', 'security', 'New Login', 'New login from Chrome on Windows', {device: 'Chrome', location: 'New York'});
    notificationManager.createNotification('card', 'transactions', 'Card Created', 'New virtual card "Marketing Expenses" created', {cardName: 'Marketing Expenses'});
    notificationManager.createNotification('system', 'system', 'Welcome to Freeway Cards', 'Your account has been successfully created', {});
}