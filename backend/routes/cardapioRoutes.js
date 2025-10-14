const express = require('express');
const router = express.Router();
const cardapioController = require('./../controllers/cardapioController');

// Rotas do Cardápio

router.get('/abrirCardapio', cardapioController.abrirCardapio);
router.get('/produtos', cardapioController.listarProdutosPorCategoria);
router.get('/categorias', cardapioController.listarCategorias);

module.exports = router;

