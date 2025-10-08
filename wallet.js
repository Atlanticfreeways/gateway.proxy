// Wallet Management System
let userWallet = JSON.parse(localStorage.getItem('userWallet')) || {
    balance: 0,
    transactions: [],
    usage: { bandwidth: 0, connections: 0 },
    limits: { bandwidth: 0, connections: 0 }
};

function initWallet() {
    if (!isLoggedIn()) {
        window.location.href = 'login.html?redirect=wallet.html';
        return;
    }
    
    updateWalletDisplay();
    loadTransactionHistory();
}

function updateWalletDisplay() {
    document.getElementById('walletBalance').textContent = userWallet.balance.toFixed(2);
    document.getElementById('usedBandwidth').textContent = userWallet.usage.bandwidth;
    document.getElementById('totalBandwidth').textContent = userWallet.limits.bandwidth;
    document.getElementById('usedConnections').textContent = userWallet.usage.connections;
    document.getElementById('totalConnections').textContent = userWallet.limits.connections;
}

function showFundModal() {
    document.getElementById('fundModal').style.display = 'flex';
}

function closeFundModal() {
    document.getElementById('fundModal').style.display = 'none';
}

function addFunds() {
    const amount = parseFloat(document.getElementById('fundAmount').value);
    const method = document.getElementById('fundMethod').value;
    
    if (!amount || amount < 10) {
        showNotification('Minimum funding amount is $10', 'error');
        return;
    }
    
    // Simulate payment processing
    showNotification('Processing payment...', 'info');
    
    setTimeout(() => {
        userWallet.balance += amount;
        userWallet.transactions.unshift({
            id: Date.now(),
            type: 'deposit',
            amount: amount,
            method: method,
            date: new Date().toISOString(),
            status: 'completed'
        });
        
        localStorage.setItem('userWallet', JSON.stringify(userWallet));
        updateWalletDisplay();
        loadTransactionHistory();
        closeFundModal();
        
        showNotification(`Successfully added $${amount.toFixed(2)} to your wallet`, 'success');
    }, 2000);
}

function loadTransactionHistory() {
    const list = document.getElementById('transactionList');
    if (!list) return;
    
    if (userWallet.transactions.length === 0) {
        list.innerHTML = '<p style="text-align:center;color:#636e72">No transactions yet</p>';
        return;
    }
    
    list.innerHTML = userWallet.transactions.map(tx => `
        <div class="transaction-item">
            <div class="transaction-info">
                <div class="transaction-type">${tx.type.toUpperCase()}</div>
                <div class="transaction-date">${new Date(tx.date).toLocaleDateString()}</div>
            </div>
            <div class="transaction-amount ${tx.type === 'deposit' ? 'positive' : 'negative'}">
                ${tx.type === 'deposit' ? '+' : '-'}$${tx.amount.toFixed(2)}
            </div>
        </div>
    `).join('');
}

function purchaseWithWallet(amount, description) {
    if (userWallet.balance < amount) {
        showNotification('Insufficient balance. Please add funds.', 'error');
        return false;
    }
    
    userWallet.balance -= amount;
    userWallet.transactions.unshift({
        id: Date.now(),
        type: 'purchase',
        amount: amount,
        description: description,
        date: new Date().toISOString(),
        status: 'completed'
    });
    
    localStorage.setItem('userWallet', JSON.stringify(userWallet));
    return true;
}

// Initialize wallet on page load
if (window.location.pathname.includes('wallet.html')) {
    document.addEventListener('DOMContentLoaded', initWallet);
}