const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Get all signal statuses
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT s.*, m.imei, c.name as client_name 
            FROM signals s
            JOIN modules m ON s.imei = m.imei
            JOIN clients c ON m.client_id = c.id
            ORDER BY s.no_signal_since DESC
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

// Get signal status by IMEI
router.get('/:imei', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT s.*, m.imei, c.name as client_name 
            FROM signals s
            JOIN modules m ON s.imei = m.imei
            JOIN clients c ON m.client_id = c.id
            WHERE s.imei = ?
            ORDER BY s.no_signal_since DESC
            LIMIT 1
        `, [req.params.imei]);
        
        if (rows.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'No signal data found for this module'
            });
        }
        
        res.json({
            status: 'success',
            data: rows[0]
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

module.exports = router; 