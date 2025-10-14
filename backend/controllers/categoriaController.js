//import { query } from '../database.js';
const { query } = require('../database');
// Funções do controller

const path = require('path');

exports.abrirCrudCategoria = (req, res) => {
  console.log('categoriaController - Rota /abrirCrudCategoria - abrir o crudCategoria');
  res.sendFile(path.join(__dirname, '../../frontend/categoria/categoria.html'));
}

exports.listarCategorias = async (req, res) => {
  try {
    const result = await query('SELECT * FROM categoria ORDER BY id_categoria');
    // console.log('Resultado do SELECT:', result.rows);//verifica se está retornando algo
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar categorias:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.criarCategoria = async (req, res) => {
  //  console.log('Criando categoria com dados:', req.body);
  try {
    const { id_categoria, nome_categoria} = req.body;

    // Validação básica
    if (!nome_categoria) {
      return res.status(400).json({
        error: 'Nome do categoria é obrigatório'
      });
    }

    const result = await query(
      'INSERT INTO categoria (id_categoria, nome_categoria) VALUES ($1, $2) RETURNING *',
      [id_categoria, nome_categoria]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar categoria:', error);

    // Verifica se é erro de violação de constraint NOT NULL
    if (error.code === '23502') {
      return res.status(400).json({
        error: 'Dados obrigatórios não fornecidos'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.obterCategoria = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID deve ser um número válido' });
    }

    const result = await query(
      'SELECT * FROM categoria WHERE id_categoria = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter categoria:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.atualizarCategoria = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nome_categoria } = req.body;

   
    // Verifica se a categoria existe
    const existingPersonResult = await query(
      'SELECT * FROM categoria WHERE id_categoria = $1',
      [id]
    );

    if (existingPersonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Categoria não encontrado' });
    }

    // Constrói a query de atualização dinamicamente para campos não nulos
    const currentPerson = existingPersonResult.rows[0];
    const updatedFields = {
      nome_categoria: nome_categoria !== undefined ? nome_categoria : currentPerson.nome_categoria
    };

    // Atualiza a categoria
    const updateResult = await query(
      'UPDATE categoria SET nome_categoria = $1 WHERE id_categoria = $2 RETURNING *',
      [updatedFields.nome_categoria, id]
    );

    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.deletarCategoria = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // Verifica se a categoria existe
    const existingPersonResult = await query(
      'SELECT * FROM categoria WHERE id_categoria = $1',
      [id]
    );

    if (existingPersonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }

    // Deleta a categoria (as constraints CASCADE cuidarão das dependências)
    await query(
      'DELETE FROM categoria WHERE id_categoria = $1',
      [id]
    );

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar categoria:', error);

    // Verifica se é erro de violação de foreign key (dependências)
    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Não é possível deletar categoria com dependências associadas'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
