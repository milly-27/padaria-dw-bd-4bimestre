const API_BASE_URL = 'http://localhost:3001';

// Função para mostrar formulário de login
function showLogin() {
    document.getElementById('login-tab').classList.add('active');
    document.getElementById('register-tab').classList.remove('active');
}

// Função para mostrar formulário de cadastro
function showRegister() {
    document.getElementById('login-tab').classList.remove('active');
    document.getElementById('register-tab').classList.add('active');
}

// Função para mostrar alertas
function showAlert(message, type = 'error') {
    // Remover alertas existentes
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    // Criar novo alerta
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    // Inserir no início do formulário ativo
    const activeTab = document.querySelector('.tab-content.active');
    activeTab.insertBefore(alert, activeTab.firstChild);
    
    // Remover alerta após 5 segundos
    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, 5000);
}

// Função para mostrar loading
function showLoading(show = true) {
    const loading = document.querySelector('.loading');
    if (loading) {
        loading.style.display = show ? 'block' : 'none';
    }
}

// Login Unificado
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {
        email_pessoa: formData.get('email'),
        senha_pessoa: formData.get('senha')
    };
    
    try {
        showLoading(true);
        
        // Tenta login primeiro como cliente
        let response = await fetch(`${API_BASE_URL}/login/loginCliente`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(data)
        });
        
        let result = await response.json();
        
        // Se não for cliente, tenta como funcionário
        if (result.status !== 'ok') {
            response = await fetch(`${API_BASE_URL}/login/loginFuncionario`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(data)
            });
            
            result = await response.json();
        }
        
        if (result.status === 'ok') {
            showAlert('Login realizado com sucesso!', 'success');
            setTimeout(() => {
                window.location.href = '../menu.html';
            }, 1500);
        } else {
            showAlert('Email ou senha incorretos!', 'error');
        }
    } catch (error) {
        console.error('Erro no login:', error);
        showAlert('Erro ao fazer login. Tente novamente.', 'error');
    } finally {
        showLoading(false);
    }
});

// Cadastro
document.getElementById('cadastroForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {
        cpf: formData.get('cpf'),
        nome_pessoa: formData.get('nome'),
        email_pessoa: formData.get('email'),
        senha_pessoa: formData.get('senha')
    };
    
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
        
        if (result.status === 'ok') {
            showAlert('Cadastro realizado com sucesso!', 'success');
            setTimeout(() => {
                showLogin();
                // Limpar formulário
                e.target.reset();
            }, 2000);
        } else {
            showAlert(result.error || 'Erro ao cadastrar. Tente novamente.', 'error');
        }
    } catch (error) {
        console.error('Erro no cadastro:', error);
        showAlert('Erro ao cadastrar. Tente novamente.', 'error');
    } finally {
        showLoading(false);
    }
});

// Máscara para CPF (apenas números)
document.getElementById('regCpf').addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    // Limitar a 11 dígitos
    if (value.length > 11) {
        value = value.substring(0, 11);
    }
    e.target.value = value;
});

// Verificar se já está logado
window.addEventListener('load', async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/login/verificaSePessoaEstaLogada`, {
            credentials: 'include'
        });
        
        const result = await response.json();
        
        if (result.status === 'ok') {
            // Pessoa já está logada, redirecionar para menu
            window.location.href = '../menu.html';
        }
    } catch (error) {
        console.error('Erro ao verificar login:', error);
    }
});