const API_BASE_URL = 'http://localhost:3001';

// ========================================
// FUNÇÕES DE NAVEGAÇÃO ENTRE FORMULÁRIOS
// ========================================
function showLogin() {
    document.getElementById('login-tab').classList.add('active');
    document.getElementById('register-tab').classList.remove('active');
}

function showRegister() {
    document.getElementById('login-tab').classList.remove('active');
    document.getElementById('register-tab').classList.add('active');
}

// ========================================
// FUNÇÕES DE FEEDBACK VISUAL
// ========================================
function showAlert(message, type = 'error') {
    // Remover alertas existentes
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    // Criar novo alerta
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.style.cssText = `
        padding: 1rem;
        margin-bottom: 1rem;
        border-radius: 8px;
        font-weight: 500;
        text-align: center;
        animation: slideIn 0.3s ease;
        ${type === 'success' ? 'background: #d4edda; color: #155724; border: 1px solid #c3e6cb;' : ''}
        ${type === 'error' ? 'background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;' : ''}
    `;
    alert.textContent = message;
    
    // Inserir no início do formulário ativo
    const activeTab = document.querySelector('.tab-content.active');
    if (activeTab) {
        const form = activeTab.querySelector('form');
        if (form) {
            form.insertBefore(alert, form.firstChild);
        }
    }
    
    // Remover alerta após 5 segundos
    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, 5000);
}

function showLoading(show = true) {
    const loadingEl = document.getElementById('loading');
    if (!loadingEl && show) {
        const loading = document.createElement('div');
        loading.id = 'loading';
        loading.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        `;
        loading.innerHTML = '<div style="background: white; padding: 2rem; border-radius: 10px; font-weight: 600;">Carregando...</div>';
        document.body.appendChild(loading);
    } else if (loadingEl && !show) {
        loadingEl.remove();
    }
}

// ========================================
// FUNÇÃO PARA LIMPAR TODOS OS COOKIES
// ========================================
function limparCookies() {
    console.log('🍪 Limpando todos os cookies...');
    
    try {
        const cookies = document.cookie.split(";");
        
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i];
            const eqPos = cookie.indexOf("=");
            const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
            
            // Deletar cookie em múltiplos caminhos e domínios
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
// FUNÇÃO PARA LIMPAR FORMULÁRIOS
// ========================================
function limparFormularios() {
    console.log('🧹 Limpando formulários...');
    
    try {
        const loginForm = document.getElementById('loginForm');
        const cadastroForm = document.getElementById('cadastroForm');
        
        if (loginForm) {
            loginForm.reset();
            console.log('✅ Formulário de login limpo!');
        }
        if (cadastroForm) {
            cadastroForm.reset();
            console.log('✅ Formulário de cadastro limpo!');
        }
    } catch (error) {
        console.error('❌ Erro ao limpar formulários:', error);
    }
}

// ========================================
// LOGIN - PRIORIDADE: FUNCIONÁRIO → CLIENTE
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    
    if (!loginForm) {
        console.error('❌ Formulário de login não encontrado!');
        return;
    }
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        console.log('🔐 Formulário de login submetido!');
        
        const formData = new FormData(e.target);
        const data = {
            email_pessoa: formData.get('email'),
            senha_pessoa: formData.get('senha')
        };
        
        console.log('📧 Email:', data.email_pessoa);
        console.log('══════════════════════════════════════');
        
        if (!data.email_pessoa || !data.senha_pessoa) {
            showAlert('Por favor, preencha email e senha!', 'error');
            return;
        }
        
        try {
            showLoading(true);
            
            // ✅ 1️⃣ PRIORIDADE: Tenta login como FUNCIONÁRIO primeiro
            console.log('🔍 PASSO 1: Verificando se é FUNCIONÁRIO...');
            let response = await fetch(`${API_BASE_URL}/login/loginFuncionario`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(data)
            });
            
            let result = await response.json();
            console.log('📨 Resposta login funcionário:', result);
            
            // Se for funcionário válido (qualquer cargo), aceita
            if (result.status === 'ok') {
                console.log('✅ Login como FUNCIONÁRIO realizado com sucesso!');
                console.log('👤 Nome:', result.nome);
                console.log('📧 Email:', result.email);
                console.log('🔑 Tipo:', result.tipo);
                console.log('🎯 Cargo:', result.cargo);
                console.log('══════════════════════════════════════');
                
                sessionStorage.setItem('usuarioLogado', JSON.stringify({
                    nome: result.nome,
                    email: result.email,
                    tipo: result.tipo,
                    cargo: result.cargo
                }));
                
                showAlert('Login realizado com sucesso!', 'success');
                
                setTimeout(() => {
                    console.log('🔄 Redirecionando para menu...');
                    window.location.href = '../menu.html';
                }, 1000);
                return; // IMPORTANTE: Sai da função
            }
            
            // ✅ 2️⃣ Se não for funcionário, tenta como CLIENTE
            console.log('ℹ️ Não é funcionário, verificando se é CLIENTE...');
            console.log('🔍 PASSO 2: Verificando se é CLIENTE...');
            
            response = await fetch(`${API_BASE_URL}/login/loginCliente`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(data)
            });
            
            result = await response.json();
            console.log('📨 Resposta login cliente:', result);
            
            if (result.status === 'ok') {
                console.log('✅ Login como CLIENTE realizado com sucesso!');
                console.log('👤 Nome:', result.nome);
                console.log('📧 Email:', result.email);
                console.log('🔑 Tipo:', result.tipo);
                console.log('══════════════════════════════════════');
                
                sessionStorage.setItem('usuarioLogado', JSON.stringify({
                    nome: result.nome,
                    email: result.email,
                    tipo: result.tipo,
                    cargo: ''
                }));
                
                showAlert('Login realizado com sucesso!', 'success');
                
                setTimeout(() => {
                    console.log('🔄 Redirecionando para menu...');
                    window.location.href = '../menu.html';
                }, 1000);
            } else {
                console.log('❌ Credenciais incorretas');
                console.log('══════════════════════════════════════');
                showAlert('Email ou senha incorretos!', 'error');
                
                // ✅ Limpa os campos em caso de erro
                e.target.reset();
            }
        } catch (error) {
            console.error('❌ Erro no login:', error);
            console.log('══════════════════════════════════════');
            showAlert('Erro ao fazer login. Verifique sua conexão e tente novamente.', 'error');
            
            // ✅ Limpa os campos em caso de erro
            e.target.reset();
        } finally {
            showLoading(false);
        }
    });
});

// ========================================
// CADASTRO
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    const cadastroForm = document.getElementById('cadastroForm');
    
    if (!cadastroForm) {
        console.error('❌ Formulário de cadastro não encontrado!');
        return;
    }
    
    cadastroForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = {
            cpf: formData.get('cpf'),
            nome_pessoa: formData.get('nome'),
            email_pessoa: formData.get('email'),
            senha_pessoa: formData.get('senha')
        };
        
        console.log('📝 Tentando cadastrar:', data.nome_pessoa);
        
        // Validação simples de CPF (apenas números e 11 dígitos)
        if (data.cpf.length !== 11) {
            showAlert('CPF deve conter 11 dígitos!', 'error');
            return;
        }
        
        // Validação de senha
        if (data.senha_pessoa.length > 20) {
            showAlert('Senha deve ter no máximo 20 caracteres!', 'error');
            return;
        }
        
        try {
            showLoading(true);
            
            const response = await fetch(`${API_BASE_URL}/login/cadastrarCliente`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            console.log('📨 Resposta cadastro:', result);
            
            if (result.status === 'ok') {
                console.log('✅ Cadastro realizado com sucesso!');
                showAlert('Cadastro realizado com sucesso! Faça login para continuar.', 'success');
                setTimeout(() => {
                    showLogin();
                    // Limpar formulário
                    e.target.reset();
                }, 2000);
            } else {
                console.log('❌ Erro no cadastro:', result.error);
                showAlert(result.error || 'Erro ao cadastrar. Tente novamente.', 'error');
            }
        } catch (error) {
            console.error('❌ Erro no cadastro:', error);
            showAlert('Erro ao cadastrar. Tente novamente.', 'error');
        } finally {
            showLoading(false);
        }
    });
});

// ========================================
// MÁSCARA PARA CPF
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    const cpfInput = document.getElementById('regCpf');
    
    if (cpfInput) {
        cpfInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            // Limitar a 11 dígitos
            if (value.length > 11) {
                value = value.substring(0, 11);
            }
            e.target.value = value;
        });
    }
});

// ========================================
// FUNÇÃO DE LOGOUT - CORRIGIDA E MELHORADA
// ========================================
async function logout() {
    if (!confirm('Deseja realmente sair do sistema?')) {
        return;
    }
    
    console.log('🚪 Fazendo logout...');
    console.log('══════════════════════════════════════');
    
    try {
        showLoading(true);
        
        const response = await fetch(`${API_BASE_URL}/login/logout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        });
        
        const result = await response.json();
        console.log('📨 Resposta logout:', result);
        
        // ✅ Verificar 'deslogado' ao invés de 'ok'
        if (result.status === 'deslogado') {
            console.log('✅ Logout realizado com sucesso no servidor!');
            console.log('🧹 Iniciando limpeza local...');
            
            // 1. Limpar sessionStorage
            sessionStorage.removeItem('usuarioLogado');
            sessionStorage.clear();
            console.log('✅ SessionStorage limpo');
            
            // 2. Limpar localStorage
            localStorage.removeItem('usuarioLogado');
            localStorage.clear();
            console.log('✅ LocalStorage limpo');
            
            // 3. Limpar cookies
            limparCookies();
            
            // 4. Limpar formulários
            limparFormularios();
            
            console.log('══════════════════════════════════════');
            console.log('✅ Logout completo! Redirecionando...');
            
            // 5. Redirecionar para página de login
            setTimeout(() => {
                window.location.href = 'login/login.html';
            }, 500);
        } else {
            console.log('❌ Erro ao fazer logout no servidor');
            console.log('🧹 Limpando dados locais mesmo assim...');
            
            // Mesmo com erro, limpar tudo localmente
            sessionStorage.clear();
            localStorage.clear();
            limparCookies();
            limparFormularios();
            
            console.log('══════════════════════════════════════');
            alert('Erro ao fazer logout no servidor, mas dados locais foram limpos.');
            window.location.href = 'login/login.html';
        }
    } catch (error) {
        console.error('❌ Erro no logout:', error);
        console.log('🧹 Limpando dados locais mesmo assim...');
        
        // Limpar tudo mesmo com erro
        sessionStorage.clear();
        localStorage.clear();
        limparCookies();
        limparFormularios();
        
        console.log('══════════════════════════════════════');
        alert('Erro ao fazer logout. Dados locais foram limpos.');
        window.location.href = 'login/login.html';
    } finally {
        showLoading(false);
    }
}

// Tornar função logout disponível globalmente
window.logout = logout;

// ========================================
// VERIFICAÇÃO INICIAL AO CARREGAR PÁGINA
// ========================================
window.addEventListener('load', async () => {
    console.log('🔍 Verificando se já está logado...');
    
    // ✅ SEMPRE limpar formulários ao carregar (garante campos em branco)
    limparFormularios();
    
    try {
        const response = await fetch(`${API_BASE_URL}/login/verificaSePessoaEstaLogada`, {
            method: 'GET',
            credentials: 'include'
        });
        
        const result = await response.json();
        console.log('📨 Resposta verificação:', result);
        
        if (result.status === 'ok') {
            console.log('✅ Já está logado! Redirecionando...');
            // Pessoa já está logada, redirecionar para menu
            window.location.href = '../menu.html';
        } else {
            console.log('ℹ️ Não está logado, mostrando tela de login');
            // ✅ Garante que os campos estão limpos
            limparFormularios();
        }
    } catch (error) {
        console.error('❌ Erro ao verificar login:', error);
        // Em caso de erro, garante que campos estão limpos
        limparFormularios();
    }
});

// ========================================
// LOGOUT AUTOMÁTICO AO FECHAR PÁGINA
// ========================================
window.addEventListener('beforeunload', async (e) => {
    // Verifica se a página atual não é a de login
    const isLoginPage = window.location.pathname.includes('login.html');
    
    if (!isLoginPage) {
        console.log('🚪 Saindo da página, fazendo logout automático...');
        
        try {
            await fetch(`${API_BASE_URL}/login/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                keepalive: true
            });
            
            // Limpar tudo
            sessionStorage.removeItem('usuarioLogado');
            sessionStorage.clear();
            localStorage.clear();
            limparCookies();
            
            console.log('✅ Logout automático realizado!');
        } catch (error) {
            console.error('❌ Erro no logout automático:', error);
        }
    }
});

console.log('✅ login.js carregado com sucesso!');