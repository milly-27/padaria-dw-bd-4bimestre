// auth.js - Sistema de Autenticação com Debug e Logout Automático

const API_URL = 'http://localhost:3001';

// Função para mostrar mensagens
export function mostrarMensagem(elemento, texto, tipo) {
    elemento.textContent = texto;
    elemento.className = `mensagem ${tipo}`;
    elemento.style.display = 'block';
    
    console.log(`📢 Mensagem [${tipo}]:`, texto);
}

// Função para salvar dados no sessionStorage (ao invés de cookie com prazo longo)
function salvarSessao(nome, valor) {
    sessionStorage.setItem(nome, valor);
    console.log(`💾 Sessão salva: ${nome} = ${valor}`);
}

// Função para ler sessionStorage
function lerSessao(nome) {
    const valor = sessionStorage.getItem(nome);
    console.log(`🔍 Lendo sessão: ${nome} = ${valor || 'null'}`);
    return valor;
}

// Função para deletar sessão
function deletarSessao(nome) {
    sessionStorage.removeItem(nome);
    console.log(`🗑️ Sessão deletada: ${nome}`);
}

// Função para deletar todas as sessões
function deletarTodasSessoes() {
    console.log('🧹 Deletando todas as sessões...');
    sessionStorage.clear();
    console.log('✅ Todas as sessões deletadas!');
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
            body: JSON.stringify({ 
                email_usuario: email,
                senha_usuario: senha
            })
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
            
            // Salvar na sessão (será apagado ao fechar o navegador)
            salvarSessao('token', usuario.token || 'no-token');
            salvarSessao('userId', usuario.id || usuario.cpf);
            salvarSessao('userName', usuario.nome);
            salvarSessao('userEmail', usuario.email);
            salvarSessao('userType', usuario.is_funcionario ? 'funcionario' : 'cliente');
            salvarSessao('userCargo', usuario.cargo || '');
            
            console.log('🎉 Sessão criada com sucesso!');
            console.log('⚠️ A sessão será apagada ao fechar o navegador');
            
            // Verificar se foram salvos
            console.log('🔍 Verificando dados da sessão:');
            console.log('  - token:', lerSessao('token'));
            console.log('  - userId:', lerSessao('userId'));
            console.log('  - userName:', lerSessao('userName'));
            console.log('  - userEmail:', lerSessao('userEmail'));
            console.log('  - userType:', lerSessao('userType'));
            console.log('  - userCargo:', lerSessao('userCargo'));
            
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
        const response = await fetch(`${API_URL}/auth/registro`, {
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
            
            // Salvar na sessão
            salvarSessao('token', data.user.token || 'no-token');
            salvarSessao('userId', data.user.id || data.user.cpf);
            salvarSessao('userName', data.user.nome);
            salvarSessao('userEmail', data.user.email);
            salvarSessao('userType', data.user.tipo || 'cliente');
            salvarSessao('userCargo', data.user.cargo || '');
            
            console.log('🎉 Sessão criada com sucesso!');
            console.log('⚠️ A sessão será apagada ao fechar o navegador');
            
            // Verificar se foram salvos
            console.log('🔍 Verificando dados da sessão:');
            console.log('  - token:', lerSessao('token'));
            console.log('  - userId:', lerSessao('userId'));
            console.log('  - userName:', lerSessao('userName'));
            console.log('  - userEmail:', lerSessao('userEmail'));
            
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
    
    const token = lerSessao('token');
    const userId = lerSessao('userId');
    const userName = lerSessao('userName');
    
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
    
    deletarTodasSessoes();
    
    console.log('✅ Logout realizado com sucesso!');
}

// Exportar funções auxiliares também
export { lerSessao as lerCookie, salvarSessao as salvarCookie, deletarSessao as deletarCookie };