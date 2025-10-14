
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

exports.criarPedido = async (req, res) => {
  try {
    const { id_pedido, data_pedido, cpf, valor_total } = req.body;

    if (!data_pedido) {
      return res.status(400).json({
        error: 'A data do pedido é obrigatória'
      });
    }

    const result = await query(
      'INSERT INTO pedido (id_pedido, data_pedido, cpf, valor_total) VALUES ($1, $2, $3, $4) RETURNING *',
      [id_pedido, data_pedido, cpf, valor_total]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar pedido:', error);

    if (error.code === '23502') {
      return res.status(400).json({
        error: 'Dados obrigatórios não fornecidos'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
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

