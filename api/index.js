const express = require('express');
const cors = require('cors');
const session = require('express-session');
const { testConnection } = require('../config/database');

// Import routes
const clientsRouter = require('../routes/clients');
const modulesRouter = require('../routes/modules');
const renewalsRouter = require('../routes/renewals');
const signalsRouter = require('../routes/signals');
const anomaliesRouter = require('../routes/anomalies');
const diagnosticsRouter = require('../routes/diagnostics');
const smsRouter = require('../routes/sms');
const welcomeRouter = require('../routes/welcome');
const adminAuthRouter = require('../routes/adminAuth');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
  }));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET || 'geo5lux_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    }
}));

// Test database connection
testConnection();

// Mount routes
app.use('/', welcomeRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/modules', modulesRouter);
app.use('/api/renewals', renewalsRouter);
app.use('/api/signals', signalsRouter);
app.use('/api/anomalies', anomaliesRouter);
app.use('/api/diagnostics', diagnosticsRouter);
app.use('/api/sms', smsRouter);
app.use('/api/admin', adminAuthRouter);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        status: 'error',
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 