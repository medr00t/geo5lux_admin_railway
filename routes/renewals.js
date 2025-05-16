const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Get all renewals
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT r.*, m.imei, c.name as client_name 
            FROM renewals r
            JOIN modules m ON r.imei = m.imei
            JOIN clients c ON r.client_id = c.id
            ORDER BY r.validated_on DESC
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

// Get renewals by IMEI
router.get('/:imei', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT r.*, m.imei, c.name as client_name 
            FROM renewals r
            JOIN modules m ON r.imei = m.imei
            JOIN clients c ON r.client_id = c.id
            WHERE r.imei = ?
            ORDER BY r.validated_on DESC
        `, [req.params.imei]);
        
        if (rows.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'No renewals found for this module'
            });
        }
        
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

// Create new renewal
router.post('/', async (req, res) => {
    try {
        const { imei, client_id, validated_on, expires_on } = req.body;
        
        // Check if module exists
        const [module] = await pool.query('SELECT * FROM modules WHERE imei = ?', [imei]);
        if (module.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Module not found'
            });
        }

        // Check if client exists
        const [client] = await pool.query('SELECT * FROM clients WHERE id = ?', [client_id]);
        if (client.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Client not found'
            });
        }

        const [result] = await pool.query(
            'INSERT INTO renewals (imei, client_id, validated_on, expires_on) VALUES (?, ?, ?, ?)',
            [imei, client_id, validated_on, expires_on]
        );

        res.status(201).json({
            status: 'success',
            data: {
                id: result.insertId,
                imei,
                client_id,
                validated_on,
                expires_on
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

module.exports = router; 