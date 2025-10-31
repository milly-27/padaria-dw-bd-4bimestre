const API_BASE_URL = 'http://localhost:3001';

// ========================================
// ESTILOS DINÂMICOS
// ========================================
const injetarEstilos = () => {
    // Verifica se os estilos já foram adicionados
    if (document.getElementById('menu-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'menu-styles';
    style.textContent = `
        .hidden {
            display: none !important;
        }
        
        .user-info {
            background: var(--accent, #f0f0f0);
            padding: 0.7rem 1.5rem;
            border-radius: var(--radius-md, 8px);
            cursor: pointer;
            transition: var(--transition, all 0.3s ease);
            box-shadow: var(--shadow-sm, 0 2px 4px rgba(0,0,0,0.1));
            display: flex;
            align-items: center;
            gap: 0.5rem;
            position: relative;
        }
        
        .user-info:hover {
            background: var(--primary, #007bff);
            color: white;
            transform: translateY(-2px);
            box-shadow: var(--shadow-md, 0 4px 8px rgba(0,0,0,0.15));
        }
        
        .logout-tooltip {
            position: absolute;
            top: calc(100% + 10px);
            right: 0;
            background: var(--text-dark, #333);
            color: white;
            padding: 0.4rem 0.8rem;
            border-radius: 6px;
            font-size: 0.8rem;
            white-space: nowrap;
            opacity: 0;
            visibility: hidden;
            transition: var(--transition, all 0.3s ease);
            pointer-events: none;
            z-index: 1000;
        }
        
        .user-info:hover .logout-tooltip {
            opacity: 1;
            visibility: visible;
        }
        
        .user-section {
            display: flex;
            align-items: center;
            gap: 1rem;
        }
    `;
    document.head.appendChild(style);
};

// ========================================
// CONTROLE DO MENU DE CADASTROS
// ========================================
const controlarMenuCadastros = (mostrar = false) => {
    const menuCadastros = document.getElementById('menuCadastros');
    if (menuCadastros) {
        menuCadastros.style.display = mostrar ? 'block' : 'none';
        console.log(`📋 Menu de cadastros: ${mostrar ? 'VISÍVEL' : 'OCULTO'}`);
    }
};

// ========================================
// GERENCIAMENTO DE UI
// ========================================
const atualizarInterfaceUsuario = (userData = null) => {
    const btnLogin = document.getElementById('btnLogin');
    const userInfo = document.getElementById('userInfo');
    const userName = document.getElementById('userName');
    const loginMessage = document.getElementById('loginMessage');
    
    // Validar elementos necessários
    if (!btnLogin || !userInfo || !userName) {
        console.warn('⚠️ Elementos de UI não encontrados');
        return;
    }
    
    if (userData) {
        // Usuário está logado
        btnLogin.classList.add('hidden');
        userInfo.classList.remove('hidden');
        if (loginMessage) loginMessage.classList.remove('hidden');
        
        // Atualizar nome do usuário
        userName.textContent = userData.nome;
        
        // Remover span de tipo anterior se existir
        const spanAntigo = userName.querySelector('#tipoUsuario');
        if (spanAntigo) spanAntigo.remove();
        
        // Adicionar tipo de usuário
        const tipoUsuarioSpan = document.createElement('span');
        tipoUsuarioSpan.id = 'tipoUsuario';
        tipoUsuarioSpan.style.cssText = 'font-size: 0.85em; color: #999; margin-left: 10px;';
        
        // Formatar exibição do tipo e cargo
        if (userData.tipo === 'funcionario' && userData.cargo) {
            tipoUsuarioSpan.textContent = `(${userData.cargo})`;
        } else {
            tipoUsuarioSpan.textContent = `(${userData.tipo})`;
        }
        
        userName.appendChild(tipoUsuarioSpan);
        
        // ✅ GARANTIR QUE userInfo PODE SER CLICADO
        userInfo.style.cursor = 'pointer';
        userInfo.title = 'Clique para fazer logout';
        
        // Controlar menu de cadastros - APENAS FUNCIONÁRIOS
        const temPermissao = userData.tipo === 'funcionario';
        controlarMenuCadastros(temPermissao);
        
        console.log(`✅ Interface atualizada para: ${userData.nome} - ${userData.tipo}${userData.cargo ? ' - ' + userData.cargo : ''}`);
        console.log(temPermissao ? '✅ Menu de cadastros LIBERADO' : '❌ Menu de cadastros BLOQUEADO');
    } else {
        // Usuário não está logado
        btnLogin.classList.remove('hidden');
        userInfo.classList.add('hidden');
        if (loginMessage) loginMessage.classList.add('hidden');
        userName.textContent = '';
        
        // Esconder menu de cadastros
        controlarMenuCadastros(false);
        
        console.log('❌ Interface resetada - usuário não logado');
    }
};

// ========================================
// VERIFICAÇÃO DE LOGIN - CORRIGIDA COM LOGS DETALHADOS
// ========================================
const verificarSeUsuarioEstaLogadoBackend = async () => {
    console.log('🔍 Verificando login no backend...');
    console.log('══════════════════════════════════════');
    
    try {
        // Primeiro tenta verificar se está logado
        const response = await fetch(`${API_BASE_URL}/login/verificaSePessoaEstaLogada`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📨 Resposta inicial do backend:', data);

        if (data.status === 'ok' && data.nome) {
            let userData = { 
                nome: data.nome,
                tipo: data.tipo || 'cliente',
                cargo: data.cargo || ''
            };
            
            console.log('🔍 Dados recebidos:');
            console.log('   - tipo:', userData.tipo);
            console.log('   - cargo:', userData.cargo);
            
            // ✅ SEMPRE verificar se é funcionário, independente do tipo que veio
            console.log('🔍 Buscando na lista de funcionários...');
            
            try {
                // Tenta buscar dados como funcionário
                const funcResponse = await fetch(`${API_BASE_URL}/funcionario/listar`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log('📡 Status da requisição funcionários:', funcResponse.status);
                
                if (funcResponse.ok) {
                    const funcData = await funcResponse.json();
                    console.log('📨 Resposta funcionários completa:', funcData);
                    
                    // Procura o usuário atual na lista de funcionários
                    if (funcData.funcionarios && Array.isArray(funcData.funcionarios)) {
                        console.log(`📋 Total de funcionários na lista: ${funcData.funcionarios.length}`);
                        
                        // Listar todos os nomes para debug
                        funcData.funcionarios.forEach((f, index) => {
                            console.log(`   ${index + 1}. ${f.nome_pessoa} - Cargo: ${f.cargo_funcionario}`);
                        });
                        
                        const funcionario = funcData.funcionarios.find(f => 
                            f.nome_pessoa && f.nome_pessoa.toLowerCase().trim() === userData.nome.toLowerCase().trim()
                        );
                        
                        console.log(`🔍 Procurando por: "${userData.nome}"`);
                        console.log('🔍 Resultado da busca:', funcionario);
                        
                        if (funcionario) {
                            console.log('✅ ENCONTRADO COMO FUNCIONÁRIO!');
                            console.log('   - Nome completo:', funcionario.nome_pessoa);
                            console.log('   - Cargo:', funcionario.cargo_funcionario);
                            
                            userData.tipo = 'funcionario';
                            userData.cargo = funcionario.cargo_funcionario || '';
                        } else {
                            console.log('❌ NÃO encontrado na lista de funcionários');
                        }
                    } else {
                        console.log('⚠️ Lista de funcionários vazia ou inválida');
                    }
                } else {
                    console.log('❌ Erro ao buscar funcionários, status:', funcResponse.status);
                }
            } catch (funcError) {
                console.error('❌ Erro ao buscar funcionários:', funcError);
            }
            
            console.log('══════════════════════════════════════');
            console.log('👤 USUÁRIO FINAL IDENTIFICADO:');
            console.log('   Nome:', userData.nome);
            console.log('   Tipo:', userData.tipo);
            console.log('   Cargo:', userData.cargo || '(sem cargo)');
            console.log('══════════════════════════════════════');
            
            // Salvar no sessionStorage
            sessionStorage.setItem('usuarioLogado', JSON.stringify(userData));
            
            // Atualizar interface
            atualizarInterfaceUsuario(userData);
            
            return userData;
        } else {
            console.log('❌ Usuário não está logado');
            console.log('══════════════════════════════════════');
            
            // Limpar sessionStorage
            sessionStorage.removeItem('usuarioLogado');
            
            // Atualizar interface
            atualizarInterfaceUsuario(null);
            
            return null;
        }
    } catch (error) {
        console.error('❌ Erro ao verificar login no backend:', error);
        console.log('══════════════════════════════════════');
        
        // Em caso de erro, limpar estado
        sessionStorage.removeItem('usuarioLogado');
        atualizarInterfaceUsuario(null);
        
        return null;
    }
};

// ========================================
// FUNÇÃO PARA LIMPAR TODOS OS COOKIES
// ========================================
const limparCookies = () => {
    console.log('🍪 Limpando todos os cookies...');
    
    try {
        const cookies = document.cookie.split(";");
        
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i];
            const eqPos = cookie.indexOf("=");
            const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
            
            // Deletar o cookie em múltiplos caminhos e domínios
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname;
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=." + window.location.hostname;
        }
        
        console.log('✅ Cookies limpos!');
    } catch (error) {
        console.error('❌ Erro ao limpar cookies:', error);
    }
};

// ========================================
// LOGOUT - CORRIGIDO E MELHORADO
// ========================================
const logout = async () => {
    if (!confirm('Deseja realmente sair do sistema?')) {
        return;
    }
    
    console.log('🚪 Iniciando logout...');
    
    try {
        const response = await fetch(`${API_BASE_URL}/login/logout`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();
        console.log('📨 Resposta logout:', result);
        
        // ✅ Verificar 'deslogado'
        if (result.status === 'deslogado') {
            console.log('✅ Logout realizado com sucesso!');
            
            // 1. Limpar sessionStorage
            sessionStorage.removeItem('usuarioLogado');
            sessionStorage.clear();
            
            // 2. Limpar localStorage também (se houver)
            localStorage.removeItem('usuarioLogado');
            localStorage.clear();
            
            // 3. Limpar cookies
            limparCookies();
            
            // 4. Atualizar interface
            atualizarInterfaceUsuario(null);
            
            // 5. Notificar usuário
            alert('Logout realizado com sucesso!');
            
            // 6. Redirecionar para a página de login
            setTimeout(() => {
                window.location.href = 'login/login.html';
            }, 500);
        } else {
            throw new Error('Resposta inesperada do servidor');
        }
    } catch (error) {
        console.error('❌ Erro ao fazer logout:', error);
        
        // Mesmo com erro, limpar tudo localmente
        sessionStorage.clear();
        localStorage.clear();
        limparCookies();
        atualizarInterfaceUsuario(null);
        
        alert('Erro ao fazer logout no servidor, mas dados locais foram limpos.');
        
        // Redirecionar mesmo assim
        setTimeout(() => {
            window.location.href = 'login/login.html';
        }, 1000);
    }
};

// ========================================
// FUNÇÕES AUXILIARES
// ========================================
const redirecionarLogin = () => {
    console.log('🔄 Redirecionando para login...');
    window.location.href = 'login/login.html';
};

const verificarLogin = () => {
    const usuarioLogado = sessionStorage.getItem('usuarioLogado');
    
    if (usuarioLogado) {
        try {
            const userData = JSON.parse(usuarioLogado);
            atualizarInterfaceUsuario(userData);
            return userData;
        } catch (error) {
            console.error('Erro ao parsear dados do usuário:', error);
            sessionStorage.removeItem('usuarioLogado');
            atualizarInterfaceUsuario(null);
            return null;
        }
    }
    
    atualizarInterfaceUsuario(null);
    return null;
};

const handleUserAction = (action) => {
    if (action === "gerenciar-conta") {
        alert("Redirecionando para a página de Gerenciar Conta...");
        // window.location.href = 'conta/gerenciar.html';
    } else if (action === "sair") {
        logout();
    }
};

// Funções mantidas para compatibilidade
const logout2 = () => logout();
const nomeUsuario = () => verificarLogin();

const usuarioAutorizado = async () => {
    const userData = verificarLogin();
    if (!userData) {
        const backendData = await verificarSeUsuarioEstaLogadoBackend();
        return backendData && backendData.tipo === 'funcionario';
    }
    return userData.tipo === 'funcionario';
};

// ========================================
// SIMULAÇÃO DE LOGIN (DESENVOLVIMENTO)
// ========================================
const simularLogin = () => {
    const userData = {
        nome: 'Berola da Silva',
        tipo: 'funcionario',
        cargo: 'Gerente'
    };
    
    sessionStorage.setItem('usuarioLogado', JSON.stringify(userData));
    atualizarInterfaceUsuario(userData);
    console.log('🎭 Login simulado como funcionário');
};

// ========================================
// INICIALIZAÇÃO - CORRIGIDA
// ========================================
const inicializarMenu = () => {
    console.log('🚀 Menu carregado, inicializando...');
    
    // Injetar estilos
    injetarEstilos();
    
    // Esconder menu de cadastros por padrão
    controlarMenuCadastros(false);
    
    // Verificar login no backend
    verificarSeUsuarioEstaLogadoBackend();
    
    // ✅ ADICIONAR EVENT LISTENER PARA O BOTÃO DE LOGIN (se existir)
    const btnLogin = document.getElementById('btnLogin');
    if (btnLogin) {
        // Remover qualquer onclick inline e adicionar via JS
        btnLogin.onclick = null;
        btnLogin.removeAttribute('onclick'); // Remove onclick do HTML
        btnLogin.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🔄 Botão login clicado');
            redirecionarLogin();
        });
        console.log('✅ Event listener adicionado ao botão de login');
    } else {
        console.warn('⚠️ Botão de login (btnLogin) não encontrado');
    }
    
    // ✅ ADICIONAR EVENT LISTENER PARA userInfo (LOGOUT)
    const userInfo = document.getElementById('userInfo');
    if (userInfo) {
        userInfo.onclick = null;
        userInfo.removeAttribute('onclick'); // Remove onclick do HTML
        userInfo.style.cursor = 'pointer'; // Adiciona cursor pointer
        userInfo.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🚪 UserInfo clicado - iniciando logout');
            logout();
        });
        console.log('✅ Event listener adicionado ao userInfo para LOGOUT');
    } else {
        console.warn('⚠️ UserInfo não encontrado');
    }
};

// ========================================
// EVENT LISTENERS
// ========================================
document.addEventListener('DOMContentLoaded', inicializarMenu);

// Atalho de desenvolvimento: CTRL + L para simular login
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        simularLogin();
    }
});

// ========================================
// EXPORTAR FUNÇÕES GLOBALMENTE
// ========================================
window.menuFunctions = {
    verificarLogin,
    logout,
    usuarioAutorizado,
    redirecionarLogin,
    limparCookies
};

// ✅ TORNAR FUNÇÕES DISPONÍVEIS GLOBALMENTE PARA O HTML
window.logout = logout;
window.redirecionarLogin = redirecionarLogin;
window.handleUserAction = handleUserAction;
window.simularLogin = simularLogin;

console.log('✅ menu.js carregado com sucesso!');