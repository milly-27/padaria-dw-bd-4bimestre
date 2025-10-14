
// Configuração da API, IP e porta.
const API_BASE_URL = 'http://localhost:3001';
let currentPersonId = null;
let operacao = null;

// Elementos do DOM
const form = document.getElementById('forma_pagamentoForm');
const searchId = document.getElementById('searchId');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnCancelar = document.getElementById('btnCancelar');
const btnSalvar = document.getElementById('btnSalvar');
const forma_pagamentosTableBody = document.getElementById('forma_pagamentosTableBody');
const messageContainer = document.getElementById('messageContainer');

// Carregar lista de forma_pagamentos ao inicializar
document.addEventListener('DOMContentLoaded', () => {
    carregarForma_pagamentos();
});

// Event Listeners
btnBuscar.addEventListener('click', buscarForma_pagamento);
btnIncluir.addEventListener('click', incluirForma_pagamento);
btnAlterar.addEventListener('click', alterarForma_pagamento);
btnExcluir.addEventListener('click', excluirForma_pagamento);
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
            // Primeiro elemento - bloqueia se bloquearPrimeiro for true, libera se for false
            input.disabled = bloquearPrimeiro;
        } else {
            // Demais elementos - faz o oposto do primeiro
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

// Função para formatar data para exibição
function formatarData(dataString) {
    if (!dataString) return '';
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
}

// Função para converter data para formato ISO
function converterDataParaISO(dataString) {
    if (!dataString) return null;
    return new Date(dataString).toISOString();
}

// Função para buscar forma_pagamento por ID
async function buscarForma_pagamento() {
    const id = searchId.value.trim();
    if (!id) {
        mostrarMensagem('Digite um ID para buscar', 'warning');
        return;
    }
    bloquearCampos(false);
    //focus no campo searchId
    searchId.focus();
    try {
        const response = await fetch(`${API_BASE_URL}/forma_pagamentos/${id}`);

        if (response.ok) {
            const forma_pagamento = await response.json();
            preencherFormulario(forma_pagamento);

            mostrarBotoes(true, false, true, true, false, false);// mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
            mostrarMensagem('Forma_pagamento encontrado!', 'success');

        } else if (response.status === 404) {
            limparFormulario();
            searchId.value = id;
            mostrarBotoes(true, true, false, false, false, false); //mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
            mostrarMensagem('Forma_pagamento não encontrado. Você pode incluir um novo forma_pagamento.', 'info');
            bloquearCampos(false);//bloqueia a pk e libera os demais campos
            //enviar o foco para o campo de nome
        } else {
            throw new Error('Erro ao buscar forma_pagamento');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao buscar forma_pagamento', 'error');
    }
}

// Função para preencher formulário com dados da forma_pagamento
function preencherFormulario(forma_pagamento) {
    currentPersonId = forma_pagamento.id_forma_pagamento;
    searchId.value = forma_pagamento.id_forma_pagamento;
    document.getElementById('nome_forma').value = forma_pagamento.nome_forma || '';
    }


// Função para incluir forma_pagamento
async function incluirForma_pagamento() {

    mostrarMensagem('Digite os dados!', 'success');
    currentPersonId = searchId.value;
    // console.log('Incluir nova forma_pagamento - currentPersonId: ' + currentPersonId);
    limparFormulario();
    searchId.value = currentPersonId;
    bloquearCampos(true);

    mostrarBotoes(false, false, false, false, true, true); // mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
    document.getElementById('nome_forma').focus();
    operacao = 'incluir';
    // console.log('fim nova forma_pagamento - currentPersonId: ' + currentPersonId);
}

// Função para alterar forma_pagamento
async function alterarForma_pagamento() {
    mostrarMensagem('Digite os dados!', 'success');
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);// mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
    document.getElementById('nome_forma').focus();
    operacao = 'alterar';
}

// Função para excluir forma_pagamento
async function excluirForma_pagamento() {
    mostrarMensagem('Excluindo forma_pagamento...', 'info');
    currentPersonId = searchId.value;
    //bloquear searchId
    searchId.disabled = true;
    bloquearCampos(false); // libera os demais campos
    mostrarBotoes(false, false, false, false, true, true);// mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)           
    operacao = 'excluir';
}

async function salvarOperacao() {
    console.log('Operação:', operacao + ' - currentPersonId: ' + currentPersonId + ' - searchId: ' + searchId.value);

    const formData = new FormData(form);
    const forma_pagamento = {
        id_forma_pagamento: searchId.value,
        nome_forma: formData.get('nome_forma')      
    };
    let response = null;
    try {
        if (operacao === 'incluir') {
            response = await fetch(`${API_BASE_URL}/forma_pagamentos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(forma_pagamento)
            });
        } else if (operacao === 'alterar') {
            response = await fetch(`${API_BASE_URL}/forma_pagamentos/${currentPersonId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(forma_pagamento)
            });
        } else if (operacao === 'excluir') {
            // console.log('Excluindo forma_pagamento com ID:', currentPersonId);
            response = await fetch(`${API_BASE_URL}/forma_pagamentos/${currentPersonId}`, {
                method: 'DELETE'
            });
            console.log('Forma_pagamento excluído' + response.status);
        }
        if (response.ok && (operacao === 'incluir' || operacao === 'alterar')) {
            const novaForma_pagamento = await response.json();
            mostrarMensagem('Operação ' + operacao + ' realizada com sucesso!', 'success');
            limparFormulario();
            carregarForma_pagamentos();

        } else if (operacao !== 'excluir') {
            const error = await response.json();
            mostrarMensagem(error.error || 'Erro ao incluir forma_pagamento', 'error');
        } else {
            mostrarMensagem('Forma_pagamento excluída com sucesso!', 'success');
            limparFormulario();
            carregarForma_pagamentos();
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao incluir ou alterar a forma_pagamento', 'error');
    }

    mostrarBotoes(true, false, false, false, false, false);// mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
    bloquearCampos(false);//libera pk e bloqueia os demais campos
    document.getElementById('searchId').focus();
}

// Função para cancelar operação
function cancelarOperacao() {
    limparFormulario();
    mostrarBotoes(true, false, false, false, false, false);// mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
    bloquearCampos(false);//libera pk e bloqueia os demais campos
    document.getElementById('searchId').focus();
    mostrarMensagem('Operação cancelada', 'info');
}

// Função para carregar lista de forma_pagamentos
async function carregarForma_pagamentos() {
    try {
        const response = await fetch(`${API_BASE_URL}/forma_pagamentos`);
    //    debugger
        if (response.ok) {
            const forma_pagamentos = await response.json();
            renderizarTabelaForma_pagamentos(forma_pagamentos);
        } else {
            throw new Error('Erro ao carregar forma_pagamentos');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao carregar lista de forma_pagamentos', 'error');
    }
}

// Função para renderizar tabela de forma_pagamentos
function renderizarTabelaForma_pagamentos(forma_pagamentos) {
    forma_pagamentosTableBody.innerHTML = '';

    forma_pagamentos.forEach(forma_pagamento => {
        const row = document.createElement('tr');
        row.innerHTML = `
                    <td>
                        <button class="btn-id" onclick="selecionarForma_pagamento(${forma_pagamento.id_forma_pagamento})">
                            ${forma_pagamento.id_forma_pagamento}
                        </button>
                    </td>
                    <td>${forma_pagamento.nome_forma}</td>
                                 
                `;
        forma_pagamentosTableBody.appendChild(row);
    });
}

// Função para selecionar forma_pagamento da tabela
async function selecionarForma_pagamento(id) {
    searchId.value = id;
    await buscarForma_pagamento();
}
