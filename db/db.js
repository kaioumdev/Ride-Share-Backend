'use strict';
const mongoose = require('mongoose');

// Vercel serverless functions are stateless — each invocation may spin up a
// fresh Node.js process. However within the same warm instance the module
// cache persists, so we reuse the existing connection instead of opening a
// new one every request (which would exhaust the MongoDB Atlas connection pool).
let isConnected = false;

async function connectToDb() {
    if (isConnected) return;

    // Already connecting — wait for it instead of opening a second connection
    if (mongoose.connection.readyState === 1) {
        isConnected = true;
        return;
    }

    try {
        await mongoose.connect(process.env.DB_CONNECT, {
            // Recommended settings for serverless environments
            serverSelectionTimeoutMS: 5000,   // fail fast if Atlas is unreachable
            socketTimeoutMS: 10000,
        });
        isConnected = true;
        console.log('Connected to DB');
    } catch (err) {
        console.error('DB connection error:', err.message);
        throw err; // let the request handler return 500 with a clear log
    }
}

module.exports = connectToDb;
