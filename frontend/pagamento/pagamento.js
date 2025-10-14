// Configuração da API, IP e porta.
const API_BASE_URL = 'http://localhost:3001';
let currentPagamentoId = null;
let operacao = null;

// Elementos do DOM
const form = document.getElementById('pagamentoForm');
const searchId = document.getElementById('searchId');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnCancelar = document.getElementById('btnCancelar');
const btnSalvar = document.getElementById('btnSalvar');
const pagamentosTableBody = document.getElementById('pagamentosTableBody');
const messageContainer = document.getElementById('messageContainer');

// Carregar lista de pagamentos ao inicializar
document.addEventListener('DOMContentLoaded', () => {
    carregarPagamentos();
});

// Event Listeners
btnBuscar.addEventListener('click', buscarPagamento);
btnIncluir.addEventListener('click', incluirPagamento);
btnAlterar.addEventListener('click', alterarPagamento);
btnExcluir.addEventListener('click', excluirPagamento);
btnCancelar.addEventListener('click', cancelarOperacao);
btnSalvar.addEventListener('click', salvarOperacao);

// Inicializa botões e campos
mostrarBotoes(true, false, false, false, false, false);
bloquearCampos(false);

// Função para mostrar mensagens
function mostrarMensagem(texto, tipo = 'info') {
    messageContainer.innerHTML = `<div class="message ${tipo}">${texto}</div>`;
    setTimeout(() => {
        messageContainer.innerHTML = '';
    }, 3000);
}

function bloquearCampos(bloquearPrimeiro) {
    const inputs = form.querySelectorAll('input');
    inputs.forEach((input, index) => {
        if (index === 0) {
            input.disabled = bloquearPrimeiro; // ID bloqueia/libera conforme parâmetro
        } else {
            input.disabled = !bloquearPrimeiro; // outros fazem o oposto
        }
    });
}

function limparFormulario() {
    form.reset();
}

function mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar) {
    btnBuscar.style.display = btBuscar ? 'inline-block' : 'none';
    btnIncluir.style.display = btIncluir ? 'inline-block' : 'none';
    btnAlterar.style.display = btAlterar ? 'inline-block' : 'none';
    btnExcluir.style.display = btExcluir ? 'inline-block' : 'none';
    btnSalvar.style.display = btSalvar ? 'inline-block' : 'none';
    btnCancelar.style.display = btCancelar ? 'inline-block' : 'none';
}

// Buscar pagamento por ID
async function buscarPagamento() {
    const id = searchId.value.trim();
    if (!id) {
        mostrarMensagem('Digite um ID para buscar', 'warning');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/pagamento/${id}`);
        if (response.ok) {
            const pagamento = await response.json();
            preencherFormulario(pagamento);
            mostrarBotoes(true, false, true, true, false, false);
            mostrarMensagem('Pagamento encontrado!', 'success');
        } else if (response.status === 404) {
            limparFormulario();
            searchId.value = id;
            mostrarBotoes(true, true, false, false, false, false);
            mostrarMensagem('Pagamento não encontrado. Você pode incluir um novo.', 'info');
            bloquearCampos(true);
            document.getElementById('id_pedido').focus();
        } else {
            throw new Error('Erro ao buscar pagamento');
        }
    } catch (error) {
        console.error(error);
        mostrarMensagem('Erro ao buscar pagamento', 'error');
    }
}

// Preencher formulário com dados do pagamento
function preencherFormulario(pagamento) {
    currentPagamentoId = pagamento.id_pagamento;
    searchId.value = pagamento.id_pagamento;
    document.getElementById('id_pedido').value = pagamento.id_pedido || '';
    document.getElementById('data_pagamento').value = pagamento.data_pagamento ? pagamento.data_pagamento.split('T')[0] : '';
    document.getElementById('valor_total').value = pagamento.valor_total || '';
}

// Incluir novo pagamento
function incluirPagamento() {
    mostrarMensagem('Digite os dados do novo pagamento', 'info');
    currentPagamentoId = null;
    limparFormulario();
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);
    document.getElementById('id_pedido').focus();
    operacao = 'incluir';
}

// Alterar pagamento existente
function alterarPagamento() {
    mostrarMensagem('Altere os dados do pagamento', 'info');
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);
    document.getElementById('id_pedido').focus();
    operacao = 'alterar';
}

// Excluir pagamento
function excluirPagamento() {
    mostrarMensagem('Excluindo pagamento...', 'warning');
    currentPagamentoId = searchId.value;
    searchId.disabled = true;
    bloquearCampos(false);
    mostrarBotoes(false, false, false, false, true, true);
    operacao = 'excluir';
}

// Salvar operação (incluir, alterar ou excluir)
async function salvarOperacao() {
    const formData = new FormData(form);
    const pagamento = {
        id_pedido: formData.get('id_pedido'),
        data_pagamento: formData.get('data_pagamento'),
        valor_total: formData.get('valor_total')
    };
    let response = null;

    try {
        if (operacao === 'incluir') {
            response = await fetch(`${API_BASE_URL}/pagamento`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pagamento)
            });
        } else if (operacao === 'alterar') {
            response = await fetch(`${API_BASE_URL}/pagamento/${currentPagamentoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pagamento)
            });
        } else if (operacao === 'excluir') {
            response = await fetch(`${API_BASE_URL}/pagamento/${currentPagamentoId}`, {
                method: 'DELETE'
            });
        }

        if (response.ok) {
            mostrarMensagem(`Operação ${operacao} realizada com sucesso!`, 'success');
            limparFormulario();
            carregarPagamentos();
        } else {
            const error = await response.json();
            mostrarMensagem(error.error || `Erro ao ${operacao} pagamento`, 'error');
        }
    } catch (error) {
        console.error(error);
        mostrarMensagem('Erro na operação', 'error');
    }

    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false);
    searchId.disabled = false;
    searchId.focus();
}

// Cancelar operação
function cancelarOperacao() {
    limparFormulario();
    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false);
    searchId.disabled = false;
    searchId.focus();
    mostrarMensagem('Operação cancelada', 'info');
}

// Carregar lista de pagamentos
async function carregarPagamentos() {
    try {
        const response = await fetch(`${API_BASE_URL}/pagamento`);
        if (response.ok) {
            const pagamentos = await response.json();
            renderizarTabelaPagamentos(pagamentos);
        } else {
            throw new Error('Erro ao carregar pagamentos');
        }
    } catch (error) {
        console.error(error);
        mostrarMensagem('Erro ao carregar lista de pagamentos', 'error');
    }
}

// Renderizar tabela de pagamentos
function renderizarTabelaPagamentos(pagamentos) {
    pagamentosTableBody.innerHTML = '';
    pagamentos.forEach(pagamento => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><button class="btn-id" onclick="selecionarPagamento(${pagamento.id_pagamento})">${pagamento.id_pagamento}</button></td>
            <td>${pagamento.id_pedido}</td>
            <td>${pagamento.data_pagamento ? pagamento.data_pagamento.split('T')[0] : ''}</td>
            <td>${pagamento.valor_total}</td>
        `;
        pagamentosTableBody.appendChild(row);
    });
}

// Selecionar pagamento da tabela
async function selecionarPagamento(id) {
    searchId.value = id;
    await buscarPagamento();
}
