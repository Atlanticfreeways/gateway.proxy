const users={'admin@gateways.com':{password:'admin123',role:'admin',name:'Admin User'},'customer@test.com':{password:'customer123',role:'customer',name:'Test Customer'}};
// Google Sheets CSV URL - Replace with your published sheet URL
const PRODUCTS_SHEET_URL = 'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/export?format=csv&gid=0';

let products = [];

// Load products from Google Sheets
async function loadProductsFromSheet() {
    try {
        const response = await fetch(PRODUCTS_SHEET_URL);
        const csvText = await response.text();
        const rows = csvText.split('\n').slice(1); // Skip header
        
        products = rows.filter(row => row.trim()).map((row, index) => {
            const [id, name, subscriptionPrice, payAsYouGoPrice, description] = row.split(',');
            return {
                id: parseInt(id) || index + 1,
                name: name?.replace(/"/g, '') || 'Product',
                subscriptionPrice: parseFloat(subscriptionPrice) || 0,
                payAsYouGoPrice: parseFloat(payAsYouGoPrice) || 0,
                description: description?.replace(/"/g, '') || 'Description',
                features: ['High performance', 'Global locations', '24/7 support'],
                subscriptionFeatures: ['Monthly allocation', 'Priority support', 'Advanced features'],
                payAsYouGoFeatures: ['Pay per use', 'No commitment', 'Instant activation']
            };
        });
        
        if (window.location.pathname.includes('products.html')) {
            displayProducts();
        }
    } catch (error) {
        console.error('Failed to load products from sheet:', error);
        // Fallback to default products
        products = [
            {id:1,name:'SOCKS5 Proxies',subscriptionPrice:25,payAsYouGoPrice:0.05,description:'High-performance SOCKS5 proxies',features:['SOCKS5 protocol','Authentication','99.9% uptime'],subscriptionFeatures:['50 proxies/month','Unlimited bandwidth','Priority support'],payAsYouGoFeatures:['$0.05 per proxy','Pay per use','No commitment']}
        ];
    }
}
let cart=JSON.parse(localStorage.getItem('cart'))||[],currentUser=JSON.parse(localStorage.getItem('currentUser'))||null,isDarkTheme=localStorage.getItem('darkTheme')==='true';

function toggleTheme(){isDarkTheme=!isDarkTheme;localStorage.setItem('darkTheme',isDarkTheme);document.body.classList.toggle('dark-theme',isDarkTheme);updateThemeButton()}
function updateThemeButton(){const t=document.getElementById('themeBtn');t&&(t.textContent=isDarkTheme?'☀️':'🌙')}

function addSubscriptionToCart(e){const t=products.find(t=>t.id===e);if(t){const subscriptionItem={...t,id:e+'_sub',name:t.name+' (Subscription)',price:t.subscriptionPrice,type:'subscription',features:t.subscriptionFeatures,quantity:1};const n=cart.find(t=>t.id===subscriptionItem.id);n?n.quantity+=1:cart.push(subscriptionItem);localStorage.setItem('cart',JSON.stringify(cart));updateCartCount();showNotification(`${t.name} subscription added to cart!`,'success')}}function addPayAsYouGoToCart(e){const t=products.find(t=>t.id===e);if(t){const credits=prompt(`How many ${t.name.toLowerCase()} do you want to buy? (Price: $${t.payAsYouGoPrice} each)`,10);if(credits&&credits>0){const payAsYouGoItem={...t,id:e+'_payg',name:t.name+' Credits',price:t.payAsYouGoPrice*credits,type:'payAsYouGo',originalPrice:t.payAsYouGoPrice,credits:parseInt(credits),quantity:1};const n=cart.find(t=>t.id===payAsYouGoItem.id);n?(n.credits+=parseInt(credits),n.price+=t.payAsYouGoPrice*credits):cart.push(payAsYouGoItem);localStorage.setItem('cart',JSON.stringify(cart));updateCartCount();showNotification(`${credits} ${t.name} credits added to cart!`,'success')}}}

function removeFromCart(e){cart=cart.filter(t=>t.id!==e);localStorage.setItem('cart',JSON.stringify(cart));updateCartCount();window.location.pathname.includes('cart.html')&&displayCart()}

function updateCartCount(){const e=document.getElementById('cartCount');if(e){const t=cart.reduce((e,t)=>e+t.quantity,0);e.textContent=t;e.style.display=t>0?'inline':'none'}}

function showNotification(message,type='info'){const notification=document.createElement('div');notification.style.cssText=`position:fixed;top:80px;left:50%;transform:translateX(-50%);padding:1rem 2rem;border-radius:10px;color:white;font-weight:600;z-index:10000;animation:slideDown 0.3s ease;box-shadow:0 4px 20px rgba(0,0,0,0.2);`;notification.style.background=type==='success'?'linear-gradient(135deg,#00b894,#00cec9)':type==='error'?'linear-gradient(135deg,#fd79a8,#e84393)':'linear-gradient(135deg,#74b9ff,#0984e3)';notification.textContent=message;document.body.appendChild(notification);setTimeout(()=>{notification.style.animation='slideUp 0.3s ease';setTimeout(()=>document.body.removeChild(notification),300)},2500)}

function login(e,t){const n=users[e];return!!(n&&n.password===t)&&(currentUser={email:e,...n},localStorage.setItem('currentUser',JSON.stringify(currentUser)),!0)}

// Google OAuth Configuration - REPLACE WITH YOUR REAL CLIENT ID
const GOOGLE_CLIENT_ID = 'YOUR_ACTUAL_CLIENT_ID_HERE.apps.googleusercontent.com';

// INSTRUCTIONS:
// 1. Go to https://console.cloud.google.com/
// 2. Create OAuth 2.0 Client ID
// 3. Replace 'YOUR_ACTUAL_CLIENT_ID_HERE' with your real Client ID

function initGoogleAuth() {
    if (typeof google !== 'undefined' && google.accounts) {
        google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleSignIn,
            auto_select: false,
            cancel_on_tap_outside: true
        });
        
        const googleBtnElement = document.getElementById('google-signin-btn');
        if (googleBtnElement) {
            google.accounts.id.renderButton(googleBtnElement, {
                theme: 'outline',
                size: 'large',
                width: '100%',
                text: 'signin_with',
                shape: 'rectangular'
            });
        }
    }
}

function handleGoogleSignIn(response) {
    try {
        const payload = JSON.parse(atob(response.credential.split('.')[1]));
        const googleUser = {
            email: payload.email,
            name: payload.name,
            role: 'customer',
            provider: 'google',
            picture: payload.picture,
            verified: payload.email_verified,
            joinDate: new Date().toISOString()
        };
        
        currentUser = googleUser;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        users[googleUser.email] = googleUser;
        
        showNotification(`Welcome ${googleUser.name}! Successfully signed in with Google.`, 'success');
        setTimeout(() => window.location.href = 'dashboard.html', 1000);
    } catch (error) {
        console.error('Google Sign-In error:', error);
        showNotification('Google Sign-In failed. Please try again.', 'error');
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

function register(e,t,n,o){const identifier=o||t;if(users[identifier])return!1;const newUser={password:n,role:'customer',name:e,email:t,phone:o||null};users[identifier]=newUser;currentUser=newUser;localStorage.setItem('currentUser',JSON.stringify(currentUser));showNotification('Account created successfully! Welcome to Gateways!','success');return!0}

function logout(){currentUser=null;localStorage.removeItem('currentUser');showNotification('Logged out successfully','info');window.location.href='index.html'}
function isLoggedIn(){return null!==currentUser}

function displayProducts(){const e=document.getElementById('productsContainer');e&&(e.innerHTML=products.map(e=>`<div class="product-card"><h3>${e.name}</h3><div style="margin-bottom:1.5rem"><p style="margin-bottom:1rem">${e.description}</p><div style="background:rgba(102,126,234,0.1);padding:1rem;border-radius:10px;margin-bottom:1rem"><h4 style="color:#667eea;margin-bottom:0.5rem">Common Features:</h4><ul style="margin:0;padding-left:1rem">${e.features.map(t=>`<li style="margin-bottom:0.25rem;font-size:0.9rem">${t}</li>`).join('')}</ul></div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem"><div style="border:2px solid #667eea;border-radius:10px;padding:1rem;text-align:center"><h4 style="color:#667eea;margin-bottom:0.5rem">Subscription</h4><div style="font-size:1.5rem;font-weight:bold;color:#667eea;margin-bottom:1rem">$${e.subscriptionPrice}/month</div><ul style="text-align:left;margin-bottom:1rem;font-size:0.9rem">${e.subscriptionFeatures.map(t=>`<li style="margin-bottom:0.25rem">✓ ${t}</li>`).join('')}</ul><button onclick="addSubscriptionToCart(${e.id})" class="btn" style="width:100%;padding:0.75rem">Subscribe</button></div><div style="border:2px solid #00b894;border-radius:10px;padding:1rem;text-align:center"><h4 style="color:#00b894;margin-bottom:0.5rem">Pay-As-You-Go</h4><div style="font-size:1.5rem;font-weight:bold;color:#00b894;margin-bottom:1rem">$${e.payAsYouGoPrice}/proxy</div><ul style="text-align:left;margin-bottom:1rem;font-size:0.9rem">${e.payAsYouGoFeatures.map(t=>`<li style="margin-bottom:0.25rem">✓ ${t}</li>`).join('')}</ul><button onclick="addPayAsYouGoToCart(${e.id})" class="btn btn-secondary" style="width:100%;padding:0.75rem">Buy Credits</button></div></div></div>`).join(''))}

function displayCart(){const e=document.getElementById('cartContainer');if(e){if(0===cart.length)return void(e.innerHTML='<div class="section"><p style="text-align:center;font-size:1.2rem;color:#636e72">Your cart is empty</p><div style="text-align:center;margin-top:2rem"><a href="products.html" class="btn">Browse Products</a></div></div>');const t=cart.reduce((e,t)=>e+t.price*t.quantity,0);e.innerHTML=`${cart.map(e=>`<div class="cart-item"><div><h4>${e.name}</h4><p style="color:#636e72">${e.type==='subscription'?`$${e.price}/month subscription`:`$${e.price} ${e.credits?`(${e.credits} credits @ $${e.originalPrice} each)`:'one-time'}`} × ${e.quantity} = $${e.price*e.quantity}${e.type==='subscription'?'/month':''}</p></div><div style="display:flex;gap:1rem;align-items:center"><button onclick="updateQuantity('${e.id}',-1)" class="btn-secondary" style="padding:0.5rem 1rem">-</button><span style="font-weight:bold">${e.quantity}</span><button onclick="updateQuantity('${e.id}',1)" class="btn-secondary" style="padding:0.5rem 1rem">+</button><button onclick="removeFromCart('${e.id}')" class="btn-danger">Remove</button></div></div>`).join('')}<div class="cart-total"><h3>Total: $${t}${cart.some(e=>e.type==='subscription')?'/month + one-time charges':''}</h3><p style="margin:1rem 0;color:#636e72">${cart.some(e=>e.type==='subscription')?'Subscriptions will auto-renew monthly. ':''}Instant access and money-back guarantee included</p><button onclick="checkout()" class="btn" style="font-size:1.1rem;padding:1.2rem 3rem">Complete Purchase</button></div>`;updateCartSummary(t)}}

function updateQuantity(e,t){const n=cart.find(t=>t.id===e);n&&(n.quantity+=t,n.quantity<=0?removeFromCart(e):(localStorage.setItem('cart',JSON.stringify(cart)),updateCartCount(),displayCart()))}

function updateCartSummary(total){const subtotalEl=document.getElementById('subtotal'),totalEl=document.getElementById('total'),billingNote=document.getElementById('billingNote');subtotalEl&&(subtotalEl.textContent=`$${total}`);totalEl&&(totalEl.textContent=`$${total}`);billingNote&&(billingNote.innerHTML=cart.some(e=>e.type==='subscription')?'<strong>💳 Mixed Billing:</strong> Subscriptions will auto-renew monthly. One-time charges are processed immediately.':'<strong>💰 Crypto Discount:</strong> Pay with Bitcoin, Ethereum, or USDC and get 5% off your total!')}

function checkout(){if(!isLoggedIn())return showNotification('Please login to checkout','error'),void(window.location.href='login.html');if(0===cart.length)return void showNotification('Your cart is empty','error');const e=cart.reduce((e,t)=>e+t.price*t.quantity,0);const hasSubscription=cart.some(t=>t.type==='subscription');const paymentMethod=prompt('Choose payment method:\n1. Credit Card\n2. PayPal\n3. Bitcoin\n4. Ethereum\n5. USDC\n6. Bank Transfer\n\nEnter number (1-6):','1');const methods=['Credit Card','PayPal','Bitcoin','Ethereum','USDC','Bank Transfer'];const selectedMethod=methods[parseInt(paymentMethod)-1]||'Credit Card';const cryptoMethods=['Bitcoin','Ethereum','USDC'];const isCrypto=cryptoMethods.includes(selectedMethod);const discount=isCrypto?0.05:0;const finalAmount=e*(1-discount);showNotification(`Processing ${selectedMethod} payment...`,'info');setTimeout(()=>{showNotification(`Payment successful via ${selectedMethod}! ${isCrypto?`(5% crypto discount applied) `:''}Total: $${finalAmount.toFixed(2)}${hasSubscription?'/month + one-time charges':''}. Access details sent to your email!`,'success');cart=[];localStorage.setItem('cart',JSON.stringify(cart));updateCartCount();setTimeout(()=>window.location.href='dashboard.html',2000)},2000)}

function initPage(){document.body.classList.toggle('dark-theme',isDarkTheme);updateThemeButton();updateCartCount();const e=document.getElementById('navUser');e&&(e.innerHTML=isLoggedIn()?`<span style="color:#667eea;font-weight:600">Welcome, ${currentUser.name}</span><a href="dashboard.html" style="background:rgba(102,126,234,0.1);color:#667eea;border-radius:20px">Dashboard</a><button onclick="logout()" class="btn" style="padding:0.5rem 1rem">Logout</button>`:'<a href="login.html" style="color:#667eea">Login</a><a href="register.html" class="btn">Get Started</a>')}

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
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            if (login(email, password)) {
                showNotification('Login successful! Welcome back!', 'success');
                setTimeout(() => {
                    window.location.href = currentUser.role === 'admin' ? 'admin.html' : 'dashboard.html';
                }, 1000);
            } else {
                showNotification('Invalid credentials. Please try again.', 'error');
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
                setTimeout(() => window.location.href = 'dashboard.html', 1500);
            } else {
                showNotification('Registration failed. User may already exist.', 'error');
            }
        });
    }
});

const style=document.createElement('style');style.textContent='@keyframes slideDown{from{transform:translate(-50%,-100%);opacity:0}to{transform:translate(-50%,0);opacity:1}}@keyframes slideUp{from{transform:translate(-50%,0);opacity:1}to{transform:translate(-50%,-100%);opacity:0}}';document.head.appendChild(style);