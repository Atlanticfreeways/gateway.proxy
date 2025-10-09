/**
 * Gateways Proxy - Main Application
 * Uses modular architecture with core utilities
 */

'use strict';

class GatewaysProxy {
    constructor() {
        this.init();
    }

    init() {
        this.initializeTheme();
        this.initializeEventListeners();
    }

    initializeTheme() {
        const savedTheme = GatewaysCore.StorageManager.get(GatewaysCore.CONFIG.STORAGE_KEYS.THEME);
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
        }
    }

    initializeEventListeners() {
        const themeBtn = document.getElementById('themeBtn');
        if (themeBtn) {
            themeBtn.addEventListener('click', this.toggleTheme);
        }
    }

    toggleTheme() {
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        GatewaysCore.StorageManager.set(GatewaysCore.CONFIG.STORAGE_KEYS.THEME, isDark ? 'dark' : 'light');
    }

    openApiDocs() {
        window.open('https://docs.gateways-proxy.com', '_blank');
    }

    logout() {
        GatewaysCore.StorageManager.remove(GatewaysCore.CONFIG.STORAGE_KEYS.USER);
        GatewaysCore.StorageManager.remove(GatewaysCore.CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        window.location.href = 'index.html';
    }
}

// Global Functions
function generateEndpoint() {
    if (window.dashboardManager) {
        return window.dashboardManager.generateEndpoint();
    }
}

function openApiDocs() {
    if (window.gatewaysProxy) {
        window.gatewaysProxy.openApiDocs();
    }
}

function logout() {
    if (window.gatewaysProxy) {
        window.gatewaysProxy.logout();
    }
}

function toggleTheme() {
    if (window.gatewaysProxy) {
        window.gatewaysProxy.toggleTheme();
    }
}

// Pricing Functions
function showPricing(type) {
    const pricingGrids = ['residential-pricing', 'datacenter-pricing', 'mobile-pricing'];
    
    // Hide all pricing grids
    pricingGrids.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.style.display = 'none';
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
    
    // Show selected pricing and activate button
    const targetGrid = document.getElementById(`${type}-pricing`);
    if (targetGrid) {
        targetGrid.style.display = 'grid';
    }
    
    const targetButton = document.querySelector(`[onclick="showPricing('${type}')"]`);
    if (targetButton) {
        targetButton.classList.add('active');
    }
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    window.gatewaysProxy = new GatewaysProxy();
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .dark-theme {
        --background: #0f172a;
        --surface: #1e293b;
        --text-primary: #f1f5f9;
        --text-secondary: #94a3b8;
        --border-color: #334155;
    }
`;
document.head.appendChild(style);