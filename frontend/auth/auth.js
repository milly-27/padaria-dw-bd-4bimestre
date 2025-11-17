// auth.js - Sistema de Autenticação com Debug

const API_URL = 'http://localhost:3001';

// Função para mostrar mensagens
export function mostrarMensagem(elemento, texto, tipo) {
    elemento.textContent = texto;
    elemento.className = `mensagem ${tipo}`;
    elemento.style.display = 'block';
    
    console.log(`📢 Mensagem [${tipo}]:`, texto);
}

// Função para salvar dados no cookie
function salvarCookie(nome, valor, dias = 7) {
    const data = new Date();
    data.setTime(data.getTime() + (dias * 24 * 60 * 60 * 1000));
    const expira = "expires=" + data.toUTCString();
    const cookie = `${nome}=${valor};${expira};path=/`;
    document.cookie = cookie;
    
    console.log(`🍪 Cookie salvo: ${nome} = ${valor}`);
    console.log(`📅 Expira em: ${expira}`);
    console.log(`📋 Cookie completo:`, cookie);
}

// Função para ler cookie
function lerCookie(nome) {
    const nomeCookie = nome + "=";
    const cookies = document.cookie.split(';');
    
    console.log(`🔍 Procurando cookie: ${nome}`);
    console.log(`📋 Todos os cookies:`, document.cookie);
    
    for(let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i].trim();
        if (cookie.indexOf(nomeCookie) === 0) {
            const valor = cookie.substring(nomeCookie.length, cookie.length);
            console.log(`✅ Cookie encontrado: ${nome} = ${valor}`);
            return valor;
        }
    }
    
    console.log(`❌ Cookie não encontrado: ${nome}`);
    return null;
}

// Função para deletar cookie
function deletarCookie(nome) {
    console.log(`🗑️ Deletando cookie: ${nome}`);
    document.cookie = `${nome}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    console.log(`✅ Cookie ${nome} deletado`);
}

// Função de Login
export async function login(email, senha) {
    console.log('🔐 Iniciando login...');
    console.log('📧 Email:', email);
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, senha })
        });

        console.log('📡 Resposta do servidor:', response.status, response.statusText);
        
        const data = await response.json();
        console.log('📦 Dados recebidos:', data);

        // Verificar diferentes formatos de resposta
        const loginSucesso = data.logged || data.status === "ok" || data.status === "success";
        const usuario = data.user || data.usuario;

        if (loginSucesso && usuario) {
            console.log('✅ Login bem-sucedido!');
            console.log('👤 Usuário:', usuario);
            
            // Salvar cookies
            salvarCookie('token', usuario.token || 'no-token');
            salvarCookie('userId', usuario.id || usuario.cpf);
            salvarCookie('userName', usuario.nome);
            salvarCookie('userEmail', usuario.email);
            salvarCookie('userType', usuario.tipo || 'cliente');
            salvarCookie('userCargo', usuario.cargo || '');
            
            console.log('🎉 Cookies salvos com sucesso!');
            
            // Verificar se foram salvos
            console.log('🔍 Verificando cookies salvos:');
            console.log('  - token:', lerCookie('token'));
            console.log('  - userId:', lerCookie('userId'));
            console.log('  - userName:', lerCookie('userName'));
            console.log('  - userEmail:', lerCookie('userEmail'));
            console.log('  - userType:', lerCookie('userType'));
            console.log('  - userCargo:', lerCookie('userCargo'));
            
            // Retornar no formato esperado
            return {
                logged: true,
                user: usuario
            };
        } else {
            console.log('❌ Login falhou:', data.error || data.message || 'Erro desconhecido');
            return {
                logged: false,
                error: data.error || data.message || 'Email ou senha incorretos'
            };
        }
    } catch (error) {
        console.error('🔥 Erro na requisição de login:', error);
        throw error;
    }
}

// Função de Registro
export async function registrar(user) {
    console.log('📝 Iniciando cadastro...');
    console.log('👤 Dados do usuário:', user);
    
    try {
        const response = await fetch(`${API_URL}/auth/registrar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(user)
        });

        console.log('📡 Resposta do servidor:', response.status, response.statusText);
        
        const data = await response.json();
        console.log('📦 Dados recebidos:', data);

        if (data.logged && data.user) {
            console.log('✅ Cadastro bem-sucedido!');
            console.log('👤 Usuário:', data.user);
            
            // Salvar cookies
            salvarCookie('token', data.user.token || 'no-token');
            salvarCookie('userId', data.user.id || data.user.cpf);
            salvarCookie('userName', data.user.nome);
            salvarCookie('userEmail', data.user.email);
            salvarCookie('userType', data.user.tipo || 'cliente');
            salvarCookie('userCargo', data.user.cargo || '');
            
            console.log('🎉 Cookies salvos com sucesso!');
            
            // Verificar se foram salvos
            console.log('🔍 Verificando cookies salvos:');
            console.log('  - token:', lerCookie('token'));
            console.log('  - userId:', lerCookie('userId'));
            console.log('  - userName:', lerCookie('userName'));
            console.log('  - userEmail:', lerCookie('userEmail'));
            
            return data;
        } else {
            console.log('❌ Cadastro falhou:', data.error || 'Erro desconhecido');
            return data;
        }
    } catch (error) {
        console.error('🔥 Erro na requisição de cadastro:', error);
        throw error;
    }
}

// Função para verificar se o usuário está logado
export function verificarLogin() {
    console.log('🔍 Verificando login...');
    
    const token = lerCookie('token');
    const userId = lerCookie('userId');
    const userName = lerCookie('userName');
    
    if (token && userId) {
        console.log('✅ Usuário está logado!');
        return {
            logged: true,
            user: {
                id: userId,
                nome: userName,
                token: token
            }
        };
    }
    
    console.log('❌ Usuário não está logado');
    return { logged: false };
}

// Função de Logout
export function logout() {
    console.log('👋 Realizando logout...');
    
    deletarCookie('token');
    deletarCookie('userId');
    deletarCookie('userName');
    deletarCookie('userEmail');
    deletarCookie('userType');
    deletarCookie('userCargo');
    
    console.log('✅ Logout realizado com sucesso!');
    console.log('🔍 Cookies após logout:', document.cookie);
}

// Exportar funções auxiliares também
export { lerCookie, salvarCookie, deletarCookie };