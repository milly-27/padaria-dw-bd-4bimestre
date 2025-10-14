const express = require('express');
const router = express.Router();
const produtoController = require('./../controllers/produtoController');
const upload = require('../middleware/upload');

// CRUD de Produtos

router.get('/abrirCrudProduto', produtoController.abrirCrudProduto);
router.get('/', produtoController.listarProdutos);
router.post('/', upload.single('imagem'), produtoController.criarProduto);
router.get('/:id', produtoController.obterProduto);
router.put('/:id', upload.single('imagem'), produtoController.atualizarProduto);
router.delete('/:id', produtoController.deletarProduto);

module.exports = router;
