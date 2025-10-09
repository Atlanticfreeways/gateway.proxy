// Support Center System
class SupportCenter {
    constructor() {
        this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
        this.currentTab = 'articles';
        this.articles = this.getArticles();
        
        this.checkAuth();
        this.initializeEventListeners();
    }

    checkAuth() {
        if (!this.currentUser) {
            window.location.href = 'login.html';
            return;
        }
        document.getElementById('user-name').textContent = this.currentUser.name;
    }

    initializeEventListeners() {
        document.getElementById('support-form').addEventListener('submit', (e) => this.submitSupportForm(e));
        document.getElementById('search-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchArticles();
        });
    }

    getArticles() {
        return {
            'getting-started': [
                { title: 'Welcome to Freeway Cards', content: 'Learn how to get started with your virtual card platform...' },
                { title: 'Setting up your account', content: 'Complete guide to account setup and verification...' },
                { title: 'Understanding account types', content: 'Differences between Individual and Business accounts...' },
                { title: 'First steps after signup', content: 'What to do after creating your account...' },
                { title: 'Platform overview', content: 'Navigate the Freeway Cards dashboard and features...' }
            ],
            'cards': [
                { title: 'Creating your first virtual card', content: 'Step-by-step guide to card creation...' },
                { title: 'Card types: Visa vs Mastercard', content: 'Choose the right card type for your needs...' },
                { title: 'Setting spending limits', content: 'Configure and manage card spending limits...' },
                { title: 'Card restrictions and controls', content: 'Block merchants, countries, and transaction types...' },
                { title: 'Freezing and unfreezing cards', content: 'Temporarily disable cards for security...' },
                { title: 'Funding your cards', content: 'Add money to your cards from wallet or bank...' },
                { title: 'Card transaction history', content: 'View and manage your card transactions...' },
                { title: 'Deleting cards safely', content: 'How to properly remove cards from your account...' }
            ],
            'wallet': [
                { title: 'Wallet overview', content: 'Understanding your Freeway Cards wallet...' },
                { title: 'Funding with cryptocurrency', content: 'Add funds using BTC, USDT, and ETH...' },
                { title: 'Bank transfers and ACH', content: 'Fund your wallet via bank transfer...' },
                { title: 'Withdrawal process', content: 'How to withdraw funds to your bank account...' },
                { title: 'Transaction fees explained', content: 'Understanding all fees and charges...' },
                { title: 'QR code payments', content: 'Using QR codes for crypto funding...' }
            ],
            'security': [
                { title: 'Account security best practices', content: 'Keep your account safe and secure...' },
                { title: 'Two-factor authentication', content: 'Enable 2FA for enhanced security...' },
                { title: 'Password management', content: 'Creating and managing strong passwords...' },
                { title: 'Recognizing phishing attempts', content: 'Stay safe from fraudulent communications...' }
            ],
            'business': [
                { title: 'Business account features', content: 'Explore business-specific tools and features...' },
                { title: 'Team management', content: 'Add and manage team members...' },
                { title: 'Expense tracking', content: 'Monitor and categorize business expenses...' }
            ],
            'troubleshooting': [
                { title: 'Login issues', content: 'Troubleshoot common login problems...' },
                { title: 'Card not working', content: 'Fix issues with card transactions...' },
                { title: 'Payment failures', content: 'Resolve funding and payment problems...' },
                { title: 'Browser compatibility', content: 'Ensure your browser works with our platform...' },
                { title: 'Mobile app issues', content: 'Troubleshoot mobile-specific problems...' },
                { title: 'Notification problems', content: 'Fix notification delivery issues...' },
                { title: 'Account verification delays', content: 'What to do if KYC verification is delayed...' }
            ]
        };
    }

    showTab(tab) {
        this.currentTab = tab;
        
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.textContent.toLowerCase().includes(tab)) {
                btn.classList.add('active');
            }
        });
        
        // Show/hide content
        document.querySelectorAll('.support-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tab}-tab`).classList.add('active');
        
        // Reset to categories view if on articles tab
        if (tab === 'articles') {
            this.showCategories();
        }
    }

    showCategory(category) {
        const articles = this.articles[category] || [];
        const categoryTitles = {
            'getting-started': 'Getting Started',
            'cards': 'Virtual Cards',
            'wallet': 'Wallet & Payments',
            'security': 'Security & Privacy',
            'business': 'Business Features',
            'troubleshooting': 'Troubleshooting'
        };
        
        document.querySelector('.categories-grid').classList.add('hidden');
        document.getElementById('articles-list').classList.remove('hidden');
        document.getElementById('search-results').classList.add('hidden');
        
        document.getElementById('category-title').textContent = categoryTitles[category];
        
        const articlesContent = document.getElementById('articles-content');
        articlesContent.innerHTML = articles.map(article => `
            <div class="article-item" onclick="openArticle('${article.title}', '${article.content}')">
                <h3>${article.title}</h3>
                <p>${article.content.substring(0, 100)}...</p>
                <span class="read-more">Read more →</span>
            </div>
        `).join('');
    }

    showCategories() {
        document.querySelector('.categories-grid').classList.remove('hidden');
        document.getElementById('articles-list').classList.add('hidden');
        document.getElementById('search-results').classList.add('hidden');
        document.getElementById('search-input').value = '';
    }

    searchArticles() {
        const query = document.getElementById('search-input').value.toLowerCase().trim();
        
        if (!query) {
            this.showCategories();
            return;
        }
        
        const results = [];
        Object.keys(this.articles).forEach(category => {
            this.articles[category].forEach(article => {
                if (article.title.toLowerCase().includes(query) || 
                    article.content.toLowerCase().includes(query)) {
                    results.push({ ...article, category });
                }
            });
        });
        
        document.querySelector('.categories-grid').classList.add('hidden');
        document.getElementById('articles-list').classList.add('hidden');
        document.getElementById('search-results').classList.remove('hidden');
        
        const searchContent = document.getElementById('search-content');
        if (results.length === 0) {
            searchContent.innerHTML = `
                <div class="no-results">
                    <h3>No results found</h3>
                    <p>Try different keywords or browse our categories</p>
                </div>
            `;
        } else {
            searchContent.innerHTML = results.map(article => `
                <div class="article-item" onclick="openArticle('${article.title}', '${article.content}')">
                    <h3>${article.title}</h3>
                    <p>${article.content.substring(0, 100)}...</p>
                    <span class="category-tag">${article.category.replace('-', ' ')}</span>
                    <span class="read-more">Read more →</span>
                </div>
            `).join('');
        }
    }

    clearSearch() {
        document.getElementById('search-input').value = '';
        this.showCategories();
    }

    openArticle(title, content) {
        // Create modal for article
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content article-modal">
                <div class="modal-header">
                    <h2>${title}</h2>
                    <button onclick="this.closest('.modal').remove()">×</button>
                </div>
                <div class="article-content">
                    <p>${content}</p>
                    <div class="article-actions">
                        <button onclick="this.closest('.modal').remove()" class="btn btn-secondary">Close</button>
                        <button onclick="this.reportHelpful('${title}')" class="btn btn-primary">Was this helpful?</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    toggleFAQ(element) {
        const faqItem = element.parentElement;
        const answer = faqItem.querySelector('.faq-answer');
        const toggle = element.querySelector('.faq-toggle');
        
        if (faqItem.classList.contains('active')) {
            faqItem.classList.remove('active');
            answer.style.maxHeight = '0';
            toggle.textContent = '+';
        } else {
            // Close other open FAQs
            document.querySelectorAll('.faq-item.active').forEach(item => {
                item.classList.remove('active');
                item.querySelector('.faq-answer').style.maxHeight = '0';
                item.querySelector('.faq-toggle').textContent = '+';
            });
            
            faqItem.classList.add('active');
            answer.style.maxHeight = answer.scrollHeight + 'px';
            toggle.textContent = '−';
        }
    }

    showContactForm() {
        document.getElementById('contact-form').classList.remove('hidden');
    }

    hideContactForm() {
        document.getElementById('contact-form').classList.add('hidden');
        document.getElementById('support-form').reset();
    }

    startLiveChat() {
        // Simulate live chat
        alert('Live chat feature will be available soon! For now, please use the contact form or email support.');
    }

    submitSupportForm(e) {
        e.preventDefault();
        
        const formData = {
            subject: document.getElementById('subject').value,
            priority: document.getElementById('priority').value,
            message: document.getElementById('message').value,
            attachLogs: document.getElementById('attach-logs').checked,
            timestamp: new Date().toISOString(),
            user: this.currentUser.email
        };
        
        // Save to localStorage (in production, send to server)
        const tickets = JSON.parse(localStorage.getItem('supportTickets') || '[]');
        const ticket = {
            id: 'TICKET-' + Date.now(),
            ...formData,
            status: 'open'
        };
        
        tickets.push(ticket);
        localStorage.setItem('supportTickets', JSON.stringify(tickets));
        
        // Send notification
        if (typeof NotificationUtils !== 'undefined') {
            NotificationUtils.createNotification(
                'support',
                'system',
                'Support Ticket Created',
                `Your ticket ${ticket.id} has been submitted. We'll respond within 24 hours.`,
                { ticketId: ticket.id }
            );
        }
        
        this.showSuccess(`Support ticket ${ticket.id} created successfully! We'll respond within 24 hours.`);
        this.hideContactForm();
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
            max-width: 400px;
        `;
        
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 5000);
    }
}

// Global functions
function showTab(tab) {
    supportCenter.showTab(tab);
}

function showCategory(category) {
    supportCenter.showCategory(category);
}

function showCategories() {
    supportCenter.showCategories();
}

function searchArticles() {
    supportCenter.searchArticles();
}

function clearSearch() {
    supportCenter.clearSearch();
}

function openArticle(title, content) {
    supportCenter.openArticle(title, content);
}

function toggleFAQ(element) {
    supportCenter.toggleFAQ(element);
}

function showContactForm() {
    supportCenter.showContactForm();
}

function hideContactForm() {
    supportCenter.hideContactForm();
}

function startLiveChat() {
    supportCenter.startLiveChat();
}

function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    window.location.href = 'index.html';
}

function toggleMobileMenu() {
    const navMenu = document.getElementById('nav-menu');
    const toggle = document.querySelector('.mobile-menu-toggle');
    navMenu.classList.toggle('mobile-active');
    toggle.classList.toggle('active');
}

function toggleUserMenu() {
    const dropdown = document.getElementById('user-dropdown-menu');
    dropdown.classList.toggle('hidden');
}

// Initialize
const supportCenter = new SupportCenter();