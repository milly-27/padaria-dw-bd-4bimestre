const { query } = require('../database');
const path = require('path');

exports.abrirCrudPagamento = (req, res) => {
  console.log('pagamentoController - Rota /abrirCrudPagamento - abrir o crudPagamento');
  res.sendFile(path.join(__dirname, '../../frontend/pagamento/pagamento.html'));
}

exports.listarPagamentos = async (req, res) => {
  try {
    const result = await query('SELECT * FROM pagamento ORDER BY id_pagamento');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar pagamentos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.criarPagamento = async (req, res) => {
  try {
    console.log('\n💳 [PAGAMENTO CONTROLLER] Criando pagamento...');
    console.log('   Body recebido:', JSON.stringify(req.body, null, 2));
    
    let { id_pagamento, id_pedido, data_pagamento, valor_total } = req.body;

    // Validação básica
    if (!id_pedido || !valor_total) {
      console.error('❌ [PAGAMENTO] id_pedido ou valor_total não fornecidos');
      return res.status(400).json({
        error: 'id_pedido e valor_total são obrigatórios'
      });
    }

    // PUXAR DATA AUTOMÁTICA SE NÃO VIER DO FRONTEND
    if (!data_pagamento) {
      const hoje = new Date();
      const ano = hoje.getFullYear();
      const mes = String(hoje.getMonth() + 1).padStart(2, '0');
      const dia = String(hoje.getDate()).padStart(2, '0');
      data_pagamento = `${ano}-${mes}-${dia}`;
      
      console.log('   ℹ️ Data não fornecida, usando data atual:', data_pagamento);
    } else {
      console.log('   ℹ️ Data fornecida:', data_pagamento);
    }

    console.log('   Valores:');
    console.log('   - id_pedido:', id_pedido);
    console.log('   - data_pagamento:', data_pagamento);
    console.log('   - valor_total:', valor_total);

    console.log('🔍 [PAGAMENTO] Executando INSERT...');
    const result = await query(
      'INSERT INTO pagamento (id_pedido, data_pagamento, valor_total) VALUES ($1, $2, $3) RETURNING *',
      [id_pedido, data_pagamento, valor_total]
    );

    const pagamentoCriado = result.rows[0];
    console.log('✅ [PAGAMENTO] Criado com sucesso!');
    console.log('   ID:', pagamentoCriado.id_pagamento);
    console.log('   Resposta:', JSON.stringify(pagamentoCriado, null, 2));

    res.status(201).json(pagamentoCriado);
  } catch (error) {
    console.error('\n❌ [PAGAMENTO] Erro ao criar pagamento:', error);
    console.error('   Mensagem:', error.message);
    console.error('   Código:', error.code);

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
        message: 'Pedido não encontrado no sistema'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.obterPagamento = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID deve ser um número válido' });
    }

    const result = await query(
      'SELECT * FROM pagamento WHERE id_pagamento = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pagamento não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter pagamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.atualizarPagamento = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { id_pagamento, data_pagamento, valor_total } = req.body;

    // Verifica se o pagamento existe
    const existingPersonResult = await query(
      'SELECT * FROM pagamento WHERE id_pagamento = $1',
      [id]
    );

    if (existingPersonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pagamento não encontrado' });
    }

    // Constrói a query de atualização dinamicamente para campos não nulos
    const currentPerson = existingPersonResult.rows[0];
    const updatedFields = {
      id_pagamento: id_pagamento !== undefined ? id_pagamento : currentPerson.id_pagamento,
      data_pagamento: data_pagamento !== undefined ? data_pagamento : currentPerson.data_pagamento,
      valor_total: valor_total !== undefined ? valor_total : currentPerson.valor_total
    };

    // Atualiza o pagamento
    const updateResult = await query(
      'UPDATE pagamento SET data_pagamento = $1, valor_total = $2 WHERE id_pagamento = $3 RETURNING *',
      [updatedFields.data_pagamento, updatedFields.valor_total, id]
    );    

    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar pagamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.deletarPagamento = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Verifica se o pagamento existe
    const existingPersonResult = await query(
      'SELECT * FROM pagamento WHERE id_pagamento = $1',
      [id]
    );

    if (existingPersonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pagamento não encontrada' });
    }

    // Deleta o pagamento
    await query(
      'DELETE FROM pagamento WHERE id_pagamento = $1',
      [id]
    );

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar pagamento:', error);

    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Não é possível deletar pagamento com dependências associadas'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}