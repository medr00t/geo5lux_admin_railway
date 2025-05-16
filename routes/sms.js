const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Get all SMS history
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT * FROM sms_history
            ORDER BY sent_date DESC
        `);
        res.json({
            status: 'success',
            data: rows
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Get SMS history by date
router.get('/by-date/:date', async (req, res) => {
    try {
        const date = req.params.date; // Format: YYYY-MM-DD HH:mm:ss
        const [rows] = await pool.query(`
            SELECT * FROM sms_history 
            WHERE DATE(sent_date) = DATE(?)
            ORDER BY sent_date DESC
        `, [date]);
        res.json({
            status: 'success',
            data: rows
        });
    } catch (error) {
        res.status(500).json({
            status: 'error', 
            message: error.message
        });
    }
});

// Send new SMS
router.post('/', async (req, res) => {
    try {
        const { recipients, sms_type, message } = req.body;
        if (!Array.isArray(recipients) || recipients.length === 0) {
            return res.status(400).json({ status: 'error', message: 'No recipients provided' });
        }
        let inserted = 0;
        for (const r of recipients) {
            if (!r.recipient || !r.phone_number) continue;
            await pool.query(
                'INSERT INTO sms_history (sent_date, recipient, phone_number, sms_type, message) VALUES (?, ?, ?, ?, ?)',
                [new Date(), r.recipient, r.phone_number, sms_type, message]
            );
            inserted++;
        }
        res.status(201).json({
            status: 'success',
            inserted
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

module.exports = router; 