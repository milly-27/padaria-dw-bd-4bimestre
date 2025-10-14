const express = require('express');
const router = express.Router();
const categoriaController = require('./../controllers/categoriaController');

// CRUD de Categorias

router.get('/abrirCrudCategoria', categoriaController.abrirCrudCategoria);
router.get('/', categoriaController.listarCategorias);
router.post('/', categoriaController.criarCategoria);
router.get('/:id', categoriaController.obterCategoria);
router.put('/:id', categoriaController.atualizarCategoria);
router.delete('/:id', categoriaController.deletarCategoria);

module.exports = router;
