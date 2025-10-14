const db = require('../database.js');

// Verificar se pessoa está logada
exports.verificaSePessoaEstaLogada = (req, res) => {
  console.log('loginController - Acessando rota /verificaSePessoaEstaLogada');
  let nome = req.cookies.pessoaLogada;
  let tipo = req.cookies.tipoPessoa;
  let cargo = req.cookies.cargoPessoa;
  console.log('Cookie pessoaLogada:', nome);
  console.log('Cookie tipoPessoa:', tipo);
  console.log('Cookie cargoPessoa:', cargo);
  
  if (nome) {
    res.json({ status: 'ok', nome, tipo, cargo });
  } else {
    res.json({ status: 'nao_logado' });
  }
}

// Login de cliente
exports.loginCliente = async (req, res) => {
  const { email_pessoa, senha_pessoa } = req.body;

  const sql = `
    SELECT cpf, nome_pessoa, email_pessoa
    FROM pessoa
    WHERE email_pessoa = $1 AND senha_pessoa = $2
  `;

  console.log('Rota loginCliente:', sql, email_pessoa);

  try {
    const result = await db.query(sql, [email_pessoa, senha_pessoa]);

    if (result.rows.length === 0) {
      return res.json({ status: 'credenciais_incorretas' });
    }

    const { cpf, nome_pessoa, email_pessoa: email } = result.rows[0];

    // Define cookies
    res.cookie('pessoaLogada', nome_pessoa, {
      sameSite: 'Lax',
      secure: false,
      httpOnly: true,
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.cookie('tipoPessoa', 'cliente', {
      sameSite: 'Lax',
      secure: false,
      httpOnly: true,
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.cookie('idPessoa', cpf, {
      sameSite: 'Lax',
      secure: false,
      httpOnly: true,
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.cookie('cargoPessoa', '', {
      sameSite: 'Lax',
      secure: false,
      httpOnly: true,
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });

    console.log("Login de cliente realizado com sucesso");

    return res.json({
      status: 'ok',
      nome: nome_pessoa,
      email: email,
      tipo: 'cliente',
      cargo: ''
    });

  } catch (err) {
    console.error('Erro ao fazer login do cliente:', err);
    return res.status(500).json({ status: 'erro', mensagem: err.message });
  }
}

// Login de funcionário/gerente
exports.loginFuncionario = async (req, res) => {
  const { email_pessoa, senha_pessoa } = req.body;

  const sql = `
    SELECT cpf, nome_pessoa, email_pessoa
    FROM pessoa
    WHERE email_pessoa = $1 AND senha_pessoa = $2
  `;

  console.log('Rota loginFuncionario:', sql, email_pessoa);

  try {
    const result = await db.query(sql, [email_pessoa, senha_pessoa]);

    if (result.rows.length === 0) {
      return res.json({ status: 'credenciais_incorretas' });
    }

    const { cpf, nome_pessoa, email_pessoa: email } = result.rows[0];

    // Define cookies
    res.cookie('pessoaLogada', nome_pessoa, {
      sameSite: 'Lax',
      secure: false,
      httpOnly: true,
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.cookie('tipoPessoa', 'funcionario', {
      sameSite: 'Lax',
      secure: false,
      httpOnly: true,
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.cookie('idPessoa', cpf, {
      sameSite: 'Lax',
      secure: false,
      httpOnly: true,
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.cookie('cargoPessoa', '', {
      sameSite: 'Lax',
      secure: false,
      httpOnly: true,
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });

    console.log("Login de funcionário realizado com sucesso");

    return res.json({
      status: 'ok',
      nome: nome_pessoa,
      email: email,
      tipo: 'funcionario',
      cargo: ''
    });

  } catch (err) {
    console.error('Erro ao fazer login do funcionário:', err);
    return res.status(500).json({ status: 'erro', mensagem: err.message });
  }
}

// Cadastro de cliente
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

    // Validação de email básica
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email_pessoa)) {
      return res.status(400).json({
        status: 'erro',
        error: 'Formato de email inválido'
      });
    }

    // Validação de CPF básica
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

    // Insere nova pessoa na tabela pessoa
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

    res.status(201).json({ 
      status: 'ok', 
      message: 'Cliente cadastrado com sucesso' 
    });

  } catch (error) {
    console.error('Erro ao cadastrar cliente:', error);

    // Verifica se é erro de CPF duplicado
    if (error.code === '23505' && error.constraint?.includes('cpf')) {
      return res.status(400).json({
        status: 'erro',
        error: 'CPF já está em uso'
      });
    }

    // Verifica se é erro de email duplicado
    if (error.code === '23505' && error.constraint?.includes('email')) {
      return res.status(400).json({
        status: 'erro',
        error: 'Email já está em uso'
      });
    }

    res.status(500).json({ 
      status: 'erro',
      error: 'Erro interno do servidor' 
    });
  }
};

// Logout
exports.logout = (req, res) => {
  res.clearCookie('pessoaLogada', {
    sameSite: 'Lax',
    secure: false,
    httpOnly: true,
    path: '/',
  });
  
  res.clearCookie('tipoPessoa', {
    sameSite: 'Lax',
    secure: false,
    httpOnly: true,
    path: '/',
  });
  
  res.clearCookie('idPessoa', {
    sameSite: 'Lax',
    secure: false,
    httpOnly: true,
    path: '/',
  });
  
  res.clearCookie('cargoPessoa', {
    sameSite: 'Lax',
    secure: false,
    httpOnly: true,
    path: '/',
  });
  
  console.log("Cookies removidos com sucesso");
  res.json({ status: 'deslogado' });
}