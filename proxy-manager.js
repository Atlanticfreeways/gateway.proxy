// Proxy Management System
let proxyPool = [];
let activeConnections = [];
let rotationSettings = {
    interval: 300,
    type: 'time',
    stickySession: false
};

// Initialize proxy manager
function initProxyManager() {
    if (!isLoggedIn()) {
        window.location.href = 'login.html?redirect=proxy-manager.html';
        return;
    }
    
    loadProxyPool();
    loadRotationSettings();
    startConnectionMonitoring();
    updatePoolStats();
}

// Generate proxy endpoint
function generateEndpoint() {
    const proxyType = document.getElementById('proxyType').value;
    const location = document.getElementById('location').value;
    
    const endpoint = {
        id: Date.now(),
        type: proxyType,
        location: location,
        host: generateProxyHost(location),
        port: generateProxyPort(proxyType),
        username: generateUsername(),
        password: generatePassword(),
        created: new Date().toISOString(),
        status: 'active'
    };
    
    // Add to user's endpoints
    const userEndpoints = JSON.parse(localStorage.getItem('userEndpoints')) || [];
    userEndpoints.unshift(endpoint);
    localStorage.setItem('userEndpoints', JSON.stringify(userEndpoints));
    
    displayGeneratedEndpoints();
    showNotification('Proxy endpoint generated successfully!', 'success');
}

// Generate proxy host based on location
function generateProxyHost(location) {
    const hosts = {
        us: 'us-proxy.gateways.com',
        uk: 'uk-proxy.gateways.com',
        de: 'de-proxy.gateways.com',
        jp: 'jp-proxy.gateways.com',
        ca: 'ca-proxy.gateways.com'
    };
    return hosts[location] || 'proxy.gateways.com';
}

// Generate proxy port based on type
function generateProxyPort(type) {
    const ports = {
        http: 8080,
        socks5: 1080,
        residential: 9000
    };
    return ports[type] + Math.floor(Math.random() * 100);
}

// Generate random username/password
function generateUsername() {
    return 'gw_' + Math.random().toString(36).substr(2, 8);
}

function generatePassword() {
    return Math.random().toString(36).substr(2, 12);
}

// Display generated endpoints
function displayGeneratedEndpoints() {
    const userEndpoints = JSON.parse(localStorage.getItem('userEndpoints')) || [];
    const container = document.getElementById('generatedEndpoints');
    
    container.innerHTML = userEndpoints.slice(0, 5).map(endpoint => `
        <div class="endpoint-item">
            <div class="endpoint-info">
                <div class="endpoint-url">
                    <strong>${endpoint.type.toUpperCase()}</strong>
                    <code>${endpoint.host}:${endpoint.port}</code>
                </div>
                <div class="endpoint-auth">
                    <span>User: ${endpoint.username}</span>
                    <span>Pass: ${endpoint.password}</span>
                </div>
                <div class="endpoint-meta">
                    <span>Location: ${endpoint.location.toUpperCase()}</span>
                    <span>Created: ${new Date(endpoint.created).toLocaleDateString()}</span>
                </div>
            </div>
            <div class="endpoint-actions">
                <button onclick="copyEndpoint('${endpoint.id}')" class="btn btn-secondary">Copy</button>
                <button onclick="testEndpoint('${endpoint.id}')" class="btn btn-secondary">Test</button>
                <button onclick="deleteEndpoint('${endpoint.id}')" class="btn btn-danger">Delete</button>
            </div>
        </div>
    `).join('');
}

// Copy endpoint to clipboard
function copyEndpoint(endpointId) {
    const userEndpoints = JSON.parse(localStorage.getItem('userEndpoints')) || [];
    const endpoint = userEndpoints.find(ep => ep.id == endpointId);
    
    if (endpoint) {
        const endpointString = `${endpoint.host}:${endpoint.port}:${endpoint.username}:${endpoint.password}`;
        navigator.clipboard.writeText(endpointString).then(() => {
            showNotification('Endpoint copied to clipboard', 'success');
        });
    }
}

// Test endpoint connection
function testEndpoint(endpointId) {
    showNotification('Testing endpoint connection...', 'info');
    
    // Mock endpoint test
    setTimeout(() => {
        const success = Math.random() > 0.1; // 90% success rate
        if (success) {
            showNotification('Endpoint test successful! Response time: 45ms', 'success');
        } else {
            showNotification('Endpoint test failed. Connection timeout.', 'error');
        }
    }, 2000);
}

// Delete endpoint
function deleteEndpoint(endpointId) {
    if (confirm('Are you sure you want to delete this endpoint?')) {
        let userEndpoints = JSON.parse(localStorage.getItem('userEndpoints')) || [];
        userEndpoints = userEndpoints.filter(ep => ep.id != endpointId);
        localStorage.setItem('userEndpoints', JSON.stringify(userEndpoints));
        displayGeneratedEndpoints();
        showNotification('Endpoint deleted successfully', 'success');
    }
}

// Save rotation settings
function saveRotationSettings() {
    rotationSettings = {
        interval: parseInt(document.getElementById('rotationInterval').value),
        type: document.getElementById('rotationType').value,
        stickySession: document.getElementById('stickySession').value === 'enabled'
    };
    
    localStorage.setItem('rotationSettings', JSON.stringify(rotationSettings));
    showNotification('Rotation settings saved successfully', 'success');
}

// Load rotation settings
function loadRotationSettings() {
    const saved = JSON.parse(localStorage.getItem('rotationSettings'));
    if (saved) {
        rotationSettings = saved;
        document.getElementById('rotationInterval').value = saved.interval;
        document.getElementById('rotationType').value = saved.type;
        document.getElementById('stickySession').value = saved.stickySession ? 'enabled' : 'disabled';
    }
}

// Load proxy pool
function loadProxyPool() {
    // Generate mock proxy pool
    proxyPool = Array.from({length: 50}, (_, i) => ({
        id: i + 1,
        ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        port: 8080 + i,
        location: ['US', 'UK', 'DE', 'JP', 'CA'][Math.floor(Math.random() * 5)],
        status: Math.random() > 0.1 ? 'active' : 'blocked',
        responseTime: Math.floor(Math.random() * 200) + 20,
        successRate: Math.floor(Math.random() * 20) + 80,
        lastUsed: new Date(Date.now() - Math.random() * 86400000).toISOString()
    }));
    
    displayIPPool();
}

// Display IP pool
function displayIPPool() {
    const container = document.getElementById('ipPoolList');
    
    container.innerHTML = proxyPool.slice(0, 10).map(ip => `
        <div class="ip-item ${ip.status}">
            <div class="ip-info">
                <strong>${ip.ip}:${ip.port}</strong>
                <span class="location">${ip.location}</span>
            </div>
            <div class="ip-stats">
                <span>Response: ${ip.responseTime}ms</span>
                <span>Success: ${ip.successRate}%</span>
            </div>
            <div class="ip-status">
                <span class="status-badge ${ip.status}">${ip.status}</span>
            </div>
        </div>
    `).join('');
}

// Update pool statistics
function updatePoolStats() {
    const totalIPs = proxyPool.length;
    const activeIPs = proxyPool.filter(ip => ip.status === 'active').length;
    const blockedIPs = proxyPool.filter(ip => ip.status === 'blocked').length;
    const avgSuccessRate = Math.round(proxyPool.reduce((sum, ip) => sum + ip.successRate, 0) / totalIPs);
    
    document.getElementById('totalIPs').textContent = totalIPs;
    document.getElementById('activeIPs').textContent = activeIPs;
    document.getElementById('blockedIPs').textContent = blockedIPs;
    document.getElementById('poolSuccessRate').textContent = avgSuccessRate + '%';
}

// Refresh proxy pool
function refreshPool() {
    showNotification('Refreshing proxy pool...', 'info');
    
    setTimeout(() => {
        loadProxyPool();
        updatePoolStats();
        showNotification('Proxy pool refreshed successfully', 'success');
    }, 2000);
}

// Test all IPs
function testAllIPs() {
    showNotification('Testing all IPs in pool...', 'info');
    
    setTimeout(() => {
        // Mock test results
        proxyPool.forEach(ip => {
            ip.responseTime = Math.floor(Math.random() * 200) + 20;
            ip.successRate = Math.floor(Math.random() * 20) + 80;
            if (Math.random() < 0.05) ip.status = 'blocked';
        });
        
        displayIPPool();
        updatePoolStats();
        showNotification('IP pool testing completed', 'success');
    }, 5000);
}

// Remove failed IPs
function removeFailedIPs() {
    const beforeCount = proxyPool.length;
    proxyPool = proxyPool.filter(ip => ip.status !== 'blocked');
    const removedCount = beforeCount - proxyPool.length;
    
    displayIPPool();
    updatePoolStats();
    showNotification(`Removed ${removedCount} failed IPs from pool`, 'success');
}

// Start connection monitoring
function startConnectionMonitoring() {
    setInterval(updateConnectionStats, 5000);
    setInterval(addConnectionLog, 3000);
}

// Update connection statistics
function updateConnectionStats() {
    const stats = {
        activeConnections: Math.floor(Math.random() * 50) + 10,
        requestsPerMin: Math.floor(Math.random() * 1000) + 100,
        avgResponseTime: Math.floor(Math.random() * 100) + 30,
        errorRate: (Math.random() * 5).toFixed(1)
    };
    
    document.getElementById('activeConnections').textContent = stats.activeConnections;
    document.getElementById('requestsPerMin').textContent = stats.requestsPerMin;
    document.getElementById('avgResponseTime').textContent = stats.avgResponseTime + 'ms';
    document.getElementById('errorRate').textContent = stats.errorRate + '%';
}

// Add connection log entry
function addConnectionLog() {
    const logContainer = document.getElementById('connectionLog');
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    
    const timestamp = new Date().toLocaleTimeString();
    const ip = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    const status = Math.random() > 0.1 ? 'success' : 'error';
    const responseTime = Math.floor(Math.random() * 200) + 20;
    
    logEntry.innerHTML = `
        <span class="log-time">${timestamp}</span>
        <span class="log-ip">${ip}</span>
        <span class="log-status ${status}">${status}</span>
        <span class="log-response">${responseTime}ms</span>
    `;
    
    logContainer.insertBefore(logEntry, logContainer.firstChild);
    
    // Keep only last 20 entries
    while (logContainer.children.length > 20) {
        logContainer.removeChild(logContainer.lastChild);
    }
}

// Save proxy configuration
function saveProxyConfig() {
    const config = {
        username: document.getElementById('proxyUsername').value,
        password: document.getElementById('proxyPassword').value,
        maxConnections: parseInt(document.getElementById('maxConnections').value),
        requestTimeout: parseInt(document.getElementById('requestTimeout').value)
    };
    
    localStorage.setItem('proxyConfig', JSON.stringify(config));
    showNotification('Proxy configuration saved successfully', 'success');
}

// Initialize on page load
if (window.location.pathname.includes('proxy-manager.html')) {
    document.addEventListener('DOMContentLoaded', initProxyManager);
}