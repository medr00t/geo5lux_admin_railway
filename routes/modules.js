const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Get all modules
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT m.*, c.name as client_name 
            FROM modules m
            LEFT JOIN clients c ON m.client_id = c.id
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

// Get module by IMEI
router.get('/:imei', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT m.*, c.name as client_name 
            FROM modules m
            LEFT JOIN clients c ON m.client_id = c.id
            WHERE m.imei = ?
        `, [req.params.imei]);
        if (rows.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Module not found'
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

// Create new module
router.post('/', async (req, res) => {
    try {
        const { imei, model, client_id, vehicle_name, sim_number, validated_on, expires_on, status } = req.body;
        
        // Check if client exists
        if (client_id) {
            const [client] = await pool.query('SELECT id FROM clients WHERE id = ?', [client_id]);
            if (client.length === 0) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Client not found'
                });
            }
        }

        const [result] = await pool.query(
            'INSERT INTO modules (imei, model, client_id, vehicle_name, sim_number, validated_on, expires_on, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [imei, model, client_id, vehicle_name, sim_number, validated_on, expires_on, status]
        );

        res.status(201).json({
            status: 'success',
            data: {
                imei,
                model,
                client_id,
                vehicle_name,
                sim_number,
                validated_on,
                expires_on,
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

// Update module
router.put('/:imei', async (req, res) => {
    try {
        const { model, client_id, vehicle_name, sim_number, validated_on, expires_on, status } = req.body;
        
        // Check if client exists
        if (client_id) {
            const [client] = await pool.query('SELECT id FROM clients WHERE id = ?', [client_id]);
            if (client.length === 0) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Client not found'
                });
            }
        }

        const [result] = await pool.query(
            'UPDATE modules SET model = ?, client_id = ?, vehicle_name = ?, sim_number = ?, validated_on = ?, expires_on = ?, status = ? WHERE imei = ?',
            [model, client_id, vehicle_name, sim_number, validated_on, expires_on, status, req.params.imei]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Module not found'
            });
        }

        res.json({
            status: 'success',
            data: {
                imei: req.params.imei,
                model,
                client_id,
                vehicle_name,
                sim_number,
                validated_on,
                expires_on,
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

// PATCH update module (partial update)
router.patch('/:imei', async (req, res) => {
    try {
        const allowedFields = ['model', 'client_id', 'vehicle_name', 'sim_number', 'validated_on', 'expires_on', 'status'];
        const updates = [];
        const values = [];
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates.push(`${field} = ?`);
                values.push(req.body[field]);
            }
        }
        if (updates.length === 0) {
            return res.status(400).json({ status: 'error', message: 'No valid fields to update' });
        }
        values.push(req.params.imei);
        const [result] = await pool.query(
            `UPDATE modules SET ${updates.join(', ')} WHERE imei = ?`,
            values
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ status: 'error', message: 'Module not found' });
        }
        // Return the updated module with all fields
        const [rows] = await pool.query(`
            SELECT m.*, c.name as client_name 
            FROM modules m
            LEFT JOIN clients c ON m.client_id = c.id
            WHERE m.imei = ?
        `, [req.params.imei]);
        res.json({ status: 'success', data: rows[0] });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// PATCH unassign module from client (set client_id to NULL)
router.patch('/:imei/unassign', async (req, res) => {
    try {
        const [result] = await pool.query(
            'UPDATE modules SET client_id = NULL WHERE imei = ?',
            [req.params.imei]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ status: 'error', message: 'Module not found' });
        }
        // Return the updated module with all fields
        const [rows] = await pool.query(`
            SELECT m.*, c.name as client_name 
            FROM modules m
            LEFT JOIN clients c ON m.client_id = c.id
            WHERE m.imei = ?
        `, [req.params.imei]);
        res.json({ status: 'success', data: rows[0] });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Delete module
router.delete('/:imei', async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM modules WHERE imei = ?', [req.params.imei]);
        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Module not found'
            });
        }
        res.json({
            status: 'success',
            message: 'Module deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

module.exports = router; 