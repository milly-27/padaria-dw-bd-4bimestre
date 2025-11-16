// Configuração da API
const API_BASE_URL = 'http://localhost:3001';

// Elementos do DOM
const carrinhoVazio = document.getElementById('carrinhoVazio');
const carrinhoConteudo = document.getElementById('carrinhoConteudo');
const itensCarrinho = document.getElementById('itensCarrinho');
const subtotalElement = document.getElementById('subtotal');
const totalElement = document.getElementById('total');
const messageContainer = document.getElementById('messageContainer');
const btnLimparCarrinho = document.getElementById('btnLimparCarrinho');
const btnFinalizarPagamento = document.getElementById('btnFinalizarPagamento');

// Variáveis globais
let carrinho = [];
let usuarioLogado = null;

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Verificar usuário logado
        await verificarUsuarioLogado();
        
        // Carregar carrinho
        carregarCarrinho();
        
        // Atualizar interface
        atualizarInterface();
        
        // Configurar event listeners
        configurarEventListeners();
        
        console.log('Carrinho inicializado com sucesso!', carrinho);
    } catch (error) {
        console.error('Erro ao inicializar o carrinho:', error);
        mostrarMensagem('Erro ao carregar o carrinho. Por favor, recarregue a página.', 'error');
    }
});

// ========================================
// VERIFICAR USUÁRIO LOGADO
// ========================================
async function verificarUsuarioLogado() {
    try {
        const response = await fetch(`${API_BASE_URL}/login/verificaSePessoaEstaLogada`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
        
        const data = await response.json();
        
        if (data.status === 'ok' && data.usuario) {
            usuarioLogado = {
                id: data.usuario.id,
                nome: data.usuario.nome,
                email: data.usuario.email,
                tipo: data.usuario.tipo,
                cargo: data.usuario.cargo
            };
            
            console.log('👤 Usuário logado:', usuarioLogado);
            
            // Atualizar header com informações do usuário
            atualizarHeaderUsuario();
        } else {
            console.log('❌ Usuário não autenticado');
            usuarioLogado = null;
        }
    } catch (error) {
        console.error('Erro ao verificar usuário logado:', error);
        usuarioLogado = null;
    }
}

// ========================================
// ATUALIZAR HEADER COM INFO DO USUÁRIO
// ========================================
function atualizarHeaderUsuario() {
    const headerElement = document.querySelector('.header h1');
    if (headerElement && usuarioLogado) {
        // Adicionar informação do usuário no header
        const userInfoDiv = document.createElement('div');
        userInfoDiv.className = 'user-info-header';
        userInfoDiv.style.cssText = 'font-size: 0.9rem; color: #666; margin-top: 0.5rem;';
        userInfoDiv.innerHTML = `
            <span style="font-weight: 500;">Olá, <span style="color: #667eea; font-weight: 600;">${usuarioLogado.nome}</span></span>
            ${usuarioLogado.tipo === 'funcionario' && usuarioLogado.cargo ? 
                `<span style="margin-left: 10px; padding: 2px 8px; background: #f0f0f0; border-radius: 4px; font-size: 0.8rem;">${usuarioLogado.cargo}</span>` 
                : ''}
        `;
        
        // Verificar se já existe e substituir
        const existingUserInfo = document.querySelector('.user-info-header');
        if (existingUserInfo) {
            existingUserInfo.replaceWith(userInfoDiv);
        } else {
            headerElement.after(userInfoDiv);
        }
    }
}

// Event Listeners
function configurarEventListeners() {
    if (btnLimparCarrinho) {
        btnLimparCarrinho.addEventListener('click', limparCarrinho);
    }
    
    if (btnFinalizarPagamento) {
        btnFinalizarPagamento.addEventListener('click', finalizarPagamento);
    }
}

// Função para mostrar mensagens
function mostrarMensagem(texto, tipo = 'info') {
    if (!messageContainer) {
        console.log(`[${tipo.toUpperCase()}] ${texto}`);
        return;
    }
    
    messageContainer.innerHTML = `<div class="message ${tipo}">${texto}</div>`;
    
    if (messageContainer.timeoutId) {
        clearTimeout(messageContainer.timeoutId);
    }
    
    messageContainer.timeoutId = setTimeout(() => {
        if (messageContainer) {
            messageContainer.innerHTML = '';
        }
    }, 4000);
}

// Função para carregar carrinho do localStorage
function carregarCarrinho() {
    try {
        const carrinhoSalvo = localStorage.getItem('carrinho');
        if (carrinhoSalvo) {
            try {
                carrinho = JSON.parse(carrinhoSalvo);
                carrinho = carrinho.map(item => ({
                    ...item,
                    quantidade: parseInt(item.quantidade) || 1,
                    preco: parseFloat(item.preco) || 0
                }));
            } catch (error) {
                console.error('Erro ao carregar carrinho:', error);
                carrinho = [];
                localStorage.removeItem('carrinho');
            }
        }
    } catch (error) {
        console.error('Erro ao carregar carrinho:', error);
        carrinho = [];
    }
}

// Função para salvar carrinho no localStorage
function salvarCarrinho() {
    try {
        localStorage.setItem('carrinho', JSON.stringify(carrinho || []));
        return true;
    } catch (error) {
        console.error('Erro ao salvar carrinho:', error);
        mostrarMensagem('Erro ao salvar o carrinho. Tente novamente.', 'error');
        return false;
    }
}

// Função para remover item do carrinho
function removerDoCarrinho(idProduto) {
    if (!idProduto) return;
    
    const index = carrinho.findIndex(item => item && item.id_produto === idProduto);
    if (index !== -1) {
        const nomeItem = carrinho[index]?.nome_produto || 'Item';
        carrinho.splice(index, 1);
        const salvou = salvarCarrinho();
        if (salvou) {
            atualizarInterface();
            mostrarMensagem(`${nomeItem} removido do carrinho!`, 'success');
        }
    }
}

// Função para atualizar quantidade de um item
function atualizarQuantidade(idProduto, novaQuantidade) {
    if (!idProduto || isNaN(novaQuantidade) || novaQuantidade < 0) return;
    
    const item = carrinho.find(item => item && item.id_produto === idProduto);
    if (item) {
        if (novaQuantidade <= 0) {
            removerDoCarrinho(idProduto);
        } else {
            item.quantidade = parseInt(novaQuantidade);
            const salvou = salvarCarrinho();
            if (salvou) {
                atualizarInterface();
            }
        }
    }
}

// Função para limpar carrinho
function limparCarrinho() {
    if (!carrinho || carrinho.length === 0) {
        mostrarMensagem('O carrinho já está vazio!', 'info');
        return;
    }
    
    if (confirm('Tem certeza que deseja remover todos os itens do carrinho?')) {
        carrinho = [];
        const salvou = salvarCarrinho();
        if (salvou) {
            atualizarInterface();
            mostrarMensagem('Carrinho limpo com sucesso!', 'success');
        }
    }
}

// Função para calcular subtotal
function calcularSubtotal() {
    return carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0);
}

// Função para calcular total
function calcularTotal() {
    return calcularSubtotal();
}

// Função para atualizar interface
function atualizarInterface() {
    if (!carrinhoVazio || !carrinhoConteudo) return;
    
    if (carrinho.length === 0) {
        carrinhoVazio.style.display = 'block';
        carrinhoConteudo.style.display = 'none';
    } else {
        carrinhoVazio.style.display = 'none';
        carrinhoConteudo.style.display = 'grid';
        renderizarItens();
        atualizarResumo();
    }
}

// Função para renderizar itens do carrinho
function renderizarItens() {
    if (!itensCarrinho) return;
    
    itensCarrinho.innerHTML = '';
    
    carrinho.forEach(item => {
        const itemElement = criarElementoItem(item);
        itensCarrinho.appendChild(itemElement);
    });
}

// Função para criar elemento de item
function criarElementoItem(item) {
    if (!item) return document.createElement('div');
    
    const itemElement = document.createElement('div');
    itemElement.className = 'item-carrinho';
    
    try {
        const imagemUrl = item.imagem_produto || 'https://via.placeholder.com/80';
        const nomeProduto = item.nome_produto || 'Produto sem nome';
        const preco = parseFloat(item.preco) || 0;
        const quantidade = parseInt(item.quantidade) || 1;
        const subtotal = preco * quantidade;
        
        itemElement.innerHTML = `
            <div class="item-imagem">
                <img src="${imagemUrl}" alt="${nomeProduto}" onerror="this.src='https://via.placeholder.com/80';">
            </div>
            <div class="item-info">
                <h4>${nomeProduto}</h4>
                <p class="item-preco">R$ ${preco.toFixed(2).replace('.', ',')}</p>
            </div>
            <div class="quantidade-controles">
                <button class="btn-quantidade" data-action="decrease" data-id="${item.id_produto}">-</button>
                <input type="number" class="quantidade-input" value="${quantidade}" min="1" data-id="${item.id_produto}" readonly>
                <button class="btn-quantidade" data-action="increase" data-id="${item.id_produto}">+</button>
            </div>
            <div class="item-subtotal">R$ ${subtotal.toFixed(2).replace('.', ',')}</div>
            <button class="btn-remover" data-id="${item.id_produto}">🗑️</button>
        `;
        
        // Event listeners
        const btnsQuantidade = itemElement.querySelectorAll('.btn-quantidade');
        btnsQuantidade.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const action = btn.getAttribute('data-action');
                const idProduto = parseInt(btn.getAttribute('data-id'));
                const item = carrinho.find(i => i && i.id_produto === idProduto);
                
                if (!item) return;
                
                if (action === 'increase') {
                    atualizarQuantidade(idProduto, item.quantidade + 1);
                } else if (action === 'decrease') {
                    if (item.quantidade > 1) {
                        atualizarQuantidade(idProduto, item.quantidade - 1);
                    } else {
                        removerDoCarrinho(idProduto);
                    }
                }
            });
        });
        
        const btnRemover = itemElement.querySelector('.btn-remover');
        if (btnRemover) {
            btnRemover.addEventListener('click', (e) => {
                e.preventDefault();
                const idProduto = parseInt(btnRemover.getAttribute('data-id'));
                if (confirm('Tem certeza que deseja remover este item do carrinho?')) {
                    removerDoCarrinho(idProduto);
                }
            });
        }
        
    } catch (error) {
        console.error('Erro ao criar elemento do item:', error);
        itemElement.innerHTML = '<div class="error">Erro ao carregar o item</div>';
    }
    
    return itemElement;
}

// Função para atualizar resumo
function atualizarResumo() {
    const subtotal = calcularSubtotal();
    const total = calcularTotal();
    
    if (subtotalElement) {
        subtotalElement.textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
    }
    if (totalElement) {
        totalElement.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    }
}

// ========================================
// FINALIZAR PAGAMENTO - NOVA FUNÇÃO
// ========================================
function finalizarPagamento() {
    if (carrinho.length === 0) {
        mostrarMensagem('Seu carrinho está vazio!', 'error');
        return;
    }
    
    if (!usuarioLogado) {
        mostrarMensagem('Você precisa estar logado para finalizar a compra!', 'error');
        setTimeout(() => {
            window.location.href = '../login/login.html';
        }, 2000);
        return;
    }
    
    // Salvar carrinho antes de redirecionar
    salvarCarrinho();
    
    // Redirecionar para página de finalização
    window.location.href = '../pagamento/finalizacao.html';
}

// Exportar funções globalmente
window.adicionarAoCarrinho = (produto, quantidade = 1) => {
    const itemExistente = carrinho.find(item => item.id_produto === produto.id_produto);
    
    if (itemExistente) {
        itemExistente.quantidade += quantidade;
    } else {
        carrinho.push({
            id_produto: produto.id_produto,
            nome_produto: produto.nome_produto,
            preco: produto.preco,
            imagem_produto: produto.imagem_produto,
            quantidade: quantidade
        });
    }
    
    salvarCarrinho();
    atualizarInterface();
    mostrarMensagem(`${produto.nome_produto} adicionado ao carrinho!`, 'success');
};

window.obterQuantidadeItens = () => {
    return carrinho.reduce((total, item) => total + item.quantidade, 0);
};

window.obterTotalCarrinho = () => {
    return calcularTotal();
};