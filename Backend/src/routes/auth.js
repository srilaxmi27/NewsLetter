const express = require('express');
const router  = express.Router();
const { verifyToken }              = require('../middlewares/auth');
const { googleLogin, devLogin, devLogout } = require('../controllers/authController');

// GET /api/auth/profile
router.get('/profile', verifyToken, (req, res) => {
  res.json({ success: true, data: req.user });
});

// POST /api/auth/google — validate Google ID token, upsert user, set cookie
router.post('/google', googleLogin);

// DEV-ONLY
router.post('/dev-login',  devLogin);
router.post('/dev-logout', devLogout);

module.exports = router;
