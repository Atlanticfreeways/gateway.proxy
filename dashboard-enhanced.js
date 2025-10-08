// Enhanced Dashboard JavaScript
let bandwidthChart, requestChart;

// Initialize dashboard
function initDashboard() {
    if (!isLoggedIn()) {
        window.location.href = 'login.html?redirect=dashboard-enhanced.html';
        return;
    }
    
    updateUserStats();
    initCharts();
    updateApiKeys();
    startRealTimeMonitoring();
}

// Update user statistics
function updateUserStats() {
    const stats = getUserStats();
    
    document.getElementById('activeProxies').textContent = stats.activeProxies;
    document.getElementById('bandwidthUsed').textContent = `${stats.bandwidthUsed} GB`;
    document.getElementById('totalRequests').textContent = formatNumber(stats.totalRequests);
    document.getElementById('successRate').textContent = `${stats.successRate}%`;
}

// Get user statistics (mock data)
function getUserStats() {
    return {
        activeProxies: 25,
        bandwidthUsed: 2.4,
        totalRequests: 1247892,
        successRate: 99.9
    };
}

// Initialize charts
function initCharts() {
    // Bandwidth Chart
    const bandwidthCtx = document.getElementById('bandwidthChart').getContext('2d');
    bandwidthChart = new Chart(bandwidthCtx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Bandwidth (GB)',
                data: [0.3, 0.5, 0.4, 0.6, 0.2, 0.1, 0.3],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });

    // Request Chart
    const requestCtx = document.getElementById('requestChart').getContext('2d');
    requestChart = new Chart(requestCtx, {
        type: 'bar',
        data: {
            labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
            datasets: [{
                label: 'Requests (K)',
                data: [12, 8, 25, 45, 38, 22],
                backgroundColor: '#10b981'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

// API Key Management
function updateApiKeys() {
    const keys = getApiKeys();
    document.getElementById('prodKey').textContent = keys.production;
    document.getElementById('testKey').textContent = keys.test;
}

function getApiKeys() {
    let keys = JSON.parse(localStorage.getItem('apiKeys')) || {};
    if (!keys.production) {
        keys.production = 'gw_prod_' + generateRandomKey();
        keys.test = 'gw_test_' + generateRandomKey();
        localStorage.setItem('apiKeys', JSON.stringify(keys));
    }
    return keys;
}

function generateRandomKey() {
    return Array.from({length: 32}, () => Math.random().toString(36)[2]).join('');
}

function copyApiKey(type) {
    const keys = getApiKeys();
    const key = type === 'prod' ? keys.production : keys.test;
    
    navigator.clipboard.writeText(key).then(() => {
        showNotification(`${type} API key copied to clipboard`, 'success');
    });
}

function regenerateApiKey(type) {
    if (confirm(`Are you sure you want to regenerate the ${type} API key? This will invalidate the current key.`)) {
        const keys = getApiKeys();
        const newKey = `gw_${type}_` + generateRandomKey();
        
        if (type === 'prod') {
            keys.production = newKey;
        } else {
            keys.test = newKey;
        }
        
        localStorage.setItem('apiKeys', JSON.stringify(keys));
        updateApiKeys();
        showNotification(`${type} API key regenerated successfully`, 'success');
    }
}

function createApiKey() {
    const keyName = prompt('Enter a name for the new API key:');
    if (keyName) {
        const newKey = 'gw_custom_' + generateRandomKey();
        showNotification(`New API key "${keyName}" created: ${newKey}`, 'success');
    }
}

// Real-time monitoring
function startRealTimeMonitoring() {
    setInterval(updateMonitoringStatus, 30000); // Update every 30 seconds
}

function updateMonitoringStatus() {
    // Simulate status updates
    const indicators = document.querySelectorAll('.status-indicator');
    indicators.forEach(indicator => {
        const random = Math.random();
        if (random > 0.95) {
            indicator.className = 'status-indicator warning';
        } else if (random > 0.99) {
            indicator.className = 'status-indicator error';
        } else {
            indicator.className = 'status-indicator online';
        }
    });
}

// Utility functions
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function downloadUsageReport() {
    showNotification('Generating usage report...', 'info');
    
    setTimeout(() => {
        const report = generateUsageReport();
        downloadFile('usage-report.json', JSON.stringify(report, null, 2));
        showNotification('Usage report downloaded successfully', 'success');
    }, 2000);
}

function generateUsageReport() {
    return {
        reportDate: new Date().toISOString(),
        user: currentUser.email,
        stats: getUserStats(),
        apiKeys: Object.keys(getApiKeys()).length,
        period: 'Last 30 days'
    };
}

function downloadFile(filename, content) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

function testConnection() {
    showNotification('Testing proxy connection...', 'info');
    
    setTimeout(() => {
        const success = Math.random() > 0.1; // 90% success rate
        if (success) {
            showNotification('Connection test successful! Latency: 47ms', 'success');
        } else {
            showNotification('Connection test failed. Please check your configuration.', 'error');
        }
    }, 3000);
}

// Initialize on page load
if (window.location.pathname.includes('dashboard-enhanced.html')) {
    document.addEventListener('DOMContentLoaded', initDashboard);
}