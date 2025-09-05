const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Rota de login
router.post('/login', authController.login);

// Rota para trocar senha (primeiro acesso)
router.post('/change-password', authController.verifyToken, authController.changePassword);

// Rota para verificar token
router.get('/verify', authController.verifyToken, (req, res) => {
  res.json({
    success: true,
    message: 'Token válido',
    user: req.user
  });
});

module.exports = router;
