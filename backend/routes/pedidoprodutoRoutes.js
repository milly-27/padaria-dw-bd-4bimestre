
const express = require('express');
const router = express.Router();
const pedidoprodutoController = require('./../controllers/pedidoprodutoController');

// CRUD de Pedidoprodutos
// Rotas para a PK composta: pedido_id e produto_id
router.get('/:id_pedido/:id_produto', pedidoprodutoController.obterPedidoproduto);
router.put('/:id_pedido/:id_produto', pedidoprodutoController.atualizarPedidoproduto);
router.delete('/:id_pedido/:id_produto', pedidoprodutoController.deletarPedidoproduto);

// Outras rotas sem a PK composta
router.get('/abrirCrudPedidoproduto', pedidoprodutoController.abrirCrudPedidoproduto);
router.get('/', pedidoprodutoController.listarPedidoprodutos);


// Rota para obter todos os itens de um pedido específico
router.get('/:idPedido', pedidoprodutoController.obterItensDeUmPedidoproduto);
router.post('/', pedidoprodutoController.criarPedidoproduto);

module.exports = router;