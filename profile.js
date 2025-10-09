// Profile Management System
class ProfileManager {
    constructor() {
        this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
        this.users = JSON.parse(localStorage.getItem('users') || '{}');
        this.userPreferences = JSON.parse(localStorage.getItem('userPreferences') || '{}');
        
        this.checkAuth();
        this.loadProfile();
        this.initializeEventListeners();
    }

    checkAuth() {
        if (!this.currentUser) {
            window.location.href = 'login.html';
            return;
        }
        document.getElementById('user-name').textContent = this.currentUser.name;
    }

    initializeEventListeners() {
        document.getElementById('profile-form').addEventListener('submit', (e) => this.saveProfile(e));
        document.getElementById('password-form').addEventListener('submit', (e) => this.changePassword(e));
    }

    loadProfile() {
        const user = this.users[this.currentUser.email] || this.currentUser;
        const preferences = this.userPreferences[this.currentUser.email] || {};
        const kycData = JSON.parse(localStorage.getItem('kycData') || '{}');
        const userKYC = kycData[this.currentUser.email];
        
        // Load personal information
        document.getElementById('full-name').value = user.name || '';
        document.getElementById('email').value = user.email || '';
        document.getElementById('phone').value = user.phone || '';
        document.getElementById('account-type').value = user.accountType || 'individual';
        
        // Load account status
        document.getElementById('email-status').textContent = user.verified ? 'Verified' : 'Pending';
        document.getElementById('email-status').className = `status-value ${user.verified ? 'verified' : 'pending'}`;
        
        // Load KYC status
        let kycStatus = 'Not Started';
        let kycClass = 'pending';
        
        if (userKYC) {
            if (userKYC.status === 'pending') {
                kycStatus = 'Under Review';
                kycClass = 'pending';
            } else if (userKYC.status === 'approved') {
                kycStatus = 'Verified';
                kycClass = 'verified';
            } else if (userKYC.status === 'rejected') {
                kycStatus = 'Rejected';
                kycClass = 'pending';
            }
        }
        
        document.getElementById('kyc-status').textContent = kycStatus;
        document.getElementById('kyc-status').className = `status-value ${kycClass}`;
        
        const memberSince = new Date(user.createdAt).toLocaleDateString();
        document.getElementById('member-since').textContent = memberSince;
        
        // Load preferences
        document.getElementById('email-notifications').checked = preferences.emailNotifications !== false;
        document.getElementById('sms-notifications').checked = preferences.smsNotifications || false;
        document.getElementById('marketing-emails').checked = preferences.marketingEmails || false;
        document.getElementById('currency').value = preferences.currency || 'USD';
        
        // Load 2FA status
        const has2FA = preferences.twoFactorEnabled || false;
        document.getElementById('2fa-status').textContent = has2FA ? 'Enabled' : 'Not enabled';
        document.getElementById('2fa-toggle').textContent = has2FA ? 'Disable' : 'Enable';
    }

    saveProfile(e) {
        e.preventDefault();
        
        const updatedUser = {
            ...this.users[this.currentUser.email],
            name: document.getElementById('full-name').value,
            phone: document.getElementById('phone').value
        };
        
        // Update in storage
        this.users[this.currentUser.email] = updatedUser;
        localStorage.setItem('users', JSON.stringify(this.users));
        
        // Update current user
        this.currentUser.name = updatedUser.name;
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        
        this.showSuccess('Profile updated successfully!');
    }

    openPasswordModal() {
        document.getElementById('password-modal').classList.remove('hidden');
    }

    closePasswordModal() {
        document.getElementById('password-modal').classList.add('hidden');
        document.getElementById('password-form').reset();
    }

    changePassword(e) {
        e.preventDefault();
        
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        // Validate current password
        const user = this.users[this.currentUser.email];
        if (user.password !== currentPassword) {
            alert('Current password is incorrect');
            return;
        }
        
        // Validate new password
        if (newPassword !== confirmPassword) {
            alert('New passwords do not match');
            return;
        }
        
        if (newPassword.length < 8) {
            alert('Password must be at least 8 characters long');
            return;
        }
        
        // Update password
        user.password = newPassword;
        this.users[this.currentUser.email] = user;
        localStorage.setItem('users', JSON.stringify(this.users));
        
        this.closePasswordModal();
        this.showSuccess('Password changed successfully!');
    }

    toggle2FA() {
        const preferences = this.userPreferences[this.currentUser.email] || {};
        const current2FA = preferences.twoFactorEnabled || false;
        
        if (current2FA) {
            // Disable 2FA
            preferences.twoFactorEnabled = false;
            document.getElementById('2fa-status').textContent = 'Not enabled';
            document.getElementById('2fa-toggle').textContent = 'Enable';
            this.showSuccess('Two-factor authentication disabled');
        } else {
            // Enable 2FA (simplified)
            preferences.twoFactorEnabled = true;
            document.getElementById('2fa-status').textContent = 'Enabled';
            document.getElementById('2fa-toggle').textContent = 'Disable';
            this.showSuccess('Two-factor authentication enabled');
        }
        
        this.userPreferences[this.currentUser.email] = preferences;
        localStorage.setItem('userPreferences', JSON.stringify(this.userPreferences));
    }

    viewLoginHistory() {
        // Simulate login history
        const history = [
            { date: new Date().toISOString(), ip: '192.168.1.1', device: 'Chrome on Windows' },
            { date: new Date(Date.now() - 86400000).toISOString(), ip: '192.168.1.1', device: 'Safari on iPhone' },
            { date: new Date(Date.now() - 172800000).toISOString(), ip: '192.168.1.1', device: 'Chrome on Windows' }
        ];
        
        const historyText = history.map(entry => 
            `${new Date(entry.date).toLocaleString()} - ${entry.device} (${entry.ip})`
        ).join('\n');
        
        alert(`Recent Login History:\n\n${historyText}`);
    }

    startKYC() {
        alert('KYC verification process will be implemented in the next phase. This will include document upload and identity verification.');
    }

    savePreferences() {
        const preferences = {
            emailNotifications: document.getElementById('email-notifications').checked,
            smsNotifications: document.getElementById('sms-notifications').checked,
            marketingEmails: document.getElementById('marketing-emails').checked,
            currency: document.getElementById('currency').value,
            twoFactorEnabled: this.userPreferences[this.currentUser.email]?.twoFactorEnabled || false
        };
        
        this.userPreferences[this.currentUser.email] = preferences;
        localStorage.setItem('userPreferences', JSON.stringify(this.userPreferences));
        
        this.showSuccess('Preferences saved successfully!');
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
function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    window.location.href = 'index.html';
}

// Mobile menu toggle
function toggleMobileMenu() {
    const navMenu = document.getElementById('nav-menu');
    const toggle = document.querySelector('.mobile-menu-toggle');
    navMenu.classList.toggle('mobile-active');
    toggle.classList.toggle('active');
}

// User menu toggle
function toggleUserMenu() {
    const dropdown = document.getElementById('user-dropdown-menu');
    dropdown.classList.toggle('hidden');
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const userMenu = document.querySelector('.user-dropdown');
    const dropdown = document.getElementById('user-dropdown-menu');
    const navMenu = document.getElementById('nav-menu');
    const toggle = document.querySelector('.mobile-menu-toggle');
    
    if (userMenu && !userMenu.contains(event.target)) {
        dropdown.classList.add('hidden');
    }
    
    if (!navMenu.contains(event.target) && !toggle.contains(event.target)) {
        navMenu.classList.remove('mobile-active');
        toggle.classList.remove('active');
    }
});

function openPasswordModal() {
    profileManager.openPasswordModal();
}

function closePasswordModal() {
    profileManager.closePasswordModal();
}

function toggle2FA() {
    profileManager.toggle2FA();
}

function viewLoginHistory() {
    profileManager.viewLoginHistory();
}

function startKYC() {
    profileManager.startKYC();
}

function savePreferences() {
    profileManager.savePreferences();
}

// Initialize
const profileManager = new ProfileManager();