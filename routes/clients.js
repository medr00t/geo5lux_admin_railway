const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Get all clients
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                c.id, 
                c.name, 
                c.email, 
                c.manager_name, 
                c.manager_phone, 
                c.fix_phone,
                c.address,
                c.country,
                c.status,
                c.max_history_days,
                c.reports_enabled,
                c.geofence_enabled,
                c.max_zones,
                c.tech_support,
                COUNT(m.imei) as modules_count
            FROM clients c
            LEFT JOIN modules m ON m.client_id = c.id
            GROUP BY c.id
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

// Get client by ID
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT id, name, email, manager_name, manager_phone, fix_phone, address, country, status, max_history_days, reports_enabled, geofence_enabled, max_zones, tech_support 
             FROM clients WHERE id = ?`,
            [req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Client not found'
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

// Create new client
router.post('/', async (req, res) => {
    try {
        const { id, name, email, manager_name, manager_phone, fix_phone, address, country, status } = req.body;
        const [result] = await pool.query(
            `INSERT INTO clients 
             (id, name, email, manager_name, manager_phone, fix_phone, address, country, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, name, email, manager_name, manager_phone, fix_phone, address, country, status]
        );
        res.status(201).json({
            status: 'success',
            data: {
                id,
                name,
                email,
                manager_name,
                manager_phone,
                fix_phone,
                address,
                country,
                status
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Update client
router.put('/:id', async (req, res) => {
    try {
        const { name, email, manager_name, manager_phone, fix_phone, address, country, status, max_history_days, reports_enabled, geofence_enabled, max_zones, tech_support } = req.body;
        const [result] = await pool.query(
            `UPDATE clients 
             SET name = ?, email = ?, manager_name = ?, manager_phone = ?, fix_phone = ?, address = ?, country = ?, status = ?, max_history_days = ?, reports_enabled = ?, geofence_enabled = ?, max_zones = ?, tech_support = ?
             WHERE id = ?`,
            [name, email, manager_name, manager_phone, fix_phone, address, country, status, max_history_days, reports_enabled, geofence_enabled, max_zones, tech_support, req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Client not found'
            });
        }
        res.json({
            status: 'success',
            data: {
                id: req.params.id,
                name,
                email,
                manager_name,
                manager_phone,
                fix_phone,
                address,
                country,
                status,
                max_history_days,
                reports_enabled,
                geofence_enabled,
                max_zones,
                tech_support
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Delete client
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM clients WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Client not found'
            });
        }
        res.json({
            status: 'success',
            message: 'Client deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

module.exports = router;
