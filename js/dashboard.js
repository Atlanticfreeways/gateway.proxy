/**
 * Dashboard Management Module
 */

'use strict';

class DashboardManager {
    constructor() {
        this.currentUser = null;
        this.proxyEndpoints = [];
        this.init();
    }

    init() {
        this.loadUserSession();
        this.loadDashboardData();
        this.initializeEventListeners();
    }

    loadUserSession() {
        this.currentUser = GatewaysCore.StorageManager.get(GatewaysCore.CONFIG.STORAGE_KEYS.USER);
        if (this.currentUser) {
            this.updateUserInterface();
        }
    }

    updateUserInterface() {
        const userElements = document.querySelectorAll('#user-name, #welcome-name');
        userElements.forEach(el => {
            if (el) el.textContent = this.currentUser.name;
        });
    }

    loadDashboardData() {
        if (document.getElementById('active-proxies')) {
            this.loadUserStats();
            this.loadProxyOverview();
            this.createUsageChart();
        }
    }

    loadUserStats() {
        const proxyData = this.getProxyData();
        const activeProxies = proxyData.endpoints ? proxyData.endpoints.filter(p => p.status === 'active').length : 0;
        
        const stats = {
            'active-proxies': activeProxies || 12,
            'bandwidth-used': `${(proxyData.usage?.bandwidth || 24.7).toFixed(1)} GB`,
            'success-rate': '99.8%',
            'avg-response': '187ms',
            'current-plan': 'Growth',
            'requests-today': '8,247'
        };

        Object.entries(stats).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }

    loadProxyOverview() {
        const proxyOverview = document.getElementById('proxy-overview');
        if (!proxyOverview) return;

        const proxyData = this.getProxyData();
        const endpoints = proxyData.endpoints || this.generateSampleEndpoints();

        if (endpoints.length === 0) {
            proxyOverview.innerHTML = this.getEmptyStateHTML();
            return;
        }

        proxyOverview.innerHTML = endpoints.slice(0, 3).map(proxy => this.createProxyCard(proxy)).join('');
    }

    getEmptyStateHTML() {
        return `
            <div class="empty-state" style="text-align: center; padding: 2rem; color: #64748b;">
                <div style="font-size: 2rem; margin-bottom: 1rem;">🌐</div>
                <h3>No proxy endpoints yet</h3>
                <p>Generate your first endpoint to get started</p>
                <button onclick="dashboardManager.generateEndpoint()" class="btn btn-primary" style="margin-top: 1rem;">
                    Generate Endpoint
                </button>
            </div>
        `;
    }

    createProxyCard(proxy) {
        return `
            <div class="proxy-endpoint-card" style="
                background: white;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 1rem;
                margin-bottom: 1rem;
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span style="font-size: 1.2rem;">${this.getProxyIcon(proxy.type)}</span>
                        <strong>${proxy.type.charAt(0).toUpperCase() + proxy.type.slice(1)}</strong>
                    </div>
                    <span class="status-badge ${proxy.status}" style="
                        padding: 0.25rem 0.5rem;
                        border-radius: 12px;
                        font-size: 0.7rem;
                        font-weight: 600;
                        background: ${proxy.status === 'active' ? '#dcfce7' : '#fee2e2'};
                        color: ${proxy.status === 'active' ? '#166534' : '#991b1b'};
                    ">${proxy.status}</span>
                </div>
                <div style="font-family: monospace; font-size: 0.8rem; color: #64748b; margin-bottom: 0.5rem;">
                    ${proxy.host}:${proxy.port}
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: #64748b;">
                    <span>📍 ${proxy.country}</span>
                    <span>📊 ${proxy.usage.requests || 0} requests</span>
                </div>
            </div>
        `;
    }

    generateSampleEndpoints() {
        const sampleEndpoints = [
            new GatewaysCore.ProxyEndpoint({
                type: 'residential',
                country: 'US',
                usage: { requests: 1247, bandwidth: 2.3 }
            }),
            new GatewaysCore.ProxyEndpoint({
                type: 'datacenter',
                country: 'UK',
                usage: { requests: 856, bandwidth: 1.8 }
            }),
            new GatewaysCore.ProxyEndpoint({
                type: 'mobile',
                country: 'DE',
                usage: { requests: 432, bandwidth: 0.9 }
            })
        ];
        
        this.saveProxyData({ endpoints: sampleEndpoints.map(e => e.toJSON()) });
        return sampleEndpoints.map(e => e.toJSON());
    }

    getProxyIcon(type) {
        const icons = { residential: '🏠', datacenter: '🏢', mobile: '📱' };
        return icons[type] || '🌐';
    }

    createUsageChart() {
        const canvas = document.getElementById('usageChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const data = [45, 35, 20];
        const colors = ['#2563eb', '#059669', '#dc2626'];
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 20;
        
        let currentAngle = 0;
        
        data.forEach((value, index) => {
            const sliceAngle = (value / 100) * 2 * Math.PI;
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fillStyle = colors[index];
            ctx.fill();
            
            currentAngle += sliceAngle;
        });
    }

    generateEndpoint() {
        const endpoint = new GatewaysCore.ProxyEndpoint({
            type: GatewaysCore.CONFIG.PROXY_TYPES[Math.floor(Math.random() * GatewaysCore.CONFIG.PROXY_TYPES.length)],
            country: GatewaysCore.CONFIG.COUNTRIES[Math.floor(Math.random() * GatewaysCore.CONFIG.COUNTRIES.length)]
        });

        this.proxyEndpoints.push(endpoint);
        this.saveProxyData();
        GatewaysCore.NotificationManager.show('Proxy endpoint generated successfully!', 'success');
        this.loadProxyOverview();
        
        return endpoint;
    }

    getProxyData() {
        const currentUser = this.currentUser || GatewaysCore.StorageManager.get(GatewaysCore.CONFIG.STORAGE_KEYS.USER) || {};
        const allProxyData = GatewaysCore.StorageManager.get(GatewaysCore.CONFIG.STORAGE_KEYS.PROXY_DATA) || {};
        return allProxyData[currentUser.email] || { endpoints: [], usage: { bandwidth: 0, requests: 0 } };
    }

    saveProxyData(data = null) {
        const currentUser = this.currentUser || GatewaysCore.StorageManager.get(GatewaysCore.CONFIG.STORAGE_KEYS.USER) || {};
        const allProxyData = GatewaysCore.StorageManager.get(GatewaysCore.CONFIG.STORAGE_KEYS.PROXY_DATA) || {};
        
        if (data) {
            allProxyData[currentUser.email] = data;
        } else {
            allProxyData[currentUser.email] = {
                endpoints: this.proxyEndpoints.map(e => e.toJSON ? e.toJSON() : e),
                usage: { bandwidth: 24.7, requests: 8247 }
            };
        }
        
        GatewaysCore.StorageManager.set(GatewaysCore.CONFIG.STORAGE_KEYS.PROXY_DATA, allProxyData);
    }

    initializeEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.textContent?.includes('Generate') || e.target.onclick?.toString().includes('generateEndpoint')) {
                this.generateEndpoint();
            }
        });
    }
}

// Initialize dashboard manager
let dashboardManager;
document.addEventListener('DOMContentLoaded', () => {
    dashboardManager = new DashboardManager();
});