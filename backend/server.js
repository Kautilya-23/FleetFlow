const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check - always works even if DB is down
app.get('/', (req, res) => {
    const dbState = mongoose.connection.readyState;
    const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
    res.json({
        status: 'FleetFlow API is running',
        database: states[dbState] || 'unknown'
    });
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000, // Fail fast instead of hanging
})
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch((err) => {
        console.error('❌ MongoDB connection error:', err.message);
        console.error('👉 Make sure MongoDB is running: net start MongoDB (as Admin) or run mongod in a terminal');
    });

// Re-try connection every 10 seconds if disconnected
mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected. Retrying...');
});

// API Routes
const apiRoutes = require('./routes/api');
const costsRoutes = require('./routes/costs');
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/api/costs', costsRoutes);

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Connecting to MongoDB at: ${process.env.MONGO_URI}`);
});
