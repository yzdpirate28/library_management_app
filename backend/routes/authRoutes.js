const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// Routes publiques
router.post('/register', authController.register);
router.post('/login', authController.login);

// Routes protégées
router.get('/profile', auth.verifyToken, authController.getProfile);
router.put('/profile', auth.verifyToken, authController.updateProfile);
router.put('/change-password', auth.verifyToken, authController.changePassword);

module.exports = router;