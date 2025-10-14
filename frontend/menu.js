const API_BASE_URL = 'http://localhost:3001';

// --- SEU CÓDIGO EXISTENTE MANTIDO ---
function redirecionarLogin() {
    window.location.href = 'login/login.html';
}

function logout() {
    if (confirm('Deseja realmente sair do sistema?')) {
        // Limpar dados da sessão
        sessionStorage.removeItem('usuarioLogado');
        
        // Esconder informações do usuário e mostrar botão de login
        document.getElementById('userInfo').classList.add('hidden');
        document.getElementById('btnLogin').classList.remove('hidden');
        document.getElementById('loginMessage').classList.add('hidden');
        
        alert('Logout realizado com sucesso!');
    }
}

function verificarLogin() {
    const usuarioLogado = sessionStorage.getItem('usuarioLogado');
    
    if (usuarioLogado) {
        const userData = JSON.parse(usuarioLogado);
        mostrarUsuarioLogado(userData);
    }
}

function mostrarUsuarioLogado(userData) {
    const btnLogin = document.getElementById('btnLogin');
    const userInfo = document.getElementById('userInfo');
    const userName = document.getElementById('userName');
    const loginMessage = document.getElementById('loginMessage');
    
    btnLogin.classList.add('hidden');
    userName.textContent = userData.nome;
    userInfo.classList.remove('hidden');
    loginMessage.classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', function() {
    verificarLogin();
});

// Simulação de login para teste
function simularLogin() {
    const userData = {
        cpf: '12345678901',
        nome: 'Berola da Silva',
        email: 'berola@gmail.com'
    };
    
    sessionStorage.setItem('usuarioLogado', JSON.stringify(userData));
    mostrarUsuarioLogado(userData);
}

document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        simularLogin();
    }
});

function handleUserAction(action) {
    if (action === "gerenciar-conta") {
        alert("Redirecionando para a página de Gerenciar Conta...");
    } else if (action === "sair") {
        logout();
    }
}

function logout2() {
    logout();
}

function nomeUsuario() {
    verificarLogin();
}

async function usuarioAutorizado() {
    console.log('Função usuarioAutorizado() - implementar conforme API');
}

// --- NOVO CÓDIGO ADICIONADO PARA LOGIN REAL ---
async function verificarSeUsuarioEstaLogadoBackend() {
    try {
        const res = await fetch(`${API_BASE_URL}/login/verificaSeUsuarioEstaLogado`, {
            method: 'POST',
            credentials: 'include'
        });
        const data = await res.json();

        if (data.status === 'ok' && data.nome) {
            const userData = { nome: data.nome, cpf: data.cpf };
            sessionStorage.setItem('usuarioLogado', JSON.stringify(userData));
            mostrarUsuarioLogado(userData);
        }
    } catch (err) {
        console.error('Erro ao verificar login no backend:', err);
    }
}

// Chama a verificação do backend ao carregar a página
document.addEventListener('DOMContentLoaded', function() {
    verificarSeUsuarioEstaLogadoBackend();
});
