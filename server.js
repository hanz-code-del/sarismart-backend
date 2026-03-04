// server.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');

// Optional: you can add more route files later
// const paymentRoutes = require('./routes/payments');
// const profileRoutes = require('./routes/profile');

const app = express();

// ────────────────────────────────────────────────
// Middleware
// ────────────────────────────────────────────────
app.use(cors({
  origin: '*',                    // ← in production change to your frontend domain(s)
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());          // built-in body parser — replaces body-parser package
app.use(express.urlencoded({ extended: true }));

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ────────────────────────────────────────────────
// Routes
// ────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// Placeholder routes — implement when you're ready
app.get('/api/profile', (req, res) => {
  res.status(501).json({ message: 'Profile endpoint - coming soon' });
});

app.post('/api/payments', (req, res) => {
  res.status(501).json({ message: 'Payment simulation - coming soon' });
});

// Catch-all 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ────────────────────────────────────────────────
// Database connection check (optional but very useful)
// ────────────────────────────────────────────────
async function checkDatabaseConnection() {
  try {
    const pool = require('./db'); // your db.js file
    const connection = await pool.getConnection();
    console.log('✓ MySQL database connected successfully');
    connection.release();
  } catch (err) {
    console.error('✗ Database connection failed:');
    console.error(err.message);
    process.exit(1); // exit if DB is critical and cannot connect
  }
}

// ────────────────────────────────────────────────
// Start server
// ────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`=======================================`);
  console.log(`  SariSmart Backend`);
  console.log(`  Running on http://localhost:${PORT}`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`=======================================`);

  await checkDatabaseConnection();
});