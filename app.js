const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const app = express();
const cookieParser = require('cookie-parser');
const connectToDb = require('./db/db');
const userRoutes = require('./routes/user.routes');
const captainRoutes = require('./routes/captain.routes');
const mapsRoutes = require('./routes/maps.routes');
const rideRoutes = require('./routes/ride.routes');
const swaggerUi = require('swagger-ui-express');
const { swaggerSpec, swaggerUiOptions } = require('./swagger');

connectToDb();

// app.use(cors());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
}))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());



// ── Swagger UI ────────────────────────────────────────────────
// Accessible at: http://localhost:5005/api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// Expose raw OpenAPI JSON for tools like Postman / Insomnia
app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});
// ─────────────────────────────────────────────────────────────

app.get('/', (req, res) => {
    res.send('Hello World — API docs available at /api-docs');
});

app.use('/users', userRoutes);
app.use('/captains', captainRoutes);
app.use('/maps', mapsRoutes);
app.use('/rides', rideRoutes);




module.exports = app;

