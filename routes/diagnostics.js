const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Get all diagnostics
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT d.*, m.imei, c.name as client_name 
            FROM diagnostics d
            JOIN modules m ON d.imei = m.imei
            JOIN clients c ON m.client_id = c.id
            ORDER BY d.record_time DESC
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

// Get diagnostics by IMEI and date
router.get('/by-date/:imei', async (req, res) => {
    const { imei } = req.params;
    const { date } = req.query;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ status: 'error', message: 'Invalid or missing date. Use YYYY-MM-DD.' });
    }
    try {
        const [rows] = await pool.query(`
            SELECT d.*, m.imei, c.name as client_name 
            FROM diagnostics d
            JOIN modules m ON d.imei = m.imei
            JOIN clients c ON m.client_id = c.id
            WHERE d.imei = ? AND DATE(d.record_time) = ?
            ORDER BY d.record_time ASC
        `, [imei, date]);
        const [totalAlerts] = await pool.query(`
            SELECT COUNT(*) as total_alerts
            FROM anomalies
            WHERE imei = ?
        `, [imei]);
        
        res.json({
            status: 'success',
            data: rows,
            totalAlerts: totalAlerts[0].total_alerts
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Get diagnostics by IMEI
router.get('/:imei', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT d.*, m.imei, c.name as client_name 
            FROM diagnostics d
            JOIN modules m ON d.imei = m.imei
            JOIN clients c ON m.client_id = c.id
            WHERE d.imei = ?
            ORDER BY d.record_time DESC
            LIMIT 1
        `, [req.params.imei]);
        
        if (rows.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'No diagnostics data found for this module'
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