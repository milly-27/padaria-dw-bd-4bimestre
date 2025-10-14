const { query } = require('../database');
const path = require('path');

// Função para fazer login
exports.login = async (req, res) => {
  try {
    const { email, senha } = req.body;

    // Validação básica
    if (!email || !senha) {
      return res.status(400).json({
        error: 'Email e senha são obrigatórios'
      });
    }

    let result;
    if (global.useMockData) {
      result = await global.mockDatabase.verificarLogin(email, senha);
    } else {
      result = await query(
        'SELECT * FROM pessoa WHERE email_pessoa = $1 AND senha_pessoa = $2',
        [email, senha]
      );
    }

    if (result.rows.length === 0) {
      // Verificar se o email existe
      let emailExiste;
      if (global.useMockData) {
        emailExiste = await global.mockDatabase.verificarEmailExiste(email);
      } else {
        emailExiste = await query(
          'SELECT * FROM pessoa WHERE email_pessoa = $1',
          [email]
        );
      }

      if (emailExiste.rows.length === 0) {
        return res.status(404).json({
          error: 'Usuário não encontrado'
        });
      } else {
        return res.status(401).json({
          error: 'Senha incorreta'
        });
      }
    }

    const usuario = result.rows[0];

    // Login bem-sucedido
    res.json({
      message: 'Login realizado com sucesso',
      usuario: {
        id_pessoa: usuario.id_pessoa,
        nome_pessoa: usuario.nome_pessoa,
        email_pessoa: usuario.email_pessoa,
        cpf_pessoa: usuario.cpf_pessoa
      }
    });

  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Função para verificar se email existe
exports.verificarEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email é obrigatório'
      });
    }

    let result;
    if (global.useMockData) {
      result = await global.mockDatabase.verificarEmailExiste(email);
    } else {
      result = await query(
        'SELECT * FROM pessoa WHERE email_pessoa = $1',
        [email]
      );
    }

    if (result.rows.length > 0) {
      return res.status(409).json({
        error: 'Email já está em uso'
      });
    }

    res.json({
      message: 'Email disponível'
    });

  } catch (error) {
    console.error('Erro ao verificar email:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Função para logout (limpar dados do lado cliente)
exports.logout = async (req, res) => {
  try {
    res.json({
      message: 'Logout realizado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Função para verificar se usuário está logado (middleware)
exports.verificarAutenticacao = (req, res, next) => {
  // Como estamos usando localStorage no frontend, 
  // esta função pode ser usada para verificações futuras
  next();
};
