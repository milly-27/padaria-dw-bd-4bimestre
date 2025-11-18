// ========================================
// CONFIGURAÇÃO DA API
// ========================================
const API_BASE_URL = 'http://localhost:3001';

// ========================================
// FUNÇÕES DE COOKIES
// ========================================
function lerCookie(nome) {
    const nomeCookie = nome + "=";
    const cookies = document.cookie.split(';');
    
    for(let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i].trim();
        if (cookie.indexOf(nomeCookie) === 0) {
            return cookie.substring(nomeCookie.length, cookie.length);
        }
    }
    return null;
}

// ========================================
// CONFIGURAÇÃO DA CHAVE PIX
// ========================================
const MINHA_CHAVE_PIX = '02964990999';
const NOME_RECEBEDOR = 'Celso Mainko';
const CIDADE_RECEBEDOR = 'Campo Mourao';

// ========================================
// VARIÁVEIS GLOBAIS
// ========================================
let carrinho = [];
let usuario = null;
let formasPagamento = [];
let formaSelecionada = null;
let pedidoId = null;

// Dados de pagamento
let dadosPagamento = {
    numeroCartao: '',
    nomeCartao: '',
    validadeCartao: '',
    cvv: '',
    cpfTitular: ''
};

let qrCodePix = '';
let copiaPix = '';

// ========================================
// INICIALIZAÇÃO
// ========================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 [INICIALIZAÇÃO] Sistema de pagamento iniciado');
    await carregarDados();
});

// ========================================
// CARREGAR DADOS - CORRIGIDO PARA COOKIES
// ========================================
async function carregarDados() {
    try {
        console.log('\n📥 [CARREGAR DADOS] Iniciando carregamento...\n');
        
        // 1. VERIFICAR USUÁRIO LOGADO - PRIORIZAR COOKIES
        console.log('👤 [USUÁRIO] Verificando autenticação...');
        
        // PRIMEIRO: Tentar cookies
        const userId = lerCookie('userId');
        const userName = lerCookie('userName');
        const userEmail = lerCookie('userEmail');
        const userType = lerCookie('userType');
        const userCargo = lerCookie('userCargo');
        
        console.log('🍪 [COOKIES] Dados encontrados:');
        console.log('   - userId:', userId || '❌ Não encontrado');
        console.log('   - userName:', userName || '❌ Não encontrado');
        console.log('   - userEmail:', userEmail || '❌ Não encontrado');
        console.log('   - userType:', userType || '❌ Não encontrado');
        console.log('   - userCargo:', userCargo || '❌ Não encontrado');
        
        if (userId && userName) {
            usuario = {
                id: userId,
                nome: userName,
                email: userEmail || '',
                tipo: userType || 'cliente',
                cargo: userCargo || ''
            };
            console.log('✅ [USUÁRIO] Autenticado via cookies:', usuario.nome);
        } else {
            // SEGUNDO: Tentar sessionStorage
            console.log('🔍 [SESSÃO] Verificando sessionStorage...');
            const usuarioSession = sessionStorage.getItem('usuarioLogado');
            
            if (usuarioSession) {
                usuario = JSON.parse(usuarioSession);
                console.log('✅ [USUÁRIO] Autenticado via sessionStorage:', usuario.nome);
            } else {
                // TERCEIRO: Tentar backend
                console.log('🔍 [BACKEND] Consultando servidor...');
                try {
                    const respUsuario = await fetch(`${API_BASE_URL}/auth/verificar-login`, {
                        method: 'GET',
                        credentials: 'include',
                        headers: {
                            'Accept': 'application/json',
                            'Cache-Control': 'no-cache'
                        }
                    });
                    const dataUsuario = await respUsuario.json();
                    
                    if (dataUsuario.status === 'ok' && dataUsuario.usuario) {
                        usuario = {
                            id: dataUsuario.usuario.id,
                            nome: dataUsuario.usuario.nome,
                            email: dataUsuario.usuario.email,
                            tipo: dataUsuario.usuario.tipo
                        };
                        console.log('✅ [USUÁRIO] Autenticado via backend:', usuario.nome);
                    }
                } catch (error) {
                    console.error('❌ [BACKEND] Erro ao verificar:', error);
                }
            }
        }
        
        if (!usuario) {
            console.log('❌ [USUÁRIO] Não autenticado! Redirecionando...');
            mostrarErro('Você precisa estar logado para finalizar a compra');
            setTimeout(() => window.location.href = '../auth/login.html', 2000);
            return;
        }

        // 2. CARREGAR CARRINHO DO LOCALSTORAGE
        console.log('\n🛒 [CARRINHO] Carregando do LocalStorage...');
        const carrinhoLocal = localStorage.getItem('carrinho');
        
        if (!carrinhoLocal || carrinhoLocal === '[]') {
            console.log('❌ [CARRINHO] Vazio! Redirecionando...');
            mostrarErro('Seu carrinho está vazio');
            setTimeout(() => window.location.href = '../carrinho/carrinho.html', 2000);
            return;
        }
        
        carrinho = JSON.parse(carrinhoLocal);
        console.log('✅ [CARRINHO] Carregado:', carrinho.length, 'itens');
        carrinho.forEach((item, i) => {
            console.log(`   ${i+1}. ${item.nome_produto} - Qtd: ${item.quantidade} - R$ ${item.preco}`);
        });

        // 3. BUSCAR FORMAS DE PAGAMENTO DO BANCO
        console.log('\n💳 [FORMAS PAGAMENTO] Buscando do banco de dados...');
        await carregarFormasPagamento();

        // 4. RENDERIZAR INTERFACE
        console.log('\n🎨 [INTERFACE] Renderizando...');
        renderizarInterface();

    } catch (error) {
        console.error('\n❌ [ERRO FATAL] Erro ao carregar dados:', error);
        mostrarErro('Erro ao carregar dados do sistema: ' + error.message);
    }
}

// ========================================
// BUSCAR FORMAS DE PAGAMENTO DO BANCO
// ========================================
async function carregarFormasPagamento() {
    try {
        console.log('📡 [API] Requisição: GET /forma_pagamentos');
        
        const response = await fetch(`${API_BASE_URL}/forma_pagamentos`, {
            method: 'GET',
            headers: { 
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });
        
        console.log('📨 [API] Status:', response.status);
        
        if (!response.ok) {
            throw new Error('Erro ao buscar formas de pagamento');
        }
        
        const data = await response.json();
        processarFormasPagamento(data);
        
    } catch (error) {
        console.error('❌ [FORMAS PAGAMENTO] Erro ao buscar do banco:', error);
        console.log('⚠️ [FORMAS PAGAMENTO] Usando formas padrão');
        
        // Fallback com formas padrão
        formasPagamento = [
            { id_forma_pagamento: 1, nome_forma: 'PIX' },
            { id_forma_pagamento: 2, nome_forma: 'Cartão de Crédito' },
            { id_forma_pagamento: 3, nome_forma: 'Cartão de Débito' },
            { id_forma_pagamento: 4, nome_forma: 'Dinheiro' }
        ];
    }
}

// ========================================
// PROCESSAR RESPOSTA DO BANCO
// ========================================
function processarFormasPagamento(data) {
    console.log('🔍 [PROCESSAR] Resposta recebida:', typeof data);
    
    // Extrair array da resposta
    let formasArray = Array.isArray(data) ? data : (data.rows || data.data || data.formas || []);
    
    console.log('📊 [PROCESSAR] Total encontrado:', formasArray.length);
    
    if (formasArray.length === 0) {
        throw new Error('Nenhuma forma de pagamento encontrada no banco');
    }
    
    // Normalizar estrutura
    formasPagamento = formasArray.map((forma, i) => {
        const normalized = {
            id_forma_pagamento: forma.id_forma_pagamento || forma.id,
            nome_forma: forma.nome_forma || forma.nome
        };
        console.log(`   ${i+1}. ID: ${normalized.id_forma_pagamento} - ${normalized.nome_forma}`);
        return normalized;
    }).filter(f => f.id_forma_pagamento && f.nome_forma);
    
    console.log('✅ [FORMAS PAGAMENTO] Total carregado:', formasPagamento.length);
}

// ========================================
// RENDERIZAR INTERFACE
// ========================================
function renderizarInterface() {
    document.getElementById('userName').textContent = usuario.nome;
    document.getElementById('userCpf').textContent = usuario.id;

    const total = calcularTotal();
    document.getElementById('totalValor').textContent = formatarMoeda(total);
    document.getElementById('totalItens').textContent = carrinho.length;

    renderizarItens();
    renderizarSelectFormasPagamento();

    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('mainScreen').style.display = 'block';
    
    console.log('✅ [INTERFACE] Renderizada com sucesso');
}

// ========================================
// RENDERIZAR ITENS DO PEDIDO
// ========================================
function renderizarItens() {
    const container = document.getElementById('pedidoItens');
    container.innerHTML = '';

    carrinho.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'item-pedido';
        
        const subtotal = item.preco * item.quantidade;
        
        itemElement.innerHTML = `
            <div class="item-info">
                <div class="item-info-nome">${item.nome_produto}</div>
                <div class="item-quantidade">Quantidade: ${item.quantidade}</div>
            </div>
            <div class="item-preco">${formatarMoeda(subtotal)}</div>
        `;
        
        container.appendChild(itemElement);
    });
}

// ========================================
// RENDERIZAR SELECT DE FORMAS DE PAGAMENTO
// ========================================
function renderizarSelectFormasPagamento() {
    const container = document.getElementById('formasPagamentoGrid');
    
    if (!container) {
        console.error('❌ [SELECT] Container não encontrado!');
        return;
    }
    
    container.innerHTML = '';
    
    console.log('🎨 [SELECT] Renderizando com', formasPagamento.length, 'opções');
    
    if (!Array.isArray(formasPagamento) || formasPagamento.length === 0) {
        container.innerHTML = '<p style="color: red; padding: 20px;">❌ Nenhuma forma de pagamento disponível</p>';
        return;
    }

    // Criar container para select e dados de pagamento
    const wrapperDiv = document.createElement('div');
    wrapperDiv.style.cssText = 'width: 100%;';
    
    // Criar wrapper do select
    const selectWrapper = document.createElement('div');
    selectWrapper.style.cssText = 'width: 100%; margin-bottom: 20px;';
    
    // Label
    const label = document.createElement('label');
    label.textContent = 'Selecione a forma de pagamento:';
    label.style.cssText = 'display: block; font-weight: 600; color: #2c3e50; margin-bottom: 10px; font-size: 1.1rem;';
    
    // Select
    const select = document.createElement('select');
    select.id = 'selectFormaPagamento';
    select.style.cssText = `
        width: 100%;
        padding: 15px 20px;
        font-size: 1.1rem;
        font-weight: 600;
        font-family: inherit;
        color: #2c3e50;
        background: white;
        border: 3px solid #e0e0e0;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.3s ease;
        appearance: none;
        background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23667eea' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
        background-repeat: no-repeat;
        background-position: right 15px center;
        background-size: 20px;
        padding-right: 50px;
    `;
    
    // Opção padrão
    const optionDefault = document.createElement('option');
    optionDefault.value = '';
    optionDefault.textContent = '-- Escolha como deseja pagar --';
    optionDefault.disabled = true;
    optionDefault.selected = true;
    select.appendChild(optionDefault);
    
    // Adicionar todas as formas do banco
    formasPagamento.forEach((forma) => {
        const option = document.createElement('option');
        option.value = forma.id_forma_pagamento;
        option.textContent = forma.nome_forma;
        option.dataset.forma = JSON.stringify(forma);
        select.appendChild(option);
    });
    
    // Container para dados de pagamento
    const dadosContainer = document.createElement('div');
    dadosContainer.id = 'dadosPagamentoContainer';
    dadosContainer.style.cssText = 'margin-top: 20px;';
    
    // Event listener
    select.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        
        if (selectedOption && selectedOption.dataset.forma) {
            const forma = JSON.parse(selectedOption.dataset.forma);
            console.log('\n💳 [SELEÇÃO] Forma escolhida:', forma.nome_forma);
            
            this.style.borderColor = '#667eea';
            this.style.backgroundColor = '#f8f9fa';
            
            selecionarFormaPagamento(forma);
        }
    });
    
    // Hover
    select.addEventListener('mouseenter', function() {
        if (!this.value) {
            this.style.borderColor = '#667eea';
            this.style.boxShadow = '0 5px 15px rgba(102, 126, 234, 0.2)';
        }
    });
    
    select.addEventListener('mouseleave', function() {
        if (!this.value) {
            this.style.borderColor = '#e0e0e0';
            this.style.boxShadow = 'none';
        }
    });
    
    // Montar estrutura
    selectWrapper.appendChild(label);
    selectWrapper.appendChild(select);
    wrapperDiv.appendChild(selectWrapper);
    wrapperDiv.appendChild(dadosContainer);
    container.appendChild(wrapperDiv);
    
    console.log('✅ [SELECT] Renderizado com', select.options.length - 1, 'opções');
}

// ========================================
// SELECIONAR FORMA DE PAGAMENTO
// ========================================
function selecionarFormaPagamento(forma) {
    formaSelecionada = forma;
    renderizarDadosPagamento();
    document.getElementById('btnConfirmar').disabled = false;
}

// ========================================
// RENDERIZAR DADOS DE PAGAMENTO
// ========================================
function renderizarDadosPagamento() {
    const container = document.getElementById('dadosPagamentoContainer');
    
    if (!container) {
        console.error('❌ [DADOS PAGAMENTO] Container não encontrado!');
        return;
    }
    
    const nome = formaSelecionada.nome_forma.toLowerCase();
    
    console.log('🎨 [DADOS PAGAMENTO] Renderizando para:', formaSelecionada.nome_forma);
    
    if (nome.includes('pix')) {
        const total = calcularTotal();
        gerarQRCodePix(total, MINHA_CHAVE_PIX, NOME_RECEBEDOR, CIDADE_RECEBEDOR);
        
        container.innerHTML = `
            <div class="dados-pagamento">
                <h3 class="section-title">💳 Pagamento via PIX</h3>
                <div class="pix-container">
                    <img src="${qrCodePix}" alt="QR Code PIX" class="qrcode-image">
                    <p class="pix-instrucoes">Escaneie o QR Code com seu app de banco</p>
                    <button class="btn-copiar-pix" onclick="copiarCodigoPix()">
                        📋 Copiar Código PIX
                    </button>
                    <div class="codigo-pix">${copiaPix}</div>
                </div>
            </div>
        `;
    } else if (nome.includes('cartão') || nome.includes('cartao') || nome.includes('crédito') || nome.includes('credito') || nome.includes('débito') || nome.includes('debito')) {
        container.innerHTML = `
            <div class="dados-pagamento">
                <h3 class="section-title">💎 Dados do Cartão</h3>
                <div class="form-group">
                    <label class="form-label">Número do Cartão</label>
                    <input type="text" class="form-input" id="numeroCartao" placeholder="0000 0000 0000 0000" maxlength="19" oninput="formatarNumeroCartao(this)">
                </div>
                <div class="form-group">
                    <label class="form-label">Nome no Cartão</label>
                    <input type="text" class="form-input" id="nomeCartao" placeholder="NOME COMPLETO" oninput="dadosPagamento.nomeCartao = this.value.toUpperCase(); this.value = this.value.toUpperCase()">
                </div>
                <div class="form-grid-2">
                    <div class="form-group">
                        <label class="form-label">Validade</label>
                        <input type="text" class="form-input" id="validadeCartao" placeholder="MM/AA" maxlength="5" oninput="formatarValidadeCartao(this)">
                    </div>
                    <div class="form-group">
                        <label class="form-label">CVV</label>
                        <input type="text" class="form-input" id="cvvCartao" placeholder="123" maxlength="4" oninput="dadosPagamento.cvv = this.value.replace(/\\D/g, ''); this.value = dadosPagamento.cvv">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">CPF do Titular</label>
                    <input type="text" class="form-input" id="cpfTitular" placeholder="000.000.000-00" maxlength="14" oninput="formatarCPF(this)">
                </div>
            </div>
        `;
    } else if (nome.includes('dinheiro')) {
        const total = calcularTotal();
        container.innerHTML = `
            <div class="dados-pagamento">
                <h3 class="section-title">💵 Pagamento em Dinheiro</h3>
                <div class="dinheiro-container">
                    <div class="dinheiro-icon">💰</div>
                    <p class="dinheiro-texto">Total a pagar:</p>
                    <p class="dinheiro-valor">${formatarMoeda(total)}</p>
                    <p class="pix-instrucoes" style="margin-top: 20px;">Pagamento será realizado na entrega</p>
                </div>
            </div>
        `;
    } else {
        // Forma genérica
        const total = calcularTotal();
        container.innerHTML = `
            <div class="dados-pagamento">
                <h3 class="section-title">💰 ${formaSelecionada.nome_forma}</h3>
                <div class="dinheiro-container">
                    <div class="dinheiro-icon">💳</div>
                    <p class="dinheiro-texto">Total a pagar:</p>
                    <p class="dinheiro-valor">${formatarMoeda(total)}</p>
                    <p class="pix-instrucoes" style="margin-top: 20px;">Forma de pagamento: ${formaSelecionada.nome_forma}</p>
                </div>
            </div>
        `;
    }
}

// ========================================
// GERAR QR CODE PIX
// ========================================
function gerarQRCodePix(valor, chave, nome, cidade) {
    const txid = `PED${Date.now()}`;
    const gui = '0014br.gov.bcb.pix';
    const pixKey = `01${String(chave.length).padStart(2, '0')}${chave}`;
    const merchantAccount = `26${String(gui.length + pixKey.length).padStart(2, '0')}${gui}${pixKey}`;
    const mcc = '52040000';
    const currency = '5303986';
    const amount = `54${String(valor.toFixed(2).length).padStart(2, '0')}${valor.toFixed(2)}`;
    const countryCode = '5802BR';
    const merchantName = `59${String(nome.length).padStart(2, '0')}${nome}`;
    const merchantCity = `60${String(cidade.length).padStart(2, '0')}${cidade}`;
    const additionalData = `05${String(txid.length).padStart(2, '0')}${txid}`;
    const additionalField = `62${String(additionalData.length).padStart(2, '0')}${additionalData}`;
    const payloadSemCRC = `000201${merchantAccount}${mcc}${currency}${amount}${countryCode}${merchantName}${merchantCity}${additionalField}6304`;
    const crc = calcularCRC16(payloadSemCRC);
    const payloadCompleto = payloadSemCRC + crc;
    
    copiaPix = payloadCompleto;
    qrCodePix = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(payloadCompleto)}`;
}

function calcularCRC16(str) {
    let crc = 0xFFFF;
    for (let i = 0; i < str.length; i++) {
        crc ^= str.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            if (crc & 0x8000) {
                crc = (crc << 1) ^ 0x1021;
            } else {
                crc = crc << 1;
            }
        }
    }
    crc = crc & 0xFFFF;
    return crc.toString(16).toUpperCase().padStart(4, '0');
}

// ========================================
// CONFIRMAR PAGAMENTO
// ========================================
async function confirmarPagamento() {
    if (!formaSelecionada) {
        mostrarErro('Selecione uma forma de pagamento');
        return;
    }

    console.log('\n💳 [PAGAMENTO] Iniciando processo de confirmação...');

    const nome = formaSelecionada.nome_forma.toLowerCase();

    // Validar cartão
    if (nome.includes('cartão') || nome.includes('cartao')) {
        if (!validarCartao(dadosPagamento.numeroCartao)) {
            mostrarErro('Número de cartão inválido');
            return;
        }
        if (!dadosPagamento.nomeCartao || dadosPagamento.nomeCartao.length < 3) {
            mostrarErro('Nome do titular inválido');
            return;
        }
        if (!/^\d{2}\/\d{2}$/.test(dadosPagamento.validadeCartao)) {
            mostrarErro('Validade inválida (MM/AA)');
            return;
        }
        if (!/^\d{3,4}$/.test(dadosPagamento.cvv)) {
            mostrarErro('CVV inválido');
            return;
        }
        if (!validarCPF(dadosPagamento.cpfTitular)) {
            mostrarErro('CPF do titular inválido');
            return;
        }
    }

    // Mostrar tela de processamento
    document.getElementById('mainScreen').style.display = 'none';
    document.getElementById('processingScreen').style.display = 'flex';

    try {
        const total = calcularTotal();

        // OBTER DATA ATUAL
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, '0');
        const dia = String(hoje.getDate()).padStart(2, '0');
        const dataAtual = `${ano}-${mes}-${dia}`;

        console.log('\n📋 [DADOS] Preparando pedido...');
        console.log('   CPF:', usuario.id);
        console.log('   Data:', dataAtual);
        console.log('   Total:', total);

        const pedidoPayload = {
            cpf: usuario.id,
            data_pedido: dataAtual,
            valor_total: total
        };

        console.log('\n🚀 [API] POST /pedido');
        
        const respPedido = await fetch(`${API_BASE_URL}/pedido`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(pedidoPayload)
        });

        console.log('📨 [PEDIDO] Status:', respPedido.status);

        if (!respPedido.ok) {
            const errorText = await respPedido.text();
            console.error('❌ [PEDIDO] Erro:', errorText);
            throw new Error(`Erro ao criar pedido: ${respPedido.status}`);
        }
        
        const pedido = await respPedido.json();
        pedidoId = pedido.id_pedido;
        console.log('✅ [PEDIDO] Criado! ID:', pedidoId);

        // INSERIR ITENS DO PEDIDO
        console.log('\n📦 [ITENS] Inserindo itens...');
        for (const item of carrinho) {
            const itemPayload = {
                id_pedido: pedidoId,
                id_produto: item.id_produto,
                quantidade: item.quantidade,
                preco_unitario: item.preco
            };

            const itemResp = await fetch(`${API_BASE_URL}/pedidoproduto`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(itemPayload)
            });

            if (!itemResp.ok) {
                throw new Error(`Erro ao inserir item ${item.id_produto}`);
            }
            console.log(`   ✅ Item ${item.id_produto} inserido`);
        }

        // CRIAR PAGAMENTO
        console.log('\n💰 [PAGAMENTO] Criando registro...');
        
        const pagamentoPayload = {
            id_pedido: pedidoId,
            data_pagamento: dataAtual,
            valor_total: total
        };

        const pagamentoResp = await fetch(`${API_BASE_URL}/pagamento`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(pagamentoPayload)
        });

        if (!pagamentoResp.ok) {
            throw new Error('Erro ao criar pagamento');
        }

        const pagamento = await pagamentoResp.json();
        const idPagamento = pagamento.id_pagamento;
        console.log('✅ [PAGAMENTO] Criado! ID:', idPagamento);

        // RELACIONAR FORMA DE PAGAMENTO
        console.log('\n🔗 [FORMA PAGAMENTO] Relacionando...');
        
        const formaPagPayload = {
            id_pagamento: idPagamento,
            id_forma_pagamento: formaSelecionada.id_forma_pagamento,
            valor_pago: total
        };

        const formaPagResp = await fetch(`${API_BASE_URL}/pagamento_has_formapagamentos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(formaPagPayload)
        });

        if (!formaPagResp.ok) {
            throw new Error('Erro ao relacionar forma de pagamento');
        }

        console.log('✅ [PAGAMENTO] Completo!');

        // SUCESSO
        document.getElementById('processingScreen').style.display = 'none';
        document.getElementById('successScreen').style.display = 'flex';
        document.getElementById('pedidoNumero').textContent = pedidoId;

        // LIMPAR CARRINHO
        localStorage.removeItem('carrinho');
        console.log('🗑️ [CARRINHO] Limpo');

        // Redirecionar após 5 segundos
        setTimeout(() => {
            window.location.href = '../menu.html';
        }, 5000);

    } catch (error) {
        console.error('\n❌ [ERRO FATAL]:', error);
        console.error('   Mensagem:', error.message);
        
        document.getElementById('processingScreen').style.display = 'none';
        document.getElementById('errorScreen').style.display = 'flex';
        document.getElementById('errorMessage').textContent = error.message || 'Erro ao processar pagamento';
    }
}

// ========================================
// FORMATAÇÕES
// ========================================
function formatarNumeroCartao(input) {
    let valor = input.value.replace(/\s/g, '').replace(/\D/g, '');
    valor = valor.replace(/(\d{4})/g, '$1 ').trim();
    input.value = valor;
    dadosPagamento.numeroCartao = valor.replace(/\s/g, '');
}

function formatarValidadeCartao(input) {
    let valor = input.value.replace(/\D/g, '');
    if (valor.length >= 2) {
        valor = valor.slice(0, 2) + '/' + valor.slice(2, 4);
    }
    input.value = valor;
    dadosPagamento.validadeCartao = valor;
}

function formatarCPF(input) {
    let valor = input.value.replace(/\D/g, '');
    valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
    valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
    valor = valor.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    input.value = valor;
    dadosPagamento.cpfTitular = valor;
}

function formatarMoeda(valor) {
    return `R$ ${valor.toFixed(2).replace('.', ',')}`;
}

// ========================================
// VALIDAÇÕES
// ========================================
function validarCartao(numero) {
    numero = numero.replace(/\s/g, '');
    if (!/^\d{13,19}$/.test(numero)) return false;
    
    let soma = 0;
    let alternar = false;
    
    for (let i = numero.length - 1; i >= 0; i--) {
        let digito = parseInt(numero.charAt(i), 10);
        if (alternar) {
            digito *= 2;
            if (digito > 9) digito -= 9;
        }
        soma += digito;
        alternar = !alternar;
    }
    
    return (soma % 10) === 0;
}

function validarCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    
    let soma = 0;
    for (let i = 0; i < 9; i++) soma += parseInt(cpf.charAt(i)) * (10 - i);
    let resto = 11 - (soma % 11);
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(9))) return false;
    
    soma = 0;
    for (let i = 0; i < 10; i++) soma += parseInt(cpf.charAt(i)) * (11 - i);
    resto = 11 - (soma % 11);
    if (resto === 10 || resto === 11) resto = 0;
    return resto === parseInt(cpf.charAt(10));
}

// ========================================
// FUNÇÕES AUXILIARES
// ========================================
function calcularTotal() {
    return carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0);
}

function copiarCodigoPix() {
    navigator.clipboard.writeText(copiaPix);
    alert('✅ Código PIX copiado!');
}

function voltarCarrinho() {
    window.location.href = '../carrinho/carrinho.html';
}

function tentarNovamente() {
    location.reload();
}

function mostrarErro(mensagem) {
    const container = document.getElementById('errorContainer');
    if (container) {
        container.innerHTML = `<div class="error-message">${mensagem}</div>`;
        setTimeout(() => {
            container.innerHTML = '';
        }, 5000);
    }
}

console.log('✅ Sistema de pagamento carregado!');

// ========================================
// CONFIRMAR PAGAMENTO - VERSÃO SIMPLIFICADA E CORRIGIDA
// ========================================
async function confirmarPagamento() {
    if (!formaSelecionada) {
        mostrarErro('Selecione uma forma de pagamento');
        return;
    }

    console.log('\n💳 [PAGAMENTO] Iniciando processo de confirmação...');

    const nome = formaSelecionada.nome_forma.toLowerCase();

    // Validar cartão
    if (nome.includes('cartão') || nome.includes('cartao')) {
        if (!validarCartao(dadosPagamento.numeroCartao)) {
            mostrarErro('Número de cartão inválido');
            return;
        }
        if (!dadosPagamento.nomeCartao || dadosPagamento.nomeCartao.length < 3) {
            mostrarErro('Nome do titular inválido');
            return;
        }
        if (!/^\d{2}\/\d{2}$/.test(dadosPagamento.validadeCartao)) {
            mostrarErro('Validade inválida (MM/AA)');
            return;
        }
        if (!/^\d{3,4}$/.test(dadosPagamento.cvv)) {
            mostrarErro('CVV inválido');
            return;
        }
        if (!validarCPF(dadosPagamento.cpfTitular)) {
            mostrarErro('CPF do titular inválido');
            return;
        }
    }

    // Mostrar tela de processamento
    document.getElementById('mainScreen').style.display = 'none';
    document.getElementById('processingScreen').style.display = 'flex';

    try {
        const total = calcularTotal();

        // OBTER DATA ATUAL
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, '0');
        const dia = String(hoje.getDate()).padStart(2, '0');
        const dataAtual = `${ano}-${mes}-${dia}`;

        console.log('\n📋 [DADOS] Preparando pedido...');
        console.log('   CPF:', usuario.id);
        console.log('   Data:', dataAtual);
        console.log('   Total:', total);

        // ============================================
        // PAYLOAD SIMPLIFICADO - APENAS 3 CAMPOS!
        // ============================================
        const pedidoPayload = {
            cpf: usuario.id,
            data_pedido: dataAtual,
            valor_total: total
        };

        console.log('\n📦 [PEDIDO] Payload SIMPLIFICADO:');
        console.log(JSON.stringify(pedidoPayload, null, 2));

        // ============================================
        // CRIAR PEDIDO - UMA ÚNICA TENTATIVA
        // ============================================
        console.log('\n🚀 [API] POST /pedido');
        console.log('   URL:', `${API_BASE_URL}/pedido`);
        console.log('   Body:', JSON.stringify(pedidoPayload));

        const respPedido = await fetch(`${API_BASE_URL}/pedido`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(pedidoPayload)
        });

        console.log('📨 [PEDIDO] Status:', respPedido.status);

        if (!respPedido.ok) {
            const errorText = await respPedido.text();
            console.error('❌ [PEDIDO] Erro:', errorText);
            
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch (e) {
                errorData = { error: errorText };
            }

            throw new Error(errorData.message || errorData.error || `Erro ${respPedido.status}`);
        }
        
        const pedido = await respPedido.json();
        pedidoId = pedido.id_pedido;
        console.log('✅ [PEDIDO] Criado! ID:', pedidoId);

        // ============================================
        // INSERIR ITENS DO PEDIDO
        // ============================================
        console.log('\n📦 [ITENS] Inserindo itens...');
        for (const item of carrinho) {
            console.log(`   Inserindo: ${item.nome_produto} (${item.quantidade}x R$${item.preco})`);
            
            const itemPayload = {
                id_pedido: pedidoId,
                id_produto: item.id_produto,
                quantidade: item.quantidade,
                preco_unitario: item.preco
            };

            const itemResp = await fetch(`${API_BASE_URL}/pedidoproduto`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(itemPayload)
            });

            if (!itemResp.ok) {
                const errorData = await itemResp.json().catch(() => ({}));
                throw new Error(errorData.message || `Erro ao inserir item ${item.id_produto}`);
            }
            console.log(`   ✅ Item ${item.id_produto} inserido`);
        }

        // ============================================
        // CRIAR PAGAMENTO
        // ============================================
        console.log('\n💰 [PAGAMENTO] Criando registro...');
        
        const pagamentoPayload = {
            id_pedido: pedidoId,
            data_pagamento: dataAtual,
            valor_total: total
        };

        const pagamentoResp = await fetch(`${API_BASE_URL}/pagamento`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(pagamentoPayload)
        });

        if (!pagamentoResp.ok) {
            const errorData = await pagamentoResp.json().catch(() => ({}));
            throw new Error(errorData.message || 'Erro ao criar pagamento');
        }

        const pagamento = await pagamentoResp.json();
        const idPagamento = pagamento.id_pagamento;
        console.log('✅ [PAGAMENTO] Criado! ID:', idPagamento);

        // ============================================
        // RELACIONAR FORMA DE PAGAMENTO
        // ============================================
        console.log('\n🔗 [FORMA PAGAMENTO] Relacionando...');
        
        const formaPagPayload = {
            id_pagamento: idPagamento,
            id_forma_pagamento: formaSelecionada.id_forma_pagamento,
            valor_pago: total
        };

        const formaPagResp = await fetch(`${API_BASE_URL}/pagamento_has_formapagamentos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(formaPagPayload)
        });

        if (!formaPagResp.ok) {
            const errorData = await formaPagResp.json().catch(() => ({}));
            throw new Error(errorData.message || 'Erro ao relacionar forma de pagamento');
        }

        console.log('✅ [PAGAMENTO] Completo!');

        // ============================================
        // SUCESSO!
        // ============================================
        document.getElementById('processingScreen').style.display = 'none';
        document.getElementById('successScreen').style.display = 'flex';
        document.getElementById('pedidoNumero').textContent = pedidoId;

        // LIMPAR CARRINHO
        localStorage.removeItem('carrinho');
        console.log('🗑️ [CARRINHO] Limpo');

        // Redirecionar após 5 segundos
        setTimeout(() => {
            window.location.href = '../menu.html';
        }, 5000);

    } catch (error) {
        console.error('\n❌ [ERRO FATAL]:', error);
        console.error('   Mensagem:', error.message);
        console.error('   Stack:', error.stack);
        
        document.getElementById('processingScreen').style.display = 'none';
        document.getElementById('errorScreen').style.display = 'flex';
        document.getElementById('errorMessage').textContent = error.message || 'Erro ao processar pagamento';
    }
}
