const db = require('../database');
// No início do arquivo authController.js, adicione esta linha:
const { enviarEmailRecuperacao } = require('../config/emailConfig');
// ======================================
// REGISTRO DE NOVO USUÁRIO
// ======================================
exports.registro = async (req, res) => {
  const {
    name, email, password, cpf, birthdate,
    cidade, estado, rua, numero, cep, complemento, bairro
  } = req.body;

  console.log('📝 Tentativa de registro:', { email, cpf });

  // Validações básicas
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
  }

  if (!cpf || cpf.length !== 11) {
    return res.status(400).json({ error: 'CPF deve ter 11 dígitos.' });
  }

  if (password.length > 20) {
    return res.status(400).json({ error: 'Senha deve ter no máximo 20 caracteres.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Formato de email inválido.' });
  }

  try {
    // Verificar se CPF ou email já existem
    const checkUser = await db.query(
      'SELECT cpf, email_pessoa FROM pessoa WHERE cpf = $1 OR email_pessoa = $2',
      [cpf, email]
    );

    if (checkUser.rows.length > 0) {
      if (checkUser.rows[0].cpf === cpf) {
        return res.status(400).json({ error: 'CPF já cadastrado.' });
      }
      if (checkUser.rows[0].email_pessoa === email) {
        return res.status(400).json({ error: 'E-mail já cadastrado.' });
      }
    }

    // Inserir pessoa
    const resultPessoa = await db.query(
      `INSERT INTO pessoa (cpf, nome_pessoa, email_pessoa, senha_pessoa)
       VALUES ($1, $2, $3, $4)
       RETURNING cpf, nome_pessoa, email_pessoa`,
      [cpf, name, email, password]
    );

    const user = resultPessoa.rows[0];

    // Inserir cliente
    await db.query(
      'INSERT INTO cliente (cpf) VALUES ($1)',
      [cpf]
    );

    console.log('✅ Usuário registrado:', user.email_pessoa);

    // Criar cookie de sessão
    res.cookie('usuarioLogado', user.nome_pessoa, {
      sameSite: 'None',
      secure: true,
      httpOnly: true,
      path: '/',
      maxAge: 24 * 60 * 60 * 1000, // 1 dia
    });

    res.cookie('usuarioCpf', user.cpf, {
      sameSite: 'None',
      secure: true,
      httpOnly: true,
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      message: 'Usuário registrado com sucesso.',
      user: {
        cpf: user.cpf,
        nome: user.nome_pessoa,
        email: user.email_pessoa
      },
      logged: true
    });

  } catch (err) {
    console.error('❌ Erro no registro:', err);
    res.status(500).json({ error: 'Erro ao registrar usuário.' });
  }
};

// ======================================
// LOGIN
// ======================================
exports.login = async (req, res) => {
  const { email_usuario, senha_usuario } = req.body;

  console.log('🔐 Tentativa de login:', email_usuario);

  if (!email_usuario || !senha_usuario) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }

  try {
    // Buscar pessoa e verificar se é funcionário
    const resultPessoa = await db.query(
      `SELECT p.cpf, p.nome_pessoa, p.email_pessoa, p.senha_pessoa,
              f.cpf as is_funcionario, c.nome_cargo
       FROM pessoa p
       LEFT JOIN funcionario f ON p.cpf = f.cpf
       LEFT JOIN cargo c ON f.id_cargo = c.id_cargo
       WHERE p.email_pessoa = $1`,
      [email_usuario]
    );

    if (resultPessoa.rows.length === 0) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    }

    const user = resultPessoa.rows[0];

    // Verificar senha (texto plano - não recomendado em produção)
    if (user.senha_pessoa !== senha_usuario) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    }

    console.log('✅ Login bem-sucedido:', user.email_pessoa);

    // Criar cookies
    res.cookie('usuarioLogado', user.nome_pessoa, {
      sameSite: 'None',
      secure: true,
      httpOnly: true,
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.cookie('usuarioCpf', user.cpf, {
      sameSite: 'None',
      secure: true,
      httpOnly: true,
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      message: 'Login efetuado com sucesso.',
      user: {
        cpf: user.cpf,
        nome: user.nome_pessoa,
        email: user.email_pessoa,
        is_funcionario: !!user.is_funcionario,
        cargo: user.nome_cargo || null
      },
      logged: true
    });

  } catch (err) {
    console.error('❌ Erro no login:', err);
    res.status(500).json({ error: 'Erro ao efetuar login.' });
  }
};

// ======================================
// VERIFICAR SE ESTÁ LOGADO
// ======================================
exports.verificarLogin = async (req, res) => {
  const nome = req.cookies.usuarioLogado;
  const cpf = req.cookies.usuarioCpf;

  console.log('🔍 Verificando login:', { nome, cpf });

  if (!nome || !cpf) {
    return res.json({ logged: false });
  }

  try {
    // Verificar se o usuário ainda existe no banco
    const result = await db.query(
      `SELECT p.cpf, p.nome_pessoa, p.email_pessoa,
              f.cpf as is_funcionario, c.nome_cargo
       FROM pessoa p
       LEFT JOIN funcionario f ON p.cpf = f.cpf
       LEFT JOIN cargo c ON f.id_cargo = c.id_cargo
       WHERE p.cpf = $1`,
      [cpf]
    );

    if (result.rows.length === 0) {
      // Usuário não existe mais, limpar cookies
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
      return res.json({ logged: false });
    }

    const user = result.rows[0];

    res.json({
      logged: true,
      cpf: user.cpf,
      nome: user.nome_pessoa,
      email: user.email_pessoa,
      is_funcionario: !!user.is_funcionario,
      cargo: user.nome_cargo || null
    });

  } catch (err) {
    console.error('❌ Erro ao verificar login:', err);
    res.status(500).json({ error: 'Erro ao verificar sessão.' });
  }
};

// ======================================
// LOGOUT - VERSÃO ROBUSTA E CORRIGIDA
// ======================================
exports.logout = (req, res) => {
  console.log('\n👋 [LOGOUT] Iniciando processo de logout...');
  console.log('════════════════════════════════════════');
  
  // Configurações comuns dos cookies
  const cookieOptions = {
    sameSite: 'None',
    secure: true,
    httpOnly: true,
    path: '/',
  };
  
  // Lista completa de cookies para limpar
  const cookiesParaLimpar = [
    'usuarioLogado',
    'usuarioCpf',
    'token',
    'userId',
    'userName',
    'userEmail',
    'userType',
    'userCargo'
  ];
  
  // Limpar todos os cookies
  cookiesParaLimpar.forEach(cookieName => {
    res.clearCookie(cookieName, cookieOptions);
    console.log(`   🗑️ Cookie limpo: ${cookieName}`);
  });
  
  console.log('✅ [LOGOUT] Todos os cookies removidos');
  console.log('════════════════════════════════════════\n');

  res.json({
    status: 'deslogado',
    message: 'Logout realizado com sucesso.',
    logged: false
  });
};

// ======================================
// VERIFICAR EMAIL (para fluxo de login em etapas)
// ======================================
exports.verificarEmail = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email é obrigatório' });
  }

  try {
    const result = await db.query(
      'SELECT nome_pessoa FROM pessoa WHERE email_pessoa = $1',
      [email]
    );

    if (result.rows.length > 0) {
      return res.json({
        status: 'existe',
        nome: result.rows[0].nome_pessoa
      });
    }

    res.json({ status: 'nao_encontrado' });
  } catch (err) {
    console.error('❌ Erro ao verificar email:', err);
    res.status(500).json({ error: 'Erro ao verificar email.' });
  }
};

// ======================================
// ATUALIZAR SENHA
// ======================================
exports.atualizarSenha = async (req, res) => {
  const cpf = req.cookies.usuarioCpf;
  const { senha_atual, nova_senha } = req.body;

  if (!cpf) {
    return res.status(401).json({ error: 'Usuário não autenticado.' });
  }

  if (!senha_atual || !nova_senha) {
    return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias.' });
  }

  if (nova_senha.length > 20) {
    return res.status(400).json({ error: 'Nova senha deve ter no máximo 20 caracteres.' });
  }

  try {
    // Verificar senha atual
    const checkPassword = await db.query(
      'SELECT senha_pessoa FROM pessoa WHERE cpf = $1',
      [cpf]
    );

    if (checkPassword.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    if (checkPassword.rows[0].senha_pessoa !== senha_atual) {
      return res.status(400).json({ error: 'Senha atual incorreta.' });
    }

    // Atualizar senha
    await db.query(
      'UPDATE pessoa SET senha_pessoa = $1 WHERE cpf = $2',
      [nova_senha, cpf]
    );

    console.log('✅ Senha atualizada para CPF:', cpf);

    res.json({ message: 'Senha atualizada com sucesso.' });

  } catch (err) {
    console.error('❌ Erro ao atualizar senha:', err);
    res.status(500).json({ error: 'Erro ao atualizar senha.' });
  }
};
// ======================================
// ADICIONE ESTE CÓDIGO NO FINAL DO SEU authController.js
// ANTES DO ÚLTIMO }; OU module.exports
// ======================================

// Armazenamento temporário de códigos (em produção, use Redis ou banco)
const codigosRecuperacao = new Map();

// Função para gerar código de 6 dígitos
function gerarCodigo() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Substitua a função exports.solicitarRecuperacao por esta versão:

// ======================================
// SOLICITAR RECUPERAÇÃO DE SENHA - COM EMAIL REAL
// ======================================
exports.solicitarRecuperacao = async (req, res) => {
  const { email } = req.body;

  console.log('\n📧 [RECUPERAÇÃO] Solicitação para:', email);

  if (!email) {
    return res.status(400).json({ 
      success: false,
      error: 'Email é obrigatório' 
    });
  }

  try {
    // Verificar se o email existe no banco
    const result = await db.query(
      'SELECT cpf, nome_pessoa, email_pessoa FROM pessoa WHERE email_pessoa = $1',
      [email]
    );

    if (result.rows.length === 0) {
      console.log('❌ Email não encontrado:', email);
      return res.status(404).json({ 
        success: false,
        error: 'Email não cadastrado no sistema' 
      });
    }

    const user = result.rows[0];

    // Gerar código de 6 dígitos
    const codigo = gerarCodigo();
    
    // Armazenar código com timestamp (válido por 10 minutos)
    codigosRecuperacao.set(email, {
      codigo: codigo,
      timestamp: Date.now(),
      tentativas: 0
    });

    console.log('✅ Código gerado:', codigo);
    console.log('⏰ Válido por 10 minutos');

    // ═══════════════════════════════════════
    // ENVIAR EMAIL REAL
    // ═══════════════════════════════════════
    console.log('📨 Enviando email para:', email);
    
    const emailResult = await enviarEmailRecuperacao(
      user.email_pessoa,
      user.nome_pessoa,
      codigo
    );

    if (emailResult.success) {
      console.log('✅ Email enviado com sucesso!');
      
      // Agendar remoção do código após 10 minutos
      setTimeout(() => {
        if (codigosRecuperacao.has(email)) {
          codigosRecuperacao.delete(email);
          console.log('🗑️ Código expirado removido para:', email);
        }
      }, 10 * 60 * 1000);

      res.json({
        success: true,
        message: 'Código enviado para o email cadastrado'
      });
    } else {
      console.error('❌ Falha ao enviar email:', emailResult.error);
      
      // Mesmo que o email falhe, ainda deixar o código disponível para teste
      console.log('⚠️ MODO FALLBACK - Código disponível no console');
      console.log('\n═══════════════════════════════════════');
      console.log('📨 CÓDIGO DE RECUPERAÇÃO (FALLBACK)');
      console.log('═══════════════════════════════════════');
      console.log('Para:', user.nome_pessoa, `<${email}>`);
      console.log('Código:', codigo);
      console.log('═══════════════════════════════════════\n');
      
      res.json({
        success: true,
        message: 'Erro ao enviar email, mas o código está disponível. Verifique o console do servidor.',
        warning: 'Email não enviado - verifique a configuração SMTP'
      });
    }

  } catch (err) {
    console.error('❌ Erro ao solicitar recuperação:', err);
    res.status(500).json({ 
      success: false,
      error: 'Erro ao processar solicitação' 
    });
  }
};

// ======================================
// VERIFICAR CÓDIGO DE RECUPERAÇÃO
// ======================================
exports.verificarCodigo = async (req, res) => {
  const { email, code } = req.body;

  console.log('\n🔍 [VERIFICAÇÃO] Email:', email, '| Código:', code);

  if (!email || !code) {
    return res.status(400).json({ 
      success: false,
      error: 'Email e código são obrigatórios' 
    });
  }

  try {
    // Verificar se existe código para este email
    const codigoData = codigosRecuperacao.get(email);

    if (!codigoData) {
      console.log('❌ Nenhum código encontrado para:', email);
      return res.status(404).json({ 
        success: false,
        error: 'Código não encontrado ou expirado. Solicite um novo código.' 
      });
    }

    // Verificar se o código expirou (10 minutos)
    const tempoDecorrido = Date.now() - codigoData.timestamp;
    const minutosDecorridos = Math.floor(tempoDecorrido / 60000);
    
    if (tempoDecorrido > 10 * 60 * 1000) {
      codigosRecuperacao.delete(email);
      console.log('❌ Código expirado para:', email);
      return res.status(400).json({ 
        success: false,
        error: 'Código expirado. Solicite um novo código.' 
      });
    }

    console.log(`⏰ Tempo decorrido: ${minutosDecorridos} minuto(s)`);

    // Limitar tentativas
    if (codigoData.tentativas >= 5) {
      codigosRecuperacao.delete(email);
      console.log('❌ Muitas tentativas para:', email);
      return res.status(429).json({ 
        success: false,
        error: 'Muitas tentativas. Solicite um novo código.' 
      });
    }

    // Verificar se o código está correto
    if (codigoData.codigo !== code) {
      codigoData.tentativas++;
      const tentativasRestantes = 5 - codigoData.tentativas;
      console.log(`❌ Código incorreto (Tentativa ${codigoData.tentativas}/5)`);
      return res.status(400).json({ 
        success: false,
        error: `Código incorreto. ${tentativasRestantes} tentativa(s) restante(s).` 
      });
    }

    console.log('✅ Código verificado com sucesso!');

    res.json({
      success: true,
      message: 'Código verificado com sucesso'
    });

  } catch (err) {
    console.error('❌ Erro ao verificar código:', err);
    res.status(500).json({ 
      success: false,
      error: 'Erro ao verificar código' 
    });
  }
};

// ======================================
// REDEFINIR SENHA
// ======================================
exports.redefinirSenha = async (req, res) => {
  const { email, code, nova_senha } = req.body;

  console.log('\n🔑 [REDEFINIR] Alterando senha para:', email);

  if (!email || !code || !nova_senha) {
    return res.status(400).json({ 
      success: false,
      error: 'Email, código e nova senha são obrigatórios' 
    });
  }

  // Validar senha
  if (nova_senha.length < 6 || nova_senha.length > 20) {
    return res.status(400).json({ 
      success: false,
      error: 'A senha deve ter entre 6 e 20 caracteres' 
    });
  }

  try {
    // Verificar código novamente (segurança)
    const codigoData = codigosRecuperacao.get(email);

    if (!codigoData || codigoData.codigo !== code) {
      console.log('❌ Código inválido ao redefinir senha');
      return res.status(400).json({ 
        success: false,
        error: 'Código inválido ou expirado' 
      });
    }

    // Verificar se o usuário existe
    const checkUser = await db.query(
      'SELECT cpf, nome_pessoa FROM pessoa WHERE email_pessoa = $1',
      [email]
    );

    if (checkUser.rows.length === 0) {
      console.log('❌ Usuário não encontrado');
      return res.status(404).json({ 
        success: false,
        error: 'Usuário não encontrado' 
      });
    }

    const user = checkUser.rows[0];

    // Atualizar senha no banco
    await db.query(
      'UPDATE pessoa SET senha_pessoa = $1 WHERE email_pessoa = $2',
      [nova_senha, email]
    );

    // Remover código usado
    codigosRecuperacao.delete(email);

    console.log('✅ Senha redefinida com sucesso para:', user.nome_pessoa);

    res.json({
      success: true,
      message: 'Senha alterada com sucesso'
    });

  } catch (err) {
    console.error('❌ Erro ao redefinir senha:', err);
    res.status(500).json({ 
      success: false,
      error: 'Erro ao redefinir senha' 
    });
  }
};