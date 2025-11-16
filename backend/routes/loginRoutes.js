const express = require('express');
const router = express.Router();
const path = require('path');

// Servir arquivos estáticos da pasta login
router.use(express.static(path.join(__dirname, '../../frontend/login')));

// Rota para abrir a página de login
router.get('/login.html', (req, res) => {
    console.log('📍 Abrindo login.html');
    res.sendFile(path.join(__dirname, '../../frontend/login/login.html'));
});

module.exports = router;