// Configuração da API
const API_BASE_URL = 'http://localhost:3001';
let currentPersonCpf = null;
let operacao = null;

// Elementos do DOM
const form = document.getElementById('pessoaForm');
const searchId = document.getElementById('searchId');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnCancelar = document.getElementById('btnCancelar');
const btnSalvar = document.getElementById('btnSalvar');
const pessoasTableBody = document.getElementById('pessoasTableBody');
const messageContainer = document.getElementById('messageContainer');

// Elementos específicos
const checkboxFuncionario = document.getElementById('checkboxFuncionario');
const checkboxCliente = document.getElementById('checkboxCliente');
const funcionarioFields = document.getElementById('funcionarioFields');
const salarioInput = document.getElementById('salario');
const cargoSelect = document.getElementById('id_cargo');
const cpfInput = document.getElementById('cpf_pessoa');
const senhaInput = document.getElementById('senha_pessoa');
const toggleSenha = document.getElementById('toggleSenha');

// Carregar dados ao inicializar
document.addEventListener('DOMContentLoaded', () => {
    carregarPessoas();
    carregarCargos();
    configurarEventListeners();
});

// Configurar event listeners
function configurarEventListeners() {
    btnBuscar.addEventListener('click', buscarPessoa);
    btnIncluir.addEventListener('click', incluirPessoa);
    btnAlterar.addEventListener('click', alterarPessoa);
    btnExcluir.addEventListener('click', excluirPessoa);
    btnCancelar.addEventListener('click', cancelarOperacao);
    btnSalvar.addEventListener('click', salvarOperacao);

    checkboxFuncionario.addEventListener('change', function() {
        if (this.checked) {
            funcionarioFields.style.display = 'block';
            salarioInput.required = true;
            cargoSelect.required = true;
        } else {
            funcionarioFields.style.display = 'none';
            salarioInput.required = false;
            cargoSelect.required = false;
            salarioInput.value = '';
            cargoSelect.value = '';
        }
    });

    toggleSenha.addEventListener('click', function() {
        const type = senhaInput.getAttribute('type') === 'password' ? 'text' : 'password';
        senhaInput.setAttribute('type', type);
        this.classList.toggle('fa-eye-slash');
    });

    const formatarCPF = (input) => {
        input.addEventListener('input', () => {
            let value = input.value.replace(/\D/g, '');
            if (value.length > 11) {
                value = value.slice(0, 11);
            }
            input.value = value;
        });
    };

    formatarCPF(searchId);
    formatarCPF(cpfInput);
}

// Configuração inicial dos botões
mostrarBotoes(true, false, false, false, false, false);
bloquearCampos(false);

// Função para mostrar mensagens
function mostrarMensagem(texto, tipo = 'info') {
    messageContainer.innerHTML = `<div class="message ${tipo}">${texto}</div>`;
    setTimeout(() => {
        messageContainer.innerHTML = '';
    }, 4000);
}

// Função para bloquear/desbloquear campos
function bloquearCampos(bloquearPrimeiro) {
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach((input, index) => {
        if (index === 0) {
            input.disabled = bloquearPrimeiro;
        } else {
            input.disabled = !bloquearPrimeiro;
        }
    });
    
    // Garantir que os checkboxes sempre fiquem habilitados durante alteração
    if (bloquearPrimeiro && operacao === 'alterar') {
        checkboxFuncionario.disabled = false;
        checkboxCliente.disabled = false;
    }
}

// Função para limpar formulário
function limparFormulario() {
    form.reset();
    currentPersonCpf = null;
    funcionarioFields.style.display = 'none';
    salarioInput.required = false;
    cargoSelect.required = false;
    senhaInput.setAttribute('type', 'password');
    toggleSenha.classList.remove('fa-eye-slash');
}

// Função para mostrar/ocultar botões
function mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar) {
    btnBuscar.style.display = btBuscar ? 'inline-block' : 'none';
    btnIncluir.style.display = btIncluir ? 'inline-block' : 'none';
    btnAlterar.style.display = btAlterar ? 'inline-block' : 'none';
    btnExcluir.style.display = btExcluir ? 'inline-block' : 'none';
    btnSalvar.style.display = btSalvar ? 'inline-block' : 'none';
    btnCancelar.style.display = btCancelar ? 'inline-block' : 'none';
}

// Função para carregar cargos
async function carregarCargos() {
    try {
        const response = await fetch(`${API_BASE_URL}/cargos`);
        if (!response.ok) throw new Error('Erro ao carregar cargos');

        const cargos = await response.json();
        cargoSelect.innerHTML = '<option value="">Selecione um cargo</option>';

        cargos.forEach(cargo => {
            const option = document.createElement('option');
            option.value = cargo.id_cargo;
            option.textContent = cargo.nome_cargo;
            cargoSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar cargos:', error);
        mostrarMensagem('Erro ao carregar cargos', 'error');
    }
}

// Função para buscar pessoa por CPF
async function buscarPessoa() {
    const cpf = searchId.value.trim();
    if (!cpf) {
        mostrarMensagem('Digite um CPF para buscar', 'warning');
        return;
    }
    if (cpf.length !== 11) {
        mostrarMensagem('O CPF deve conter 11 dígitos.', 'warning');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/pessoas/${cpf}`);

        if (response.ok) {
            const pessoa = await response.json();
            await preencherFormulario(pessoa);
            mostrarBotoes(true, false, true, true, false, false);
            mostrarMensagem('Pessoa encontrada!', 'success');
        } else if (response.status === 404) {
            limparFormulario();
            searchId.value = cpf;
            mostrarBotoes(true, true, false, false, false, false);
            mostrarMensagem('Pessoa não encontrada. Você pode incluir uma nova pessoa.', 'info');
            bloquearCampos(false);
        } else {
            throw new Error('Erro ao buscar pessoa');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao buscar pessoa', 'error');
    }
}

// Função para preencher formulário com dados da pessoa
async function preencherFormulario(pessoa) {
    currentPersonCpf = pessoa.cpf;
    searchId.value = pessoa.cpf;
    document.getElementById('nome_pessoa').value = pessoa.nome_pessoa || '';
    document.getElementById('email_pessoa').value = pessoa.email_pessoa || '';
    document.getElementById('senha_pessoa').value = pessoa.senha_pessoa || '';
    document.getElementById('cpf_pessoa').value = pessoa.cpf || '';

    senhaInput.setAttribute('type', 'password');
    toggleSenha.classList.remove('fa-eye-slash');

    try {
        const funcionarioResponse = await fetch(`${API_BASE_URL}/funcionarios/pessoa/${pessoa.cpf}`);
        if (funcionarioResponse.ok) {
            const funcionario = await funcionarioResponse.json();
            checkboxFuncionario.checked = true;
            funcionarioFields.style.display = 'block';
            salarioInput.value = funcionario.salario || '';
            cargoSelect.value = funcionario.id_cargo || '';
            salarioInput.required = true;
            cargoSelect.required = true;
        } else {
            checkboxFuncionario.checked = false;
            funcionarioFields.style.display = 'none';
            salarioInput.required = false;
            cargoSelect.required = false;
        }
    } catch (error) {
        console.error('Erro ao verificar funcionário:', error);
        checkboxFuncionario.checked = false;
    }

    try {
        const clienteResponse = await fetch(`${API_BASE_URL}/clientes/pessoa/${pessoa.cpf}`);
        checkboxCliente.checked = clienteResponse.ok;
    } catch (error) {
        console.error('Erro ao verificar cliente:', error);
        checkboxCliente.checked = false;
    }
}

// Função para incluir pessoa
function incluirPessoa() {
    mostrarMensagem('Digite os dados da nova pessoa!', 'info');
    currentPersonCpf = searchId.value;
    limparFormulario();
    searchId.value = currentPersonCpf;
    cpfInput.value = currentPersonCpf;
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);
    document.getElementById('nome_pessoa').focus();
    operacao = 'incluir';
}

// Função para alterar pessoa
function alterarPessoa() {
    mostrarMensagem('Altere os dados da pessoa!', 'info');
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);
    document.getElementById('nome_pessoa').focus();
    operacao = 'alterar';
}

// Função para excluir pessoa
function excluirPessoa() {
    mostrarMensagem('Confirme a exclusão salvando...', 'warning');
    bloquearCampos(false);
    mostrarBotoes(false, false, false, false, true, true);
    operacao = 'excluir';
}

// Função para excluir associações de forma robusta
async function excluirAssociacoes(cpf) {
    const resultados = {
        funcionario: false,
        cliente: false,
        erros: []
    };

    // Tentar excluir funcionário
    try {
        const funcResponse = await fetch(`${API_BASE_URL}/funcionarios/${cpf}`, {
            method: 'DELETE'
        });
        
        if (funcResponse.ok) {
            resultados.funcionario = true;
            console.log(`Funcionário com CPF ${cpf} excluído com sucesso`);
        } else if (funcResponse.status === 404) {
            console.log(`Funcionário com CPF ${cpf} não existe (ok)`);
            resultados.funcionario = true;
        } else {
            const errorData = await funcResponse.json().catch(() => ({ error: 'Erro desconhecido' }));
            resultados.erros.push(`Funcionário: ${errorData.error || funcResponse.statusText}`);
        }
    } catch (error) {
        console.error(`Erro ao excluir funcionário:`, error);
        resultados.erros.push(`Funcionário: ${error.message}`);
    }

    // Tentar excluir cliente
    try {
        const clienteResponse = await fetch(`${API_BASE_URL}/clientes/${cpf}`, {
            method: 'DELETE'
        });
        
        if (clienteResponse.ok) {
            resultados.cliente = true;
            console.log(`Cliente com CPF ${cpf} excluído com sucesso`);
        } else if (clienteResponse.status === 404) {
            console.log(`Cliente com CPF ${cpf} não existe (ok)`);
            resultados.cliente = true;
        } else {
            const errorData = await clienteResponse.json().catch(() => ({ error: 'Erro desconhecido' }));
            resultados.erros.push(`Cliente: ${errorData.error || clienteResponse.statusText}`);
        }
    } catch (error) {
        console.error(`Erro ao excluir cliente:`, error);
        resultados.erros.push(`Cliente: ${error.message}`);
    }

    return resultados;
}

// Função salvarOperacao melhorada
async function salvarOperacao() {
    try {
        if (operacao === 'excluir') {
            // FLUXO DE EXCLUSÃO
            if (!currentPersonCpf) {
                mostrarMensagem('Nenhuma pessoa selecionada para exclusão!', 'error');
                return;
            }

            console.log(`Iniciando exclusão da pessoa com CPF: ${currentPersonCpf}`);

            // Excluir as associações
            const resultadosAssociacoes = await excluirAssociacoes(currentPersonCpf);
            
            if (resultadosAssociacoes.erros.length > 0) {
                console.error('Erros ao excluir associações:', resultadosAssociacoes.erros);
                mostrarMensagem(`Avisos: ${resultadosAssociacoes.erros.join('; ')}`, 'warning');
            }

            // Excluir a pessoa
            const responsePessoa = await fetch(`${API_BASE_URL}/pessoas/${currentPersonCpf}`, {
                method: 'DELETE'
            });

            if (responsePessoa.ok) {
                mostrarMensagem('Pessoa excluída com sucesso!', 'success');
                limparFormulario();
                await carregarPessoas();
                mostrarBotoes(true, false, false, false, false, false);
                bloquearCampos(false);
                searchId.focus();
                return;
            } else {
                const error = await responsePessoa.json().catch(() => ({ error: 'Erro desconhecido' }));
                throw new Error(error.error || `Erro HTTP ${responsePessoa.status}`);
            }
        }

        // FLUXO NORMAL PARA INCLUIR E ALTERAR
        const formData = new FormData(form);
        const pessoaData = {
            nome_pessoa: formData.get('nome_pessoa'),
            email_pessoa: formData.get('email_pessoa'),
            senha_pessoa: formData.get('senha_pessoa'),
            cpf: formData.get('cpf_pessoa')
        };

        if (!pessoaData.nome_pessoa || !pessoaData.email_pessoa || !pessoaData.cpf) {
            mostrarMensagem('Preencha todos os campos obrigatórios!', 'warning');
            return;
        }

        if (pessoaData.cpf.length !== 11) {
            mostrarMensagem('O CPF deve conter 11 dígitos.', 'warning');
            return;
        }

        if (checkboxFuncionario.checked) {
            if (!formData.get('salario') || !formData.get('id_cargo')) {
                mostrarMensagem('Preencha salário e cargo para funcionários!', 'warning');
                return;
            }
        }

        let responsePessoa;
        
        if (operacao === 'incluir') {
            responsePessoa = await fetch(`${API_BASE_URL}/pessoas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pessoaData)
            });
        } else if (operacao === 'alterar') {
            responsePessoa = await fetch(`${API_BASE_URL}/pessoas/${currentPersonCpf}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pessoaData)
            });
        }

        if (responsePessoa.ok) {
            // Gerenciar funcionário
            const isFuncionarioChecked = checkboxFuncionario.checked;
            const funcionarioExists = await verificarExistencia(`${API_BASE_URL}/funcionarios/pessoa/${pessoaData.cpf}`);

            if (isFuncionarioChecked) {
                const funcionarioData = {
                    cpf: pessoaData.cpf,
                    id_cargo: parseInt(formData.get('id_cargo')),
                    salario: parseFloat(formData.get('salario'))
                };
                
                try {
                    if (funcionarioExists) {
                        // Atualizar funcionário existente
                        const funcResponse = await fetch(`${API_BASE_URL}/funcionarios/${pessoaData.cpf}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(funcionarioData)
                        });
                        
                        if (!funcResponse.ok) {
                            const error = await funcResponse.json();
                            console.error('Erro ao atualizar funcionário:', error);
                        }
                    } else {
                        // Criar novo funcionário
                        const funcResponse = await fetch(`${API_BASE_URL}/funcionarios`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(funcionarioData)
                        });
                        
                        if (!funcResponse.ok) {
                            const error = await funcResponse.json();
                            console.error('Erro ao criar funcionário:', error);
                        }
                    }
                } catch (error) {
                    console.error('Erro ao gerenciar funcionário:', error);
                }
            } else if (!isFuncionarioChecked && funcionarioExists) {
                // Remover funcionário se desmarcado
                try {
                    await fetch(`${API_BASE_URL}/funcionarios/${pessoaData.cpf}`, {
                        method: 'DELETE'
                    });
                } catch (error) {
                    console.error('Erro ao excluir funcionário:', error);
                }
            }

            // Gerenciar cliente
            const isClienteChecked = checkboxCliente.checked;
            const clienteExists = await verificarExistencia(`${API_BASE_URL}/clientes/pessoa/${pessoaData.cpf}`);

            if (isClienteChecked && !clienteExists) {
                // Criar novo cliente
                const clienteData = {
                    cpf: pessoaData.cpf
                };
                
                try {
                    const clienteResponse = await fetch(`${API_BASE_URL}/clientes`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(clienteData)
                    });
                    
                    if (!clienteResponse.ok) {
                        const error = await clienteResponse.json();
                        console.error('Erro ao criar cliente:', error);
                    }
                } catch (error) {
                    console.error('Erro ao criar cliente:', error);
                }
            } else if (!isClienteChecked && clienteExists) {
                // Remover cliente se desmarcado
                try {
                    await fetch(`${API_BASE_URL}/clientes/${pessoaData.cpf}`, {
                        method: 'DELETE'
                    });
                } catch (error) {
                    console.error('Erro ao excluir cliente:', error);
                }
            }

            mostrarMensagem(`Operação de ${operacao} realizada com sucesso!`, 'success');
            limparFormulario();
            await carregarPessoas();
        } else {
            const error = await responsePessoa.json();
            mostrarMensagem(error.error || `Erro ao ${operacao} pessoa`, 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem(`Erro ao ${operacao} pessoa: ${error.message}`, 'error');
    }

    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false);
    searchId.focus();
}

// Função para cancelar operação
function cancelarOperacao() {
    limparFormulario();
    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false);
    searchId.focus();
    mostrarMensagem('Operação cancelada', 'info');
}

// Função para carregar lista de pessoas
async function carregarPessoas() {
    try {
        const response = await fetch(`${API_BASE_URL}/pessoas`);
        if (response.ok) {
            const pessoas = await response.json();
            await renderizarTabelaPessoas(pessoas);
        } else {
            throw new Error('Erro ao carregar pessoas');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao carregar lista de pessoas', 'error');
    }
}

// Função para renderizar tabela de pessoas
async function renderizarTabelaPessoas(pessoas) {
    pessoasTableBody.innerHTML = '';

    for (const pessoa of pessoas) {
        const row = document.createElement('tr');
        
        let funcionarioInfo = { ehFuncionario: false, cargo: '-', salario: '-' };
        try {
            const funcionarioResponse = await fetch(`${API_BASE_URL}/funcionarios/pessoa/${pessoa.cpf}`);
            if (funcionarioResponse.ok) {
                const funcionario = await funcionarioResponse.json();
                funcionarioInfo = {
                    ehFuncionario: true,
                    cargo: funcionario.nome_cargo || '-',
                    salario: funcionario.salario ? `R$ ${parseFloat(funcionario.salario).toFixed(2)}` : '-'
                };
            }
        } catch (error) {
            console.error('Erro ao verificar funcionário:', error);
        }

        let ehCliente = false;
        try {
            const clienteResponse = await fetch(`${API_BASE_URL}/clientes/pessoa/${pessoa.cpf}`);
            ehCliente = clienteResponse.ok;
        } catch (error) {
            console.error('Erro ao verificar cliente:', error);
        }

        row.innerHTML = `
            <td>
                <button class="btn-id" onclick="selecionarPessoa('${pessoa.cpf}')">
                    ${pessoa.cpf}
                </button>
            </td>
            <td>${pessoa.nome_pessoa}</td>
            <td>${pessoa.email_pessoa}</td>
            <td>${funcionarioInfo.ehFuncionario ? '✅ Sim' : '❌ Não'}</td>
            <td>${ehCliente ? '✅ Sim' : '❌ Não'}</td>
            <td>${funcionarioInfo.cargo}</td>
            <td>${funcionarioInfo.salario}</td>
        `;
        pessoasTableBody.appendChild(row);
    }
}

// Função para selecionar pessoa da tabela
async function selecionarPessoa(cpf) {
    searchId.value = cpf;
    await buscarPessoa();
}

// Função auxiliar para verificar existência
async function verificarExistencia(url) {
    try {
        const response = await fetch(url);
        return response.ok;
    } catch (error) {
        console.error('Erro ao verificar existência:', error);
        return false;
    }
}