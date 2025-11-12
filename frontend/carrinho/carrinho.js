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
const btnCriarPedido = document.getElementById('btnCriarPedido');
const btnIrParaPagamento = document.getElementById('btnIrParaPagamento');

// Modais
const modalConfirmacaoPedido = document.getElementById('modalConfirmacaoPedido');
const modalPagamento = document.getElementById('modalPagamento');
const modalSucesso = document.getElementById('modalSucesso');

// Elementos dos modais
const modalCpf = document.getElementById('modalCpf');
const modalTotal = document.getElementById('modalTotal');
const modalFormaPagamento = document.getElementById('modalFormaPagamento');
const btnCancelarModalPedido = document.getElementById('btnCancelarModalPedido');
const btnConfirmarPedido = document.getElementById('btnConfirmarPedido');

const numeroPedido = document.getElementById('numeroPedido');
const totalPagar = document.getElementById('totalPagar');
const formaPagamentoEscolhida = document.getElementById('formaPagamentoEscolhida');
const btnCancelarPagamento = document.getElementById('btnCancelarPagamento');
const btnFinalizarPagamento = document.getElementById('btnFinalizarPagamento');

const pedidoFinalizado = document.getElementById('pedidoFinalizado');
const btnVoltarCardapio = document.getElementById('btnVoltarCardapio');

// Variáveis globais
let carrinho = [];
let pedidoAtual = null;
let formasPagamento = [];

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Inicializar carrinho vazio se não existir
        if (!Array.isArray(carrinho)) {
            carrinho = [];
        }
        
        carregarCarrinho();
        carregarFormasPagamento();
        atualizarInterface();
        configurarEventListeners();
        
        console.log('Carrinho inicializado com sucesso!', carrinho);
    } catch (error) {
        console.error('Erro ao inicializar o carrinho:', error);
        mostrarMensagem('Erro ao carregar o carrinho. Por favor, recarregue a página.', 'error');
    }
});

// Função para abrir modal
function abrirModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

// Função para fechar modal
function fecharModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Fechar modal ao clicar fora do conteúdo
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        fecharModal(e.target.id);
    }
});

// Event Listeners
function configurarEventListeners() {
    // Verificar se os elementos existem antes de adicionar os event listeners
    if (btnLimparCarrinho) {
        btnLimparCarrinho.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            limparCarrinho();
        });
    }
    
    if (btnCriarPedido) {
        btnCriarPedido.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            abrirModalConfirmacaoPedido();
        });
    }
    
    if (btnIrParaPagamento) {
        btnIrParaPagamento.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            irParaPagamento();
        });
    }
    
    if (btnVoltarCardapio) {
        btnVoltarCardapio.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '../cardapio/cardapio.html';
        });
    }
    
    // Adicionar listener para o botão de cancelar modal
    if (btnCancelarModalPedido) {
        btnCancelarModalPedido.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            fecharModal('modalConfirmacaoPedido');
        });
    }
    
    // Adicionar listener para o botão de confirmar pedido no modal
    if (btnConfirmarPedido) {
        btnConfirmarPedido.addEventListener('click', (e) => {
            e.preventDefault();
            criarPedido();
        });
    }
}

// Função para aplicar máscara no CPF
function aplicarMascaraCPF(e) {
    let value = e.target.value.replace(/\D/g, '');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    e.target.value = value;
}

// Função para mostrar mensagens
function mostrarMensagem(texto, tipo = 'info') {
    if (!messageContainer) {
        console.log(`[${tipo.toUpperCase()}] ${texto}`);
        return;
    }
    
    messageContainer.innerHTML = `<div class="message ${tipo}">${texto}</div>`;
    
    // Remover mensagem após 4 segundos
    if (messageContainer.timeoutId) {
        clearTimeout(messageContainer.timeoutId);
    }
    
    messageContainer.timeoutId = setTimeout(() => {
        if (messageContainer) {
            messageContainer.innerHTML = '';
        }
    }, 4000);
}

// Função para carregar formas de pagamento do banco
async function carregarFormasPagamento() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/formas-pagamento`);
        if (!response.ok) throw new Error('Erro ao carregar formas de pagamento');
        
        formasPagamento = await response.json();
        
        // Limpar e popular o select
        formaPagamentoSelect.innerHTML = '<option value="">Selecione uma forma de pagamento</option>';
        formasPagamento.forEach(forma => {
            const option = document.createElement('option');
            option.value = forma.id_forma_pagamento;
            option.textContent = forma.nome_forma;
            formaPagamentoSelect.appendChild(option);
        });
        
    } catch (error) {
        console.error('Erro ao carregar formas de pagamento:', error);
        formaPagamentoSelect.innerHTML = '<option value="">Erro ao carregar formas de pagamento</option>';
    }
}

// Função para carregar carrinho do localStorage
function carregarCarrinho() {
    try {
        if (typeof localStorage === 'undefined') {
            console.error('localStorage não está disponível neste navegador');
            carrinho = [];
            return;
        }
        
        const carrinhoSalvo = localStorage.getItem('carrinho');
        if (carrinhoSalvo) {
        try {
                carrinho = JSON.parse(carrinhoSalvo);
                // Garantir que as quantidades sejam números
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
        if (typeof localStorage === 'undefined') {
            console.error('localStorage não está disponível neste navegador');
            return false;
        }
        
        localStorage.setItem('carrinho', JSON.stringify(carrinho || []));
        return true;
    } catch (error) {
        console.error('Erro ao salvar carrinho:', error);
        mostrarMensagem('Erro ao salvar o carrinho. Tente novamente.', 'error');
        return false;
    }
}

// Função para adicionar item ao carrinho (será chamada de outras páginas)
function adicionarAoCarrinho(produto, quantidade = 1) {
    const itemExistente = carrinho.find(item => item.id_produto === produto.id_produto);
    
    if (itemExistente) {
        itemExistente.quantidade += quantidade;
    } else {
        carrinho.push({
            id_produto: produto.id_produto,
            nome_produto: produto.nome_produto,
            preco: produto.preco,
            imagem_path: produto.imagem_path,
            nome_categoria: produto.nome_categoria,
            quantidade: quantidade
        });
    }
    
    salvarCarrinho();
    atualizarInterface();
    mostrarMensagem(`${produto.nome_produto} adicionado ao carrinho!`, 'success');
}

// Função para remover item do carrinho
function removerDoCarrinho(idProduto) {
    if (!idProduto) return;
    
    const index = carrinho.findIndex(item => item && item.id_produto === idProduto);
    if (index !== -1) {
        const nomeItem = carrinho[index]?.nome_produto || carrinho[index]?.nome || 'Item';
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

// Função para calcular total (sem taxa de entrega)
function calcularTotal() {
    return calcularSubtotal();
}

// Função para atualizar interface
function atualizarInterface() {
    // Verificar se os elementos existem antes de manipulá-los
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
    
    // Atualizar contador de itens no menu (se existir)
    const contadorItens = document.getElementById('contadorItens');
    if (contadorItens) {
        const totalItens = carrinho.reduce((total, item) => total + (parseInt(item.quantidade) || 0), 0);
        contadorItens.textContent = totalItens > 0 ? totalItens : '';
    }
}

// Função para renderizar itens do carrinho
function renderizarItens() {
    itensCarrinho.innerHTML = '';
    
    carrinho.forEach(item => {
        const itemElement = criarElementoItem(item);
        itensCarrinho.appendChild(itemElement);
    });
}

// Função para criar elemento de item com imagem
function criarElementoItem(item) {
    if (!item) return document.createElement('div');
    
    const itemElement = document.createElement('div');
    itemElement.className = 'carrinho-item';
    
    try {
        // Construir a URL da imagem - assumindo que a imagem está em /frontend/uploads/
        const imagemUrl = item.imagem && item.imagem.trim() !== ''
            ? `/frontend/uploads/${item.imagem}`
            : 'https://via.placeholder.com/80';
        
        // Usar nome_produto em vez de nome para compatibilidade
        const nomeProduto = item.nome_produto || item.nome || 'Produto sem nome';
        const descricao = item.descricao || 'Sem descrição';
        const preco = parseFloat(item.preco) || 0;
        const quantidade = parseInt(item.quantidade) || 1;
        const subtotal = preco * quantidade;
        
        itemElement.innerHTML = `
            <div class="item-imagem">
                <img src="${imagemUrl}" alt="${nomeProduto}" onerror="this.src='https://via.placeholder.com/80';">
            </div>
            <div class="item-detalhes">
                <h4>${nomeProduto}</h4>
                <p class="item-descricao">${descricao}</p>
                <div class="item-acoes">
                    <button type="button" class="btn-quantidade" data-action="decrease" data-id="${item.id_produto}" aria-label="Diminuir quantidade">-</button>
                    <span class="quantidade">${quantidade}</span>
                    <button type="button" class="btn-quantidade" data-action="increase" data-id="${item.id_produto}" aria-label="Aumentar quantidade">+</button>
                    <button type="button" class="btn-remover" data-id="${item.id_produto}" aria-label="Remover item">Remover</button>
                </div>
            </div>
            <div class="item-preco">
                R$ ${preco.toFixed(2).replace('.', ',')}
                <span class="item-subtotal">R$ ${subtotal.toFixed(2).replace('.', ',')}</span>
            </div>
        `;
        
        // Adiciona event listeners para os botões
        const btnsQuantidade = itemElement.querySelectorAll('.btn-quantidade');
        btnsQuantidade.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
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
                e.stopPropagation();
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
    
    subtotalElement.textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
    totalElement.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

// Função para validar CPF
function validarCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11) return false;
    
    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    // Validar dígitos verificadores
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let resto = 11 - (soma % 11);
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(9))) return false;
    
    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    resto = 11 - (soma % 11);
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(10))) return false;
    
    return true;
}

// Função para abrir modal de confirmação do pedido (simplificada)
function abrirModalConfirmacaoPedido() {
    if (carrinho.length === 0) {
        mostrarMensagem('Seu carrinho está vazio!', 'error');
        return;
    }
    
    // Abre o modal de confirmação
    abrirModal('modalConfirmacaoPedido');
}

// Função para criar pedido
async function criarPedido() {
    try {
        if (carrinho.length === 0) {
            mostrarMensagem('Seu carrinho está vazio!', 'error');
            return;
        }

        // Criar pedido
        const pedido = {
            data_pedido: new Date().toISOString().split('T')[0],
            status: 'pendente',
            observacoes: '',
            itens: carrinho.map(item => ({
                id_produto: item.id_produto,
                quantidade: item.quantidade,
                preco_unitario: item.preco
            }))
        };

        const responsePedido = await fetch(`${API_BASE_URL}/api/pedidos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pedido)
        });

        if (!responsePedido.ok) {
            const errorData = await responsePedido.json().catch(() => ({}));
            throw new Error(errorData.message || 'Erro ao criar pedido');
        }

        const pedidoCriado = await responsePedido.json();
        pedidoAtual = pedidoCriado;

        // Atualizar o modal de pagamento com as informações do pedido
        if (numeroPedido) numeroPedido.textContent = pedidoCriado.id_pedido || 'N/A';
        if (totalPagar) totalPagar.textContent = `R$ ${calcularTotal().toFixed(2).replace('.', ',')}`;
        
        // Mostrar modal de pagamento
        abrirModal('modalPagamento');
        
    } catch (error) {
        console.error('Erro ao criar pedido:', error);
        mostrarMensagem(`Erro ao criar pedido: ${error.message}`, 'error');
    }
}

// Função para finalizar o pedido
async function finalizarPedido() {
    if (!pedidoAtual || !pedidoAtual.id_pedido) {
        mostrarMensagem('Nenhum pedido encontrado para finalizar.', 'error');
        return;
    }

    try {
        // Atualizar status do pedido para 'pago'
        const response = await fetch(`${API_BASE_URL}/api/pedidos/${pedidoAtual.id_pedido}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'pago' })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Erro ao atualizar status do pedido');
        }

        // Atualizar o modal de sucesso
        if (pedidoFinalizado) {
            pedidoFinalizado.textContent = pedidoAtual.id_pedido;
        }
        
        // Fechar modal de pagamento e abrir modal de sucesso
        fecharModal('modalPagamento');
        abrirModal('modalSucesso');
        
        // Limpar carrinho após finalização
        limparCarrinho();
        
    } catch (error) {
        console.error('Erro ao finalizar pedido:', error);
        mostrarMensagem(`Erro ao finalizar pedido: ${error.message}`, 'error');
    }
}

// Função para ir para a página de pagamento
function irParaPagamento() {
    if (carrinho.length === 0) {
        mostrarMensagem('Seu carrinho está vazio!', 'error');
        return;
    } catch (error) {
        console.error('Erro ao finalizar pagamento:', error);
        mostrarMensagem(error.message || 'Erro ao processar pagamento. Tente novamente.', 'error');
    }
}

// Função para obter quantidade de itens no carrinho (útil para outras páginas)
function obterQuantidadeItens() {
    return carrinho.reduce((total, item) => total + item.quantidade, 0);
}

// Função para obter valor total do carrinho (útil para outras páginas)
function obterTotalCarrinho() {
    return calcularTotal();
}

// Expor funções globalmente para uso em outras páginas
window.adicionarAoCarrinho = adicionarAoCarrinho;
window.obterQuantidadeItens = obterQuantidadeItens;
window.obterTotalCarrinho = obterTotalCarrinho;
window.atualizarQuantidade = atualizarQuantidade;
window.removerDoCarrinho = removerDoCarrinho;