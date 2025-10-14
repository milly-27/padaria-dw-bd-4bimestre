const express = require('express');
const router = express.Router();
const pagamento_has_formapagamentoController = require('./../controllers/pagamento_has_formapagamentoController');

// CRUD de Pagamento_has_formapagamentos

router.get('/abrirCrudPagamento_has_formapagamento', pagamento_has_formapagamentoController.abrirCrudPagamento_has_formapagamento);
router.get('/', pagamento_has_formapagamentoController.listarPagamento_has_formapagamentos);
router.post('/', pagamento_has_formapagamentoController.criarPagamento_has_formapagamento);
router.get('/:id', pagamento_has_formapagamentoController.obterPagamento_has_formapagamento);
router.put('/:id', pagamento_has_formapagamentoController.atualizarPagamento_has_formapagamento);
router.delete('/:id', pagamento_has_formapagamentoController.deletarPagamento_has_formapagamento);

module.exports = router;
