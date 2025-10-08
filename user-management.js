// User Management System
class UserManagement {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('users') || '{}');
        this.selectedUsers = new Set();
        this.initializeEventListeners();
        this.loadUsers();
        this.updateStats();
    }

    initializeEventListeners() {
        document.getElementById('search-users').addEventListener('input', (e) => this.filterUsers(e.target.value));
        document.getElementById('filter-status').addEventListener('change', (e) => this.filterByStatus(e.target.value));
        document.getElementById('apply-bulk').addEventListener('click', () => this.applyBulkAction());
        document.getElementById('close-modal').addEventListener('click', () => this.closeModal());
        document.getElementById('suspend-user').addEventListener('click', () => this.suspendUser());
        document.getElementById('delete-user').addEventListener('click', () => this.deleteUser());
    }

    // Load and display users
    loadUsers() {
        const tbody = document.getElementById('user-table-body');
        const userEntries = Object.entries(this.users);
        
        tbody.innerHTML = userEntries.map(([email, user]) => `
            <tr data-email="${email}">
                <td>
                    <input type="checkbox" class="user-checkbox" value="${email}">
                    <div class="user-info">
                        <div class="user-name">${user.name || 'N/A'}</div>
                        <div class="user-id">${email}</div>
                    </div>
                </td>
                <td>${email}</td>
                <td><span class="status ${user.status || 'active'}">${user.status || 'active'}</span></td>
                <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                <td>${this.getUserUsage(email)}</td>
                <td>$${this.getUserRevenue(email)}</td>
                <td>
                    <button class="btn-small" onclick="userManagement.viewUser('${email}')">View</button>
                    <button class="btn-small warning" onclick="userManagement.toggleUserStatus('${email}')">
                        ${user.status === 'suspended' ? 'Activate' : 'Suspend'}
                    </button>
                </td>
            </tr>
        `).join('');

        // Add checkbox listeners
        document.querySelectorAll('.user-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.selectedUsers.add(e.target.value);
                } else {
                    this.selectedUsers.delete(e.target.value);
                }
            });
        });
    }

    // Update statistics
    updateStats() {
        const userEntries = Object.entries(this.users);
        const total = userEntries.length;
        const active = userEntries.filter(([_, user]) => user.status !== 'suspended').length;
        const suspended = userEntries.filter(([_, user]) => user.status === 'suspended').length;
        const today = new Date().toDateString();
        const newToday = userEntries.filter(([_, user]) => 
            new Date(user.createdAt).toDateString() === today
        ).length;

        document.getElementById('total-users').textContent = total;
        document.getElementById('active-users').textContent = active;
        document.getElementById('suspended-users').textContent = suspended;
        document.getElementById('new-users').textContent = newToday;
    }

    // Get user usage data
    getUserUsage(email) {
        const proxies = JSON.parse(localStorage.getItem('proxies') || '[]');
        const userProxies = proxies.filter(p => p.userId === email);
        return `${userProxies.length} proxies`;
    }

    // Get user revenue
    getUserRevenue(email) {
        const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
        const userTransactions = transactions.filter(t => t.userId === email);
        return userTransactions.reduce((sum, t) => sum + (t.amount || 0), 0).toFixed(2);
    }

    // Filter users by search term
    filterUsers(searchTerm) {
        const rows = document.querySelectorAll('#user-table-body tr');
        rows.forEach(row => {
            const email = row.dataset.email;
            const user = this.users[email];
            const searchText = `${user.name || ''} ${email}`.toLowerCase();
            row.style.display = searchText.includes(searchTerm.toLowerCase()) ? '' : 'none';
        });
    }

    // Filter by status
    filterByStatus(status) {
        const rows = document.querySelectorAll('#user-table-body tr');
        rows.forEach(row => {
            const email = row.dataset.email;
            const user = this.users[email];
            const userStatus = user.status || 'active';
            row.style.display = (status === 'all' || userStatus === status) ? '' : 'none';
        });
    }

    // View user details
    viewUser(email) {
        const user = this.users[email];
        const modal = document.getElementById('user-modal');
        const details = document.getElementById('user-details');
        
        details.innerHTML = `
            <div class="user-detail-grid">
                <div><strong>Name:</strong> ${user.name || 'N/A'}</div>
                <div><strong>Email:</strong> ${email}</div>
                <div><strong>Status:</strong> <span class="status ${user.status || 'active'}">${user.status || 'active'}</span></div>
                <div><strong>Joined:</strong> ${new Date(user.createdAt).toLocaleDateString()}</div>
                <div><strong>Phone:</strong> ${user.phone || 'N/A'}</div>
                <div><strong>Verified:</strong> ${user.verified ? 'Yes' : 'No'}</div>
                <div><strong>Usage:</strong> ${this.getUserUsage(email)}</div>
                <div><strong>Revenue:</strong> $${this.getUserRevenue(email)}</div>
            </div>
        `;
        
        modal.classList.remove('hidden');
        modal.dataset.currentUser = email;
    }

    // Toggle user status
    toggleUserStatus(email) {
        const user = this.users[email];
        user.status = user.status === 'suspended' ? 'active' : 'suspended';
        localStorage.setItem('users', JSON.stringify(this.users));
        this.loadUsers();
        this.updateStats();
    }

    // Suspend user
    suspendUser() {
        const email = document.getElementById('user-modal').dataset.currentUser;
        this.toggleUserStatus(email);
        this.closeModal();
    }

    // Delete user
    deleteUser() {
        const email = document.getElementById('user-modal').dataset.currentUser;
        if (confirm('Are you sure you want to delete this user?')) {
            delete this.users[email];
            localStorage.setItem('users', JSON.stringify(this.users));
            this.loadUsers();
            this.updateStats();
            this.closeModal();
        }
    }

    // Apply bulk actions
    applyBulkAction() {
        const action = document.getElementById('bulk-action').value;
        if (!action || this.selectedUsers.size === 0) return;

        if (confirm(`Apply ${action} to ${this.selectedUsers.size} users?`)) {
            this.selectedUsers.forEach(email => {
                switch (action) {
                    case 'suspend':
                        this.users[email].status = 'suspended';
                        break;
                    case 'activate':
                        this.users[email].status = 'active';
                        break;
                    case 'delete':
                        delete this.users[email];
                        break;
                }
            });
            
            localStorage.setItem('users', JSON.stringify(this.users));
            this.selectedUsers.clear();
            this.loadUsers();
            this.updateStats();
        }
    }

    // Close modal
    closeModal() {
        document.getElementById('user-modal').classList.add('hidden');
    }
}

// Initialize user management
const userManagement = new UserManagement();