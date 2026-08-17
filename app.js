const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const app = express();
const connectToDb = require('./db/db');
const userRoutes = require('./routes/user.routes');
const captainRoutes = require('./routes/captain.routes');
const mapsRoutes = require('./routes/maps.routes');
const rideRoutes = require('./routes/ride.routes');
const { swaggerRouter } = require('./swagger');

const allowedOrigins = [
    // Frontend deployments
    'https://ride-share-frontend-zeta.vercel.app',
    // Backend's own domain — Swagger UI sends requests from here
    'https://ride-share-backend-mauve.vercel.app',
    // Local development
    'http://localhost:5173',
    'http://localhost:5005',
];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (server-to-server, curl, Postman)
        // AND all listed origins (frontend + backend's own Swagger UI)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS: origin ${origin} not allowed`));
        }
    },
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── DB connection middleware ───────────────────────────────────
// Vercel cold-start: await DB before every request.
// Warm instance: returns instantly via the isConnected cache in db.js.
// If DB_CONNECT env var is missing (not set in Vercel dashboard),
// returns a clear 503 instead of crashing with an HTML 500.
app.use(async (req, res, next) => {
    try {
        await connectToDb();
        next();
    } catch (err) {
        console.error('DB connection failed:', err.message);
        // Check if env var is missing — give a helpful message
        if (!process.env.DB_CONNECT) {
            return res.status(503).json({
                message: 'DB_CONNECT environment variable is not set. Add it in Vercel Dashboard → Settings → Environment Variables.',
            });
        }
        return res.status(503).json({ message: 'Database unavailable. Please try again shortly.' });
    }
});
// ─────────────────────────────────────────────────────────────

app.use(swaggerRouter);

app.get('/', (req, res) => {
    res.json({
        message: 'Ubar Ride Share API is running',
        docs: '/api-docs',
        status: 'ok',
    });
});

app.use('/users', userRoutes);
app.use('/captains', captainRoutes);
app.use('/maps', mapsRoutes);
app.use('/rides', rideRoutes);

// ── Global error handler ──────────────────────────────────────
// Catches any unhandled error thrown by route handlers / middleware.
// Without this, Express sends a plain HTML 500 page which breaks
// Swagger UI and any JSON-expecting client.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.message);
    const status = err.status || err.statusCode || 500;
    res.status(status).json({ message: err.message || 'Internal server error' });
});
// ─────────────────────────────────────────────────────────────

module.exports = app;

