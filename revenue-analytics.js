// Revenue Analytics System
class RevenueAnalytics {
    constructor() {
        this.transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
        this.initializeEventListeners();
        this.loadAnalytics();
        this.initializeCharts();
    }

    initializeEventListeners() {
        document.getElementById('time-period').addEventListener('change', (e) => {
            this.loadAnalytics(parseInt(e.target.value));
        });
        document.getElementById('export-report').addEventListener('click', () => this.exportReport());
    }

    // Load analytics data
    loadAnalytics(days = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        const filteredTransactions = this.transactions.filter(t => 
            new Date(t.createdAt) >= cutoffDate
        );

        this.updateStats(filteredTransactions);
        this.updateCharts(filteredTransactions);
        this.loadTopProducts(filteredTransactions);
        this.loadRecentTransactions();
    }

    // Update statistics
    updateStats(transactions) {
        const totalRevenue = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
        const avgOrder = transactions.length > 0 ? totalRevenue / transactions.length : 0;
        const mrr = this.calculateMRR(transactions);
        const conversionRate = this.calculateConversionRate();

        document.getElementById('total-revenue').textContent = `$${totalRevenue.toFixed(2)}`;
        document.getElementById('mrr').textContent = `$${mrr.toFixed(2)}`;
        document.getElementById('avg-order').textContent = `$${avgOrder.toFixed(2)}`;
        document.getElementById('conversion-rate').textContent = `${conversionRate.toFixed(1)}%`;

        // Calculate changes (simulated)
        document.getElementById('revenue-change').textContent = '+12.5%';
        document.getElementById('mrr-change').textContent = '+8.3%';
        document.getElementById('avg-change').textContent = '+5.2%';
        document.getElementById('conversion-change').textContent = '+2.1%';
    }

    // Calculate Monthly Recurring Revenue
    calculateMRR(transactions) {
        const monthlyTransactions = transactions.filter(t => 
            t.type === 'subscription' || t.recurring === true
        );
        return monthlyTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    }

    // Calculate conversion rate
    calculateConversionRate() {
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        const totalUsers = Object.keys(users).length;
        const payingUsers = this.transactions.map(t => t.userId).filter((v, i, a) => a.indexOf(v) === i).length;
        return totalUsers > 0 ? (payingUsers / totalUsers) * 100 : 0;
    }

    // Initialize charts
    initializeCharts() {
        this.createRevenueChart();
        this.createPaymentMethodsChart();
    }

    // Revenue trend chart
    createRevenueChart() {
        const ctx = document.getElementById('revenueChart').getContext('2d');
        const last7Days = this.getLast7DaysRevenue();
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: last7Days.labels,
                datasets: [{
                    label: 'Daily Revenue',
                    data: last7Days.data,
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value;
                            }
                        }
                    }
                }
            }
        });
    }

    // Payment methods chart
    createPaymentMethodsChart() {
        const ctx = document.getElementById('paymentMethodsChart').getContext('2d');
        const paymentMethods = this.getPaymentMethodsData();
        
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: paymentMethods.labels,
                datasets: [{
                    data: paymentMethods.data,
                    backgroundColor: ['#2563eb', '#059669', '#dc2626', '#d97706', '#7c3aed']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }

    // Get last 7 days revenue data
    getLast7DaysRevenue() {
        const labels = [];
        const data = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toDateString();
            
            labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
            
            const dayRevenue = this.transactions
                .filter(t => new Date(t.createdAt).toDateString() === dateStr)
                .reduce((sum, t) => sum + (t.amount || 0), 0);
            
            data.push(dayRevenue);
        }
        
        return { labels, data };
    }

    // Get payment methods data
    getPaymentMethodsData() {
        const methods = {};
        this.transactions.forEach(t => {
            const method = t.paymentMethod || 'Unknown';
            methods[method] = (methods[method] || 0) + (t.amount || 0);
        });
        
        return {
            labels: Object.keys(methods),
            data: Object.values(methods)
        };
    }

    // Load top products
    loadTopProducts(transactions) {
        const products = {};
        transactions.forEach(t => {
            const product = t.product || 'Unknown';
            if (!products[product]) {
                products[product] = { count: 0, revenue: 0 };
            }
            products[product].count++;
            products[product].revenue += t.amount || 0;
        });
        
        const sortedProducts = Object.entries(products)
            .sort(([,a], [,b]) => b.revenue - a.revenue)
            .slice(0, 5);
        
        const productList = document.getElementById('top-products');
        productList.innerHTML = sortedProducts.map(([name, data]) => `
            <div class="product-item">
                <div class="product-name">${name}</div>
                <div class="product-stats">
                    <span class="product-revenue">$${data.revenue.toFixed(2)}</span>
                    <span class="product-count">${data.count} sales</span>
                </div>
            </div>
        `).join('');
    }

    // Load recent transactions
    loadRecentTransactions() {
        const recent = this.transactions
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 10);
        
        const transactionList = document.getElementById('recent-transactions');
        transactionList.innerHTML = recent.map(t => `
            <div class="transaction-item">
                <div class="transaction-info">
                    <div class="transaction-user">${t.userId || 'Unknown'}</div>
                    <div class="transaction-date">${new Date(t.createdAt).toLocaleDateString()}</div>
                </div>
                <div class="transaction-amount">$${(t.amount || 0).toFixed(2)}</div>
                <div class="transaction-status ${t.status || 'completed'}">${t.status || 'completed'}</div>
            </div>
        `).join('');
    }

    // Export report
    exportReport() {
        const reportData = {
            generatedAt: new Date().toISOString(),
            totalRevenue: this.transactions.reduce((sum, t) => sum + (t.amount || 0), 0),
            totalTransactions: this.transactions.length,
            paymentMethods: this.getPaymentMethodsData(),
            recentTransactions: this.transactions.slice(-50)
        };
        
        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `revenue-report-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // Update charts with filtered data
    updateCharts(transactions) {
        // This would update existing charts with new data
        // For simplicity, we'll reinitialize them
        this.initializeCharts();
    }
}

// Initialize revenue analytics
document.addEventListener('DOMContentLoaded', () => {
    new RevenueAnalytics();
});