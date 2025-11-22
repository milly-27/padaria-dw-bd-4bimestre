const API_BASE_URL = 'http://localhost:3001';

console.log('✅ menu.js carregado com sucesso!');

// ========================================
// FUNÇÕES DE SESSÃO (sessionStorage)
// ========================================

function lerSessao(nome) {
    return sessionStorage.getItem(nome);
}

function deletarSessao(nome) {
    sessionStorage.removeItem(nome);
    console.log(`🗑️ Sessão deletada: ${nome}`);
}

function deletarTodasSessoes() {
    console.log('🍪 Deletando todas as sessões de autenticação...');
    sessionStorage.clear();
    console.log('✅ Todas as sessões deletadas!');
}

// ========================================
// MODAIS BONITOS
// ========================================

function criarModalConfirmacao(titulo, mensagem, onConfirm) {
    const modalExistente = document.getElementById('customModal');
    if (modalExistente) {
        modalExistente.remove();
    }
    
    const modalHTML = `
        <div id="customModal" class="custom-modal-overlay">
            <div class="custom-modal-content">
                <div class="custom-modal-icon">🚪</div>
                <h3 class="custom-modal-title">${titulo}</h3>
                <p class="custom-modal-message">${mensagem}</p>
                <div class="custom-modal-actions">
                    <button class="custom-modal-btn custom-modal-btn-cancel" onclick="fecharModalConfirmacao()">
                        Cancelar
                    </button>
                    <button class="custom-modal-btn custom-modal-btn-confirm" onclick="confirmarModalConfirmacao()">
                        Sim, deslogar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    setTimeout(() => {
        document.getElementById('customModal').classList.add('show');
    }, 10);
    
    window.modalConfirmCallback = onConfirm;
}

function fecharModalConfirmacao() {
    const modal = document.getElementById('customModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
    window.modalConfirmCallback = null;
}

function confirmarModalConfirmacao() {
    if (window.modalConfirmCallback) {
        window.modalConfirmCallback();
    }
    fecharModalConfirmacao();
}

function mostrarModalSucesso(titulo, mensagem) {
    const modalExistente = document.getElementById('customModal');
    if (modalExistente) {
        modalExistente.remove();
    }
    
    const modalHTML = `
        <div id="customModal" class="custom-modal-overlay">
            <div class="custom-modal-content success">
                <div class="custom-modal-icon success">✅</div>
                <h3 class="custom-modal-title">${titulo}</h3>
                <p class="custom-modal-message">${mensagem}</p>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    setTimeout(() => {
        document.getElementById('customModal').classList.add('show');
    }, 10);
    
    setTimeout(() => {
        fecharModalConfirmacao();
    }, 2000);
}

// ========================================
// CONTROLE DE VISIBILIDADE DOS MENUS
// ========================================

function controlarMenus(isGerente, isLogado) {
    const menuCadastros = document.getElementById('menuCadastros');
    const menuRelatorios = document.getElementById('menuRelatorios');
    const menuMinhasCompras = document.getElementById('menuMinhasCompras');
    
    console.log('🔐 Controlando menus - É gerente?', isGerente, '- Está logado?', isLogado);
    
    // Menus de Cadastros e Relatórios - só para gerente
    if (isGerente) {
        if (menuCadastros) menuCadastros.style.display = 'block';
        if (menuRelatorios) menuRelatorios.style.display = 'block';
        console.log('✅ Menus de Cadastros e Relatórios LIBERADOS');
    } else {
        if (menuCadastros) menuCadastros.style.display = 'none';
        if (menuRelatorios) menuRelatorios.style.display = 'none';
        console.log('🔒 Menus de Cadastros e Relatórios BLOQUEADOS');
    }
    
    // Menu Minhas Compras - para qualquer usuário logado
    if (isLogado) {
        if (menuMinhasCompras) menuMinhasCompras.style.display = 'block';
        console.log('✅ Menu Minhas Compras LIBERADO');
    } else {
        if (menuMinhasCompras) menuMinhasCompras.style.display = 'none';
        console.log('🔒 Menu Minhas Compras BLOQUEADO');
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
        
        btnLogin.classList.add('hidden');
        userInfo.classList.remove('hidden');
        if (loginPrompt) loginPrompt.style.display = 'none';
        
        userName.innerHTML = '';
        
        const nomeSpan = document.createElement('span');
        nomeSpan.textContent = userData.nome;
        nomeSpan.style.cssText = 'font-weight: 600; color: var(--text-dark);';
        userName.appendChild(nomeSpan);
        
        if (userData.isGerente) {
            const badgeSpan = document.createElement('span');
            badgeSpan.textContent = '👑 Gerente';
            badgeSpan.style.cssText = `
                font-size: 0.75rem;
                font-weight: 600;
                margin-left: 10px;
                padding: 4px 10px;
                background: linear-gradient(135deg, var(--primary), var(--secondary));
                color: white;
                border-radius: 15px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            `;
            userName.appendChild(badgeSpan);
        }
        
        userInfo.style.cursor = 'pointer';
        userInfo.title = 'Clique para fazer logout';
        userInfo.onclick = logout;
        
        if (userData.isGerente) {
            if (welcomeTitle) welcomeTitle.textContent = `Bem-vindo gerente, ${userData.nome}! 🍞`;
            if (welcomeMessage) welcomeMessage.textContent = 'Você tem acesso total ao sistema. Use o menu acima para gerenciar cadastros e visualizar relatórios.';
        } else {
            if (welcomeTitle) welcomeTitle.textContent = `Seja bem-vindo, ${userData.nome}! 🍞`;
            if (welcomeMessage) welcomeMessage.textContent = 'Explore nosso cardápio e faça seus pedidos. Acesse "Minhas Compras" para ver seu histórico.';
        }
        
        // Controlar menus - passa isGerente e isLogado=true
        controlarMenus(userData.isGerente, true);
        
    } else {
        // Usuário não está logado
        console.log('👤 Nenhum usuário logado');
        
        btnLogin.classList.remove('hidden');
        userInfo.classList.add('hidden');
        if (loginPrompt) loginPrompt.style.display = 'block';
        if (userName) userName.innerHTML = '';
        
        if (welcomeTitle) welcomeTitle.textContent = 'Tradição e Sabor';
        if (welcomeMessage) welcomeMessage.textContent = 'Feito com carinho, assado com amor. Experimente o melhor da confeitaria artesanal.';
        
        // Ocultar todos os menus restritos
        controlarMenus(false, false);
    }
}

// ========================================
// VERIFICAR LOGIN NO SESSIONSTORAGE
// ========================================

function verificarSeUsuarioEstaLogado() {
    console.log('🔍 Verificando autenticação no sessionStorage...');
    console.log('══════════════════════════════════════');
    
    try {
        const userId = lerSessao('userId');
        const userName = lerSessao('userName');
        const userEmail = lerSessao('userEmail');
        const userType = lerSessao('userType');
        const userCargo = lerSessao('userCargo');
        const token = lerSessao('token');
        
        console.log('💾 Dados da sessão:');
        console.log('   - userId:', userId || '❌ Não encontrado');
        console.log('   - userName:', userName || '❌ Não encontrado');
        console.log('   - userEmail:', userEmail || '❌ Não encontrado');
        console.log('   - userType:', userType || '❌ Não encontrado');
        console.log('   - userCargo:', userCargo || '❌ Não encontrado');
        console.log('   - token:', token ? '✅ Presente' : '❌ Ausente');
        
        if (!userId || !userName) {
            console.log('❌ Usuário não autenticado (sessão vazia)');
            console.log('══════════════════════════════════════');
            atualizarInterfaceUsuario(null);
            return null;
        }
        
        const isGerente = userType === 'funcionario' && 
                         userCargo && 
                         userCargo.toLowerCase() === 'gerente';
        
        const userData = {
            id: userId,
            nome: userName,
            email: userEmail,
            tipo: userType || 'cliente',
            cargo: userCargo || null,
            isGerente: isGerente
        };
        
        console.log('👤 Dados do usuário (sessão):');
        console.log('   - Nome:', userData.nome);
        console.log('   - Tipo:', userData.tipo);
        console.log('   - Cargo:', userData.cargo || '(não especificado)');
        console.log(`   - É gerente? ${userData.isGerente ? '✅ Sim' : '❌ Não'}`);
        console.log('══════════════════════════════════════');
        
        atualizarInterfaceUsuario(userData);
        
        return userData;
        
    } catch (error) {
        console.error('❌ Erro ao verificar autenticação:', error);
        console.log('══════════════════════════════════════');
        deletarTodasSessoes();
        atualizarInterfaceUsuario(null);
        return null;
    }
}

// ========================================
// LOGOUT COM MODAIS BONITOS
// ========================================

async function logout() {
    console.log('🚪 Solicitação de logout...');
    
    criarModalConfirmacao(
        'Deseja sair?',
        'Tem certeza que deseja encerrar sua sessão?',
        async () => {
            console.log('🚪 Confirmado! Iniciando logout...');
            
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
                
                if (result.logged === false || result.status === 'deslogado') {
                    console.log('✅ Logout realizado com sucesso no servidor!');
                }
            } catch (error) {
                console.warn('⚠️ Erro ao fazer logout no servidor:', error);
                console.log('➡️ Continuando com logout local...');
            }
            
            console.log('🧹 Limpando dados locais...');
            deletarTodasSessoes();
            
            atualizarInterfaceUsuario(null);
            
            mostrarModalSucesso(
                'Logout realizado!',
                'Até logo! Você será redirecionado...'
            );
            
            setTimeout(() => {
                window.location.href = './auth/login.html';
            }, 2000);
        }
    );
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
    
    verificarSeUsuarioEstaLogado();
    
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

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        console.log('💾 Conteúdo do sessionStorage:');
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            console.log(`   ${key}: ${sessionStorage.getItem(key)}`);
        }
        verificarSeUsuarioEstaLogado();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        fecharModalConfirmacao();
    }
});

// ========================================
// EXPORTAR FUNÇÕES GLOBALMENTE
// ========================================

window.logout = logout;
window.redirecionarLogin = redirecionarLogin;
window.verificarSeUsuarioEstaLogado = verificarSeUsuarioEstaLogado;
window.fecharModalConfirmacao = fecharModalConfirmacao;
window.confirmarModalConfirmacao = confirmarModalConfirmacao;