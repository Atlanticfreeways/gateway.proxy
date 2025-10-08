// Backend API - Node.js/Express server
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// In-memory storage (replace with real database)
let users = {};
let proxies = {};
let transactions = {};

// Auth middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.sendStatus(401);
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Auth routes
app.post('/api/auth/register', async (req, res) => {
    const { email, password, name } = req.body;
    
    if (users[email]) {
        return res.status(400).json({ error: 'User already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    users[email] = {
        email,
        name,
        password: hashedPassword,
        createdAt: new Date().toISOString()
    };
    
    res.json({ message: 'User created successfully' });
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user = users[email];
    
    if (!user || !await bcrypt.compare(password, user.password)) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ email: user.email }, JWT_SECRET);
    res.json({ token, user: { email: user.email, name: user.name } });
});

// Proxy routes
app.get('/api/proxies', authenticateToken, (req, res) => {
    const userProxies = Object.values(proxies).filter(p => p.userId === req.user.email);
    res.json(userProxies);
});

app.post('/api/proxies', authenticateToken, (req, res) => {
    const id = Date.now().toString();
    const proxy = {
        id,
        userId: req.user.email,
        ...req.body,
        createdAt: new Date().toISOString()
    };
    proxies[id] = proxy;
    res.json(proxy);
});

// Payment routes
app.get('/api/payments/transactions', authenticateToken, (req, res) => {
    const userTransactions = Object.values(transactions).filter(t => t.userId === req.user.email);
    res.json(userTransactions);
});

app.post('/api/payments/create', authenticateToken, (req, res) => {
    const id = Date.now().toString();
    const transaction = {
        id,
        userId: req.user.email,
        ...req.body,
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    transactions[id] = transaction;
    res.json(transaction);
});

// User routes
app.get('/api/user/profile', authenticateToken, (req, res) => {
    const user = users[req.user.email];
    res.json({ email: user.email, name: user.name });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});