const express = require('express');
const router = express.Router();
const path = require('path');

// Servir arquivos estáticos da pasta frontend para esta rota
router.use(express.static(path.join(__dirname, '../../frontend')));

// Rota para abrir o menu
router.get('/', (req, res) => {
    console.log('📍 Abrindo menu.html');
    res.sendFile(path.join(__dirname, '../../frontend/menu.html'));
});

module.exports = router;