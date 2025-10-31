const db = require('../database.js');

// ===== CONFIGURAÇÃO CENTRALIZADA DE COOKIES =====
const getCookieOptions = () => {
  return {
    httpOnly: false, // Permite acesso via JavaScript
    secure: false,   // False para localhost (true apenas em HTTPS)
    sameSite: 'lax', // Proteção CSRF
    path: '/',
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  };
};

// ===== VERIFICAR SE PESSOA ESTÁ LOGADA =====
exports.verificaSePessoaEstaLogada = (req, res) => {
  console.log('loginController - Verificando se pessoa está logada');
  
  const nome = req.cookies.pessoaLogada;
  const tipo = req.cookies.tipoPessoa;
  const cargo = req.cookies.cargoPessoa;
  
  console.log('Cookies recebidos:', { nome, tipo, cargo });
  
  if (nome) {
    return res.json({ 
      status: 'ok', 
      nome, 
      tipo: tipo || 'cliente', 
      cargo: cargo || '' 
    });
  } else {
    return res.json({ 
      status: 'nao_logado' 
    });
  }
};

// ===== LOGIN DE CLIENTE =====
exports.loginCliente = async (req, res) => {
  const { email_pessoa, senha_pessoa } = req.body;

  const sql = `
    SELECT cpf, nome_pessoa, email_pessoa
    FROM pessoa
    WHERE email_pessoa = $1 AND senha_pessoa = $2
  `;

  console.log('Login cliente:', email_pessoa);

  try {
    const result = await db.query(sql, [email_pessoa, senha_pessoa]);

    if (result.rows.length === 0) {
      return res.json({ 
        status: 'credenciais_incorretas' 
      });
    }

    const { cpf, nome_pessoa, email_pessoa: email } = result.rows[0];

    // Verifica se é realmente um cliente
    const verificaCliente = await db.query(
      'SELECT cpf FROM cliente WHERE cpf = $1',
      [cpf]
    );

    if (verificaCliente.rows.length === 0) {
      return res.json({ 
        status: 'credenciais_incorretas', 
        mensagem: 'Usuário não é cliente' 
      });
    }

    // Define cookies
    const cookieOptions = getCookieOptions();

    res.cookie('pessoaLogada', nome_pessoa, cookieOptions);
    res.cookie('tipoPessoa', 'cliente', cookieOptions);
    res.cookie('idPessoa', cpf, cookieOptions);
    res.cookie('cargoPessoa', '', cookieOptions);

    console.log('✅ Cookies definidos - Cliente:', nome_pessoa);

    return res.json({
      status: 'ok',
      nome: nome_pessoa,
      email: email,
      tipo: 'cliente',
      cargo: ''
    });

  } catch (err) {
    console.error('Erro no login do cliente:', err);
    return res.status(500).json({ 
      status: 'erro', 
      mensagem: err.message 
    });
  }
};

// ===== LOGIN DE FUNCIONÁRIO/GERENTE =====
exports.loginFuncionario = async (req, res) => {
  const { email_pessoa, senha_pessoa } = req.body;

  const sql = `
    SELECT p.cpf, p.nome_pessoa, p.email_pessoa, c.nome_cargo
    FROM pessoa p
    INNER JOIN funcionario f ON p.cpf = f.cpf
    INNER JOIN cargo c ON f.id_cargo = c.id_cargo
    WHERE p.email_pessoa = $1 AND p.senha_pessoa = $2
  `;

  console.log('Login funcionário:', email_pessoa);

  try {
    const result = await db.query(sql, [email_pessoa, senha_pessoa]);

    if (result.rows.length === 0) {
      return res.json({ 
        status: 'credenciais_incorretas' 
      });
    }

    const { cpf, nome_pessoa, email_pessoa: email, nome_cargo } = result.rows[0];

    // Define cookies
    const cookieOptions = getCookieOptions();

    res.cookie('pessoaLogada', nome_pessoa, cookieOptions);
    res.cookie('tipoPessoa', 'funcionario', cookieOptions);
    res.cookie('idPessoa', cpf, cookieOptions);
    res.cookie('cargoPessoa', nome_cargo, cookieOptions);

    console.log('✅ Cookies definidos - Funcionário:', nome_pessoa, '/', nome_cargo);

    return res.json({
      status: 'ok',
      nome: nome_pessoa,
      email: email,
      tipo: 'funcionario',
      cargo: nome_cargo
    });

  } catch (err) {
    console.error('Erro no login do funcionário:', err);
    return res.status(500).json({ 
      status: 'erro', 
      mensagem: err.message 
    });
  }
};

// ===== CADASTRO DE CLIENTE =====
exports.cadastrarCliente = async (req, res) => {
  try {
    const { cpf, nome_pessoa, email_pessoa, senha_pessoa } = req.body;

    // Validação básica
    if (!cpf || !nome_pessoa || !email_pessoa || !senha_pessoa) {
      return res.status(400).json({
        status: 'erro',
        error: 'CPF, nome, email e senha são obrigatórios'
      });
    }

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email_pessoa)) {
      return res.status(400).json({
        status: 'erro',
        error: 'Formato de email inválido'
      });
    }

    // Validação de CPF
    if (cpf.length !== 11) {
      return res.status(400).json({
        status: 'erro',
        error: 'CPF deve ter 11 dígitos'
      });
    }

    // Verifica se CPF já existe
    const verificaCpf = await db.query(
      'SELECT cpf FROM pessoa WHERE cpf = $1',
      [cpf]
    );

    if (verificaCpf.rows.length > 0) {
      return res.status(400).json({
        status: 'erro',
        error: 'CPF já está em uso'
      });
    }

    // Verifica se email já existe
    const verificaEmail = await db.query(
      'SELECT email_pessoa FROM pessoa WHERE email_pessoa = $1',
      [email_pessoa]
    );

    if (verificaEmail.rows.length > 0) {
      return res.status(400).json({
        status: 'erro',
        error: 'Email já está em uso'
      });
    }

    // Insere nova pessoa
    await db.query(
      `INSERT INTO pessoa (cpf, nome_pessoa, email_pessoa, senha_pessoa)
       VALUES ($1, $2, $3, $4)`,
      [cpf, nome_pessoa, email_pessoa, senha_pessoa]
    );

    // Insere automaticamente na tabela cliente
    await db.query(
      `INSERT INTO cliente (cpf)
       VALUES ($1)`,
      [cpf]
    );

    console.log('✅ Cliente cadastrado:', nome_pessoa);

    return res.status(201).json({ 
      status: 'ok', 
      message: 'Cliente cadastrado com sucesso' 
    });

  } catch (error) {
    console.error('Erro ao cadastrar cliente:', error);

    if (error.code === '23505' && error.constraint?.includes('cpf')) {
      return res.status(400).json({
        status: 'erro',
        error: 'CPF já está em uso'
      });
    }

    if (error.code === '23505' && error.constraint?.includes('email')) {
      return res.status(400).json({
        status: 'erro',
        error: 'Email já está em uso'
      });
    }

    return res.status(500).json({ 
      status: 'erro',
      error: 'Erro interno do servidor' 
    });
  }
};

// ===== LOGOUT - VERSÃO CORRIGIDA =====
exports.logout = (req, res) => {
  console.log('🚪 Iniciando logout...');
  console.log('🍪 Cookies antes:', req.cookies);
  
  // CRÍTICO: Usar MESMOS parâmetros do login com maxAge: 0
  const cookieOptions = {
    httpOnly: false,  // MESMO valor do login
    secure: false,    // MESMO valor do login
    sameSite: 'lax',  // MESMO valor do login
    path: '/',        // MESMO valor do login
    maxAge: 0         // Expira imediatamente
  };
  
  // Limpar todos os cookies usando res.cookie
  res.cookie('pessoaLogada', '', cookieOptions);
  res.cookie('tipoPessoa', '', cookieOptions);
  res.cookie('idPessoa', '', cookieOptions);
  res.cookie('cargoPessoa', '', cookieOptions);
  
  console.log('✅ Cookies removidos');
  
  // IMPORTANTE: Retornar 'deslogado' para compatibilidade com frontend
  return res.json({ 
    status: 'deslogado',
    message: 'Logout realizado com sucesso'
  });
};