const users={'admin@gateways.com':{password:'admin123',role:'admin',name:'Admin User'},'customer@test.com':{password:'customer123',role:'customer',name:'Test Customer'}};
// Google Sheets CSV URL - Replace with your published sheet URL
// Example: 'https://docs.google.com/spreadsheets/d/1ABC123.../export?format=csv&gid=0'
const PRODUCTS_SHEET_URL = 'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/export?format=csv&gid=0';

let products = [];

// Load products from Google Sheets
async function loadProductsFromSheet() {
    try {
        const response = await fetch(PRODUCTS_SHEET_URL);
        const csvText = await response.text();
        const rows = csvText.split('\n').slice(1); // Skip header
        
        products = rows.filter(row => row.trim()).map((row, index) => {
            const [id, name, price, bandwidth, connections, description] = row.split(',');
            return {
                id: parseInt(id) || index + 1,
                name: name?.replace(/"/g, '') || 'Product',
                price: parseFloat(price) || 0,
                bandwidth: bandwidth?.replace(/"/g, '') || '10 GB',
                connections: connections?.replace(/"/g, '') || '5',
                description: description?.replace(/"/g, '') || 'Description',
                features: ['HTTP/HTTPS Support', 'Global Locations', '24/7 Support']
            };
        });
        
        if (window.location.pathname.includes('products.html')) {
            displayProducts();
        }
    } catch (error) {
        console.error('Failed to load products from sheet:', error);
        // Fallback to default products
        products = [
            {id:1,name:'Starter',price:15,bandwidth:'10 GB',connections:'5',description:'Perfect for small projects',features:['HTTP/HTTPS Support','Basic Locations','Email Support']},
            {id:2,name:'Professional',price:45,bandwidth:'50 GB',connections:'25',description:'Great for growing businesses',features:['SOCKS5 Support','All Locations','Priority Support','API Access']},
            {id:3,name:'Enterprise',price:150,bandwidth:'200 GB',connections:'100',description:'For large-scale operations',features:['Dedicated IPs','Custom Locations','24/7 Phone Support','Custom Integration']}
        ];
    }
}
let cart=JSON.parse(localStorage.getItem('cart'))||[],currentUser=JSON.parse(localStorage.getItem('currentUser'))||null,isDarkTheme=localStorage.getItem('darkTheme')==='true';

function toggleTheme(){isDarkTheme=!isDarkTheme;localStorage.setItem('darkTheme',isDarkTheme);document.body.classList.toggle('dark-theme',isDarkTheme);updateThemeButton()}
function updateThemeButton(){const t=document.getElementById('themeBtn');t&&(t.textContent=isDarkTheme?'☀️':'🌙')}

function addToCart(e){const t=products.find(t=>t.id===e);if(t){const item={...t,quantity:1};const n=cart.find(t=>t.id===e);n?n.quantity+=1:cart.push(item);localStorage.setItem('cart',JSON.stringify(cart));updateCartCount();showNotification(`${t.name} plan added to cart!`,'success')}}

function removeFromCart(e){cart=cart.filter(t=>t.id!==e);localStorage.setItem('cart',JSON.stringify(cart));updateCartCount();window.location.pathname.includes('cart.html')&&displayCart()}

function updateCartCount(){const e=document.getElementById('cartCount');if(e){const t=cart.reduce((e,t)=>e+t.quantity,0);e.textContent=t;e.style.display=t>0?'inline':'none'}}

function showNotification(message,type='info'){const notification=document.createElement('div');notification.style.cssText=`position:fixed;top:80px;left:50%;transform:translateX(-50%);padding:1rem 2rem;border-radius:10px;color:white;font-weight:600;z-index:10000;animation:slideDown 0.3s ease;box-shadow:0 4px 20px rgba(0,0,0,0.2);`;notification.style.background=type==='success'?'linear-gradient(135deg,#00b894,#00cec9)':type==='error'?'linear-gradient(135deg,#fd79a8,#e84393)':'linear-gradient(135deg,#74b9ff,#0984e3)';notification.textContent=message;document.body.appendChild(notification);setTimeout(()=>{notification.style.animation='slideUp 0.3s ease';setTimeout(()=>document.body.removeChild(notification),300)},2500)}

function login(email, password) {
    const user = users[email];
    if (user && user.password === password) {
        // Update login time
        user.lastLogin = new Date().toISOString();
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        return true;
    }
    return false;
}

// Google OAuth Client ID
const GOOGLE_CLIENT_ID = '80931319066-b923kattjuj7dqnsc9no94de2m77kejv.apps.googleusercontent.com';

function initGoogleAuth() {
    if (typeof google !== 'undefined' && google.accounts) {
        google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleSignIn
        });
        
        const googleBtn = document.getElementById('google-signin-btn');
        if (googleBtn) {
            google.accounts.id.renderButton(googleBtn, {
                theme: 'outline',
                size: 'large'
            });
        }
    }
}

function handleGoogleSignIn(response) {
    try {
        const payload = JSON.parse(atob(response.credential.split('.')[1]));
        
        // Check if user exists or create new one
        let user = users[payload.email];
        if (!user) {
            // Create new user from Google data
            user = {
                email: payload.email,
                name: payload.name,
                role: 'customer',
                provider: 'google',
                picture: payload.picture,
                verified: true,
                joinDate: new Date().toISOString(),
                lastLogin: new Date().toISOString()
            };
            users[payload.email] = user;
            showNotification(`Welcome ${user.name}! Account created successfully.`, 'success');
        } else {
            // Update existing user login time
            user.lastLogin = new Date().toISOString();
            showNotification(`Welcome back, ${user.name}!`, 'success');
        }
        
        // Set current user and redirect
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Redirect based on role and intended destination
        setTimeout(() => {
            const redirectUrl = getRedirectUrl();
            window.location.href = redirectUrl;
        }, 1000);
        
    } catch (error) {
        console.error('Google Sign-In error:', error);
        showNotification('Authentication failed. Please try again.', 'error');
    }
}

function loginWithGoogle() {
    if (typeof google !== 'undefined' && google.accounts) {
        google.accounts.id.prompt();
    } else {
        showNotification('Google Sign-In is loading. Please wait...', 'info');
        setTimeout(() => {
            if (typeof google !== 'undefined' && google.accounts) {
                google.accounts.id.prompt();
            } else {
                showNotification('Google Sign-In unavailable. Please use email login.', 'error');
            }
        }, 2000);
    }
}

function register(name, email, password, phone) {
    if (users[email]) {
        showNotification('Account already exists. Please login instead.', 'error');
        return false;
    }
    
    const newUser = {
        email: email,
        name: name,
        password: password,
        phone: phone || null,
        role: 'customer',
        provider: 'email',
        verified: false,
        joinDate: new Date().toISOString(),
        lastLogin: new Date().toISOString()
    };
    
    users[email] = newUser;
    currentUser = newUser;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    showNotification('Account created successfully! Welcome to Gateways!', 'success');
    return true;
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('cart'); // Clear cart on logout
    showNotification('Logged out successfully', 'info');
    setTimeout(() => window.location.href = 'index.html', 500);
}
function isLoggedIn() {
    return currentUser !== null && currentUser !== undefined;
}

// Get redirect URL based on user role and intended destination
function getRedirectUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get('redirect');
    
    // If there's a specific redirect, use it (for protected pages)
    if (redirect && isValidRedirect(redirect)) {
        return redirect;
    }
    
    // Default redirects based on role
    if (currentUser.role === 'admin') {
        return 'admin.html';
    }
    
    return 'dashboard.html';
}

// Validate redirect URLs to prevent open redirect attacks
function isValidRedirect(url) {
    const validPages = ['dashboard.html', 'admin.html', 'cart.html', 'products.html'];
    return validPages.includes(url) || url.startsWith('#');
}

// Protect pages that require authentication
function requireAuth() {
    if (!isLoggedIn()) {
        const currentPage = window.location.pathname.split('/').pop();
        showNotification('Please login to access this page', 'error');
        setTimeout(() => {
            window.location.href = `login.html?redirect=${currentPage}`;
        }, 1000);
        return false;
    }
    return true;
}

// Check session validity (in real app, verify with server)
function validateSession() {
    if (currentUser && currentUser.lastLogin) {
        const lastLogin = new Date(currentUser.lastLogin);
        const now = new Date();
        const hoursSinceLogin = (now - lastLogin) / (1000 * 60 * 60);
        
        // Session expires after 24 hours
        if (hoursSinceLogin > 24) {
            logout();
            showNotification('Session expired. Please login again.', 'info');
            return false;
        }
    }
    return true;
}

function displayProducts(){const e=document.getElementById('productsContainer');e&&(e.innerHTML=products.map(e=>`<div class="product-card"><h3>${e.name}</h3><div class="price">$${e.price}<span style="font-size:1rem;color:#636e72">/month</span></div><p style="margin:1rem 0;color:#636e72">${e.description}</p><div style="margin:1.5rem 0"><div style="color:#667eea;font-weight:600;margin-bottom:0.5rem">Includes:</div><div style="color:#636e72;margin-bottom:0.5rem">• ${e.bandwidth} bandwidth</div><div style="color:#636e72;margin-bottom:0.5rem">• ${e.connections} concurrent connections</div></div><ul style="margin:1rem 0;padding-left:0;list-style:none">${e.features.map(t=>`<li style="margin-bottom:0.5rem;color:#636e72;font-size:0.9rem">✓ ${t}</li>`).join('')}</ul><button onclick="addToCart(${e.id})" class="btn" style="width:100%;padding:0.75rem">Choose Plan</button></div>`).join(''))}

function displayCart(){const e=document.getElementById('cartContainer');if(e){if(0===cart.length)return void(e.innerHTML='<div class="section"><p style="text-align:center;font-size:1.2rem;color:#636e72">Your cart is empty</p><div style="text-align:center;margin-top:2rem"><a href="products.html" class="btn">Browse Plans</a></div></div>');const t=cart.reduce((e,t)=>e+t.price*t.quantity,0);e.innerHTML=`${cart.map(e=>`<div class="cart-item"><div><h4>${e.name} Plan</h4><p style="color:#636e72">$${e.price}/month × ${e.quantity} = $${e.price*e.quantity}/month</p><p style="color:#636e72;font-size:0.9rem">${e.bandwidth} bandwidth • ${e.connections} connections</p></div><div style="display:flex;gap:1rem;align-items:center"><button onclick="updateQuantity('${e.id}',-1)" class="btn-secondary" style="padding:0.5rem 1rem">-</button><span style="font-weight:bold">${e.quantity}</span><button onclick="updateQuantity('${e.id}',1)" class="btn-secondary" style="padding:0.5rem 1rem">+</button><button onclick="removeFromCart('${e.id}')" class="btn-danger">Remove</button></div></div>`).join('')}<div class="cart-total"><h3>Total: $${t}/month</h3><p style="margin:1rem 0;color:#636e72">Monthly subscription with instant access</p><button onclick="checkout()" class="btn" style="font-size:1.1rem;padding:1.2rem 3rem">Complete Purchase</button></div>`;updateCartSummary(t)}}

function updateQuantity(e,t){const n=cart.find(t=>t.id===e);n&&(n.quantity+=t,n.quantity<=0?removeFromCart(e):(localStorage.setItem('cart',JSON.stringify(cart)),updateCartCount(),displayCart()))}

function updateCartSummary(total){const subtotalEl=document.getElementById('subtotal'),totalEl=document.getElementById('total'),billingNote=document.getElementById('billingNote');subtotalEl&&(subtotalEl.textContent=`$${total}`);totalEl&&(totalEl.textContent=`$${total}`);billingNote&&(billingNote.innerHTML='<strong>💳 Monthly Billing:</strong> Subscriptions auto-renew monthly. Cancel anytime.')

function checkout() {
    if (!isLoggedIn()) {
        showNotification('Please login to checkout', 'error');
        setTimeout(() => window.location.href = 'login.html?redirect=cart.html', 1000);
        return;
    }
    
    if (cart.length === 0) {
        showNotification('Your cart is empty', 'error');
        return;
    }
    
    // Redirect to comprehensive payment page
    window.location.href = 'payment.html';
}

function completeCheckout(total, method) {
    showNotification(`Payment successful via ${method}! Total: $${total}/month. Access details sent to ${currentUser.email}`, 'success');
    
    // Clear cart and update user
    cart = [];
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    
    // Update user with purchase info
    currentUser.hasPurchase = true;
    currentUser.lastPurchase = new Date().toISOString();
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    setTimeout(() => window.location.href = 'dashboard.html', 2000);
}

function initPage() {
    // Validate session on page load
    validateSession();
    
    document.body.classList.toggle('dark-theme', isDarkTheme);
    updateThemeButton();
    updateCartCount();
    
    const navUser = document.getElementById('navUser');
    if (navUser) {
        if (isLoggedIn()) {
            navUser.innerHTML = `
                <div style="display:flex;align-items:center;gap:1rem">
                    ${currentUser.picture ? `<img src="${currentUser.picture}" style="width:32px;height:32px;border-radius:50%" alt="Profile">` : ''}
                    <span style="color:#667eea;font-weight:600">Welcome, ${currentUser.name}</span>
                    <a href="dashboard.html" style="background:rgba(102,126,234,0.1);color:#667eea;border-radius:20px;padding:0.5rem 1rem;text-decoration:none">Dashboard</a>
                    <button onclick="logout()" class="btn" style="padding:0.5rem 1rem">Logout</button>
                </div>
            `;
        } else {
            navUser.innerHTML = `
                <a href="login.html" style="color:#667eea;text-decoration:none;padding:0.5rem 1rem">Login</a>
                <a href="register.html" class="btn" style="padding:0.5rem 1rem">Get Started</a>
            `;
        }
    }
    
    // Protect certain pages
    const currentPage = window.location.pathname.split('/').pop();
    const protectedPages = ['dashboard.html', 'admin.html', 'cart.html'];
    
    if (protectedPages.includes(currentPage)) {
        requireAuth();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    initPage();
    loadProductsFromSheet();
    
    // Load Google Identity Services
    if (!document.querySelector('script[src*="accounts.google.com"]')) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = initGoogleAuth;
        document.head.appendChild(script);
    } else {
        initGoogleAuth();
    }
    
    if (window.location.pathname.includes('cart.html')) displayCart();
    if (window.location.pathname.includes('products.html')) displayProducts();
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            if (login(email, password)) {
                showNotification('Login successful! Welcome back!', 'success');
                setTimeout(() => {
                    const redirectUrl = getRedirectUrl();
                    window.location.href = redirectUrl;
                }, 1000);
            } else {
                showNotification('Invalid email or password. Please try again.', 'error');
            }
        });
    }
    
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const phone = document.getElementById('phone')?.value;
            
            if (register(name, email, password, phone)) {
                setTimeout(() => {
                    const redirectUrl = getRedirectUrl();
                    window.location.href = redirectUrl;
                }, 1500);
            }
        });
    }
});

const style=document.createElement('style');style.textContent='@keyframes slideDown{from{transform:translate(-50%,-100%);opacity:0}to{transform:translate(-50%,0);opacity:1}}@keyframes slideUp{from{transform:translate(-50%,0);opacity:1}to{transform:translate(-50%,-100%);opacity:0}}';document.head.appendChild(style);