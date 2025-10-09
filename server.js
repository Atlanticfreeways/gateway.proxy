const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use('/api/', limiter);

// In-memory storage
let users = {};
let proxies = {};

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

// API Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/proxy/generate', (req, res) => {
    const { type = 'residential', country = 'US' } = req.body;
    const endpoint = {
        id: Date.now().toString(),
        type,
        country,
        host: `proxy-${type.substr(0, 3)}-${country.toLowerCase()}-01.gateways-proxy.com`,
        port: 8080,
        username: `user_${Math.random().toString(36).substr(2, 8)}`,
        password: Math.random().toString(36).substr(2, 12),
        status: 'active'
    };
    res.status(201).json({ endpoint });
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

app.get('/api/proxies', authenticateToken, (req, res) => {
    const userProxies = Object.values(proxies).filter(p => p.userId === req.user.email);
    res.json(userProxies);
});

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;