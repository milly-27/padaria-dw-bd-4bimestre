//import { query } from '../database.js';
const { query } = require('../database');
// Funções do controller

const path = require('path');

exports.abrirCrudPessoa = (req, res) => {
//  console.log('pessoaController - Rota /abrirCrudPessoa - abrir o crudPessoa');
  res.sendFile(path.join(__dirname, '../../frontend/pessoa/pessoa.html'));
}

exports.listarPessoas = async (req, res) => {
  try {
    let result;
    if (global.useMockData) {
      result = await global.mockDatabase.listarPessoas();
    } else {
      result = await query("SELECT * FROM pessoa ORDER BY cpf");
    }
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar pessoas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.criarPessoa = async (req, res) => {
  try {
    const { cpf, nome_pessoa, email_pessoa, senha_pessoa } = req.body;

    // Validação básica
    if (!nome_pessoa || !email_pessoa || !senha_pessoa || !cpf) {
      return res.status(400).json({
        error: 'Nome, email, senha e CPF são obrigatórios'
      });
    }

    // Validação de email básica
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email_pessoa)) {
      return res.status(400).json({
        error: 'Formato de email inválido'
      });
    }

    let result;
    if (global.useMockData) {
      // Verificar se email já existe
      const emailExiste = await global.mockDatabase.verificarEmailExiste(email_pessoa);
      if (emailExiste.rows.length > 0) {
        return res.status(400).json({
          error: 'Email já está em uso'
        });
      }
      
      result = await global.mockDatabase.criarPessoa({
        id_pessoa, cpf_pessoa, nome_pessoa, email_pessoa, senha_pessoa
      });
    } else {
      let queryText, queryParams;
      
      queryText = 'INSERT INTO pessoa (cpf, nome_pessoa, email_pessoa, senha_pessoa) VALUES ($1, $2, $3, $4) RETURNING *';
      queryParams = [cpf, nome_pessoa, email_pessoa, senha_pessoa];

      result = await query(queryText, queryParams);
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar pessoa:', error);

    // Verifica se é erro de email duplicado (constraint unique violation)
    if (error.code === '23505' && error.constraint === 'pessoa_email_pessoa_key') {
      return res.status(400).json({
        error: 'Email já está em uso'
      });
    }

    // Verifica se é erro de CPF duplicado
    if (error.code === '23505' && error.constraint === 'pessoa_cpf_pessoa_key') {
      return res.status(400).json({
        error: 'CPF já está em uso'
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

exports.obterPessoa = async (req, res) => {
  try {
    const cpf = req.params.id; // Usando id do parâmetro da rota

    if (!cpf) {
      return res.status(400).json({ error: 'CPF é obrigatório' });
    }

    let result;
    if (global.useMockData) {
      result = await global.mockDatabase.obterPessoa(cpf);
    } else {
      result = await query(
        'SELECT * FROM pessoa WHERE cpf = $1',
        [cpf]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pessoa não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter pessoa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.atualizarPessoa = async (req, res) => {
  try {
    const cpf = req.params.id; // Usando id do parâmetro da rota
    const { nome_pessoa, email_pessoa, senha_pessoa } = req.body;

    // Validação de email se fornecido
    if (email_pessoa) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email_pessoa)) {
        return res.status(400).json({
          error: 'Formato de email inválido'
        });
      }
    }
    // Verifica se a pessoa existe
    const existingPersonResult = await query(
      'SELECT * FROM pessoa WHERE cpf = $1',
      [cpf]
    );

    if (existingPersonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pessoa não encontrada' });
    }

    // Constrói a query de atualização dinamicamente para campos não nulos
    const currentPerson = existingPersonResult.rows[0];
    const updatedFields = {
      nome_pessoa: nome_pessoa !== undefined ? nome_pessoa : currentPerson.nome_pessoa,
      email_pessoa: email_pessoa !== undefined ? email_pessoa : currentPerson.email_pessoa,
      senha_pessoa: senha_pessoa !== undefined ? senha_pessoa : currentPerson.senha_pessoa,
    };

    // Atualiza a pessoa
    const updateResult = await query(
      'UPDATE pessoa SET nome_pessoa = $1, email_pessoa = $2, senha_pessoa = $3 WHERE cpf = $4 RETURNING *',
      [updatedFields.nome_pessoa, updatedFields.email_pessoa, updatedFields.senha_pessoa, cpf]
    );

    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar pessoa:', error);

    // Verifica se é erro de email duplicado
    if (error.code === '23505' && error.constraint === 'pessoa_email_pessoa_key') {
      return res.status(400).json({
        error: 'Email já está em uso por outra pessoa'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.deletarPessoa = async (req, res) => {
  try {
    const cpf = req.params.id; // Usando id do parâmetro da rota
    // Verifica se a pessoa existe
    const existingPersonResult = await query(
      'SELECT * FROM pessoa WHERE cpf = $1',
      [cpf]
    );

    if (existingPersonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pessoa não encontrada' });
    }

    // Deleta a pessoa (as constraints CASCADE cuidarão das dependências)
    await query(
      'DELETE FROM pessoa WHERE cpf = $1',
      [cpf]
    );

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar pessoa:', error);

    // Verifica se é erro de violação de foreign key (dependências)
    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Não é possível deletar pessoa com dependências associadas'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// Função adicional para buscar pessoa por email
exports.obterPessoaPorEmail = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }

    const result = await query(
      'SELECT * FROM pessoa WHERE email_pessoa = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pessoa não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter pessoa por email:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// Função para atualizar apenas a senha
exports.atualizarSenha = async (req, res) => {
  try {
    const cpf = req.params.id; // Usando id do parâmetro da rota
    const { senha_atual, nova_senha } = req.body;

    if (!cpf) {
      return res.status(400).json({ error: 'CPF é obrigatório' });
    }

    if (!senha_atual || !nova_senha) {
      return res.status(400).json({
        error: 'Senha atual e nova senha são obrigatórias'
      });
    }

    // Verifica se a pessoa existe e a senha atual está correta
    const personResult = await query(
      'SELECT * FROM pessoa WHERE cpf = $1',
      [cpf]
    );

    if (personResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pessoa não encontrada' });
    }

    const person = personResult.rows[0];

    // Verificação básica da senha atual (em produção, use hash)
    if (person.senha_pessoa !== senha_atual) {
      return res.status(400).json({ error: 'Senha atual incorreta' });
    }

    // Atualiza apenas a senha
    const updateResult = await query(
      'UPDATE pessoa SET senha_pessoa = $1 WHERE cpf = $2 RETURNING cpf, nome_pessoa, email_pessoa',
      [nova_senha, cpf]
    );

    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}