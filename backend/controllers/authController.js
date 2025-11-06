const db = require('../database');

// Configuração de cookies para desenvolvimento
const getCookieOptions = () => {
  return {
    httpOnly: false,
    secure: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000
  };
};

// Função para fazer login
exports.login = async (req, res) => {
  try {
    const { email, senha } = req.body;

    console.log('🔐 authController.login - Email:', email);

    if (!email || !senha) {
      console.log('❌ Email ou senha ausentes');
      return res.status(400).json({
        status: 'error',
        error: 'Email e senha são obrigatórios'
      });
    }

    // Buscar pessoa no banco
    console.log('🔍 Buscando pessoa no banco...');
    const result = await db.query(
      `SELECT p.cpf, p.nome_pessoa, p.email_pessoa,
              f.id_cargo, c.nome_cargo 
       FROM pessoa p 
       LEFT JOIN funcionario f ON p.cpf = f.cpf
       LEFT JOIN cargo c ON f.id_cargo = c.id_cargo
       WHERE p.email_pessoa = $1 AND p.senha_pessoa = $2`,
      [email, senha]
    );

    console.log('📊 Resultado da busca:', result.rows.length, 'registro(s)');

    if (result.rows.length === 0) {
      console.log('❌ Credenciais incorretas');
      return res.status(401).json({
        status: 'error',
        error: 'Email ou senha incorretos'
      });
    }

    const usuario = result.rows[0];
    const cpf = usuario.cpf;
    const tipoUsuario = usuario.id_cargo ? 'funcionario' : 'cliente';
    const cargo = (usuario.nome_cargo || '').toLowerCase();
    const isGerente = tipoUsuario === 'funcionario' && cargo === 'gerente';

    console.log('✅ Usuário encontrado:');
    console.log('   Nome:', usuario.nome_pessoa);
    console.log('   CPF:', cpf);
    console.log('   Tipo:', tipoUsuario);
    console.log('   Cargo:', cargo || 'N/A');
    console.log('   É Gerente:', isGerente);

    // Configurar cookies
    const cookieOptions = getCookieOptions();

    console.log('🍪 Configurando cookies...');
    
    res.cookie('idPessoa', cpf, cookieOptions);
    res.cookie('tipoPessoa', tipoUsuario, cookieOptions);
    res.cookie('cargoPessoa', cargo, cookieOptions);
    res.cookie('pessoaLogada', usuario.nome_pessoa, cookieOptions);
    res.cookie('emailPessoa', usuario.email_pessoa, cookieOptions);
    
    console.log('✅ Cookies configurados com sucesso');

    const responseData = {
      status: 'ok',
      message: 'Login realizado com sucesso',
      usuario: {
        id: cpf,
        nome: usuario.nome_pessoa,
        email: usuario.email_pessoa,
        tipo: tipoUsuario,
        cargo: cargo,
        isGerente: isGerente
      }
    };

    console.log('📤 Enviando resposta:', JSON.stringify(responseData, null, 2));

    return res.status(200).json(responseData);

  } catch (error) {
    console.error('❌ Erro ao fazer login:', error);
    return res.status(500).json({ 
      status: 'error',
      error: 'Erro interno do servidor',
      details: error.message
    });
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

// Função para logout
exports.logout = async (req, res) => {
  try {
    console.log('🚪 authController.logout');
    
    const cookieOptions = {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 0
    };

    res.cookie('idPessoa', '', cookieOptions);
    res.cookie('tipoPessoa', '', cookieOptions);
    res.cookie('cargoPessoa', '', cookieOptions);
    res.cookie('pessoaLogada', '', cookieOptions);
    res.cookie('emailPessoa', '', cookieOptions);
    
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

// Função para verificar se usuário está logado (middleware)
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