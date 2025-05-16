const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const crypto = require('crypto');

// POST /api/admin/login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ status: 'error', message: 'Username and password required' });
    }
    try {
        const [rows] = await pool.query('SELECT * FROM admin_users WHERE username = ?', [username]);
        if (rows.length === 0) {
            return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
        }
        const user = rows[0];
        // Hash the incoming password with SHA-256
        const hash = crypto.createHash('sha256').update(password).digest('hex');

        if (hash !== user.password_hash) {
            return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
        }
        req.session.admin_user = { id: user.id, username: user.username };
        res.json({ status: 'success', data: { username: user.username } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

router.get('/login', (req, res) => {
    res.json({ status: 'success', message: 'Admin API is running' });
});

// GET /api/admin/me
router.get('/me', (req, res) => {
    if (req.session && req.session.admin_user) {
        res.json({ status: 'success', data: req.session.admin_user });
    } else {
        res.status(401).json({ status: 'error', message: 'Not authenticated' });
    }
});

// POST /api/admin/logout
router.post('/logout', (req, res) => {
    req.session.destroy(() => {
        res.json({ status: 'success', message: 'Logged out' });
    });
});

module.exports = router;