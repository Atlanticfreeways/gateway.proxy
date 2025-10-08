// Support System - Live chat, tickets, and FAQ
class SupportSystem {
    constructor() {
        this.tickets = JSON.parse(localStorage.getItem('supportTickets') || '[]');
        this.chatMessages = [];
        this.initializeEventListeners();
        this.loadTickets();
        this.initializeFAQ();
    }

    initializeEventListeners() {
        // Live Chat
        document.getElementById('start-chat').addEventListener('click', () => this.openChat());
        document.getElementById('close-chat').addEventListener('click', () => this.closeChat());
        document.getElementById('send-message').addEventListener('click', () => this.sendMessage());
        document.getElementById('chat-message').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        // Support Tickets
        document.getElementById('create-ticket').addEventListener('click', () => this.openTicketModal());
        document.getElementById('close-modal').addEventListener('click', () => this.closeTicketModal());
        document.getElementById('ticket-form').addEventListener('submit', (e) => this.createTicket(e));
    }

    // Live Chat Functions
    openChat() {
        document.getElementById('chat-widget').classList.remove('hidden');
        this.addMessage('Support', 'Hello! How can I help you today?', 'support');
    }

    closeChat() {
        document.getElementById('chat-widget').classList.add('hidden');
        this.chatMessages = [];
        document.getElementById('chat-messages').innerHTML = '';
    }

    sendMessage() {
        const input = document.getElementById('chat-message');
        const message = input.value.trim();
        
        if (!message) return;
        
        this.addMessage('You', message, 'user');
        input.value = '';
        
        // Simulate support response
        setTimeout(() => {
            const responses = [
                'Thank you for your message. Let me help you with that.',
                'I understand your concern. Let me check that for you.',
                'That\'s a great question! Here\'s what I can tell you...',
                'I\'ll need to escalate this to our technical team. Expect a response within 2 hours.'
            ];
            const response = responses[Math.floor(Math.random() * responses.length)];
            this.addMessage('Support', response, 'support');
        }, 1000);
    }

    addMessage(sender, message, type) {
        const messagesContainer = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${type}`;
        messageDiv.innerHTML = `
            <div class="message-sender">${sender}</div>
            <div class="message-text">${message}</div>
            <div class="message-time">${new Date().toLocaleTimeString()}</div>
        `;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Ticket System Functions
    openTicketModal() {
        document.getElementById('ticket-modal').classList.remove('hidden');
    }

    closeTicketModal() {
        document.getElementById('ticket-modal').classList.add('hidden');
    }

    createTicket(e) {
        e.preventDefault();
        
        const ticket = {
            id: Date.now(),
            subject: document.getElementById('ticket-subject').value,
            priority: document.getElementById('ticket-priority').value,
            description: document.getElementById('ticket-description').value,
            status: 'open',
            createdAt: new Date().toISOString(),
            responses: []
        };
        
        this.tickets.push(ticket);
        localStorage.setItem('supportTickets', JSON.stringify(this.tickets));
        
        this.loadTickets();
        this.closeTicketModal();
        document.getElementById('ticket-form').reset();
        
        alert('Ticket created successfully! We\'ll respond within 24 hours.');
    }

    loadTickets() {
        const ticketsList = document.getElementById('tickets-list');
        
        if (this.tickets.length === 0) {
            ticketsList.innerHTML = '<p>No tickets found. Create your first ticket above.</p>';
            return;
        }
        
        ticketsList.innerHTML = this.tickets.map(ticket => `
            <div class="ticket-item">
                <div class="ticket-header">
                    <span class="ticket-id">#${ticket.id}</span>
                    <span class="ticket-status ${ticket.status}">${ticket.status}</span>
                    <span class="ticket-priority ${ticket.priority}">${ticket.priority}</span>
                </div>
                <div class="ticket-subject">${ticket.subject}</div>
                <div class="ticket-date">${new Date(ticket.createdAt).toLocaleDateString()}</div>
            </div>
        `).join('');
    }

    // FAQ Functions
    initializeFAQ() {
        const faqItems = document.querySelectorAll('.faq-item');
        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            const answer = item.querySelector('.faq-answer');
            
            question.addEventListener('click', () => {
                const isOpen = answer.style.display === 'block';
                
                // Close all other FAQ items
                faqItems.forEach(otherItem => {
                    otherItem.querySelector('.faq-answer').style.display = 'none';
                    otherItem.classList.remove('active');
                });
                
                // Toggle current item
                if (!isOpen) {
                    answer.style.display = 'block';
                    item.classList.add('active');
                }
            });
        });
    }
}

// Initialize support system
const supportSystem = new SupportSystem();