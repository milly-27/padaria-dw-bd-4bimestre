//import { query } from '../database.js';
const { query } = require('../database');
// Funções do controller

const path = require('path');

exports.abrirCrudPagamento_has_formapagamento = (req, res) => {
  console.log('pagamento_has_formapagamentoController - Rota /abrirCrudPagamento_has_formapagamento - abrir o crudPagamento_has_formapagamento');
  res.sendFile(path.join(__dirname, '../../frontend/pagamento_has_formapagamento/pagamento_has_formapagamento.html'));
}

exports.listarPagamento_has_formapagamentos = async (req, res) => {
  try {
    const result = await query('SELECT * FROM pagamento_has_formapagamento ORDER BY id_pagamento_res');
    // console.log('Resultado do SELECT:', result.rows);//verifica se está retornando algo
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar pagamento_has_formapagamentos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// ========================================
// CRIAR PAGAMENTO_HAS_FORMAPAGAMENTO - VERSÃO CORRIGIDA
// ========================================
exports.criarPagamento_has_formapagamento = async (req, res) => {
  try {
    console.log('\n🔗 [FORMA PAGAMENTO CONTROLLER] Criando relacionamento...');
    console.log('   Body recebido:', JSON.stringify(req.body, null, 2));
    
    const { id_pagamento, id_forma_pagamento, valor_pago } = req.body;

    // ============================================
    // BUSCAR PRÓXIMO ID DISPONÍVEL (CRÍTICO!)
    // ============================================
    console.log('🔢 [ID] Buscando próximo id_pagamento_res disponível...');
    
    const maxIdResult = await query('SELECT MAX(id_pagamento_res) as max_id FROM pagamento_has_formapagamento');
    const maxId = maxIdResult.rows[0].max_id || 0;
    const proximoId = maxId + 1;
    
    console.log(`   Último ID no banco: ${maxId}`);
    console.log(`   Próximo ID será: ${proximoId}`);

    // ============================================
    // VALIDAÇÃO
    // ============================================
    if (!id_pagamento || !id_forma_pagamento || !valor_pago) {
      console.error('❌ [FORMA PAGAMENTO] Dados obrigatórios não fornecidos');
      return res.status(400).json({
        error: 'id_pagamento, id_forma_pagamento e valor_pago são obrigatórios'
      });
    }

    console.log('   Valores finais:');
    console.log('   - id_pagamento_res:', proximoId);
    console.log('   - id_pagamento:', id_pagamento);
    console.log('   - id_forma_pagamento:', id_forma_pagamento);
    console.log('   - valor_pago:', valor_pago);

    // ============================================
    // INSERT COM ID EXPLÍCITO
    // ============================================
    console.log('🔍 [FORMA PAGAMENTO] Executando INSERT com ID explícito...');
    const result = await query(
      'INSERT INTO pagamento_has_formapagamento (id_pagamento_res, id_pagamento, id_forma_pagamento, valor_pago) VALUES ($1, $2, $3, $4) RETURNING *',
      [proximoId, id_pagamento, id_forma_pagamento, valor_pago]
    );

    console.log('✅ [FORMA PAGAMENTO] Relacionamento criado com sucesso!');
    console.log('   ID:', result.rows[0].id_pagamento_res);

    res.status(201).json(result.rows[0]);
    
  } catch (error) {
    console.error('\n❌ [FORMA PAGAMENTO] Erro ao criar relacionamento:', error);
    console.error('   Mensagem:', error.message);
    console.error('   Código:', error.code);

    // Verifica se é erro de violação de constraint NOT NULL
    if (error.code === '23502') {
      return res.status(400).json({
        error: 'Dados obrigatórios não fornecidos',
        message: 'Verifique se todos os campos necessários foram enviados',
        column: error.column
      });
    }

    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Violação de chave estrangeira',
        message: 'Pagamento ou forma de pagamento não encontrados'
      });
    }

    if (error.code === '23505') {
      return res.status(400).json({
        error: 'ID duplicado',
        message: 'Já existe um relacionamento com este ID. Tente novamente.',
        detail: error.detail
      });
    }

    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
}

exports.obterPagamento_has_formapagamento = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID deve ser um número válido' });
    }

    const result = await query(
      'SELECT * FROM pagamento_has_formapagamento WHERE id_pagamento_res = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pagamento_has_formapagamento não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter pagamento_has_formapagamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.atualizarPagamento_has_formapagamento = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { id_pagamento, id_forma_pagamento, valor_pago } = req.body;

   
    // Verifica se a pagamento_has_formapagamento existe
    const existingPersonResult = await query(
      'SELECT * FROM pagamento_has_formapagamento WHERE id_pagamento_res = $1',
      [id]
    );

    if (existingPersonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pagamento_has_formapagamento não encontrado' });
    }

    // Constrói a query de atualização dinamicamente para campos não nulos
    const currentPerson = existingPersonResult.rows[0];
    const updatedFields = {
      id_pagamento: id_pagamento !== undefined ? id_pagamento : currentPerson.id_pagamento,
      id_forma_pagamento: id_forma_pagamento !== undefined ? id_forma_pagamento : currentPerson.id_forma_pagamento,
      valor_pago: valor_pago !== undefined ? valor_pago : currentPerson.valor_pago
    };

    // Atualiza a pagamento_has_formapagamento
    const updateResult = await query(
      'UPDATE pagamento_has_formapagamento SET id_pagamento = $1, id_forma_pagamento = $2, valor_pago = $3 WHERE id_pagamento_res = $4 RETURNING *',
      [updatedFields.id_pagamento, updatedFields.id_forma_pagamento, updatedFields.valor_pago, id]
    );

    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar pagamento_has_formapagamento:', error);

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.deletarPagamento_has_formapagamento = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // Verifica se a pagamento_has_formapagamento existe
    const existingPersonResult = await query(
      'SELECT * FROM pagamento_has_formapagamento WHERE id_pagamento_res = $1',
      [id]
    );

    if (existingPersonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pagamento_has_formapagamento não encontrada' });
    }

    // Deleta a pagamento_has_formapagamento (as constraints CASCADE cuidarão das dependências)
    await query(
      'DELETE FROM pagamento_has_formapagamento WHERE id_pagamento_res = $1',
      [id]
    );

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar pagamento_has_formapagamento:', error);

    // Verifica se é erro de violação de foreign key (dependências)
    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Não é possível deletar pagamento_has_formapagamento com dependências associadas'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}