// Configuração da API
const API_BASE_URL = 'http://localhost:3001/api';

// Elementos do DOM
const carrinhoVazio = document.getElementById('carrinhoVazio');
const carrinhoConteudo = document.getElementById('carrinhoConteudo');
const itensCarrinho = document.getElementById('itensCarrinho');
const subtotalElement = document.getElementById('subtotal');
const totalElement = document.getElementById('total');
const messageContainer = document.getElementById('messageContainer');
const btnLimparCarrinho = document.getElementById('btnLimparCarrinho');
const btnCriarPedido = document.getElementById('btnCriarPedido');

// Inputs do formulário
const cpfInput = document.getElementById('cpf');
const formaPagamentoSelect = document.getElementById('formaPagamento');
const observacoesInput = document.getElementById('observacoes');

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
    carregarCarrinho();
    carregarFormasPagamento();
    atualizarInterface();
    configurarEventListeners();
});

// Event Listeners
function configurarEventListeners() {
    btnLimparCarrinho.addEventListener('click', limparCarrinho);
    btnCriarPedido.addEventListener('click', abrirModalConfirmacaoPedido);
    btnCancelarModalPedido.addEventListener('click', () => fecharModal('modalConfirmacaoPedido'));
    btnConfirmarPedido.addEventListener('click', criarPedido);
    btnCancelarPagamento.addEventListener('click', () => fecharModal('modalPagamento'));
    btnFinalizarPagamento.addEventListener('click', finalizarPagamento);
    btnVoltarCardapio.addEventListener('click', () => window.location.href = '../cardapio/cardapio.html');
    
    // Máscara para CPF
    cpfInput.addEventListener('input', aplicarMascaraCPF);
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
    messageContainer.innerHTML = `<div class="message ${tipo}">${texto}</div>`;
    setTimeout(() => {
        messageContainer.innerHTML = '';
    }, 4000);
}

// Função para carregar formas de pagamento do banco
async function carregarFormasPagamento() {
    try {
        const response = await fetch(`${API_BASE_URL}/formas-pagamento`);
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
    const carrinhoSalvo = localStorage.getItem('carrinho');
    if (carrinhoSalvo) {
        try {
            carrinho = JSON.parse(carrinhoSalvo);
        } catch (error) {
            console.error('Erro ao carregar carrinho:', error);
            carrinho = [];
        }
    }
}

// Função para salvar carrinho no localStorage
function salvarCarrinho() {
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
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
    const index = carrinho.findIndex(item => item.id_produto === idProduto);
    if (index !== -1) {
        const nomeItem = carrinho[index].nome_produto;
        carrinho.splice(index, 1);
        salvarCarrinho();
        atualizarInterface();
        mostrarMensagem(`${nomeItem} removido do carrinho!`, 'info');
    }
}

// Função para atualizar quantidade de um item
function atualizarQuantidade(idProduto, novaQuantidade) {
    const item = carrinho.find(item => item.id_produto === idProduto);
    if (item) {
        if (novaQuantidade <= 0) {
            removerDoCarrinho(idProduto);
        } else {
            item.quantidade = novaQuantidade;
            salvarCarrinho();
            atualizarInterface();
        }
    }
}

// Função para limpar carrinho
function limparCarrinho() {
    if (carrinho.length === 0) {
        mostrarMensagem('O carrinho já está vazio!', 'info');
        return;
    }
    
    if (confirm('Tem certeza que deseja limpar todo o carrinho?')) {
        carrinho = [];
        salvarCarrinho();
        atualizarInterface();
        mostrarMensagem('Carrinho limpo com sucesso!', 'success');
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
    itensCarrinho.innerHTML = '';
    
    carrinho.forEach(item => {
        const itemElement = criarElementoItem(item);
        itensCarrinho.appendChild(itemElement);
    });
}

// Função para criar elemento de item
function criarElementoItem(item) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'item-carrinho';
    
    const imagemHtml = item.imagem_path 
        ? `<img src="${item.imagem_path}" alt="${item.nome_produto}">`
        : '<div style="color: #6c757d; font-size: 12px;">Sem imagem</div>';
    
    itemDiv.innerHTML = `
        <div class="item-imagem">
            ${imagemHtml}
        </div>
        <div class="item-info">
            <h4>${item.nome_produto}</h4>
            <p>${item.nome_categoria || 'Sem categoria'}</p>
        </div>
        <div class="item-preco">
            R$ ${Number(item.preco).toFixed(2)}
        </div>
        <div class="quantidade-controles">
            <button class="btn-quantidade" onclick="atualizarQuantidade(${item.id_produto}, ${item.quantidade - 1})">-</button>
            <input type="number" class="quantidade-input" value="${item.quantidade}" 
                   onchange="atualizarQuantidade(${item.id_produto}, parseInt(this.value) || 0)" min="0">
            <button class="btn-quantidade" onclick="atualizarQuantidade(${item.id_produto}, ${item.quantidade + 1})">+</button>
        </div>
        <button class="btn-remover" onclick="removerDoCarrinho(${item.id_produto})" title="Remover item">
            🗑️
        </button>
    `;
    
    return itemDiv;
}

// Função para atualizar resumo
function atualizarResumo() {
    const subtotal = calcularSubtotal();
    const total = calcularTotal();
    
    subtotalElement.textContent = `R$ ${subtotal.toFixed(2)}`;
    totalElement.textContent = `R$ ${total.toFixed(2)}`;
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

// Função para abrir modal de confirmação do pedido
function abrirModalConfirmacaoPedido() {
    if (carrinho.length === 0) {
        mostrarMensagem('Adicione itens ao carrinho antes de criar o pedido!', 'warning');
        return;
    }
    
    const cpf = cpfInput.value.trim();
    if (!cpf) {
        mostrarMensagem('Por favor, informe o CPF do cliente!', 'warning');
        cpfInput.focus();
        return;
    }
    
    if (!validarCPF(cpf)) {
        mostrarMensagem('CPF inválido!', 'warning');
        cpfInput.focus();
        return;
    }
    
    const formaPagamentoId = formaPagamentoSelect.value;
    if (!formaPagamentoId) {
        mostrarMensagem('Por favor, selecione uma forma de pagamento!', 'warning');
        formaPagamentoSelect.focus();
        return;
    }
    
    const formaPagamentoNome = formasPagamento.find(f => f.id_forma_pagamento == formaPagamentoId)?.nome_forma || '';
    const total = calcularTotal();
    
    modalCpf.textContent = cpf;
    modalTotal.textContent = `R$ ${total.toFixed(2)}`;
    modalFormaPagamento.textContent = formaPagamentoNome;
    modalConfirmacaoPedido.style.display = 'flex';
}

// Função para fechar modal
function fecharModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// ======= AJUSTE AQUI: criarPedido sem enviar itens ainda =======
async function criarPedido() {
    try {
        const cpf = cpfInput.value.replace(/\D/g, '');
        const observacoes = observacoesInput.value.trim();
        const formaPagamentoId = formaPagamentoSelect.value;

        const dadosPedido = {
            cpf: cpf,
            observacoes: observacoes,
            valor_total: calcularTotal()
        };

        const response = await fetch(`${API_BASE_URL}/pedidos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosPedido)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao criar pedido');
        }

        const resultado = await response.json();
        pedidoAtual = resultado; // guarda o pedido criado

        // Fechar modal de confirmação
        fecharModal('modalConfirmacaoPedido');

        // Abrir modal de pagamento
        const formaPagamentoNome = formasPagamento.find(f => f.id_forma_pagamento == formaPagamentoId)?.nome_forma || '';
        numeroPedido.textContent = resultado.id_pedido;
        totalPagar.textContent = `R$ ${calcularTotal().toFixed(2)}`;
        formaPagamentoEscolhida.textContent = formaPagamentoNome;
        modalPagamento.style.display = 'flex';

        mostrarMensagem('Pedido criado com sucesso! Agora finalize o pagamento.', 'success');

    } catch (error) {
        console.error('Erro ao criar pedido:', error);
        mostrarMensagem(error.message || 'Erro ao criar pedido. Tente novamente.', 'error');
    }
}

// ======= AJUSTE AQUI: finalizarPagamento envia itens e pagamento =======
async function finalizarPagamento() {
    try {
        if (!pedidoAtual) throw new Error('Nenhum pedido encontrado');

        const formaPagamentoId = formaPagamentoSelect.value;

        // 1️⃣ Enviar pedidoproduto
        const itensPedido = carrinho.map(item => ({
            id_pedido: pedidoAtual.id_pedido,
            id_produto: item.id_produto,
            quantidade: item.quantidade,
            preco_unitario: item.preco
        }));

        const responseItens = await fetch(`${API_BASE_URL}/pedidoproduto`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(itensPedido)
        });

        if (!responseItens.ok) {
            const errorData = await responseItens.json();
            throw new Error(errorData.message || 'Erro ao enviar itens do pedido');
        }

        // 2️⃣ Enviar pagamento
        const dadosPagamento = {
            id_pedido: pedidoAtual.id_pedido,
            id_forma_pagamento: formaPagamentoId,
            valor_total: calcularTotal()
        };

        const responsePagamento = await fetch(`${API_BASE_URL}/pagamentos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosPagamento)
        });

        if (!responsePagamento.ok) {
            const errorData = await responsePagamento.json();
            throw new Error(errorData.message || 'Erro ao processar pagamento');
        }

        // 3️⃣ Limpar carrinho
        carrinho = [];
        salvarCarrinho();

        // Limpar formulário
        cpfInput.value = '';
        observacoesInput.value = '';
        formaPagamentoSelect.selectedIndex = 0;

        // Fechar modal de pagamento
        fecharModal('modalPagamento');

        // Mostrar modal de sucesso
        pedidoFinalizado.textContent = pedidoAtual.id_pedido;
        modalSucesso.style.display = 'flex';

        // Atualizar interface
        atualizarInterface();
        mostrarMensagem('Pagamento processado com sucesso!', 'success');

        // Resetar pedidoAtual
        pedidoAtual = null;

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
