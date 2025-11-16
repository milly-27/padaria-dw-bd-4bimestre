const API_BASE_URL = 'http://localhost:3001';

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
        
        // Atualizar nome do usuário
        userName.textContent = userData.nome;
        
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
            if (welcomeTitle) welcomeTitle.textContent = `Bem-vindo gerente, ${userData.nome}`;
            if (welcomeMessage) welcomeMessage.textContent = 'Você tem acesso total ao sistema. Use o menu acima para gerenciar cadastros e visualizar relatórios.';
        } else {
            if (welcomeTitle) welcomeTitle.textContent = `Seja bem-vindo, ${userData.nome}`;
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
        if (welcomeTitle) welcomeTitle.textContent = 'Bem-vindo ao Sistema AVAP';
        if (welcomeMessage) welcomeMessage.textContent = 'Sistema de Gerenciamento integrado. Faça login para acessar todas as funcionalidades.';
        
        // Ocultar menus restritos
        controlarMenus(false);
    }
}

// ========================================
// VERIFICAR LOGIN NO SESSIONSTORAGE
// ========================================
async function verificarSeUsuarioEstaLogadoBackend() {
    console.log('🔍 Verificando autenticação...');
    console.log('══════════════════════════════════════');
    
    try {
        // SOLUÇÃO LIVE SERVER: Usar sessionStorage
        const usuarioLogado = sessionStorage.getItem('usuarioLogado');
        
        if (!usuarioLogado) {
            console.log('❌ Usuário não autenticado (sessionStorage vazio)');
            console.log('══════════════════════════════════════');
            atualizarInterfaceUsuario(null);
            return null;
        }
        
        const userData = JSON.parse(usuarioLogado);
        
        console.log('👤 Dados do usuário (sessionStorage):');
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
        sessionStorage.removeItem('usuarioLogado');
        atualizarInterfaceUsuario(null);
        return null;
    }
}

// ========================================
// LIMPAR COOKIES
// ========================================
function limparCookies() {
    console.log('🍪 Limpando todos os cookies...');
    
    try {
        const cookies = document.cookie.split(";");
        
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i];
            const eqPos = cookie.indexOf("=");
            const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
            
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname;
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=." + window.location.hostname;
        }
        
        console.log('✅ Cookies limpos!');
    } catch (error) {
        console.error('❌ Erro ao limpar cookies:', error);
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
            console.log('✅ Logout realizado com sucesso!');
            
            // Limpar tudo
            sessionStorage.clear();
            localStorage.clear();
            limparCookies();
            
            // Atualizar interface
            atualizarInterfaceUsuario(null);
            
            // Notificar e redirecionar
            alert('Logout realizado com sucesso!');
            
            setTimeout(() => {
                window.location.href = 'http://localhost:3001/login/login.html';
            }, 500);
        } else {
            throw new Error('Resposta inesperada do servidor');
        }
    } catch (error) {
        console.error('❌ Erro ao fazer logout:', error);
        
        // Limpar mesmo com erro
        sessionStorage.clear();
        localStorage.clear();
        limparCookies();
        atualizarInterfaceUsuario(null);
        
        alert('Erro ao fazer logout no servidor, mas dados locais foram limpos.');
        
        setTimeout(() => {
            window.location.href = 'http://localhost:3001/login/login.html';
        }, 1000);
    }
}

// ========================================
// REDIRECIONAR PARA LOGIN
// ========================================
function redirecionarLogin() {
    console.log('🔄 Redirecionando para login...');
    window.location.href = 'http://localhost:3001/login/login.html';
}

// ========================================
// INICIALIZAÇÃO
// ========================================
function inicializarMenu() {
    console.log('🚀 Menu carregado, inicializando...');
    
    // Verificar login no backend
    verificarSeUsuarioEstaLogadoBackend();
    
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

// Atalho de desenvolvimento: CTRL + L para simular login de gerente
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        console.log('🎭 Simulando login de gerente...');
        atualizarInterfaceUsuario({
            nome: 'Gerente Teste',
            tipo: 'funcionario',
            cargo: 'gerente',
            isGerente: true
        });
    }
});

// ========================================
// EXPORTAR FUNÇÕES GLOBALMENTE
// ========================================
window.logout = logout;
window.redirecionarLogin = redirecionarLogin;

console.log('✅ menu.js carregado com sucesso!');