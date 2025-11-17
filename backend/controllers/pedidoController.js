// backend/controllers/pedidoController.js - VERSÃO CORRIGIDA

const { query } = require('../database');
const path = require('path');

exports.abrirCrudPedido = (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/pedido/pedido.html'));
};

exports.listarPedidos = async (req, res) => {
  try {
    const result = await query('SELECT * FROM pedido ORDER BY id_pedido');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar pedidos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ============================================
// FUNÇÃO CORRIGIDA - CRIAR PEDIDO
// ============================================
exports.criarPedido = async (req, res) => {
  console.log('\n📝 [CRIAR PEDIDO] Iniciando...');
  console.log('📦 Body recebido:', JSON.stringify(req.body, null, 2));
  
  try {
    const { cpf, data_pedido, valor_total } = req.body;

    // ============================================
    // VALIDAÇÃO CORRIGIDA - TODOS OS CAMPOS OBRIGATÓRIOS
    // ============================================
    console.log('🔍 Validando campos obrigatórios...');
    console.log('   CPF:', cpf);
    console.log('   Data:', data_pedido);
    console.log('   Valor:', valor_total);

    // Verificar se TODOS os campos obrigatórios estão presentes
    if (!cpf || !data_pedido || valor_total === undefined || valor_total === null) {
      console.error('❌ Validação falhou!');
      console.error('   CPF presente?', !!cpf);
      console.error('   Data presente?', !!data_pedido);
      console.error('   Valor presente?', valor_total !== undefined && valor_total !== null);
      
      return res.status(400).json({
        error: 'Dados obrigatórios não fornecidos',
        message: 'CPF, data_pedido e valor_total são obrigatórios',
        campos_recebidos: {
          cpf: cpf || 'AUSENTE',
          data_pedido: data_pedido || 'AUSENTE',
          valor_total: valor_total !== undefined ? valor_total : 'AUSENTE'
        }
      });
    }

    console.log('✅ Validação OK! Todos os campos presentes');

    // ============================================
    // INSERIR NO BANCO
    // ============================================
    console.log('💾 Inserindo no banco de dados...');
    console.log('   Query: INSERT INTO pedido (cpf, data_pedido, valor_total)');
    console.log('   Valores: [$1, $2, $3]', [cpf, data_pedido, valor_total]);

    const result = await query(
      'INSERT INTO pedido (cpf, data_pedido, valor_total) VALUES ($1, $2, $3) RETURNING *',
      [cpf, data_pedido, valor_total]
    );

    console.log('✅ Pedido criado com sucesso!');
    console.log('   ID gerado:', result.rows[0].id_pedido);

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error('❌ Erro ao criar pedido:', error);
    console.error('   Mensagem:', error.message);
    console.error('   Código:', error.code);
    console.error('   Stack:', error.stack);

    // Tratamento de erros específicos do PostgreSQL
    if (error.code === '23502') {
      return res.status(400).json({
        error: 'Erro de validação do banco de dados',
        message: 'Um ou mais campos obrigatórios estão ausentes',
        detalhe: error.message
      });
    }

    if (error.code === '23503') {
      return res.status(400).json({
        error: 'CPF não encontrado',
        message: 'O CPF fornecido não existe na tabela pessoa',
        detalhe: 'Verifique se o usuário está cadastrado'
      });
    }

    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
};

exports.obterPedido = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID deve ser um número válido' });
    }

    const result = await query(
      'SELECT * FROM pedido WHERE id_pedido = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter pedido:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.atualizarPedido = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

    const { data_pedido, cpf, valor_total } = req.body;

    const existing = await query('SELECT * FROM pedido WHERE id_pedido = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    const sql = `
      UPDATE pedido
      SET data_pedido = $1,
          cpf = $2,
          valor_total = $3
      WHERE id_pedido = $4
      RETURNING *
    `;
    const values = [data_pedido, cpf, valor_total, id];

    const updateResult = await query(sql, values);
    return res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar pedido:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.deletarPedido = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existingPersonResult = await query(
      'SELECT * FROM pedido WHERE id_pedido = $1',
      [id]
    );

    if (existingPersonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrada' });
    }

    await query(
      'DELETE FROM pedido WHERE id_pedido = $1',
      [id]
    );

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar pedido:', error);

    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Não é possível deletar pedido com dependências associadas'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};