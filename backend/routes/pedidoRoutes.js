const express = require('express');
const router = express.Router();
const pedidoController = require('./../controllers/pedidoController');

// CRUD de Pedidos

router.get('/abrirCrudPedido', pedidoController.abrirCrudPedido);
router.get('/', pedidoController.listarPedidos);
router.post('/', pedidoController.criarPedido);
router.get('/:id', pedidoController.obterPedido);
router.put('/:id', pedidoController.atualizarPedido);
router.delete('/:id', pedidoController.deletarPedido);

module.exports = router;