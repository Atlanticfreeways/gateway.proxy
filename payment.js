// Payment Integration JavaScript
// Replace with your actual keys
const STRIPE_PUBLIC_KEY = 'pk_test_your_stripe_publishable_key_here';
const PAYSTACK_PUBLIC_KEY = 'pk_test_your_paystack_public_key_here';

const stripe = Stripe(STRIPE_PUBLIC_KEY);
const elements = stripe.elements();

let currentPaymentMethod = 'stripe';
let orderTotal = 0;
let selectedCrypto = null;

// Crypto addresses (replace with real addresses)
const CRYPTO_ADDRESSES = {
    BTC: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
    ETH: '0x742d35Cc6634C0532925a3b8D4C9db96590c4C87',
    SOL: 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK',
    USDT: '0x742d35Cc6634C0532925a3b8D4C9db96590c4C87'
};

// Crypto rates (mock - replace with real API)
const CRYPTO_RATES = {
    BTC: 43000,
    ETH: 2300,
    SOL: 65,
    USDT: 1
};

// Initialize payment page
function initPayment() {
    if (!isLoggedIn()) {
        window.location.href = 'login.html?redirect=payment.html';
        return;
    }
    
    loadOrderSummary();
    setupStripeElements();
    setupPayPalButtons();
    setupPaystackPayment();
    updateWalletBalance();
}

// Load order summary from cart
function loadOrderSummary() {
    const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
    const orderItemsContainer = document.getElementById('orderItems');
    
    if (cartItems.length === 0) {
        window.location.href = 'cart.html';
        return;
    }
    
    let subtotal = 0;
    
    orderItemsContainer.innerHTML = cartItems.map(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        return `
            <div class="order-item">
                <div class="item-info">
                    <strong>${item.name}</strong>
                    <span>Qty: ${item.quantity}</span>
                </div>
                <span class="item-price">$${itemTotal.toFixed(2)}</span>
            </div>
        `;
    }).join('');
    
    const tax = subtotal * 0.08; // 8% tax
    orderTotal = subtotal + tax;
    
    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('tax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('total').textContent = `$${orderTotal.toFixed(2)}`;
}

// Setup Stripe Elements
function setupStripeElements() {
    const cardElement = elements.create('card', {
        style: {
            base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                    color: '#aab7c4',
                },
            },
        },
    });
    
    cardElement.mount('#card-element');
    
    cardElement.on('change', ({error}) => {
        const displayError = document.getElementById('card-errors');
        if (error) {
            displayError.textContent = error.message;
        } else {
            displayError.textContent = '';
        }
    });
    
    // Handle form submission
    const form = document.getElementById('payment-form');
    form.addEventListener('submit', handleStripePayment);
}

// Handle Stripe payment
async function handleStripePayment(event) {
    event.preventDefault();
    
    const submitButton = document.getElementById('submit-payment');
    const spinner = document.getElementById('spinner');
    const buttonText = document.getElementById('button-text');
    
    submitButton.disabled = true;
    spinner.classList.remove('hidden');
    buttonText.textContent = 'Processing...';
    
    try {
        // Create payment intent (in real app, this would be a server call)
        const paymentIntent = await createPaymentIntent(orderTotal);
        
        const {error} = await stripe.confirmCardPayment(paymentIntent.client_secret, {
            payment_method: {
                card: elements.getElement('card'),
                billing_details: {
                    name: document.getElementById('cardholder-name').value,
                    email: document.getElementById('email').value,
                },
            }
        });
        
        if (error) {
            showNotification(error.message, 'error');
        } else {
            handlePaymentSuccess('stripe');
        }
    } catch (err) {
        showNotification('Payment failed. Please try again.', 'error');
    }
    
    submitButton.disabled = false;
    spinner.classList.add('hidden');
    buttonText.textContent = 'Pay Now';
}

// Mock payment intent creation (replace with server call)
async function createPaymentIntent(amount) {
    // In a real application, this would be a server-side call
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({
                client_secret: 'pi_mock_client_secret_' + Math.random().toString(36).substr(2, 9)
            });
        }, 1000);
    });
}

// Setup PayPal buttons
function setupPayPalButtons() {
    if (typeof paypal !== 'undefined') {
        paypal.Buttons({
            createOrder: function(data, actions) {
                return actions.order.create({
                    purchase_units: [{
                        amount: {
                            value: orderTotal.toFixed(2)
                        }
                    }]
                });
            },
            onApprove: function(data, actions) {
                return actions.order.capture().then(function(details) {
                    handlePaymentSuccess('paypal');
                });
            },
            onError: function(err) {
                showNotification('PayPal payment failed. Please try again.', 'error');
            }
        }).render('#paypal-button-container');
    }
}

// Switch payment method
function switchPaymentMethod(method) {
    currentPaymentMethod = method;
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Show/hide payment forms
    document.querySelectorAll('.payment-form').forEach(form => form.classList.remove('active'));
    document.getElementById(`${method}-payment`).classList.add('active');
    
    // Update wallet balance if wallet method selected
    if (method === 'wallet') {
        updateWalletBalance();
    }
}

// Update wallet balance
function updateWalletBalance() {
    const wallet = JSON.parse(localStorage.getItem('userWallet')) || { balance: 0 };
    const balanceElement = document.getElementById('walletBalance');
    const insufficientElement = document.getElementById('insufficientFunds');
    const payButton = document.getElementById('pay-with-wallet');
    
    if (balanceElement) {
        balanceElement.textContent = wallet.balance.toFixed(2);
        
        if (wallet.balance < orderTotal) {
            insufficientElement.style.display = 'block';
            payButton.disabled = true;
            payButton.textContent = 'Insufficient Balance';
        } else {
            insufficientElement.style.display = 'none';
            payButton.disabled = false;
            payButton.textContent = `Pay $${orderTotal.toFixed(2)} with Wallet`;
        }
    }
}

// Handle wallet payment
function handleWalletPayment() {
    const wallet = JSON.parse(localStorage.getItem('userWallet')) || { balance: 0 };
    
    if (wallet.balance >= orderTotal) {
        showNotification('Processing wallet payment...', 'info');
        
        setTimeout(() => {
            // Deduct from wallet
            wallet.balance -= orderTotal;
            wallet.transactions.unshift({
                id: Date.now(),
                type: 'purchase',
                amount: orderTotal,
                description: 'Proxy plan purchase',
                date: new Date().toISOString(),
                status: 'completed'
            });
            
            localStorage.setItem('userWallet', JSON.stringify(wallet));
            handlePaymentSuccess('wallet');
        }, 2000);
    } else {
        showNotification('Insufficient wallet balance', 'error');
    }
}

// Setup Paystack payment
function setupPaystackPayment() {
    document.getElementById('pay-with-paystack')?.addEventListener('click', handlePaystackPayment);
}

// Handle Paystack payment
function handlePaystackPayment() {
    const handler = PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: currentUser.email,
        amount: orderTotal * 100, // Amount in kobo
        currency: 'USD',
        callback: function(response) {
            handlePaymentSuccess('paystack');
        },
        onClose: function() {
            showNotification('Payment cancelled', 'info');
        }
    });
    handler.openIframe();
}

// Select cryptocurrency
function selectCrypto(crypto) {
    selectedCrypto = crypto;
    const cryptoAmount = (orderTotal / CRYPTO_RATES[crypto]).toFixed(8);
    
    document.getElementById('selectedCrypto').textContent = crypto;
    document.getElementById('cryptoAmount').textContent = cryptoAmount;
    document.getElementById('cryptoAddress').textContent = CRYPTO_ADDRESSES[crypto];
    document.getElementById('crypto-details').style.display = 'block';
    
    // Highlight selected crypto
    document.querySelectorAll('.crypto-option').forEach(option => {
        option.classList.remove('selected');
    });
    event.target.closest('.crypto-option').classList.add('selected');
    
    generateQRCode(CRYPTO_ADDRESSES[crypto]);
}

// Copy crypto address
function copyCryptoAddress() {
    const address = document.getElementById('cryptoAddress').textContent;
    navigator.clipboard.writeText(address).then(() => {
        showNotification('Crypto address copied to clipboard', 'success');
    });
}

// Generate QR code (mock implementation)
function generateQRCode(address) {
    document.getElementById('qrCode').innerHTML = `
        <div style="width:150px;height:150px;background:#f0f0f0;display:flex;align-items:center;justify-content:center;border:1px solid #ddd;margin:1rem auto">
            QR Code<br>${address.substring(0, 8)}...
        </div>
    `;
}

// Verify crypto payment
function verifyCryptoPayment() {
    showNotification('Verifying crypto payment...', 'info');
    
    // Mock verification (replace with real blockchain verification)
    setTimeout(() => {
        const verified = Math.random() > 0.2; // 80% success rate
        if (verified) {
            handlePaymentSuccess('crypto');
        } else {
            showNotification('Payment not yet confirmed. Please wait or try again.', 'error');
        }
    }, 3000);
}

// Handle successful payment
function handlePaymentSuccess(method) {
    showNotification(`Payment successful via ${method}!`, 'success');
    
    // Clear cart
    const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
    localStorage.removeItem('cart');
    
    // Update user purchase history
    const purchaseHistory = JSON.parse(localStorage.getItem('purchaseHistory')) || [];
    purchaseHistory.unshift({
        id: Date.now(),
        date: new Date().toISOString(),
        method: method,
        amount: orderTotal,
        status: 'completed',
        items: cartItems,
        crypto: selectedCrypto
    });
    localStorage.setItem('purchaseHistory', JSON.stringify(purchaseHistory));
    
    // Redirect to success page
    setTimeout(() => {
        window.location.href = 'payment-success.html';
    }, 2000);
}

// Webhook handling (mock implementation)
function handleWebhook(event) {
    switch (event.type) {
        case 'payment_intent.succeeded':
            console.log('Payment succeeded:', event.data.object);
            break;
        case 'payment_intent.payment_failed':
            console.log('Payment failed:', event.data.object);
            break;
        default:
            console.log('Unhandled event type:', event.type);
    }
}

// Payment validation
function validatePayment(paymentData) {
    const requiredFields = ['amount', 'currency', 'payment_method'];
    
    for (const field of requiredFields) {
        if (!paymentData[field]) {
            throw new Error(`Missing required field: ${field}`);
        }
    }
    
    if (paymentData.amount <= 0) {
        throw new Error('Invalid payment amount');
    }
    
    return true;
}

// Event listeners
document.addEventListener('DOMContentLoaded', initPayment);

document.getElementById('pay-with-wallet')?.addEventListener('click', handleWalletPayment);
document.getElementById('verify-crypto-payment')?.addEventListener('click', verifyCryptoPayment);

// Initialize payment page
if (window.location.pathname.includes('payment.html')) {
    document.addEventListener('DOMContentLoaded', initPayment);
}