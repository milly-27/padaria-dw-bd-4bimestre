const express = require('express');
const router = express.Router();
const finalizacaoController = require('../controllers/finalizacaoController');

// ================================
// ROTA PARA ABRIR PÁGINA HTML
// ================================

// GET - Abrir página de finalização
router.get('/abrirFinalizacao', finalizacaoController.abrirFinalizacao);

// ================================
// ROTAS DE FORMAS DE PAGAMENTO
// ================================

// GET - Listar todas as formas de pagamento
router.get('/formas-pagamento', finalizacaoController.getFormasPagamento);

// ================================
// ROTAS DE PEDIDOS
// ================================

// GET - Listar todos os pedidos (com filtros opcionais)
// Parâmetros query opcionais: cpf, data_inicio, data_fim
// Exemplo: /finalizacao/pedidos?cpf=12345678900&data_inicio=2025-01-01
router.get('/pedidos', finalizacaoController.listarPedidos);

// GET - Buscar detalhes de um pedido específico
router.get('/pedidos/:id', finalizacaoController.getPedidoDetalhes);

// POST - Criar novo pedido
// Body: { cpf, data_pedido, valor_total, itens: [{ id_produto, quantidade, preco_unitario }] }
router.post('/pedidos', finalizacaoController.criarPedido);

// PUT - Atualizar status do pedido
// Body: { status: 'pago' | 'pendente' | 'cancelado' | 'entregue' }
router.put('/pedidos/:id/status', finalizacaoController.atualizarStatusPedido);

// ================================
// ROTAS DE PAGAMENTO
// ================================

// POST - Processar pagamento
// Body: { id_pedido, id_forma_pagamento, valor_total }
router.post('/processar-pagamento', finalizacaoController.processarPagamento);

module.exports = router;