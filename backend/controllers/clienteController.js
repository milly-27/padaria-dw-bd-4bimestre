//import { query } from '../database.js';
const { query } = require('../database');
// Funções do controller

const path = require('path');

exports.abrirCrudCliente = (req, res) => {
  console.log('clienteController - Rota /abrirCrudCliente - abrir o crudCliente');
  res.sendFile(path.join(__dirname, '../../frontend/cliente/cliente.html'));
}

exports.listarClientes = async (req, res) => {
  try {
    const result = await query('SELECT * FROM cliente ORDER BY cpf');
    // console.log('Resultado do SELECT:', result.rows);//verifica se está retornando algo
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar clientes:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
// Em clienteController.js

exports.criarCliente = async (req, res) => {
  console.log('REQ.BODY:', req.body);
  try {
    const { cpf } = req.body;

    // Validação básica
    if (!cpf) {
      return res.status(400).json({
        error: 'CPF é obrigatório'
      });
    }

    let result;
    if (global.useMockData) {
      result = await global.mockDatabase.criarCliente({ cpf });
    } else {
      result = await query(
        'INSERT INTO cliente (cpf) VALUES ($1) RETURNING *',
        [cpf]
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar cliente:', error);

    // Verifica se é erro de chave primária duplicada (cliente já existe)
    if (error.code === '23505') {
      return res.status(409).json({
        error: 'Este CPF já está cadastrado como cliente'
      });
    }

    // Verifica se é erro de violação de constraint NOT NULL
    if (error.code === '23502') {
      return res.status(400).json({
        error: 'Dados obrigatórios não fornecidos'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.obterCliente = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID deve ser um número válido' });
    }

    const result = await query(
      'SELECT * FROM cliente WHERE cpf = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.atualizarCliente = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

   
    // Verifica se a cliente existe
    const existingPersonResult = await query(
      'SELECT * FROM cliente WHERE cpf = $1',
      [id]
    );

    if (existingPersonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    // Constrói a query de atualização dinamicamente para campos não nulos
    const currentPerson = existingPersonResult.rows[0];
    const updatedFields = {
    };

    // Atualiza a cliente
    const updateResult = await query(
      'UPDATE cliente SET  WHERE cpf = $1 RETURNING *',
      [updatedFields.nome_cliente, id]
    );

    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.deletarCliente = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // Verifica se a cliente existe
    const existingPersonResult = await query(
      'SELECT * FROM cliente WHERE cpf = $1',
      [id]
    );

    if (existingPersonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrada' });
    }

    // Deleta a cliente (as constraints CASCADE cuidarão das dependências)
    await query(
      'DELETE FROM cliente WHERE cpf = $1',
      [id]
    );

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar cliente:', error);

    // Verifica se é erro de violação de foreign key (dependências)
    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Não é possível deletar cliente com dependências associadas'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// Função para obter cliente por CPF da pessoa
exports.obterClientePorCpf = async (req, res) => {
  try {
    const cpf = req.params.cpf;

    if (!cpf) {
      return res.status(400).json({ error: "CPF é obrigatório" });
    }

    let result;
    if (global.useMockData) {
      result = await global.mockDatabase.obterClientePorCpf(cpf);
    } else {
      result = await query(
        'SELECT * FROM cliente WHERE cpf = $1',
        [cpf]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Cliente não encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Erro ao obter cliente por CPF:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};
