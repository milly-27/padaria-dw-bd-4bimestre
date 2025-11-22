const express = require('express');
const router = express.Router();
const auth = require('../controllers/authController');

// ======================================
// ROTAS DE AUTENTICAÇÃO EXISTENTES
// ======================================
router.post('/registro', auth.registro);
router.post('/register', auth.registro); // Alias para compatibilidade
router.post('/login', auth.login);
router.post('/logout', auth.logout);
router.get('/user', auth.verificarLogin);
router.get('/verificar', auth.verificarLogin); // Alias
router.post('/verificarEmail', auth.verificarEmail);
router.put('/atualizarSenha', auth.atualizarSenha);

// ======================================
// ROTAS DE RECUPERAÇÃO DE SENHA
// ======================================

// POST - Solicitar código de recuperação
// Body: { email: string }
// Retorna: { success: boolean, message: string, codigo_dev?: string }
router.post('/solicitar-recuperacao', auth.solicitarRecuperacao);

// POST - Verificar código de recuperação
// Body: { email: string, code: string }
// Retorna: { success: boolean, message: string }
router.post('/verificar-codigo', auth.verificarCodigo);

// POST - Redefinir senha com código válido
// Body: { email: string, code: string, nova_senha: string }
// Retorna: { success: boolean, message: string }
router.post('/redefinir-senha', auth.redefinirSenha);

console.log('✅ Rotas de recuperação de senha registradas:');
console.log('   POST /auth/solicitar-recuperacao');
console.log('   POST /auth/verificar-codigo');
console.log('   POST /auth/redefinir-senha');

module.exports = router;