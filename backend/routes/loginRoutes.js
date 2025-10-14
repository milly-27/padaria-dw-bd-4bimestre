const express = require('express');
const router = express.Router();
const loginController = require('../controllers/loginController');

// Rotas de autenticação
router.get('/verificaSePessoaEstaLogada', loginController.verificaSePessoaEstaLogada);
router.post('/loginCliente', loginController.loginCliente);
router.post('/loginFuncionario', loginController.loginFuncionario);
router.post('/cadastrarCliente', loginController.cadastrarCliente);
router.post('/logout', loginController.logout);

module.exports = router;