// Configuração da API, IP e porta.
const API_BASE_URL = 'http://localhost:3001';
let currentPersonId = null;
let operacao = null;

// Elementos do DOM
const form = document.getElementById('pedidoForm');
const searchId = document.getElementById('searchId');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnCancelar = document.getElementById('btnCancelar');
const btnSalvar = document.getElementById('btnSalvar');
const pedidosTableBody = document.getElementById('pedidosTableBody');
const messageContainer = document.getElementById('messageContainer');

// Carregar lista de pedidos ao inicializar
document.addEventListener('DOMContentLoaded', () => {
    // carregarPedidos();
});

// Event Listeners
btnBuscar.addEventListener('click', buscarPedido);
btnIncluir.addEventListener('click', incluirPedido);
btnAlterar.addEventListener('click', alterarPedido);
btnExcluir.addEventListener('click', excluirPedido);
btnCancelar.addEventListener('click', cancelarOperacao);
btnSalvar.addEventListener('click', salvarOperacao);

mostrarBotoes(true, false, false, false, false, false);
bloquearCampos(false); // Inicia com searchId liberado e demais campos bloqueados

// Função para mostrar mensagens
function mostrarMensagem(texto, tipo = 'info') {
    messageContainer.innerHTML = `<div class="message ${tipo}">${texto}</div>`;
    setTimeout(() => {
        messageContainer.innerHTML = '';
    }, 3000);
}

// FUNÇÃO CORRIGIDA - Agora separa searchId dos campos editáveis
function bloquearCampos(liberarCamposEdicao) {
    // searchId sempre fica no estado oposto dos campos de edição
    document.getElementById("searchId").disabled = liberarCamposEdicao;
    
    // Campos de edição seguem o parâmetro
    document.getElementById("data_pedido").disabled = !liberarCamposEdicao;
    document.getElementById("cpf").disabled = !liberarCamposEdicao;
    document.getElementById("valor_total").disabled = !liberarCamposEdicao;
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

// Função para buscar pedido por ID
async function buscarPedido() {
    const id = searchId.value.trim();
    if (!id) {
        mostrarMensagem('Digite um ID para buscar', 'warning');
        return;
    }
    bloquearCampos(false); // Bloqueia campos de edição após buscar
    searchId.focus();

    try {
        const response = await fetch(`${API_BASE_URL}/pedido/${id}`);
        if (response.ok) {
            const pedido = await response.json();
            preencherFormulario(pedido);
            mostrarBotoes(true, false, true, true, false, false);
            mostrarMensagem('Pedido encontrado!', 'success');
            await carregarItensDoPedido(pedido.id_pedido);

        } else if (response.status === 404) {
            limparFormulario();
            searchId.value = id;
            mostrarBotoes(true, true, false, false, false, false);
            mostrarMensagem('Pedido não encontrado. Você pode incluir um novo pedido.', 'info');
            bloquearCampos(false);
        } else {
            throw new Error('Erro ao buscar pedido');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao buscar pedido', 'error');
    }
}

// Função para carregar itens
async function carregarItensDoPedido(pedidoId) {
    try {
        const responseItens = await fetch(`${API_BASE_URL}/pedidoproduto/${pedidoId}`);

        if (responseItens.ok) {
            const itensDoPedido = await responseItens.json();
            renderizerTabelaItensPedido(itensDoPedido || []);
        } else if (responseItens.status === 404) {
            const itensTableBody = document.getElementById('itensTableBody');
            itensTableBody.innerHTML = '';
        }
    } catch (error) {
        // Ignora erros silenciosamente
    }
}

function formatarDataParaInputDate(data) {
    const dataObj = new Date(data);
    const ano = dataObj.getFullYear();
    const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
    const dia = String(dataObj.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

// Função para preencher formulário com dados da pedido
function preencherFormulario(pedido) {
    currentPersonId = pedido.id_pedido;
    searchId.value = pedido.id_pedido;
    document.getElementById('data_pedido').value = formatarDataParaInputDate(pedido.data_pedido);
    document.getElementById('cpf').value = pedido.cpf || '';
    document.getElementById('valor_total').value = pedido.valor_total || 0;
}

// Função para incluir pedido
async function incluirPedido() {
    mostrarMensagem('Digite os dados!', 'success');
    currentPersonId = searchId.value;
    limparFormulario();
    searchId.value = currentPersonId;
    bloquearCampos(true); // Libera campos de edição
    mostrarBotoes(false, false, false, false, true, true);
    document.getElementById('data_pedido').focus();
    operacao = 'incluir';
}

// FUNÇÃO ALTERARPED IDO CORRIGIDA
async function alterarPedido() {
    mostrarMensagem('Altere os dados necessários!', 'info');
    bloquearCampos(true); // Libera campos de edição, bloqueia searchId
    mostrarBotoes(false, false, false, false, true, true);
    document.getElementById('data_pedido').focus();
    operacao = 'alterar';
}

// Função para excluir pedido
async function excluirPedido() {
    mostrarMensagem('Excluindo pedido...', 'info');
    currentPersonId = searchId.value;
    searchId.disabled = true;
    bloquearCampos(false); // Bloqueia campos de edição
    mostrarBotoes(false, false, false, false, true, true);
    operacao = 'excluir';
}

// FUNÇÃO SALVAR OPERACAO CORRIGIDA
async function salvarOperacao() {
    console.log('Operação:', operacao + ' - currentPersonId: ' + currentPersonId + ' - searchId: ' + searchId.value);

    // CORREÇÃO: Pegar valores diretamente dos inputs, não do FormData
    const pedido = {
        id_pedido: searchId.value,
        data_pedido: document.getElementById('data_pedido').value,
        cpf: document.getElementById('cpf').value,
        valor_total: document.getElementById('valor_total').value,
    };

    // VALIDAÇÃO: Verificar se campos obrigatórios estão preenchidos
    if (operacao !== 'excluir') {
        if (!pedido.data_pedido) {
            mostrarMensagem('Data do pedido é obrigatória!', 'error');
            return;
        }
        if (!pedido.cpf) {
            mostrarMensagem('CPF é obrigatório!', 'error');
            return;
        }
        if (!pedido.valor_total) {
            mostrarMensagem('Valor total é obrigatório!', 'error');
            return;
        }
    }

    let response = null;
    try {
        if (operacao === 'incluir') {
            response = await fetch(`${API_BASE_URL}/pedido`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(pedido)
            });
        } else if (operacao === 'alterar') {
            response = await fetch(`${API_BASE_URL}/pedido/${currentPersonId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(pedido)
            });
        } else if (operacao === 'excluir') {
            response = await fetch(`${API_BASE_URL}/pedido/${currentPersonId}`, {
                method: 'DELETE'
            });
        }

        if (response.ok && (operacao === 'incluir' || operacao === 'alterar')) {
            const novaPedido = await response.json();
            mostrarMensagem('Operação ' + operacao + ' realizada com sucesso!', 'success');
            limparFormulario();
        } else if (operacao !== 'excluir') {
            const error = await response.json();
            mostrarMensagem(error.error || 'Erro ao ' + operacao + ' pedido', 'error');
        } else {
            mostrarMensagem('Pedido excluído com sucesso!', 'success');
            limparFormulario();
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao realizar operação', 'error');
    }

    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false); // Volta ao estado inicial
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

function renderizerTabelaItensPedido(itens) {
    const itensTableBody = document.getElementById('itensTableBody');
    itensTableBody.innerHTML = '';

    if (typeof itens === 'object' && !Array.isArray(itens)) {
        itens = [itens];
    }

    itens.forEach((item, index) => {
        const row = document.createElement('tr');
        let subTotal = item.quantidade * item.preco_unitario;
        subTotal = subTotal.toFixed(2).replace('.', ',');

        row.innerHTML = `
            <td>${item.id_pedido}</td>                  
            <td>${item.id_produto}</td>
            <td>${item.nome_produto}</td>
            <td>
                <input type="number" class="quantidade-input" data-index="${index}" 
                       value="${item.quantidade}" min="1">
            </td>
            <td>
                <input type="number" class="preco-input" data-index="${index}" 
                       value="${item.preco_unitario}" min="0" step="0.01">
            </td>                           
            <td class="subtotal-cell">${subTotal}</td> 
            <td>
               <button class="btn-secondary btn-small" onclick="btnAtualizarItem(this)">Atualizar</button>
            </td>      
            <td>
                 <button class="btn-secondary btn-small" onclick="btnExcluirItem(this)">Excluir</button>
            </td>                
        `;
        itensTableBody.appendChild(row);
    });

    adicionarEventListenersSubtotal();
    atualizarValorTotal();
}

function adicionarEventListenersSubtotal() {
    const quantidadeInputs = document.querySelectorAll('.quantidade-input');
    const precoInputs = document.querySelectorAll('.preco-input');

    quantidadeInputs.forEach(input => {
        input.addEventListener('input', atualizarSubtotal);
        input.addEventListener('change', atualizarSubtotal);
    });

    precoInputs.forEach(input => {
        input.addEventListener('input', atualizarSubtotal);
        input.addEventListener('change', atualizarSubtotal);
    });
}

function atualizarSubtotal(event) {
    const index = event.target.getAttribute('data-index');
    const row = event.target.closest('tr');

    const quantidadeInput = row.querySelector('.quantidade-input');
    const precoInput = row.querySelector('.preco-input');
    const subtotalCell = row.querySelector('.subtotal-cell');

    const quantidade = parseFloat(quantidadeInput.value) || 0;
    const preco = parseFloat(precoInput.value) || 0;

    const novoSubtotal = quantidade * preco;
    subtotalCell.textContent = novoSubtotal.toFixed(2).replace('.', ',');
    
    atualizarValorTotal();
}

// Função para calcular e atualizar o valor total do pedido
function atualizarValorTotal() {
    const itensTableBody = document.getElementById('itensTableBody');
    const rows = itensTableBody.querySelectorAll('tr');
    
    let total = 0;
    
    rows.forEach(row => {
        const quantidadeInput = row.querySelector('.quantidade-input');
        const precoInput = row.querySelector('.preco-input');
        
        if (quantidadeInput && precoInput) {
            const quantidade = parseFloat(quantidadeInput.value) || 0;
            const preco = parseFloat(precoInput.value) || 0;
            total += quantidade * preco;
        }
    });
    
    // Atualiza o campo valor_total
    document.getElementById('valor_total').value = total.toFixed(2);
}

// Função para carregar lista de pedidos
async function carregarPedidos() {
    try {
        const rota = `${API_BASE_URL}/pedido`;
        const response = await fetch(rota);

        if (response.ok) {
            const pedidos = await response.json();
            if (pedidos.length > 0) {
                renderizarTabelaPedidos(pedidos);
            } else {
                throw new Error('Erro ao carregar itens do pedido');
            }
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao carregar lista de pedidos', 'error');
    }
}

// Função para renderizar tabela de pedidos
function renderizarTabelaPedidos(pedidos) {
    pedidosTableBody.innerHTML = '';

    pedidos.forEach(pedido => {
        const row = document.createElement('tr');
        row.innerHTML = `
                    <td>
                        <button class="btn-id" onclick="selecionarPedido(${pedido.id_pedido})">
                            ${pedido.id_pedido}
                        </button>
                    </td>
                    <td>${formatarData(pedido.data_pedido)}</td>                  
                    <td>${pedido.cpf}</td>                  
                    <td>${pedido.valor_total}</td>                  
                                 
                `;
        pedidosTableBody.appendChild(row);
    });
}

// Função para selecionar pedido da tabela
async function selecionarPedido(id) {
    searchId.value = id;
    await buscarPedido();
}

// Função para adicionar uma nova linha vazia para um item na tabela de itens do pedido.
function adicionarItem() {
    const itensTableBody = document.getElementById('itensTableBody');

    const row = document.createElement('tr');
    row.innerHTML = `
        <td>
            <input type="number" class="pedido-id-input" value="${searchId.value}" disabled>
        </td>                  
        <td class="produto-group">
            <input type="number" class="produto-id-input">
            <button class="btn-secondary btn-small" onclick="buscarProdutoPorId(this)">Buscar</button>
        </td>
        <td>
            <span class="produto-nome-input" id="produto-nome-input" >xx</span>
        </td>
        <td>
            <input type="number" class="quantidade-input" value="1" min="1">
        </td>
        <td>
            <input type="number" class="preco-input" value="0.00" min="0" step="0.01">
        </td>                               
        <td class="subtotal-cell">0,00</td>  
        <td>
            <button class="btn-secondary btn-small" onclick="btnAdicionarItem(this)">Adicionar</button>
        </td> 
          <td>
            <button class="btn-secondary btn-small" onclick="btnCancelarItem(this)">Cancelar</button>
        </td> 
               
    `;
    itensTableBody.appendChild(row);

    adicionarEventListenersSubtotal();
}

// Função para buscar o produto por ID no banco de dados
async function buscarProdutoPorId(button) {
    const row = button.closest('tr');
    const produtoIdInput = row.querySelector('.produto-id-input');
    const produtoId = produtoIdInput.value;

    if (!produtoId) {
        mostrarMensagem('Por favor, insira um ID de produto.', 'warning');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/produtos/${produtoId}`);
        if (!response.ok) {
            throw new Error('Produto não encontrado.');
        }

        const produto = await response.json();

        const precoInput = row.querySelector('.preco-input');
        precoInput.value = produto.preco;

        const nome_produtoInput = row.querySelector('td:nth-child(3) span');
        nome_produtoInput.innerHTML = produto.nome_produto;

        atualizarSubtotal({ target: precoInput });

        mostrarMensagem(`Produto ${produto.nome_produto} encontrado!`, 'success');

    } catch (error) {
        console.error('Erro ao buscar produto:', error);
        mostrarMensagem(error.message, 'error');
    }
}

// Função para coletar os dados de uma nova linha e enviar ao servidor para criação.
function btnAdicionarItem(button) {
    const row = button.closest('tr');
    if (!row) {
        console.error("Erro: Não foi possível encontrar a linha da tabela (<tr>).");
        return;
    }

    const pedidoId = row.querySelector('.pedido-id-input').value;
    const produtoId = row.querySelector('.produto-id-input').value;
    const quantidade = row.querySelector('.quantidade-input').value;
    const precoUnitario = row.querySelector('.preco-input').value;

    const itemData = {
        id_pedido: parseInt(pedidoId),
        id_produto: parseInt(produtoId),
        quantidade: parseInt(quantidade),
        preco_unitario: parseFloat(precoUnitario.replace(',', '.'))
    };

    if (isNaN(itemData.id_pedido) || isNaN(itemData.id_produto) || isNaN(itemData.quantidade) || isNaN(itemData.preco_unitario)) {
        mostrarMensagem('Por favor, preencha todos os campos corretamente.', 'warning');
        return;
    }

    fetch(`${API_BASE_URL}/pedidoproduto`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(itemData)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao adicionar o item do pedido. Verifique os IDs e tente novamente.');
            }
            return response.json();
        })
        .then(data => {
            mostrarMensagem('Item adicionado com sucesso!', 'success');
            buscarPedido();
            atualizarValorTotal();
        })
        .catch(error => {
            console.error('Erro:', error);
            mostrarMensagem(error.message, 'error');
        });
}

// Função para cancelar a adição de um novo item
function btnCancelarItem(button) {
    const row = button.closest('tr');

    if (row) {
        row.remove();
        mostrarMensagem('Adição do item cancelada.', 'info');
    } else {
        console.error("Erro: Não foi possível encontrar a linha da tabela para cancelar.");
    }
}

function btnAtualizarItem(button) {
    const row = button.closest('tr');

    if (!row) {
        console.error("Erro: Não foi possível encontrar a linha da tabela (<tr>).");
        return;
    }

    const cells = Array.from(row.cells);

    const pedidoId = cells[0].textContent;
    const produtoId = cells[1].textContent;
    const nomeProduto = cells[2].textContent;
    const quantidade = cells[3].querySelector('input').value;
    const precoUnitario = cells[4].querySelector('input').value;

    const itemData = {
        id_pedido: parseInt(pedidoId),
        id_produto: parseInt(produtoId),
        nome_produto: nomeProduto.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, " "),
        quantidade: parseInt(quantidade),
        preco_unitario: parseFloat(precoUnitario.replace(',', '.'))
    };

    if (isNaN(itemData.id_pedido) || isNaN(itemData.id_produto) || isNaN(itemData.quantidade) || isNaN(itemData.preco_unitario)) {
        mostrarMensagem('Por favor, preencha todos os campos corretamente.', 'warning');
        return;
    }

    delete itemData.nome_produto;

    fetch(`${API_BASE_URL}/pedidoproduto/${itemData.id_pedido}/${itemData.id_produto}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(itemData)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao salvar o item do pedido.');
            }
            return response.json();
        })
        .then(data => {
            mostrarMensagem('Item salvo com sucesso!', 'success');
            atualizarValorTotal();
        })
        .catch(error => {
            console.error('Erro:', error);
            mostrarMensagem(error.message, 'error');
        });
}

function btnExcluirItem(button) {
    const row = button.closest('tr');

    if (!row) {
        console.error("Erro: Não foi possível encontrar a linha da tabela (<tr>).");
        return;
    }

    const pedidoId = row.cells[0].textContent;
    const produtoId = row.cells[1].textContent;

    if (isNaN(parseInt(pedidoId)) || isNaN(parseInt(produtoId))) {
        mostrarMensagem('IDs do pedido ou produto inválidos.', 'warning');
        return;
    }

    if (!confirm(`Tem certeza que deseja excluir o item do produto ${produtoId} do pedido ${pedidoId}?`)) {
        return;
    }

    fetch(`${API_BASE_URL}/pedidoproduto/${pedidoId}/${produtoId}`, {
        method: 'DELETE',
    })
        .then(response => {
            if (response.ok) {
                row.remove();
                mostrarMensagem('Item excluído com sucesso!', 'success');
                atualizarValorTotal();
            } else if (response.status === 404) {
                mostrarMensagem('Erro: Item não encontrado no servidor.', 'error');
            } else {
                throw new Error('Erro ao excluir o item do pedido.');
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            mostrarMensagem(error.message, 'error');
        });
}