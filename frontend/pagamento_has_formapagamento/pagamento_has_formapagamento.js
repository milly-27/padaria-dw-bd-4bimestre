// Configuração da API, IP e porta.
const API_BASE_URL = 'http://localhost:3001';
let currentPersonId = null;
let operacao = null;

// Elementos do DOM
const form = document.getElementById('pagamento_has_formapagamentoForm');
const searchId = document.getElementById('searchId');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnCancelar = document.getElementById('btnCancelar');
const btnSalvar = document.getElementById('btnSalvar');
const pagamento_has_formapagamentosTableBody = document.getElementById('pagamento_has_formapagamentosTableBody');
const messageContainer = document.getElementById('messageContainer');

// Carregar lista de pagamento_has_formapagamentos ao inicializar
document.addEventListener('DOMContentLoaded', () => {
    carregarPagamento_has_formapagamentos();
});

// Event Listeners
btnBuscar.addEventListener('click', buscarPagamento_has_formapagamento);
btnIncluir.addEventListener('click', incluirPagamento_has_formapagamento);
btnAlterar.addEventListener('click', alterarPagamento_has_formapagamento);
btnExcluir.addEventListener('click', excluirPagamento_has_formapagamento);
btnCancelar.addEventListener('click', cancelarOperacao);
btnSalvar.addEventListener('click', salvarOperacao);

mostrarBotoes(true, false, false, false, false, false);// mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
bloquearCampos(false);//libera pk e bloqueia os demais campos

// Função para mostrar mensagens
function mostrarMensagem(texto, tipo = 'info') {
    messageContainer.innerHTML = `<div class="message ${tipo}">${texto}</div>`;
    setTimeout(() => {
        messageContainer.innerHTML = '';
    }, 3000);
}

function bloquearCampos(bloquearPrimeiro) {
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach((input, index) => {
        if (index === 0) {
            input.disabled = bloquearPrimeiro;
        } else {
            input.disabled = !bloquearPrimeiro;
        }
    });
}

// Função para limpar formulário
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

// Função para buscar pagamento_has_formapagamento por ID
async function buscarPagamento_has_formapagamento() {
    const id = searchId.value.trim();
    if (!id) {
        mostrarMensagem('Digite um ID para buscar', 'warning');
        return;
    }
    bloquearCampos(false);
    searchId.focus();
    try {
        const response = await fetch(`${API_BASE_URL}/pagamento_has_formapagamentos/${id}`);

        if (response.ok) {
            const pagamento_has_formapagamento = await response.json();
            preencherFormulario(pagamento_has_formapagamento);

            mostrarBotoes(true, false, true, true, false, false);
            mostrarMensagem('Pagamento_has_formapagamento encontrado!', 'success');

        } else if (response.status === 404) {
            limparFormulario();
            searchId.value = id;
            mostrarBotoes(true, true, false, false, false, false);
            mostrarMensagem('Pagamento_has_formapagamento não encontrado. Você pode incluir um novo pagamento_has_formapagamento.', 'info');
            bloquearCampos(false);
        } else {
            throw new Error('Erro ao buscar pagamento_has_formapagamento');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao buscar pagamento_has_formapagamento', 'error');
    }
}

// Função para preencher formulário com dados da pagamento_has_formapagamento
function preencherFormulario(pagamento_has_formapagamento) {
    currentPersonId = pagamento_has_formapagamento.id_pagamento_res;
    searchId.value = pagamento_has_formapagamento.id_pagamento_res;
    document.getElementById('id_pagamento').value = pagamento_has_formapagamento.id_pagamento || '';
    document.getElementById('id_forma_pagamento').value = pagamento_has_formapagamento.id_forma_pagamento || '';
    document.getElementById('valor_pago').value = pagamento_has_formapagamento.valor_pago || '';
}

// Função para incluir pagamento_has_formapagamento
async function incluirPagamento_has_formapagamento() {
    mostrarMensagem('Digite os dados!', 'success');
    currentPersonId = searchId.value;
    limparFormulario();
    searchId.value = currentPersonId;
    bloquearCampos(true);

    mostrarBotoes(false, false, false, false, true, true);
    document.getElementById('id_pagamento').focus();
    operacao = 'incluir';
}

// Função para alterar pagamento_has_formapagamento
async function alterarPagamento_has_formapagamento() {
    mostrarMensagem('Digite os dados!', 'success');
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);
    document.getElementById('id_pagamento').focus();
    operacao = 'alterar';
}

// Função para excluir pagamento_has_formapagamento
async function excluirPagamento_has_formapagamento() {
    mostrarMensagem('Excluindo pagamento_has_formapagamento...', 'info');
    currentPersonId = searchId.value;
    searchId.disabled = true;
    bloquearCampos(false);
    mostrarBotoes(false, false, false, false, true, true);
    operacao = 'excluir';
}

async function salvarOperacao() {
    console.log('Operação:', operacao + ' - currentPersonId: ' + currentPersonId + ' - searchId: ' + searchId.value);

    const formData = new FormData(form);
    const pagamento_has_formapagamento = {
        id_pagamento_res: searchId.value,
        id_pagamento: formData.get('id_pagamento'),
        id_forma_pagamento: formData.get('id_forma_pagamento'),
        valor_pago: formData.get('valor_pago')
    };
    let response = null;
    try {
        if (operacao === 'incluir') {
            response = await fetch(`${API_BASE_URL}/pagamento_has_formapagamentos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(pagamento_has_formapagamento)
            });
        } else if (operacao === 'alterar') {
            response = await fetch(`${API_BASE_URL}/pagamento_has_formapagamentos/${currentPersonId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(pagamento_has_formapagamento)
            });
        } else if (operacao === 'excluir') {
            response = await fetch(`${API_BASE_URL}/pagamento_has_formapagamentos/${currentPersonId}`, {
                method: 'DELETE'
            });
            console.log('Pagamento_has_formapagamento excluído' + response.status);
        }
        if (response.ok && (operacao === 'incluir' || operacao === 'alterar')) {
            const novaPagamento_has_formapagamento = await response.json();
            mostrarMensagem('Operação ' + operacao + ' realizada com sucesso!', 'success');
            limparFormulario();
            carregarPagamento_has_formapagamentos();

        } else if (operacao !== 'excluir') {
            const error = await response.json();
            mostrarMensagem(error.error || 'Erro ao incluir pagamento_has_formapagamento', 'error');
        } else {
            mostrarMensagem('Pagamento_has_formapagamento excluído com sucesso!', 'success');
            limparFormulario();
            carregarPagamento_has_formapagamentos();
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao incluir ou alterar o pagamento_has_formapagamento', 'error');
    }

    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false);
    document.getElementById('searchId').focus();
}

// Função para cancelar operação
function cancelarOperacao() {
    limparFormulario();
    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false);
    document.getElementById('searchId').focus();
    mostrarMensagem('Operação cancelada', 'info');
}

// Função para carregar lista de pagamento_has_formapagamentos
async function carregarPagamento_has_formapagamentos() {
    try {
        const response = await fetch(`${API_BASE_URL}/pagamento_has_formapagamentos`);
        if (response.ok) {
            const pagamento_has_formapagamentos = await response.json();
            renderizarTabelaPagamento_has_formapagamentos(pagamento_has_formapagamentos);
        } else {
            throw new Error('Erro ao carregar pagamento_has_formapagamentos');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao carregar lista de pagamento_has_formapagamentos', 'error');
    }
}

// Função para renderizar tabela de pagamento_has_formapagamentos
function renderizarTabelaPagamento_has_formapagamentos(pagamento_has_formapagamentos) {
    pagamento_has_formapagamentosTableBody.innerHTML = '';

    pagamento_has_formapagamentos.forEach(pagamento_has_formapagamento => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <button class="btn-id" onclick="selecionarPagamento_has_formapagamento(${pagamento_has_formapagamento.id_pagamento_res})">
                    ${pagamento_has_formapagamento.id_pagamento_res}
                </button>
            </td>
            <td>${pagamento_has_formapagamento.id_pagamento}</td>
            <td>${pagamento_has_formapagamento.id_forma_pagamento}</td>
            <td>${pagamento_has_formapagamento.valor_pago}</td>
        `;
        pagamento_has_formapagamentosTableBody.appendChild(row);
    });
}

// Função para selecionar pagamento_has_formapagamento da tabela
async function selecionarPagamento_has_formapagamento(id) {
    searchId.value = id;
    await buscarPagamento_has_formapagamento();
}
