/**
 * Middleware para verificar se o usuário está autenticado
 * Verifica se existe um cookie de sessão válido
 */
const verificarAutenticacao = (req, res, next) => {
    console.log('Verificando autenticação...');
    console.log('Cookies recebidos:', req.cookies);
    
    // Verifica se o cookie de sessão existe
    if (!req.cookies.idPessoa) {
        console.log('Acesso não autorizado - Cookie de sessão não encontrado');
        return res.status(401).json({
            status: 'error',
            message: 'Acesso não autorizado. Por favor, faça login novamente.'
        });
    }
    
    // Se chegou aqui, o usuário está autenticado
    console.log('Usuário autenticado com sucesso');
    next();
};

/**
 * Middleware para verificar se o usuário é um gerente
 */
const verificarGerente = (req, res, next) => {
    console.log('Verificando se o usuário é gerente...');
    
    // Verifica se o usuário é um gerente
    if (!req.user || req.user.tipo !== 'gerente') {
        console.log('Acesso negado - Permissão insuficiente');
        return res.status(403).json({
            status: 'error',
            message: 'Acesso negado. Você não tem permissão para acessar este recurso.'
        });
    }
    
    // Se chegou aqui, o usuário é um gerente
    console.log('Acesso concedido - Usuário é gerente');
    next();
};

module.exports = {
    verificarAutenticacao,
    verificarGerente
};
