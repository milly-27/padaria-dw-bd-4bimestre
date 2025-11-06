const db = require('../database');

// ===== CONFIGURAÇÃO CENTRALIZADA DE COOKIES =====
const getCookieOptions = (req) => {
  // Para desenvolvimento local - configuração simplificada
  return {
    httpOnly: false,  // Permite acesso via JavaScript
    secure: false,    // HTTP (não HTTPS)
    sameSite: 'lax',  // Menos restritivo
    path: '/',
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  };
};

// ===== VERIFICAR SE PESSOA ESTÁ LOGADA =====
exports.verificaSePessoaEstaLogada = async (req, res) => {
  console.log('✅ Verificando se pessoa está logada');
  console.log('🍪 Cookies recebidos:', req.cookies);
  
  try {
    const id = req.cookies.idPessoa;
    const nome = req.cookies.pessoaLogada;
    const email = req.cookies.emailPessoa;
    const tipo = req.cookies.tipoPessoa || 'cliente';
    let cargo = (req.cookies.cargoPessoa || '').toLowerCase();
    
    if (!id || !nome) {
      console.log('❌ Dados de autenticação ausentes nos cookies');
      return res.json({ 
        status: 'nao_logado',
        message: 'Usuário não está logado'
      });
    }

    // Se for funcionário, verificar o cargo no banco
    if (tipo === 'funcionario') {
      try {
        const result = await db.query(
          `SELECT f.id_pessoa, c.nome_cargo 
           FROM funcionario f 
           LEFT JOIN cargo c ON f.id_cargo = c.id_cargo 
           WHERE f.cpf = $1`,
          [id]
        );
        
        if (result.rows.length > 0) {
          const funcionario = result.rows[0];
          cargo = (funcionario.nome_cargo || '').toLowerCase();
          
          console.log(`✅ Cargo atualizado do banco: ${cargo}`);
          
          // Atualiza o cookie se necessário
          if (cargo !== req.cookies.cargoPessoa) {
            res.cookie('cargoPessoa', cargo, getCookieOptions(req));
          }
        }
      } catch (error) {
        console.error('❌ Erro ao verificar cargo:', error);
      }
    }
    
    const isGerente = tipo === 'funcionario' && cargo === 'gerente';
    
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

// ===== LOGIN UNIFICADO (CLIENTE E FUNCIONÁRIO) =====
exports.loginCliente = async (req, res) => {
  const { email_pessoa, senha_pessoa } = req.body;

  console.log('🔐 Tentando login para:', email_pessoa);

  try {
    // Busca a pessoa no banco
    const result = await db.query(
      `SELECT cpf, nome_pessoa, email_pessoa FROM pessoa WHERE email_pessoa = $1 AND senha_pessoa = $2`,
      [email_pessoa, senha_pessoa]
    );

    if (result.rows.length === 0) {
      console.log('❌ Credenciais incorretas');
      return res.json({ status: 'credenciais_incorretas' });
    }

    const { cpf, nome_pessoa, email_pessoa: email } = result.rows[0];
    
    let tipo = 'cliente';
    let cargo = '';
    let id_pessoa = cpf;

    // Verificar se é FUNCIONÁRIO
    const verificaFuncionario = await db.query(
      `SELECT f.id_pessoa, c.nome_cargo 
       FROM funcionario f
       INNER JOIN cargo c ON f.id_cargo = c.id_cargo
       WHERE f.cpf = $1`,
      [cpf]
    );

    if (verificaFuncionario.rows.length > 0) {
      tipo = 'funcionario';
      cargo = verificaFuncionario.rows[0].nome_cargo || '';
      id_pessoa = verificaFuncionario.rows[0].id_pessoa;
      console.log(`✅ Identificado como FUNCIONÁRIO - Cargo: ${cargo}`);
    } else {
      // Verificar se é CLIENTE
      const verificaCliente = await db.query(
        'SELECT cpf FROM cliente WHERE cpf = $1',
        [cpf]
      );

      if (verificaCliente.rows.length === 0) {
        console.log('❌ Não é nem funcionário nem cliente');
        return res.json({ 
          status: 'credenciais_incorretas', 
          mensagem: 'Usuário não autorizado' 
        });
      }
      console.log('✅ Identificado como CLIENTE');
    }

    // Configurar cookies
    const cookieOptions = getCookieOptions(req);

    console.log('🍪 Configurando cookies com opções:', cookieOptions);

    // IMPORTANTE: Definir todos os cookies necessários
    res.cookie('pessoaLogada', nome_pessoa, cookieOptions);
    res.cookie('tipoPessoa', tipo, cookieOptions);
    res.cookie('idPessoa', cpf, cookieOptions);
    res.cookie('cargoPessoa', cargo, cookieOptions);
    res.cookie('emailPessoa', email, cookieOptions);

    console.log('✅ Cookies definidos:');
    console.log('   - pessoaLogada:', nome_pessoa);
    console.log('   - tipoPessoa:', tipo);
    console.log('   - idPessoa:', cpf);
    console.log('   - cargoPessoa:', cargo);
    console.log('   - emailPessoa:', email);

    return res.json({
      status: 'ok',
      nome: nome_pessoa,
      email: email,
      tipo: tipo,
      cargo: cargo,
      isGerente: tipo === 'funcionario' && cargo.toLowerCase() === 'gerente'
    });

  } catch (err) {
    console.error('❌ Erro no login:', err);
    return res.status(500).json({ 
      status: 'erro', 
      mensagem: err.message 
    });
  }
};

// ===== LOGIN DE FUNCIONÁRIO (redireciona para loginCliente) =====
exports.loginFuncionario = async (req, res) => {
  return exports.loginCliente(req, res);
};

// ===== LOGOUT =====
exports.logout = (req, res) => {
  console.log('🚪 Processando logout...');
  
  const cookieOptions = {
    httpOnly: false,
    secure: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 0 // Expira imediatamente
  };
  
  // Limpar todos os cookies
  res.cookie('pessoaLogada', '', cookieOptions);
  res.cookie('tipoPessoa', '', cookieOptions);
  res.cookie('idPessoa', '', cookieOptions);
  res.cookie('cargoPessoa', '', cookieOptions);
  res.cookie('emailPessoa', '', cookieOptions);
  
  console.log('✅ Cookies limpos');
  
  return res.json({ 
    status: 'deslogado',
    message: 'Logout realizado com sucesso'
  });
};

// ===== CADASTRAR CLIENTE =====
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