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

exports.criarPagamento_has_formapagamento = async (req, res) => {
  //  console.log('Criando pagamento_has_formapagamento com dados:', req.body);
  try {
    const { id_pagamento_res,id_pagamento, id_forma_pagamento, valor_pago} = req.body;

    // Validação básica
    if (!id_pagamento || !id_forma_pagamento || !valor_pago) {
      return res.status(400).json({
        error: 'id_pagamento, id_forma_pagamento e valor_pago são obrigatórios'
      });
    }
    

    const result = await query(
      'INSERT INTO pagamento_has_formapagamento (id_pagamento_res, id_pagamento, id_forma_pagamento, valor_pago) VALUES ($1, $2,$3, $4) RETURNING *',
      [id_pagamento_res, id_pagamento, id_forma_pagamento, valor_pago]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar pagamento_has_formapagamento:', error);

    // Verifica se é erro de violação de constraint NOT NULL
    if (error.code === '23502') {
      return res.status(400).json({
        error: 'Dados obrigatórios não fornecidos'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
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
      [updatedFields.id_pagamento, id_forma_pagamento, valor_pago, id]
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
