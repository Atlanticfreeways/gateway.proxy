// Card Management System
class CardManager {
    constructor() {
        this.cards = JSON.parse(localStorage.getItem('userCards') || '[]');
        this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
        this.checkAuth();
        this.initializeEventListeners();
        this.loadCards();
    }

    checkAuth() {
        if (!this.currentUser) {
            window.location.href = 'login.html';
            return;
        }
        document.getElementById('user-name').textContent = this.currentUser.name;
    }

    initializeEventListeners() {
        document.getElementById('create-card-btn').addEventListener('click', () => this.openCreateModal());
        document.getElementById('create-card-form').addEventListener('submit', (e) => this.createCard(e));
        document.getElementById('spending-limit').addEventListener('change', (e) => this.toggleCustomLimit(e));
    }

    openCreateModal() {
        document.getElementById('create-modal').classList.remove('hidden');
    }

    closeCreateModal() {
        document.getElementById('create-modal').classList.add('hidden');
        document.getElementById('create-card-form').reset();
        document.getElementById('custom-limit').style.display = 'none';
    }

    toggleCustomLimit(e) {
        const customDiv = document.getElementById('custom-limit');
        customDiv.style.display = e.target.value === 'custom' ? 'block' : 'none';
    }

    generateCardNumber(type) {
        const prefixes = {
            visa: '4',
            mastercard: '5'
        };
        
        let cardNumber = prefixes[type];
        for (let i = 1; i < 16; i++) {
            cardNumber += Math.floor(Math.random() * 10);
        }
        return cardNumber;
    }

    generateCVV() {
        return Math.floor(100 + Math.random() * 900).toString();
    }

    generateExpiryDate() {
        const now = new Date();
        const expiry = new Date(now.getFullYear() + 3, now.getMonth());
        return `${(expiry.getMonth() + 1).toString().padStart(2, '0')}/${expiry.getFullYear().toString().slice(-2)}`;
    }

    createCard(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const cardType = formData.get('cardType');
        const cardName = document.getElementById('card-name').value;
        const spendingLimit = document.getElementById('spending-limit').value;
        const customAmount = document.getElementById('custom-amount').value;
        
        const limit = spendingLimit === 'custom' ? parseFloat(customAmount) : parseFloat(spendingLimit);
        
        const newCard = {
            id: Date.now().toString(),
            userId: this.currentUser.email,
            name: cardName,
            type: cardType,
            number: this.generateCardNumber(cardType),
            cvv: this.generateCVV(),
            expiry: this.generateExpiryDate(),
            balance: 0,
            spendingLimit: limit,
            status: 'active',
            createdAt: new Date().toISOString(),
            transactions: []
        };

        this.cards.push(newCard);
        localStorage.setItem('userCards', JSON.stringify(this.cards));
        
        this.loadCards();
        this.closeCreateModal();
        this.showSuccess('Card created successfully!');
    }

    loadCards() {
        const userCards = this.cards.filter(card => card.userId === this.currentUser.email);
        const cardsGrid = document.getElementById('cards-grid');
        const emptyState = document.getElementById('empty-state');

        if (userCards.length === 0) {
            cardsGrid.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        cardsGrid.style.display = 'grid';
        emptyState.style.display = 'none';

        cardsGrid.innerHTML = userCards.map(card => this.createCardHTML(card)).join('');
    }

    createCardHTML(card) {
        const maskedNumber = this.maskCardNumber(card.number);
        const statusClass = card.status === 'active' ? 'active' : 'frozen';
        const brandClass = card.type === 'visa' ? 'visa' : 'mastercard';

        return `
            <div class="card-item ${brandClass}" data-card-id="${card.id}">
                <div class="card-visual">
                    <div class="card-brand">${card.type.toUpperCase()}</div>
                    <div class="card-number">${maskedNumber}</div>
                    <div class="card-details">
                        <div class="card-expiry">${card.expiry}</div>
                        <div class="card-cvv">•••</div>
                    </div>
                    <div class="card-name">${card.name}</div>
                </div>
                <div class="card-info">
                    <div class="card-balance">$${card.balance.toFixed(2)} / $${card.spendingLimit.toLocaleString()}</div>
                    <div class="card-status ${statusClass}">${card.status}</div>
                </div>
                <div class="card-actions">
                    <button onclick="cardManager.viewCard('${card.id}')" class="btn-small">View</button>
                    <button onclick="cardManager.toggleCard('${card.id}')" class="btn-small ${card.status === 'active' ? 'warning' : 'success'}">
                        ${card.status === 'active' ? 'Freeze' : 'Unfreeze'}
                    </button>
                    <button onclick="cardManager.deleteCard('${card.id}')" class="btn-small danger">Delete</button>
                </div>
            </div>
        `;
    }

    maskCardNumber(number) {
        return number.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '$1 •••• •••• $4');
    }

    viewCard(cardId) {
        window.location.href = `card-details.html?id=${cardId}`;
    }

    toggleCard(cardId) {
        const card = this.cards.find(c => c.id === cardId);
        if (!card) return;

        card.status = card.status === 'active' ? 'frozen' : 'active';
        localStorage.setItem('userCards', JSON.stringify(this.cards));
        
        this.loadCards();
        this.showSuccess(`Card ${card.status === 'active' ? 'unfrozen' : 'frozen'} successfully!`);
    }

    deleteCard(cardId) {
        if (!confirm('Are you sure you want to delete this card? This action cannot be undone.')) {
            return;
        }

        this.cards = this.cards.filter(c => c.id !== cardId);
        localStorage.setItem('userCards', JSON.stringify(this.cards));
        
        this.loadCards();
        this.showSuccess('Card deleted successfully!');
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
    
    if (userMenu && !userMenu.contains(event.target)) {
        dropdown.classList.add('hidden');
    }
});

function openCreateModal() {
    cardManager.openCreateModal();
}

function closeCreateModal() {
    cardManager.closeCreateModal();
}

// Close mobile menu when clicking outside
document.addEventListener('click', function(event) {
    const navMenu = document.getElementById('nav-menu');
    const toggle = document.querySelector('.mobile-menu-toggle');
    
    if (!navMenu.contains(event.target) && !toggle.contains(event.target)) {
        navMenu.classList.remove('mobile-active');
        toggle.classList.remove('active');
    }
});

// Initialize
const cardManager = new CardManager();