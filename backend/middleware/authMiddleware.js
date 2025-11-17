const db = require('../database');

// Middleware para verificar se o usuário está autenticado
exports.verificarAutenticacao = async (req, res, next) => {
  const cpf = req.cookies.usuarioCpf;
  const nome = req.cookies.usuarioLogado;

  if (!cpf || !nome) {
    return res.status(401).json({ 
      error: 'Não autenticado',
      message: 'Faça login para acessar este recurso' 
    });
  }

  try {
    // Verificar se o usuário ainda existe
    const result = await db.query(
      'SELECT cpf, nome_pessoa, email_pessoa FROM pessoa WHERE cpf = $1',
      [cpf]
    );

    if (result.rows.length === 0) {
      // Limpar cookies inválidos
      res.clearCookie('usuarioLogado', {
        sameSite: 'None',
        secure: true,
        httpOnly: true,
        path: '/',
      });
      res.clearCookie('usuarioCpf', {
        sameSite: 'None',
        secure: true,
        httpOnly: true,
        path: '/',
      });
      return res.status(401).json({ 
        error: 'Sessão inválida',
        message: 'Faça login novamente' 
      });
    }

    // Adicionar dados do usuário na requisição
    req.user = result.rows[0];
    next();

  } catch (err) {
    console.error('❌ Erro ao verificar autenticação:', err);
    res.status(500).json({ error: 'Erro ao verificar autenticação' });
  }
};

// Middleware para verificar se o usuário é funcionário
exports.verificarFuncionario = async (req, res, next) => {
  const cpf = req.cookies.usuarioCpf;

  if (!cpf) {
    return res.status(401).json({ 
      error: 'Não autenticado',
      message: 'Faça login para acessar este recurso' 
    });
  }

  try {
    const result = await db.query(
      `SELECT f.cpf, c.nome_cargo 
       FROM funcionario f
       JOIN cargo c ON f.id_cargo = c.id_cargo
       WHERE f.cpf = $1`,
      [cpf]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ 
        error: 'Acesso negado',
        message: 'Apenas funcionários podem acessar este recurso' 
      });
    }

    // Adicionar dados do funcionário na requisição
    req.funcionario = result.rows[0];
    next();

  } catch (err) {
    console.error('❌ Erro ao verificar funcionário:', err);
    res.status(500).json({ error: 'Erro ao verificar permissões' });
  }
};

// Middleware opcional - não bloqueia se não estiver logado
exports.verificarAutenticacaoOpcional = async (req, res, next) => {
  const cpf = req.cookies.usuarioCpf;

  if (!cpf) {
    req.user = null;
    return next();
  }

  try {
    const result = await db.query(
      'SELECT cpf, nome_pessoa, email_pessoa FROM pessoa WHERE cpf = $1',
      [cpf]
    );

    req.user = result.rows.length > 0 ? result.rows[0] : null;
    next();

  } catch (err) {
    console.error('❌ Erro ao verificar autenticação opcional:', err);
    req.user = null;
    next();
  }
};