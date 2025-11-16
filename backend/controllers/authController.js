const db = require('../database');
const path = require('path');

// Configuração de cookies
const getCookieOptions = () => {
  return {
    httpOnly: false,     // Permite JavaScript acessar
    secure: false,       // Permite HTTP (não HTTPS)
    sameSite: 'none',    // Permite cross-site (CRITICAL para Live Server)
    path: '/',
    maxAge: 24 * 60 * 60 * 1000, // 24 horas
    domain: undefined    // Não especificar domínio para funcionar em qualquer localhost
  };
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, senha } = req.body;

    console.log('🔐 Login - Email:', email);

    if (!email || !senha) {
      return res.status(400).json({
        status: 'error',
        error: 'Email e senha são obrigatórios'
      });
    }

    // 1. Buscar pessoa pelo email e senha
    const pessoaResult = await db.query(
      `SELECT cpf, nome_pessoa, email_pessoa 
       FROM pessoa 
       WHERE email_pessoa = $1 AND senha_pessoa = $2`,
      [email, senha]
    );

    if (pessoaResult.rows.length === 0) {
      console.log('❌ Credenciais incorretas');
      return res.status(401).json({
        status: 'error',
        error: 'Email ou senha incorretos'
      });
    }

    const pessoa = pessoaResult.rows[0];
    const cpf = pessoa.cpf;
    let isGerente = false;
    let cargo = '';
    let tipo = 'cliente'; // padrão

    // 2. Verificar se é funcionário e se é gerente
    const funcionarioResult = await db.query(
      `SELECT f.id_cargo, c.nome_cargo 
       FROM funcionario f 
       INNER JOIN cargo c ON f.id_cargo = c.id_cargo 
       WHERE f.cpf = $1`,
      [cpf]
    );

    if (funcionarioResult.rows.length > 0) {
      tipo = 'funcionario';
      cargo = (funcionarioResult.rows[0].nome_cargo || '').toLowerCase();
      isGerente = (cargo === 'gerente');
      
      console.log(`✅ Identificado como FUNCIONÁRIO - Cargo: ${cargo}`);
      console.log(`   É gerente? ${isGerente ? 'SIM' : 'NÃO'}`);
    } else {
      // Verificar se existe na tabela cliente
      const clienteResult = await db.query(
        'SELECT cpf FROM cliente WHERE cpf = $1',
        [cpf]
      );
      
      if (clienteResult.rows.length === 0) {
        console.log('❌ Usuário não é nem funcionário nem cliente');
        return res.status(401).json({
          status: 'error',
          error: 'Usuário não autorizado'
        });
      }
      
      console.log('✅ Identificado como CLIENTE');
    }

    // 3. Configurar cookies
    const cookieOptions = getCookieOptions();
    
    res.cookie('idPessoa', cpf, cookieOptions);
    res.cookie('tipoPessoa', tipo, cookieOptions);
    res.cookie('cargoPessoa', cargo, cookieOptions);
    res.cookie('pessoaLogada', pessoa.nome_pessoa, cookieOptions);
    res.cookie('emailPessoa', pessoa.email_pessoa, cookieOptions);
    res.cookie('isGerente', isGerente.toString(), cookieOptions);

    console.log('✅ Login realizado com sucesso!');
    console.log('   Nome:', pessoa.nome_pessoa);
    console.log('   Tipo:', tipo);
    console.log('   Cargo:', cargo || 'N/A');
    console.log('   É Gerente:', isGerente);

    // 4. Retornar resposta
    return res.status(200).json({
      status: 'ok',
      message: 'Login realizado com sucesso',
      usuario: {
        id: cpf,
        nome: pessoa.nome_pessoa,
        email: pessoa.email_pessoa,
        tipo: tipo,
        cargo: cargo,
        isGerente: isGerente
      }
    });

  } catch (error) {
    console.error('❌ Erro ao fazer login:', error);
    return res.status(500).json({ 
      status: 'error',
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
};

// VERIFICAR SE ESTÁ LOGADO
exports.verificarLogin = async (req, res) => {
  console.log('✅ Verificando se pessoa está logada');
  console.log('🍪 Cookies recebidos:', req.cookies);
  
  try {
    const id = req.cookies.idPessoa;
    const nome = req.cookies.pessoaLogada;
    const email = req.cookies.emailPessoa;
    const tipo = req.cookies.tipoPessoa || 'cliente';
    let cargo = (req.cookies.cargoPessoa || '').toLowerCase();
    let isGerente = req.cookies.isGerente === 'true';
    
    if (!id || !nome) {
      console.log('❌ Dados de autenticação ausentes nos cookies');
      return res.json({ 
        status: 'nao_logado',
        message: 'Usuário não está logado'
      });
    }

    // Se for funcionário, revalidar cargo no banco
    if (tipo === 'funcionario') {
      try {
        const result = await db.query(
          `SELECT c.nome_cargo 
           FROM funcionario f 
           INNER JOIN cargo c ON f.id_cargo = c.id_cargo 
           WHERE f.cpf = $1`,
          [id]
        );
        
        if (result.rows.length > 0) {
          cargo = (result.rows[0].nome_cargo || '').toLowerCase();
          isGerente = (cargo === 'gerente');
          
          // Atualizar cookies se mudou
          if (req.cookies.cargoPessoa !== cargo || req.cookies.isGerente !== isGerente.toString()) {
            const cookieOptions = getCookieOptions();
            res.cookie('cargoPessoa', cargo, cookieOptions);
            res.cookie('isGerente', isGerente.toString(), cookieOptions);
          }
        }
      } catch (error) {
        console.error('❌ Erro ao revalidar cargo:', error);
      }
    }

    console.log('✅ Usuário autenticado:', { id, nome, tipo, cargo, isGerente });
    
    return res.json({ 
      status: 'ok', 
      usuario: {
        id,
        nome,
        email: email || '',
        tipo,
        cargo,
        isGerente
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar autenticação:', error);
    return res.status(500).json({
      status: 'erro',
      message: 'Erro ao verificar autenticação'
    });
  }
};

// VERIFICAR EMAIL
exports.verificarEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email é obrigatório'
      });
    }

    const result = await db.query(
      'SELECT * FROM pessoa WHERE email_pessoa = $1',
      [email]
    );

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

// LOGOUT
exports.logout = async (req, res) => {
  try {
    console.log('🚪 Processando logout...');
    
    const cookieOptions = {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 0
    };

    // Limpar todos os cookies
    res.cookie('idPessoa', '', cookieOptions);
    res.cookie('tipoPessoa', '', cookieOptions);
    res.cookie('cargoPessoa', '', cookieOptions);
    res.cookie('pessoaLogada', '', cookieOptions);
    res.cookie('emailPessoa', '', cookieOptions);
    res.cookie('isGerente', '', cookieOptions);
    
    console.log('✅ Cookies limpos');

    res.status(200).json({
      status: 'deslogado',
      message: 'Logout realizado com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao fazer logout:', error);
    res.status(500).json({ 
      status: 'error',
      error: 'Erro interno do servidor ao fazer logout' 
    });
  }
};

// CADASTRAR CLIENTE
exports.cadastrarCliente = async (req, res) => {
  const { cpf, nome_pessoa, email_pessoa, senha_pessoa } = req.body;

  console.log('📝 Tentando cadastrar cliente:', nome_pessoa);

  try {
    // Verificar se CPF já existe
    const cpfExiste = await db.query(
      'SELECT cpf FROM pessoa WHERE cpf = $1',
      [cpf]
    );

    if (cpfExiste.rows.length > 0) {
      return res.json({ 
        status: 'erro',
        error: 'CPF já cadastrado' 
      });
    }

    // Verificar se email já existe
    const emailExiste = await db.query(
      'SELECT email_pessoa FROM pessoa WHERE email_pessoa = $1',
      [email_pessoa]
    );

    if (emailExiste.rows.length > 0) {
      return res.json({ 
        status: 'erro',
        error: 'Email já cadastrado' 
      });
    }

    // Inserir pessoa
    await db.query(
      'INSERT INTO pessoa (cpf, nome_pessoa, email_pessoa, senha_pessoa) VALUES ($1, $2, $3, $4)',
      [cpf, nome_pessoa, email_pessoa, senha_pessoa]
    );

    // Inserir cliente
    await db.query(
      'INSERT INTO cliente (cpf) VALUES ($1)',
      [cpf]
    );

    console.log('✅ Cliente cadastrado com sucesso');

    return res.json({
      status: 'ok',
      message: 'Cliente cadastrado com sucesso'
    });

  } catch (err) {
    console.error('❌ Erro ao cadastrar cliente:', err);
    return res.status(500).json({ 
      status: 'erro',
      error: 'Erro ao cadastrar cliente',
      mensagem: err.message 
    });
  }
};

// MIDDLEWARE DE AUTENTICAÇÃO
exports.verificarAutenticacao = (req, res, next) => {
  const id = req.cookies.idPessoa;
  const nome = req.cookies.pessoaLogada;
  
  if (!id || !nome) {
    return res.status(401).json({
      status: 'error',
      error: 'Não autorizado'
    });
  }
  
  next();
};