// API System - RESTful endpoints with authentication
class ProxyAPI {
    constructor() {
        this.baseURL = '/api/v1';
        this.token = localStorage.getItem('authToken');
        this.rateLimits = new Map();
    }

    // Authentication middleware
    authenticate(token) {
        if (!token) throw new Error('Authentication required');
        // Verify JWT token (simplified)
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.exp < Date.now() / 1000) throw new Error('Token expired');
            return payload;
        } catch (e) {
            throw new Error('Invalid token');
        }
    }

    // Rate limiting
    checkRateLimit(userId, endpoint) {
        const key = `${userId}:${endpoint}`;
        const now = Date.now();
        const limit = this.rateLimits.get(key) || { count: 0, resetTime: now + 60000 };
        
        if (now > limit.resetTime) {
            limit.count = 0;
            limit.resetTime = now + 60000;
        }
        
        if (limit.count >= 100) throw new Error('Rate limit exceeded');
        limit.count++;
        this.rateLimits.set(key, limit);
    }

    // API request handler
    async request(method, endpoint, data = null) {
        try {
            const user = this.authenticate(this.token);
            this.checkRateLimit(user.id, endpoint);

            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                }
            };

            if (data) options.body = JSON.stringify(data);

            const response = await fetch(`${this.baseURL}${endpoint}`, options);
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    // Proxy endpoints
    async getProxies() {
        return this.request('GET', '/proxies');
    }

    async createProxy(config) {
        return this.request('POST', '/proxies', config);
    }

    async updateProxy(id, config) {
        return this.request('PUT', `/proxies/${id}`, config);
    }

    async deleteProxy(id) {
        return this.request('DELETE', `/proxies/${id}`);
    }

    // User endpoints
    async getProfile() {
        return this.request('GET', '/user/profile');
    }

    async updateProfile(data) {
        return this.request('PUT', '/user/profile', data);
    }

    // Payment endpoints
    async getTransactions() {
        return this.request('GET', '/payments/transactions');
    }

    async createPayment(data) {
        return this.request('POST', '/payments/create', data);
    }

    // Usage endpoints
    async getUsage() {
        return this.request('GET', '/usage/stats');
    }

    async getApiKeys() {
        return this.request('GET', '/user/api-keys');
    }

    async createApiKey(name) {
        return this.request('POST', '/user/api-keys', { name });
    }

    async revokeApiKey(keyId) {
        return this.request('DELETE', `/user/api-keys/${keyId}`);
    }
}

// Initialize API client
const api = new ProxyAPI();

// Export for use in other files
window.ProxyAPI = api;