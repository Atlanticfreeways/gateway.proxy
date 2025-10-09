// Wallet Management System
class WalletManager {
    constructor() {
        this.wallets = JSON.parse(localStorage.getItem('wallets') || '{}');
        this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
        this.userWallet = null;
        
        this.checkAuth();
        this.initializeWallet();
        this.loadWalletData();
        this.initializeEventListeners();
    }

    checkAuth() {
        if (!this.currentUser) {
            window.location.href = 'login.html';
            return;
        }
        document.getElementById('user-name').textContent = this.currentUser.name;
    }

    initializeWallet() {
        if (!this.wallets[this.currentUser.email]) {
            this.wallets[this.currentUser.email] = {
                balance: 0,
                transactions: [],
                createdAt: new Date().toISOString()
            };
            localStorage.setItem('wallets', JSON.stringify(this.wallets));
        }
        this.userWallet = this.wallets[this.currentUser.email];
    }

    initializeEventListeners() {
        document.getElementById('fund-wallet-btn').addEventListener('click', () => this.openFundingModal('crypto'));
        document.getElementById('withdraw-btn').addEventListener('click', () => this.openWithdrawModal());
        document.getElementById('withdraw-form').addEventListener('submit', (e) => this.processWithdrawal(e));
        document.getElementById('withdraw-amount').addEventListener('input', (e) => this.calculateNetAmount(e));
    }

    loadWalletData() {
        document.getElementById('wallet-balance').textContent = `$${this.userWallet.balance.toFixed(2)}`;
        document.getElementById('available-balance').textContent = this.userWallet.balance.toFixed(2);
        this.loadTransactions();
    }

    loadTransactions() {
        const transactionsList = document.getElementById('wallet-transactions');
        const transactions = this.userWallet.transactions.slice(0, 10);
        
        if (transactions.length === 0) {
            transactionsList.innerHTML = '<div class="empty-transactions"><p>No transactions yet</p></div>';
            return;
        }
        
        transactionsList.innerHTML = transactions.map(transaction => `
            <div class="transaction-item">
                <div class="transaction-info">
                    <div class="transaction-desc">${transaction.description}</div>
                    <div class="transaction-date">${new Date(transaction.date).toLocaleDateString()}</div>
                </div>
                <div class="transaction-amount ${transaction.type}">
                    ${transaction.type === 'credit' ? '+' : '-'}$${transaction.amount.toFixed(2)}
                </div>
                <div class="transaction-status ${transaction.status}">${transaction.status}</div>
            </div>
        `).join('');
    }

    openWithdrawModal() {
        document.getElementById('withdraw-modal').classList.remove('hidden');
        document.getElementById('available-balance').textContent = this.userWallet.balance.toFixed(2);
    }

    closeWithdrawModal() {
        document.getElementById('withdraw-modal').classList.add('hidden');
        document.getElementById('withdraw-form').reset();
    }

    calculateNetAmount(e) {
        const amount = parseFloat(e.target.value) || 0;
        const fee = 2.50;
        const netAmount = Math.max(0, amount - fee);
        document.getElementById('net-amount').textContent = netAmount.toFixed(2);
    }

    processWithdrawal(e) {
        e.preventDefault();
        
        const amount = parseFloat(document.getElementById('withdraw-amount').value);
        const method = document.getElementById('withdraw-method').value;
        const fee = 2.50;
        
        if (amount <= fee) {
            alert('Amount must be greater than withdrawal fee ($2.50)');
            return;
        }
        
        if (amount > this.userWallet.balance) {
            alert('Insufficient balance');
            return;
        }
        
        // Process withdrawal
        this.userWallet.balance -= amount;
        
        const transaction = {
            id: Date.now().toString(),
            type: 'debit',
            amount: amount,
            description: `Withdrawal via ${method}`,
            date: new Date().toISOString(),
            status: 'pending'
        };
        
        this.userWallet.transactions.unshift(transaction);
        localStorage.setItem('wallets', JSON.stringify(this.wallets));
        
        this.loadWalletData();
        this.closeWithdrawModal();
        this.showSuccess('Withdrawal request submitted successfully!');
    }

    addFunds(amount, method, reference = '') {
        this.userWallet.balance += amount;
        
        const transaction = {
            id: Date.now().toString(),
            type: 'credit',
            amount: amount,
            description: `Funded via ${method}${reference ? ` - ${reference}` : ''}`,
            date: new Date().toISOString(),
            status: 'completed'
        };
        
        this.userWallet.transactions.unshift(transaction);
        localStorage.setItem('wallets', JSON.stringify(this.wallets));
        
        this.loadWalletData();
        this.showSuccess(`$${amount.toFixed(2)} added to wallet successfully!`);
    }

    showSuccess(message) {
        const toast = document.createElement('div');
        toast.className = 'toast success';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #059669;
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            z-index: 10000;
        `;
        
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}

// Crypto funding functions
function openFundingModal(type) {
    if (type === 'crypto') {
        document.getElementById('crypto-modal').classList.remove('hidden');
    } else if (type === 'bank') {
        document.getElementById('bank-modal').classList.remove('hidden');
        document.getElementById('wire-reference').textContent = `FW${Date.now()}`;
    }
}

function closeFundingModal() {
    document.getElementById('crypto-modal').classList.add('hidden');
    document.getElementById('bank-modal').classList.add('hidden');
    document.getElementById('payment-details').classList.add('hidden');
}

function generateCryptoAddress() {
    const cryptoType = document.getElementById('crypto-type').value;
    const amount = document.getElementById('crypto-amount').value;
    
    if (!amount || amount < 10) {
        alert('Minimum amount is $10');
        return;
    }
    
    // Generate mock addresses
    const addresses = {
        btc: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        usdt: '0x742d35Cc6634C0532925a3b8D4C0C8b3C2e1e1e1',
        eth: '0x742d35Cc6634C0532925a3b8D4C0C8b3C2e1e1e1'
    };
    
    const networks = {
        btc: 'Bitcoin Network',
        usdt: 'Ethereum (ERC-20)',
        eth: 'Ethereum Network'
    };
    
    const address = addresses[cryptoType];
    const network = networks[cryptoType];
    
    document.getElementById('crypto-address').textContent = address;
    document.getElementById('crypto-amount-display').textContent = `$${amount}`;
    document.getElementById('crypto-network').textContent = network;
    
    // Generate QR code
    const canvas = document.getElementById('qr-canvas');
    QRCode.toCanvas(canvas, address, { width: 200 }, function (error) {
        if (error) console.error(error);
    });
    
    document.getElementById('payment-details').classList.remove('hidden');
}

function copyAddress() {
    const address = document.getElementById('crypto-address').textContent;
    navigator.clipboard.writeText(address).then(() => {
        alert('Address copied to clipboard!');
    });
}

function confirmPayment() {
    const amount = parseFloat(document.getElementById('crypto-amount').value);
    const cryptoType = document.getElementById('crypto-type').value.toUpperCase();
    
    walletManager.addFunds(amount, `Cryptocurrency (${cryptoType})`);
    closeFundingModal();
}

function initiateBankTransfer() {
    const amount = parseFloat(document.getElementById('bank-amount').value);
    
    if (!amount || amount < 100) {
        alert('Minimum amount is $100');
        return;
    }
    
    // Simulate bank transfer initiation
    alert('Bank transfer initiated. Funds will be available in 1-3 business days.');
    closeFundingModal();
}

// Global functions
function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    window.location.href = 'index.html';
}

// Mobile menu toggle
function toggleMobileMenu() {
    const navMenu = document.getElementById('nav-menu');
    const toggle = document.querySelector('.mobile-menu-toggle');
    navMenu.classList.toggle('mobile-active');
    toggle.classList.toggle('active');
}

// User menu toggle
function toggleUserMenu() {
    const dropdown = document.getElementById('user-dropdown-menu');
    dropdown.classList.toggle('hidden');
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const userMenu = document.querySelector('.user-dropdown');
    const dropdown = document.getElementById('user-dropdown-menu');
    const navMenu = document.getElementById('nav-menu');
    const toggle = document.querySelector('.mobile-menu-toggle');
    
    if (userMenu && !userMenu.contains(event.target)) {
        dropdown.classList.add('hidden');
    }
    
    if (!navMenu.contains(event.target) && !toggle.contains(event.target)) {
        navMenu.classList.remove('mobile-active');
        toggle.classList.remove('active');
    }
});

function closeWithdrawModal() {
    walletManager.closeWithdrawModal();
}

// Initialize
const walletManager = new WalletManager();