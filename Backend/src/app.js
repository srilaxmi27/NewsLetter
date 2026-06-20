const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const errorHandler = require('./middlewares/errorHandler');

const authRoutes         = require('./routes/auth');
const submissionRoutes   = require('./routes/submissions');
const approvalRoutes     = require('./routes/approvals');
const newsletterRoutes   = require('./routes/newsletters');
const notificationRoutes = require('./routes/notifications');

const app = express();

// ── Middleware ──
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Static Files (uploaded proofs & generated PDFs) ──
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Routes ──
app.use('/api/auth',          authRoutes);
app.use('/api/submissions',   submissionRoutes);
app.use('/api/approvals',     approvalRoutes);
app.use('/api/newsletters',   newsletterRoutes);
app.use('/api/notifications', notificationRoutes);

// ── Health Check ──
app.get('/api/health', (req, res) => {
  res.json({ status: 'NEWSFLOW Backend is running ✅' });
});

// ── Global Error Handler (must be last) ──
app.use(errorHandler);

module.exports = app;
