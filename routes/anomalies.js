const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Get all anomalies
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT a.*, m.imei, c.name as client_name 
            FROM anomalies a
            JOIN modules m ON a.imei = m.imei
            JOIN clients c ON m.client_id = c.id
            ORDER BY a.alert_count DESC
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

// Get anomalies by IMEI (calculated from diagnostics)
router.get('/:imei', async (req, res) => {
    try {
        // Count diagnostics rows with status_icon not 'D' as anomalies
        const [rows] = await pool.query(`
            SELECT d.*, m.imei, c.name as client_name 
            FROM diagnostics d
            JOIN modules m ON d.imei = m.imei
            JOIN clients c ON m.client_id = c.id
            WHERE d.imei = ? AND d.status_icon IS NOT NULL AND d.status_icon != 'D'
            ORDER BY d.record_time DESC
        `, [req.params.imei]);
        
        if (rows.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'No anomalies found for this module (from diagnostics)'
            });
        }
        
        res.json({
            status: 'success',
            count: rows.length,
            data: rows
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Search anomalies by date
router.post('/search-by-date', async (req, res) => {
    const { date } = req.body;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ status: 'error', message: 'Invalid or missing date. Use YYYY-MM-DD.' });
    }
    try {
        const [rows] = await pool.query(`
            SELECT 
                a.id,
                a.data_count,
                a.anomaly_type, 
                a.vehicle_id, 
                a.imei, 
                a.sim_number, 
                a.mileage_km, 
                a.fuel_level, 
                a.consumption_rate, 
                a.alert_count, 
                a.created_at,
                m.vehicle_name AS module_name
            FROM anomalies a
            JOIN modules m ON a.imei = m.imei
            WHERE DATE(a.created_at) = ?
            ORDER BY a.created_at DESC
        `, [date]);
        if (rows.length === 0) {
            return res.json({ status: 'success', data: [], message: 'No anomalies found for this date.' });
        }
        res.json({ status: 'success', data: rows });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

module.exports = router; 