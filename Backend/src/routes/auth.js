const express = require('express');
const router = express.Router();
const { getDemoUsers, selectUser } = require('../controllers/authController');

// GET  /api/auth/demo-users  — returns all demo accounts for login page
router.get('/demo-users', getDemoUsers);

// POST /api/auth/select      — selects a demo user (returns user context)
router.post('/select', selectUser);

module.exports = router;
