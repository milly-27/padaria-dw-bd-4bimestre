const { query } = require('../database');

/**
 * Middleware para verificar se o usuário está autenticado
 * Verifica se existe um cookie de sessão válido e carrega os dados do usuário
 */
const verificarAutenticacao = async (req, res, next) => {
    console.log('🔐 Verificando autenticação...');
    
    try {
        // Verifica se o cookie de sessão existe
        const idPessoa = req.cookies.idPessoa;
        if (!idPessoa) {
            console.log('❌ Acesso não autorizado - Cookie de sessão não encontrado');
            return res.status(401).json({
                status: 'error',
                message: 'Acesso não autorizado. Por favor, faça login novamente.'
            });
        }
        
        // Busca os dados do usuário no banco de dados
        const result = await query(
            `SELECT p.*, f.id_cargo, c.nome_cargo 
             FROM pessoa p 
             LEFT JOIN funcionario f ON p.cpf_pessoa = f.cpf
             LEFT JOIN cargo c ON f.id_cargo = c.id_cargo
             WHERE p.id_pessoa = $1`,
            [idPessoa]
        );
        
        if (result.rows.length === 0) {
            console.log('❌ Usuário não encontrado no banco de dados');
            // Limpa o cookie inválido
            res.clearCookie('idPessoa', { path: '/' });
            return res.status(401).json({
                status: 'error',
                message: 'Sessão inválida. Por favor, faça login novamente.'
            });
        }
        
        // Adiciona os dados do usuário ao objeto de requisição
        const usuario = result.rows[0];
        req.user = {
            id_pessoa: usuario.id_pessoa,
            nome: usuario.nome_pessoa,
            email: usuario.email_pessoa,
            cpf: usuario.cpf_pessoa,
            tipo: usuario.id_cargo ? 'funcionario' : 'cliente',
            cargo: usuario.nome_cargo || ''
        };
        
        console.log(`✅ Usuário autenticado: ${req.user.nome} (${req.user.tipo}${req.user.cargo ? ' - ' + req.user.cargo : ''})`);
        next();
        
    } catch (error) {
        console.error('❌ Erro ao verificar autenticação:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Erro interno do servidor ao verificar autenticação.'
        });
    }
};

/**
 * Middleware para verificar se o usuário é um gerente
 */
const verificarGerente = (req, res, next) => {
    console.log('👔 Verificando se o usuário é gerente...');
    
    // Verifica se o usuário está autenticado
    if (!req.user) {
        console.log('❌ Acesso negado - Usuário não autenticado');
        return res.status(401).json({
            status: 'error',
            message: 'Acesso não autorizado. Por favor, faça login novamente.'
        });
    }
    
    // Verifica se o usuário é um gerente
    if (req.user.tipo !== 'funcionario' || req.user.cargo.toLowerCase() !== 'gerente') {
        console.log(`❌ Acesso negado - O usuário ${req.user.nome} não é um gerente`);
        return res.status(403).json({
            status: 'error',
            message: 'Acesso negado. Você não tem permissão para acessar este recurso.'
        });
    }
    
    // Se chegou aqui, o usuário é um gerente
    console.log(`✅ Acesso concedido - ${req.user.nome} é um gerente`);
    next();
};

/**
 * Middleware para verificar se o usuário é um funcionário
 */
const verificarFuncionario = (req, res, next) => {
    console.log('👤 Verificando se o usuário é funcionário...');
    
    // Verifica se o usuário está autenticado
    if (!req.user) {
        console.log('❌ Acesso negado - Usuário não autenticado');
        return res.status(401).json({
            status: 'error',
            message: 'Acesso não autorizado. Por favor, faça login novamente.'
        });
    }
    
    // Verifica se o usuário é um funcionário
    if (req.user.tipo !== 'funcionario') {
        console.log(`❌ Acesso negado - O usuário ${req.user.nome} não é um funcionário`);
        return res.status(403).json({
            status: 'error',
            message: 'Acesso negado. Apenas funcionários podem acessar este recurso.'
        });
    }
    
    // Se chegou aqui, o usuário é um funcionário
    console.log(`✅ Acesso concedido - ${req.user.nome} é um funcionário`);
    next();
};

module.exports = {
    verificarAutenticacao,
    verificarGerente,
    verificarFuncionario
};
