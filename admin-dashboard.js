// Admin Dashboard Controller
class AdminDashboard {
    constructor() {
        this.initializeCharts();
        this.loadStats();
        this.loadRecentActivity();
        this.startRealTimeUpdates();
    }

    // Load dashboard statistics
    loadStats() {
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        const proxies = JSON.parse(localStorage.getItem('proxies') || '[]');
        const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
        
        // Calculate stats
        const totalUsers = Object.keys(users).length;
        const activeProxies = proxies.filter(p => p.status === 'active').length;
        const todayRevenue = this.calculateTodayRevenue(transactions);
        
        // Update UI
        document.getElementById('total-users').textContent = totalUsers;
        document.getElementById('active-proxies').textContent = activeProxies;
        document.getElementById('revenue-today').textContent = `$${todayRevenue.toFixed(2)}`;
    }

    // Calculate today's revenue
    calculateTodayRevenue(transactions) {
        const today = new Date().toDateString();
        return transactions
            .filter(t => new Date(t.createdAt).toDateString() === today)
            .reduce((sum, t) => sum + (t.amount || 0), 0);
    }

    // Initialize charts
    initializeCharts() {
        this.createUserGrowthChart();
        this.createRevenueChart();
    }

    // User growth chart
    createUserGrowthChart() {
        const ctx = document.getElementById('userGrowthChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'New Users',
                    data: [12, 19, 8, 15, 25, 32],
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
            }
        });
    }

    // Revenue chart
    createRevenueChart() {
        const ctx = document.getElementById('revenueChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Revenue',
                    data: [120, 190, 80, 150, 250, 320, 280],
                    backgroundColor: '#059669'
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
            }
        });
    }

    // Load recent activity
    loadRecentActivity() {
        const activities = [
            { type: 'user', message: 'New user registered', time: '2 min ago' },
            { type: 'payment', message: 'Payment received $49.99', time: '5 min ago' },
            { type: 'proxy', message: 'Proxy endpoint created', time: '8 min ago' },
            { type: 'support', message: 'Support ticket resolved', time: '12 min ago' },
            { type: 'system', message: 'System backup completed', time: '1 hour ago' }
        ];

        const activityList = document.getElementById('recent-activity');
        activityList.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon ${activity.type}"></div>
                <div class="activity-content">
                    <div class="activity-message">${activity.message}</div>
                    <div class="activity-time">${activity.time}</div>
                </div>
            </div>
        `).join('');
    }

    // Real-time updates
    startRealTimeUpdates() {
        setInterval(() => {
            this.loadStats();
            this.updateSystemHealth();
        }, 30000); // Update every 30 seconds
    }

    // Update system health
    updateSystemHealth() {
        const health = Math.random() > 0.1 ? 99.9 : 98.5; // Simulate occasional dips
        document.getElementById('system-health').textContent = `${health}%`;
    }
}

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', () => {
    new AdminDashboard();
});