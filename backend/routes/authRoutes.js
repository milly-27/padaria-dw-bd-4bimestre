const express = require('express');
const router = express.Router();
const auth = require('../controllers/authController');

// Rotas de autenticação
router.post('/registro', auth.registro);
router.post('/register', auth.registro); // Alias para compatibilidade
router.post('/login', auth.login);
router.post('/logout', auth.logout);
router.get('/user', auth.verificarLogin);
router.get('/verificar', auth.verificarLogin); // Alias
router.post('/verificarEmail', auth.verificarEmail);
router.put('/atualizarSenha', auth.atualizarSenha);

module.exports = router;