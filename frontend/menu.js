const API_BASE_URL = 'http://localhost:3001';

console.log('✅ menu.js carregado com sucesso!');

// ========================================
// FUNÇÕES DE COOKIES
// ========================================

function lerCookie(nome) {
    const nomeCookie = nome + "=";
    const cookies = document.cookie.split(';');
    
    for(let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i].trim();
        if (cookie.indexOf(nomeCookie) === 0) {
            return cookie.substring(nomeCookie.length, cookie.length);
        }
    }
    return null;
}

function deletarCookie(nome) {
    document.cookie = `${nome}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    console.log(`🗑️ Cookie deletado: ${nome}`);
}

function deletarTodosCookies() {
    console.log('🍪 Deletando todos os cookies de autenticação...');
    deletarCookie('token');
    deletarCookie('userId');
    deletarCookie('userName');
    deletarCookie('userEmail');
    deletarCookie('userType');
    deletarCookie('userCargo');
    console.log('✅ Todos os cookies deletados!');
}

// ========================================
// CONTROLE DE VISIBILIDADE DOS MENUS
// ========================================

function controlarMenus(isGerente) {
    const menuCadastros = document.getElementById('menuCadastros');
    const menuRelatorios = document.getElementById('menuRelatorios');
    
    console.log('🔐 Controlando menus - É gerente?', isGerente);
    
    if (isGerente) {
        if (menuCadastros) menuCadastros.style.display = 'block';
        if (menuRelatorios) menuRelatorios.style.display = 'block';
        console.log('✅ Menus de Cadastros e Relatórios LIBERADOS');
    } else {
        if (menuCadastros) menuCadastros.style.display = 'none';
        if (menuRelatorios) menuRelatorios.style.display = 'none';
        console.log('🔒 Menus de Cadastros e Relatórios BLOQUEADOS');
    }
}

// ========================================
// ATUALIZAR INTERFACE DO USUÁRIO
// ========================================

function atualizarInterfaceUsuario(userData = null) {
    console.log('🔄 Atualizando interface do usuário:', userData);
    
    const btnLogin = document.getElementById('btnLogin');
    const userInfo = document.getElementById('userInfo');
    const userName = document.getElementById('userName');
    const welcomeTitle = document.getElementById('welcomeTitle');
    const welcomeMessage = document.getElementById('welcomeMessage');
    const loginPrompt = document.getElementById('loginPrompt');
    
    if (!btnLogin || !userInfo || !userName) {
        console.warn('⚠️ Elementos de UI não encontrados');
        return;
    }
    
    if (userData && userData.nome) {
        // Usuário está logado
        console.log('👤 Usuário logado:', userData.nome);
        console.log('🔰 É gerente?', userData.isGerente);
        
        // Atualizar visibilidade
        btnLogin.classList.add('hidden');
        userInfo.classList.remove('hidden');
        if (loginPrompt) loginPrompt.style.display = 'none';
        
        // Limpar conteúdo anterior
        userName.textContent = '';
        
        // Adicionar nome do usuário
        const nomeSpan = document.createElement('span');
        nomeSpan.textContent = userData.nome;
        userName.appendChild(nomeSpan);
        
        // Adicionar tipo/cargo
        const tipoUsuarioSpan = document.createElement('span');
        tipoUsuarioSpan.style.cssText = 'font-size: 0.85em; color: #999; margin-left: 10px;';
        
        if (userData.isGerente) {
            tipoUsuarioSpan.textContent = '(Gerente)';
        } else if (userData.tipo === 'funcionario' && userData.cargo) {
            tipoUsuarioSpan.textContent = `(${userData.cargo})`;
        } else {
            tipoUsuarioSpan.textContent = '(Cliente)';
        }
        
        userName.appendChild(tipoUsuarioSpan);
        
        // Configurar userInfo para logout
        userInfo.style.cursor = 'pointer';
        userInfo.title = 'Clique para fazer logout';
        userInfo.onclick = logout;
        
        // Atualizar mensagem de boas-vindas
        if (userData.isGerente) {
            if (welcomeTitle) welcomeTitle.textContent = `Bem-vindo gerente, ${userData.nome}! 🍞`;
            if (welcomeMessage) welcomeMessage.textContent = 'Você tem acesso total ao sistema. Use o menu acima para gerenciar cadastros e visualizar relatórios.';
        } else {
            if (welcomeTitle) welcomeTitle.textContent = `Seja bem-vindo, ${userData.nome}! 🍞`;
            if (welcomeMessage) welcomeMessage.textContent = 'Explore nosso cardápio e faça seus pedidos.';
        }
        
        // Controlar menus baseado em permissões
        controlarMenus(userData.isGerente);
        
    } else {
        // Usuário não está logado
        console.log('👤 Nenhum usuário logado');
        
        btnLogin.classList.remove('hidden');
        userInfo.classList.add('hidden');
        if (loginPrompt) loginPrompt.style.display = 'block';
        if (userName) userName.textContent = '';
        
        // Mensagem padrão
        if (welcomeTitle) welcomeTitle.textContent = 'Tradição e Sabor';
        if (welcomeMessage) welcomeMessage.textContent = 'Feito com carinho, assado com amor. Experimente o melhor da confeitaria artesanal.';
        
        // Ocultar menus restritos
        controlarMenus(false);
    }
}

// ========================================
// VERIFICAR LOGIN NOS COOKIES
// ========================================

function verificarSeUsuarioEstaLogado() {
    console.log('🔍 Verificando autenticação nos cookies...');
    console.log('══════════════════════════════════════');
    
    try {
        // Ler cookies
        const userId = lerCookie('userId');
        const userName = lerCookie('userName');
        const userEmail = lerCookie('userEmail');
        const userType = lerCookie('userType');
        const userCargo = lerCookie('userCargo');
        const token = lerCookie('token');
        
        console.log('🍪 Cookies encontrados:');
        console.log('   - userId:', userId || '❌ Não encontrado');
        console.log('   - userName:', userName || '❌ Não encontrado');
        console.log('   - userEmail:', userEmail || '❌ Não encontrado');
        console.log('   - userType:', userType || '❌ Não encontrado');
        console.log('   - userCargo:', userCargo || '❌ Não encontrado');
        console.log('   - token:', token ? '✅ Presente' : '❌ Ausente');
        
        if (!userId || !userName) {
            console.log('❌ Usuário não autenticado (cookies ausentes)');
            console.log('══════════════════════════════════════');
            atualizarInterfaceUsuario(null);
            return null;
        }
        
        // Determinar se é gerente
        const isGerente = userType === 'funcionario' && userCargo === 'gerente';
        
        const userData = {
            id: userId,
            nome: userName,
            email: userEmail,
            tipo: userType || 'cliente',
            cargo: userCargo || null,
            isGerente: isGerente
        };
        
        console.log('👤 Dados do usuário (cookies):');
        console.log('   - Nome:', userData.nome);
        console.log('   - Tipo:', userData.tipo);
        console.log('   - Cargo:', userData.cargo || '(não especificado)');
        console.log(`   - É gerente? ${userData.isGerente ? '✅ Sim' : '❌ Não'}`);
        console.log('══════════════════════════════════════');
        
        // Atualizar interface
        atualizarInterfaceUsuario(userData);
        
        return userData;
        
    } catch (error) {
        console.error('❌ Erro ao verificar autenticação:', error);
        console.log('══════════════════════════════════════');
        deletarTodosCookies();
        atualizarInterfaceUsuario(null);
        return null;
    }
}

// ========================================
// LOGOUT
// ========================================

async function logout() {
    if (!confirm('Deseja realmente sair do sistema?')) {
        return;
    }
    
    console.log('🚪 Iniciando logout...');
    
    try {
        // Tentar logout no servidor
        const response = await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        console.log('📨 Resposta logout:', result);
        
        if (result.status === 'deslogado') {
            console.log('✅ Logout realizado com sucesso no servidor!');
        }
    } catch (error) {
        console.warn('⚠️ Erro ao fazer logout no servidor:', error);
        console.log('➡️ Continuando com logout local...');
    }
    
    // Limpar tudo (independente da resposta do servidor)
    console.log('🧹 Limpando dados locais...');
    sessionStorage.clear();
    localStorage.clear();
    deletarTodosCookies();
    
    // Atualizar interface
    atualizarInterfaceUsuario(null);
    
    // Notificar e redirecionar
    alert('Logout realizado com sucesso!');
    
    setTimeout(() => {
        window.location.href = './auth/login.html';
    }, 500);
}

// ========================================
// REDIRECIONAR PARA LOGIN
// ========================================

function redirecionarLogin() {
    console.log('🔄 Redirecionando para login...');
    window.location.href = './auth/login.html';
}

// ========================================
// INICIALIZAÇÃO
// ========================================

function inicializarMenu() {
    console.log('🚀 Menu carregado, inicializando...');
    
    // Verificar login nos cookies
    verificarSeUsuarioEstaLogado();
    
    // Configurar botão de login
    const btnLogin = document.getElementById('btnLogin');
    if (btnLogin) {
        btnLogin.onclick = redirecionarLogin;
        console.log('✅ Event listener adicionado ao botão de login');
    }
}

// ========================================
// EVENT LISTENERS
// ========================================

document.addEventListener('DOMContentLoaded', inicializarMenu);

// Atalho de desenvolvimento: CTRL + L para ver todos os cookies
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        console.log('🍪 Todos os cookies:');
        console.log(document.cookie);
        verificarSeUsuarioEstaLogado();
    }
});

// ========================================
// EXPORTAR FUNÇÕES GLOBALMENTE
// ========================================

window.logout = logout;
window.redirecionarLogin = redirecionarLogin;
window.verificarSeUsuarioEstaLogado = verificarSeUsuarioEstaLogado;