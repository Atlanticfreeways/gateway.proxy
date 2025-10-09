// Card Details Management
class CardDetails {
    constructor() {
        this.cards = JSON.parse(localStorage.getItem('userCards') || '[]');
        this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
        this.cardId = new URLSearchParams(window.location.search).get('id');
        this.card = null;
        this.numberRevealed = false;
        this.cvvRevealed = false;
        
        this.checkAuth();
        this.loadCard();
        this.initializeEventListeners();
    }

    checkAuth() {
        if (!this.currentUser) {
            window.location.href = 'login.html';
            return;
        }
        document.getElementById('user-name').textContent = this.currentUser.name;
    }

    loadCard() {
        this.card = this.cards.find(c => c.id === this.cardId && c.userId === this.currentUser.email);
        
        if (!this.card) {
            alert('Card not found');
            window.location.href = 'cards.html';
            return;
        }

        this.displayCard();
        this.loadTransactions();
    }

    initializeEventListeners() {
        document.getElementById('reveal-btn').addEventListener('click', () => this.toggleCardNumber());
        document.getElementById('reveal-cvv-btn').addEventListener('click', () => this.toggleCVV());
        document.getElementById('freeze-btn').addEventListener('click', () => this.toggleCardStatus());
        document.getElementById('fund-btn').addEventListener('click', () => this.openFundModal());
        document.getElementById('restrictions-btn').addEventListener('click', () => this.openRestrictionsModal());
        document.getElementById('fund-form').addEventListener('submit', (e) => this.fundCard(e));
    }

    displayCard() {
        const brandClass = this.card.type === 'visa' ? 'visa' : 'mastercard';
        
        // Update page title
        document.getElementById('card-title').textContent = this.card.name;
        
        // Create card visual
        document.getElementById('card-visual').innerHTML = `
            <div class="virtual-card ${brandClass} ${this.card.status}">
                <div class="card-brand-logo">${this.card.type.toUpperCase()}</div>
                <div class="card-number-large" id="card-number-display">${this.maskCardNumber(this.card.number)}</div>
                <div class="card-bottom">
                    <div class="card-holder">
                        <div class="label">CARD HOLDER</div>
                        <div class="value">${this.currentUser.name.toUpperCase()}</div>
                    </div>
                    <div class="card-expiry-large">
                        <div class="label">VALID THRU</div>
                        <div class="value">${this.card.expiry}</div>
                    </div>
                </div>
            </div>
        `;

        // Update card info
        document.getElementById('card-number-masked').textContent = this.maskCardNumber(this.card.number);
        document.getElementById('card-expiry').textContent = this.card.expiry;
        document.getElementById('card-cvv-masked').textContent = '•••';
        
        const statusElement = document.getElementById('card-status');
        statusElement.textContent = this.card.status.charAt(0).toUpperCase() + this.card.status.slice(1);
        statusElement.className = `status-badge ${this.card.status}`;
        
        document.getElementById('spending-limit').textContent = `$${this.card.spendingLimit.toLocaleString()}`;
        document.getElementById('available-balance').textContent = `$${this.card.balance.toFixed(2)}`;
        
        // Update freeze button
        const freezeBtn = document.getElementById('freeze-btn');
        freezeBtn.textContent = this.card.status === 'active' ? 'Freeze Card' : 'Unfreeze Card';
        freezeBtn.className = this.card.status === 'active' ? 'btn btn-warning' : 'btn btn-success';
    }

    maskCardNumber(number) {
        return number.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '$1 •••• •••• $4');
    }

    toggleCardNumber() {
        const displayElement = document.getElementById('card-number-masked');
        const cardDisplayElement = document.getElementById('card-number-display');
        const revealBtn = document.getElementById('reveal-btn');
        
        if (this.numberRevealed) {
            displayElement.textContent = this.maskCardNumber(this.card.number);
            cardDisplayElement.textContent = this.maskCardNumber(this.card.number);
            revealBtn.textContent = '👁️ Reveal';
            this.numberRevealed = false;
        } else {
            const fullNumber = this.card.number.replace(/(\d{4})(?=\d)/g, '$1 ');
            displayElement.textContent = fullNumber;
            cardDisplayElement.textContent = fullNumber;
            revealBtn.textContent = '🙈 Hide';
            this.numberRevealed = true;
            
            // Auto-hide after 10 seconds
            setTimeout(() => {
                if (this.numberRevealed) {
                    this.toggleCardNumber();
                }
            }, 10000);
        }
    }

    toggleCVV() {
        const displayElement = document.getElementById('card-cvv-masked');
        const revealBtn = document.getElementById('reveal-cvv-btn');
        
        if (this.cvvRevealed) {
            displayElement.textContent = '•••';
            revealBtn.textContent = '👁️';
            this.cvvRevealed = false;
        } else {
            displayElement.textContent = this.card.cvv;
            revealBtn.textContent = '🙈';
            this.cvvRevealed = true;
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                if (this.cvvRevealed) {
                    this.toggleCVV();
                }
            }, 5000);
        }
    }

    toggleCardStatus() {
        this.card.status = this.card.status === 'active' ? 'frozen' : 'active';
        
        // Update in storage
        const cardIndex = this.cards.findIndex(c => c.id === this.card.id);
        this.cards[cardIndex] = this.card;
        localStorage.setItem('userCards', JSON.stringify(this.cards));
        
        this.displayCard();
        this.showSuccess(`Card ${this.card.status === 'active' ? 'unfrozen' : 'frozen'} successfully!`);
        
        // Send notification
        if (typeof NotificationUtils !== 'undefined') {
            NotificationUtils.notifyCardStatusChange(this.card.name, this.card.status);
        }
    }

    openFundModal() {
        document.getElementById('fund-modal').classList.remove('hidden');
    }

    closeFundModal() {
        document.getElementById('fund-modal').classList.add('hidden');
        document.getElementById('fund-form').reset();
    }

    openRestrictionsModal() {
        document.getElementById('restrictions-modal').classList.remove('hidden');
        this.loadRestrictions();
    }

    closeRestrictionsModal() {
        document.getElementById('restrictions-modal').classList.add('hidden');
    }

    loadRestrictions() {
        const restrictions = this.card.restrictions || {
            blockedCategories: [],
            allowedCountries: ['US'],
            blockInternational: false,
            blockOnline: false,
            dailyLimit: null,
            transactionLimit: null,
            monthlyLimit: null
        };

        // Load blocked categories
        const categories = ['gambling', 'adult', 'alcohol', 'crypto', 'gas', 'atm'];
        categories.forEach(category => {
            const checkbox = document.getElementById(`block-${category}`);
            if (checkbox) {
                checkbox.checked = restrictions.blockedCategories.includes(category);
            }
        });

        // Load geographic restrictions
        const allowedCountries = document.getElementById('allowed-countries');
        Array.from(allowedCountries.options).forEach(option => {
            option.selected = restrictions.allowedCountries.includes(option.value);
        });

        document.getElementById('block-international').checked = restrictions.blockInternational;
        document.getElementById('block-online').checked = restrictions.blockOnline;

        // Load transaction limits
        document.getElementById('daily-limit').value = restrictions.dailyLimit || '';
        document.getElementById('transaction-limit').value = restrictions.transactionLimit || '';
        document.getElementById('monthly-limit').value = restrictions.monthlyLimit || '';
        
        // Load notification settings
        const notifications = restrictions.notifications || {
            allTransactions: true,
            largeTransactions: true,
            international: true,
            declined: true,
            suspicious: true
        };
        
        document.getElementById('notify-all-transactions').checked = notifications.allTransactions;
        document.getElementById('notify-large-transactions').checked = notifications.largeTransactions;
        document.getElementById('notify-international').checked = notifications.international;
        document.getElementById('notify-declined').checked = notifications.declined;
        document.getElementById('notify-suspicious').checked = notifications.suspicious;
    }

    saveRestrictions() {
        const restrictions = {
            blockedCategories: [],
            allowedCountries: [],
            blockInternational: document.getElementById('block-international').checked,
            blockOnline: document.getElementById('block-online').checked,
            dailyLimit: parseFloat(document.getElementById('daily-limit').value) || null,
            transactionLimit: parseFloat(document.getElementById('transaction-limit').value) || null,
            monthlyLimit: parseFloat(document.getElementById('monthly-limit').value) || null,
            notifications: {
                allTransactions: document.getElementById('notify-all-transactions').checked,
                largeTransactions: document.getElementById('notify-large-transactions').checked,
                international: document.getElementById('notify-international').checked,
                declined: document.getElementById('notify-declined').checked,
                suspicious: document.getElementById('notify-suspicious').checked
            }
        };

        // Get blocked categories
        const categories = ['gambling', 'adult', 'alcohol', 'crypto', 'gas', 'atm'];
        categories.forEach(category => {
            const checkbox = document.getElementById(`block-${category}`);
            if (checkbox && checkbox.checked) {
                restrictions.blockedCategories.push(category);
            }
        });

        // Get allowed countries
        const allowedCountries = document.getElementById('allowed-countries');
        Array.from(allowedCountries.selectedOptions).forEach(option => {
            restrictions.allowedCountries.push(option.value);
        });

        // Validate limits
        if (restrictions.transactionLimit && restrictions.dailyLimit && 
            restrictions.transactionLimit > restrictions.dailyLimit) {
            alert('Transaction limit cannot exceed daily limit');
            return;
        }

        if (restrictions.dailyLimit && restrictions.monthlyLimit && 
            restrictions.dailyLimit > restrictions.monthlyLimit) {
            alert('Daily limit cannot exceed monthly limit');
            return;
        }

        // Save to card
        this.card.restrictions = restrictions;
        
        // Update in storage
        const cardIndex = this.cards.findIndex(c => c.id === this.card.id);
        this.cards[cardIndex] = this.card;
        localStorage.setItem('userCards', JSON.stringify(this.cards));
        
        this.closeRestrictionsModal();
        this.showSuccess('Card restrictions updated successfully!');
    }

    resetRestrictions() {
        if (!confirm('Reset all restrictions to default settings?')) {
            return;
        }

        this.card.restrictions = {
            blockedCategories: [],
            allowedCountries: ['US'],
            blockInternational: false,
            blockOnline: false,
            dailyLimit: null,
            transactionLimit: null,
            monthlyLimit: null,
            notifications: {
                allTransactions: true,
                largeTransactions: true,
                international: true,
                declined: true,
                suspicious: true
            }
        };

        // Update in storage
        const cardIndex = this.cards.findIndex(c => c.id === this.card.id);
        this.cards[cardIndex] = this.card;
        localStorage.setItem('userCards', JSON.stringify(this.cards));

        this.loadRestrictions();
        this.showSuccess('Restrictions reset to default!');
    }

    fundCard(e) {
        e.preventDefault();
        
        const amount = parseFloat(document.getElementById('fund-amount').value);
        const source = document.getElementById('fund-source').value;
        
        if (amount <= 0) {
            alert('Please enter a valid amount');
            return;
        }
        
        if (this.card.balance + amount > this.card.spendingLimit) {
            alert('Amount exceeds spending limit');
            return;
        }
        
        // Check wallet balance if funding from wallet
        if (source === 'wallet') {
            const wallets = JSON.parse(localStorage.getItem('wallets') || '{}');
            const userWallet = wallets[this.currentUser.email];
            
            if (!userWallet || userWallet.balance < amount) {
                alert('Insufficient wallet balance');
                return;
            }
            
            // Deduct from wallet
            userWallet.balance -= amount;
            userWallet.transactions.unshift({
                id: Date.now().toString(),
                type: 'debit',
                amount: amount,
                description: `Transfer to card: ${this.card.name}`,
                date: new Date().toISOString(),
                status: 'completed'
            });
            
            localStorage.setItem('wallets', JSON.stringify(wallets));
        }
        
        // Add funds to card
        this.card.balance += amount;
        
        // Add transaction
        const transaction = {
            id: Date.now().toString(),
            type: 'credit',
            amount: amount,
            description: `Funded from ${source}`,
            date: new Date().toISOString(),
            status: 'completed'
        };
        
        this.card.transactions = this.card.transactions || [];
        this.card.transactions.unshift(transaction);
        
        // Update in storage
        const cardIndex = this.cards.findIndex(c => c.id === this.card.id);
        this.cards[cardIndex] = this.card;
        localStorage.setItem('userCards', JSON.stringify(this.cards));
        
        this.displayCard();
        this.loadTransactions();
        this.closeFundModal();
        this.showSuccess(`$${amount.toFixed(2)} added to card successfully!`);
        
        // Send notification
        if (typeof NotificationUtils !== 'undefined') {
            NotificationUtils.notifyTransaction(amount, 'Card Funding', this.card.name, 'funding');
        }
    }

    loadTransactions() {
        const transactionsList = document.getElementById('transactions-list');
        const transactions = this.card.transactions || [];
        
        if (transactions.length === 0) {
            transactionsList.innerHTML = '<div class="empty-transactions"><p>No transactions yet</p></div>';
            return;
        }
        
        transactionsList.innerHTML = transactions.slice(0, 10).map(transaction => `
            <div class="transaction-item">
                <div class="transaction-info">
                    <div class="transaction-desc">${transaction.description}</div>
                    <div class="transaction-date">${new Date(transaction.date).toLocaleDateString()}</div>
                </div>
                <div class="transaction-amount ${transaction.type}">
                    ${transaction.type === 'credit' ? '+' : '-'}$${transaction.amount.toFixed(2)}
                </div>
            </div>
        `).join('');
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

// Global functions
function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    window.location.href = 'index.html';
}

function closeFundModal() {
    cardDetails.closeFundModal();
}

function closeRestrictionsModal() {
    cardDetails.closeRestrictionsModal();
}

function saveRestrictions() {
    cardDetails.saveRestrictions();
}

function resetRestrictions() {
    cardDetails.resetRestrictions();
}

// Initialize
const cardDetails = new CardDetails();