const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Rotas de autenticação
router.post('/login', authController.login);
router.post('/verificar-email', authController.verificarEmail);
router.post('/logout', authController.logout);

module.exports = router;
