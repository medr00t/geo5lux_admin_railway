const express = require('express');
const router = express.Router();

// Welcome route
router.get('/', (req, res) => {
    res.json({
        status: 'success',
        message: 'Welcome to Geo5Lux Admin API'
    });
});

module.exports = router;
