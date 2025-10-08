// Proxy Pool Management System
class ProxyPoolManager {
    constructor() {
        this.servers = JSON.parse(localStorage.getItem('proxyServers') || '[]');
        this.config = JSON.parse(localStorage.getItem('poolConfig') || '{"algorithm": "round-robin", "healthInterval": 30}');
        this.initializeEventListeners();
        this.loadServers();
        this.updateStats();
        this.startHealthChecks();
    }

    initializeEventListeners() {
        document.getElementById('add-server').addEventListener('click', () => this.openModal());
        document.getElementById('bulk-test').addEventListener('click', () => this.testAllServers());
        document.getElementById('close-modal').addEventListener('click', () => this.closeModal());
        document.getElementById('server-form').addEventListener('submit', (e) => this.addServer(e));
        document.getElementById('apply-config').addEventListener('click', () => this.applyConfig());
    }

    // Load and display servers
    loadServers() {
        if (this.servers.length === 0) {
            this.initializeDefaultServers();
        }

        const serverList = document.getElementById('server-list');
        serverList.innerHTML = this.servers.map(server => `
            <div class="server-item ${server.status}">
                <div class="server-info">
                    <div class="server-ip">${server.ip}:${server.port}</div>
                    <div class="server-details">${server.region} • ${server.type}</div>
                </div>
                <div class="server-metrics">
                    <div class="metric">
                        <span class="metric-label">Load</span>
                        <span class="metric-value">${server.load}%</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Uptime</span>
                        <span class="metric-value">${server.uptime}%</span>
                    </div>
                </div>
                <div class="server-actions">
                    <button class="btn-small ${server.status === 'online' ? 'warning' : 'success'}" 
                            onclick="proxyPool.toggleServer('${server.id}')">
                        ${server.status === 'online' ? 'Disable' : 'Enable'}
                    </button>
                    <button class="btn-small" onclick="proxyPool.testServer('${server.id}')">Test</button>
                    <button class="btn-small danger" onclick="proxyPool.removeServer('${server.id}')">Remove</button>
                </div>
            </div>
        `).join('');
    }

    // Initialize default servers
    initializeDefaultServers() {
        this.servers = [
            {
                id: '1',
                ip: '192.168.1.100',
                port: 8080,
                region: 'us-east',
                type: 'residential',
                status: 'online',
                load: 45,
                uptime: 99.9,
                lastCheck: Date.now()
            },
            {
                id: '2',
                ip: '192.168.1.101',
                port: 8080,
                region: 'us-west',
                type: 'datacenter',
                status: 'online',
                load: 32,
                uptime: 99.8,
                lastCheck: Date.now()
            },
            {
                id: '3',
                ip: '192.168.1.102',
                port: 8080,
                region: 'eu-west',
                type: 'residential',
                status: 'offline',
                load: 0,
                uptime: 95.2,
                lastCheck: Date.now()
            }
        ];
        localStorage.setItem('proxyServers', JSON.stringify(this.servers));
    }

    // Update statistics
    updateStats() {
        const total = this.servers.length;
        const online = this.servers.filter(s => s.status === 'online').length;
        const avgLoad = online > 0 ? 
            this.servers.filter(s => s.status === 'online')
                       .reduce((sum, s) => sum + s.load, 0) / online : 0;
        const capacity = online * 1000; // Assume 1000 connections per server

        document.getElementById('total-servers').textContent = total;
        document.getElementById('online-servers').textContent = online;
        document.getElementById('avg-load').textContent = `${avgLoad.toFixed(1)}%`;
        document.getElementById('total-capacity').textContent = capacity.toLocaleString();
    }

    // Add new server
    addServer(e) {
        e.preventDefault();
        
        const server = {
            id: Date.now().toString(),
            ip: document.getElementById('server-ip').value,
            port: parseInt(document.getElementById('server-port').value),
            region: document.getElementById('server-region').value,
            type: document.getElementById('server-type').value,
            status: 'testing',
            load: 0,
            uptime: 100,
            lastCheck: Date.now()
        };

        this.servers.push(server);
        localStorage.setItem('proxyServers', JSON.stringify(this.servers));
        
        this.loadServers();
        this.updateStats();
        this.closeModal();
        
        // Test new server
        setTimeout(() => this.testServer(server.id), 1000);
    }

    // Test server connectivity
    testServer(serverId) {
        const server = this.servers.find(s => s.id === serverId);
        if (!server) return;

        server.status = 'testing';
        this.loadServers();

        // Simulate server test
        setTimeout(() => {
            const isOnline = Math.random() > 0.2; // 80% success rate
            server.status = isOnline ? 'online' : 'offline';
            server.load = isOnline ? Math.floor(Math.random() * 80) : 0;
            server.uptime = isOnline ? 95 + Math.random() * 5 : server.uptime;
            server.lastCheck = Date.now();
            
            localStorage.setItem('proxyServers', JSON.stringify(this.servers));
            this.loadServers();
            this.updateStats();
        }, 2000);
    }

    // Test all servers
    testAllServers() {
        this.servers.forEach(server => {
            setTimeout(() => this.testServer(server.id), Math.random() * 1000);
        });
    }

    // Toggle server status
    toggleServer(serverId) {
        const server = this.servers.find(s => s.id === serverId);
        if (!server) return;

        server.status = server.status === 'online' ? 'offline' : 'online';
        server.load = server.status === 'online' ? Math.floor(Math.random() * 80) : 0;
        
        localStorage.setItem('proxyServers', JSON.stringify(this.servers));
        this.loadServers();
        this.updateStats();
    }

    // Remove server
    removeServer(serverId) {
        if (confirm('Are you sure you want to remove this server?')) {
            this.servers = this.servers.filter(s => s.id !== serverId);
            localStorage.setItem('proxyServers', JSON.stringify(this.servers));
            this.loadServers();
            this.updateStats();
        }
    }

    // Apply load balancing configuration
    applyConfig() {
        this.config.algorithm = document.getElementById('lb-algorithm').value;
        this.config.healthInterval = parseInt(document.getElementById('health-interval').value);
        
        localStorage.setItem('poolConfig', JSON.stringify(this.config));
        
        // Restart health checks with new interval
        this.startHealthChecks();
        
        alert('Configuration applied successfully!');
    }

    // Start health check monitoring
    startHealthChecks() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }

        this.healthCheckInterval = setInterval(() => {
            this.servers.forEach(server => {
                if (server.status === 'online') {
                    // Simulate load fluctuation
                    server.load = Math.max(0, Math.min(100, 
                        server.load + (Math.random() - 0.5) * 10
                    ));
                }
            });
            
            localStorage.setItem('proxyServers', JSON.stringify(this.servers));
            this.loadServers();
            this.updateStats();
        }, this.config.healthInterval * 1000);
    }

    // Modal controls
    openModal() {
        document.getElementById('server-modal').classList.remove('hidden');
    }

    closeModal() {
        document.getElementById('server-modal').classList.add('hidden');
        document.getElementById('server-form').reset();
    }
}

// Initialize proxy pool manager
const proxyPool = new ProxyPoolManager();