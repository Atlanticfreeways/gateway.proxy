/**
 * Gateways Proxy - Core Module
 * @version 1.0.0
 */

'use strict';

const CONFIG = {
    STORAGE_KEYS: {
        USER: 'currentUser',
        AUTH_TOKEN: 'authToken',
        PROXY_DATA: 'proxyData',
        THEME: 'theme'
    },
    PROXY_TYPES: ['residential', 'datacenter', 'mobile'],
    COUNTRIES: ['US', 'UK', 'DE', 'CA', 'AU', 'JP'],
    PORTS: [8080, 8081, 8082, 8083]
};

const Utils = {
    generateId: (length = 8) => Math.random().toString(36).substr(2, length),
    
    formatBytes: (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    },
    
    sanitizeHtml: (str) => {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
};

class StorageManager {
    static get(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Storage error:', error);
            return null;
        }
    }

    static set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Storage error:', error);
            return false;
        }
    }
}

class NotificationManager {
    static show(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.textContent = Utils.sanitizeHtml(message);
        
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '1rem 1.5rem',
            borderRadius: '8px',
            color: 'white',
            zIndex: '9999',
            background: type === 'success' ? '#059669' : type === 'error' ? '#dc2626' : '#2563eb',
            animation: 'slideIn 0.3s ease'
        });

        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }
}

class ProxyEndpoint {
    constructor(data = {}) {
        this.id = data.id || Utils.generateId();
        this.type = data.type || CONFIG.PROXY_TYPES[0];
        this.country = data.country || CONFIG.COUNTRIES[0];
        this.host = data.host || this.generateHost();
        this.port = data.port || CONFIG.PORTS[Math.floor(Math.random() * CONFIG.PORTS.length)];
        this.username = data.username || `user_${Utils.generateId()}`;
        this.password = data.password || Utils.generateId(12);
        this.status = data.status || 'active';
        this.createdAt = data.createdAt || new Date().toISOString();
        this.usage = data.usage || { bandwidth: 0, requests: 0 };
    }

    generateHost() {
        return `proxy-${this.type.substr(0, 3)}-${this.country.toLowerCase()}-${Utils.generateId(2)}.gateways-proxy.com`;
    }

    toJSON() {
        return {
            id: this.id,
            type: this.type,
            country: this.country,
            host: this.host,
            port: this.port,
            username: this.username,
            password: this.password,
            status: this.status,
            createdAt: this.createdAt,
            usage: this.usage
        };
    }
}

window.GatewaysCore = {
    CONFIG,
    Utils,
    StorageManager,
    NotificationManager,
    ProxyEndpoint
};