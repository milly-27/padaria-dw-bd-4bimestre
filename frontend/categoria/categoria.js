
// Configuração da API, IP e porta.
const API_BASE_URL = 'http://localhost:3001';
let currentPersonId = null;
let operacao = null;

// Elementos do DOM
const form = document.getElementById('categoriaForm');
const searchId = document.getElementById('searchId');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnCancelar = document.getElementById('btnCancelar');
const btnSalvar = document.getElementById('btnSalvar');
const categoriasTableBody = document.getElementById('categoriasTableBody');
const messageContainer = document.getElementById('messageContainer');

// Carregar lista de categorias ao inicializar
document.addEventListener('DOMContentLoaded', () => {
    carregarCategorias();
});

// Event Listeners
btnBuscar.addEventListener('click', buscarCategoria);
btnIncluir.addEventListener('click', incluirCategoria);
btnAlterar.addEventListener('click', alterarCategoria);
btnExcluir.addEventListener('click', excluirCategoria);
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

// Função para buscar categoria por ID
async function buscarCategoria() {
    const id = searchId.value.trim();
    if (!id) {
        mostrarMensagem('Digite um ID para buscar', 'warning');
        return;
    }
    bloquearCampos(false);
    //focus no campo searchId
    searchId.focus();
    try {
        const response = await fetch(`${API_BASE_URL}/categorias/${id}`);

        if (response.ok) {
            const categoria = await response.json();
            preencherFormulario(categoria);

            mostrarBotoes(true, false, true, true, false, false);// mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
            mostrarMensagem('Categoria encontrado!', 'success');

        } else if (response.status === 404) {
            limparFormulario();
            searchId.value = id;
            mostrarBotoes(true, true, false, false, false, false); //mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
            mostrarMensagem('Categoria não encontrado. Você pode incluir um novo categoria.', 'info');
            bloquearCampos(false);//bloqueia a pk e libera os demais campos
            //enviar o foco para o campo de nome
        } else {
            throw new Error('Erro ao buscar categoria');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao buscar categoria', 'error');
    }
}

// Função para preencher formulário com dados da categoria
function preencherFormulario(categoria) {
    currentPersonId = categoria.id_categoria;
    searchId.value = categoria.id_categoria;
    document.getElementById('nome_categoria').value = categoria.nome_categoria || '';
    }


// Função para incluir categoria
async function incluirCategoria() {

    mostrarMensagem('Digite os dados!', 'success');
    currentPersonId = searchId.value;
    // console.log('Incluir nova categoria - currentPersonId: ' + currentPersonId);
    limparFormulario();
    searchId.value = currentPersonId;
    bloquearCampos(true);

    mostrarBotoes(false, false, false, false, true, true); // mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
    document.getElementById('nome_categoria').focus();
    operacao = 'incluir';
    // console.log('fim nova categoria - currentPersonId: ' + currentPersonId);
}

// Função para alterar categoria
async function alterarCategoria() {
    mostrarMensagem('Digite os dados!', 'success');
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);// mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
    document.getElementById('nome_categoria').focus();
    operacao = 'alterar';
}

// Função para excluir categoria
async function excluirCategoria() {
    mostrarMensagem('Excluindo categoria...', 'info');
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
    const categoria = {
        id_categoria: searchId.value,
        nome_categoria: formData.get('nome_categoria')      
    };
    let response = null;
    try {
        if (operacao === 'incluir') {
            response = await fetch(`${API_BASE_URL}/categorias`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(categoria)
            });
        } else if (operacao === 'alterar') {
            response = await fetch(`${API_BASE_URL}/categorias/${currentPersonId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(categoria)
            });
        } else if (operacao === 'excluir') {
            // console.log('Excluindo categoria com ID:', currentPersonId);
            response = await fetch(`${API_BASE_URL}/categorias/${currentPersonId}`, {
                method: 'DELETE'
            });
            console.log('Categoria excluído' + response.status);
        }
        if (response.ok && (operacao === 'incluir' || operacao === 'alterar')) {
            const novaCategoria = await response.json();
            mostrarMensagem('Operação ' + operacao + ' realizada com sucesso!', 'success');
            limparFormulario();
            carregarCategorias();

        } else if (operacao !== 'excluir') {
            const error = await response.json();
            mostrarMensagem(error.error || 'Erro ao incluir categoria', 'error');
        } else {
            mostrarMensagem('Categoria excluída com sucesso!', 'success');
            limparFormulario();
            carregarCategorias();
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao incluir ou alterar a categoria', 'error');
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

// Função para carregar lista de categorias
async function carregarCategorias() {
    try {
        const response = await fetch(`${API_BASE_URL}/categorias`);
    //    debugger
        if (response.ok) {
            const categorias = await response.json();
            renderizarTabelaCategorias(categorias);
        } else {
            throw new Error('Erro ao carregar categorias');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao carregar lista de categorias', 'error');
    }
}

// Função para renderizar tabela de categorias
function renderizarTabelaCategorias(categorias) {
    categoriasTableBody.innerHTML = '';

    categorias.forEach(categoria => {
        const row = document.createElement('tr');
        row.innerHTML = `
                    <td>
                        <button class="btn-id" onclick="selecionarCategoria(${categoria.id_categoria})">
                            ${categoria.id_categoria}
                        </button>
                    </td>
                    <td>${categoria.nome_categoria}</td>
                                 
                `;
        categoriasTableBody.appendChild(row);
    });
}

// Função para selecionar categoria da tabela
async function selecionarCategoria(id) {
    searchId.value = id;
    await buscarCategoria();
}
