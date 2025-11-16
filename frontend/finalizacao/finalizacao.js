// Configuração da API
const API_BASE_URL = 'http://localhost:3001';

// ========================================
// ⚠️ CONFIGURAÇÃO DA CHAVE PIX
// ========================================
// ✅ COLOQUE SUA CHAVE PIX AQUI:
const MINHA_CHAVE_PIX = '02964990999';  // ← SUBSTITUA PELA SUA CHAVE PIX
const NOME_RECEBEDOR = 'Celso Mainko';  // ← SUBSTITUA PELO SEU NOME OU NOME DO NEGÓCIO
const CIDADE_RECEBEDOR = 'Campo Mourao';           // ← SUBSTITUA PELA SUA CIDADE

// Tipos de chave PIX aceitas:
// - CPF: '12345678900' (só números, sem pontos ou traços)
// - CNPJ: '12345678000190' (só números)
// - Email: '[email protected]'
// - Telefone: '+5544999999999' (formato internacional com +55)
// - Chave Aleatória: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' (UUID)
// ========================================

// Variáveis globais
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
    cpfTitular: '',
    pixChave: ''
};

let qrCodePix = '';
let copiaPix = '';

// ========================================
// INICIALIZAÇÃO
// ========================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Iniciando finalização de pagamento...');
    await carregarDados();
});

// ========================================
// CARREGAR DADOS
// ========================================
async function carregarDados() {
    try {
        console.log('📥 Carregando dados...');
        
        // 1. Verificar usuário logado
        console.log('🔍 Verificando usuário logado...');
        
        // PRIMEIRO: Verificar sessionStorage
        const usuarioSession = sessionStorage.getItem('usuarioLogado');
        
        if (usuarioSession) {
            usuario = JSON.parse(usuarioSession);
            console.log('✅ Usuário encontrado no sessionStorage:', usuario.nome);
        } else {
            // SEGUNDO: Tentar backend
            console.log('🔍 Verificando no backend...');
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
                        tipo: dataUsuario.usuario.tipo,
                        cargo: dataUsuario.usuario.cargo,
                        isGerente: dataUsuario.usuario.isGerente
                    };
                    sessionStorage.setItem('usuarioLogado', JSON.stringify(usuario));
                    console.log('✅ Usuário encontrado no backend:', usuario.nome);
                }
            } catch (error) {
                console.error('❌ Erro ao verificar backend:', error);
            }
        }
        
        if (!usuario) {
            console.log('❌ Usuário não autenticado, redirecionando...');
            mostrarErro('Você precisa estar logado para finalizar a compra');
            setTimeout(() => window.location.href = '../login/login.html', 2000);
            return;
        }
        
        console.log('👤 Usuário:', usuario.nome, '| CPF:', usuario.id);

        // 2. Carregar carrinho
        const carrinhoLocal = localStorage.getItem('carrinho');
        if (!carrinhoLocal || carrinhoLocal === '[]') {
            console.log('❌ Carrinho vazio, redirecionando...');
            mostrarErro('Seu carrinho está vazio');
            setTimeout(() => window.location.href = '../carrinho/carrinho.html', 2000);
            return;
        }
        
        carrinho = JSON.parse(carrinhoLocal);
        console.log('🛒 Carrinho:', carrinho.length, 'itens');

        // 3. Carregar formas de pagamento
        console.log('💳 Carregando formas de pagamento...');
        try {
            const respFormas = await fetch(`${API_BASE_URL}/finalizacao/formas-pagamento`);
            console.log('📨 Status da resposta:', respFormas.status);
            
            if (respFormas.ok) {
                const data = await respFormas.json();
                console.log('📨 Resposta bruta:', data);
                
                if (Array.isArray(data) && data.length > 0) {
                    formasPagamento = data;
                    console.log('✅ Formas de pagamento carregadas:', formasPagamento.length);
                } else {
                    throw new Error('Resposta não é um array válido');
                }
            } else {
                throw new Error(`Erro HTTP: ${respFormas.status}`);
            }
        } catch (error) {
            console.error('❌ Erro ao carregar formas de pagamento:', error);
            console.log('⚠️ Usando formas de pagamento padrão');
            formasPagamento = [
                { id_forma_pagamento: 1, nome_forma: 'PIX' },
                { id_forma_pagamento: 2, nome_forma: 'Cartão de Crédito' },
                { id_forma_pagamento: 3, nome_forma: 'Cartão de Débito' },
                { id_forma_pagamento: 4, nome_forma: 'Dinheiro' }
            ];
        }

        // 4. Renderizar interface
        renderizarInterface();

    } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
        mostrarErro('Erro ao carregar dados do sistema: ' + error.message);
    }
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
    renderizarFormasPagamento();

    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('mainScreen').style.display = 'block';
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
// RENDERIZAR FORMAS DE PAGAMENTO
// ========================================
function renderizarFormasPagamento() {
    const container = document.getElementById('formasPagamentoGrid');
    
    if (!container) {
        console.error('❌ Container de formas de pagamento não encontrado');
        return;
    }
    
    container.innerHTML = '';
    
    if (!Array.isArray(formasPagamento) || formasPagamento.length === 0) {
        console.error('❌ formasPagamento não é um array válido');
        container.innerHTML = '<p style="color: red; padding: 20px;">Erro ao carregar formas de pagamento</p>';
        return;
    }
    
    console.log('📋 Renderizando', formasPagamento.length, 'formas de pagamento');

    formasPagamento.forEach((forma, index) => {
        if (!forma || !forma.nome_forma) {
            console.warn(`⚠️ Forma ${index} inválida:`, forma);
            return;
        }
        
        const card = document.createElement('div');
        card.className = 'forma-pagamento-card';
        card.onclick = () => selecionarFormaPagamento(forma);
        
        const nome = forma.nome_forma.toLowerCase();
        let icon = '💳';
        if (nome.includes('pix')) icon = '📱';
        if (nome.includes('dinheiro')) icon = '💵';
        if (nome.includes('débito')) icon = '💳';
        if (nome.includes('crédito')) icon = '💳';
        
        card.innerHTML = `
            <div class="forma-icon">${icon}</div>
            <div class="forma-nome">${forma.nome_forma}</div>
        `;
        
        card.setAttribute('data-id', forma.id_forma_pagamento);
        container.appendChild(card);
        
        console.log(`  ✅ Forma ${index + 1}: ${forma.nome_forma}`);
    });
}

// ========================================
// SELECIONAR FORMA DE PAGAMENTO
// ========================================
function selecionarFormaPagamento(forma) {
    formaSelecionada = forma;
    
    document.querySelectorAll('.forma-pagamento-card').forEach(card => {
        if (parseInt(card.getAttribute('data-id')) === forma.id_forma_pagamento) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
    });
    
    renderizarDadosPagamento();
    document.getElementById('btnConfirmar').disabled = false;
}

// ========================================
// RENDERIZAR DADOS DE PAGAMENTO
// ========================================
function renderizarDadosPagamento() {
    const container = document.getElementById('dadosPagamentoContainer');
    const nome = formaSelecionada.nome_forma.toLowerCase();
    
    if (nome.includes('pix')) {
        const total = calcularTotal();
        gerarQRCodePix(total, MINHA_CHAVE_PIX, NOME_RECEBEDOR, CIDADE_RECEBEDOR);
        
        container.innerHTML = `
            <div class="dados-pagamento">
                <h3 class="section-title">Dados do PIX</h3>
                <div class="pix-container">
                    <img src="${qrCodePix}" alt="QR Code PIX" class="qrcode-image">
                    <p class="pix-instrucoes">Escaneie o QR Code com seu app de banco</p>
                    <button class="btn-copiar-pix" onclick="copiarCodigoPix()">
                        📋 Copiar Código PIX
                    </button>
                    <div class="codigo-pix">${copiaPix}</div>
                </div>
                <!-- Campo removido - não é necessário para pagamento PIX -->
            </div>
        `;
    } else if (nome.includes('cartão') || nome.includes('cartao')) {
        container.innerHTML = `
            <div class="dados-pagamento">
                <h3 class="section-title">Dados do Cartão</h3>
                <div class="form-group">
                    <label class="form-label">Número do Cartão</label>
                    <input 
                        type="text" 
                        class="form-input" 
                        placeholder="0000 0000 0000 0000"
                        maxlength="19"
                        oninput="formatarNumeroCartao(this)"
                    >
                </div>
                <div class="form-group">
                    <label class="form-label">Nome no Cartão</label>
                    <input 
                        type="text" 
                        class="form-input" 
                        placeholder="NOME COMO NO CARTÃO"
                        oninput="dadosPagamento.nomeCartao = this.value.toUpperCase(); this.value = this.value.toUpperCase()"
                    >
                </div>
                <div class="form-grid-2">
                    <div class="form-group">
                        <label class="form-label">Validade</label>
                        <input 
                            type="text" 
                            class="form-input" 
                            placeholder="MM/AA"
                            maxlength="5"
                            oninput="formatarValidadeCartao(this)"
                        >
                    </div>
                    <div class="form-group">
                        <label class="form-label">CVV</label>
                        <input 
                            type="text" 
                            class="form-input" 
                            placeholder="123"
                            maxlength="4"
                            oninput="dadosPagamento.cvv = this.value.replace(/\\D/g, ''); this.value = dadosPagamento.cvv"
                        >
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">CPF do Titular</label>
                    <input 
                        type="text" 
                        class="form-input" 
                        placeholder="000.000.000-00"
                        maxlength="14"
                        oninput="formatarCPF(this)"
                    >
                </div>
            </div>
        `;
    } else if (nome.includes('dinheiro')) {
        const total = calcularTotal();
        container.innerHTML = `
            <div class="dados-pagamento">
                <h3 class="section-title">Pagamento em Dinheiro</h3>
                <div class="dinheiro-container">
                    <div class="dinheiro-icon">💵</div>
                    <p class="dinheiro-texto">Pagamento será realizado na entrega</p>
                    <p class="dinheiro-valor">${formatarMoeda(total)}</p>
                </div>
            </div>
        `;
    }
}

// ========================================
// GERAR QR CODE PIX - BASEADO NO PADRÃO BACEN
// ========================================
function gerarQRCodePix(valor, chave, nome, cidade) {
    console.log('📱 Gerando QR Code PIX...');
    console.log('   Chave:', chave);
    console.log('   Valor:', valor);
    console.log('   Nome:', nome);
    console.log('   Cidade:', cidade);
    
    // Validar chave PIX
    if (!chave || chave === 'seu_email@exemplo.com') {
        alert('⚠️ ATENÇÃO: Configure sua chave PIX no código! Procure por "MINHA_CHAVE_PIX" no arquivo finalizacao.js');
        console.error('❌ Chave PIX não configurada!');
    }
    
    // Formato TLV (Tag-Length-Value) do padrão BR Code
    const txid = `PED${Date.now()}`;
    
    // Campo 26: Merchant Account Information (PIX)
    const gui = '0014br.gov.bcb.pix';
    const pixKey = `01${String(chave.length).padStart(2, '0')}${chave}`;
    const merchantAccount = `26${String(gui.length + pixKey.length).padStart(2, '0')}${gui}${pixKey}`;
    
    // Campo 52: Merchant Category Code
    const mcc = '52040000';
    
    // Campo 53: Transaction Currency (986 = BRL)
    const currency = '5303986';
    
    // Campo 54: Transaction Amount
    const amount = `54${String(valor.toFixed(2).length).padStart(2, '0')}${valor.toFixed(2)}`;
    
    // Campo 58: Country Code
    const countryCode = '5802BR';
    
    // Campo 59: Merchant Name
    const merchantName = `59${String(nome.length).padStart(2, '0')}${nome}`;
    
    // Campo 60: Merchant City
    const merchantCity = `60${String(cidade.length).padStart(2, '0')}${cidade}`;
    
    // Campo 62: Additional Data Field Template
    const additionalData = `05${String(txid.length).padStart(2, '0')}${txid}`;
    const additionalField = `62${String(additionalData.length).padStart(2, '0')}${additionalData}`;
    
    // Montar payload sem CRC
    const payloadSemCRC = `000201${merchantAccount}${mcc}${currency}${amount}${countryCode}${merchantName}${merchantCity}${additionalField}6304`;
    
    // Calcular CRC16
    const crc = calcularCRC16(payloadSemCRC);
    
    // Payload completo
    const payloadCompleto = payloadSemCRC + crc;
    
    console.log('✅ Payload PIX gerado:', payloadCompleto.substring(0, 50) + '...');
    
    copiaPix = payloadCompleto;
    qrCodePix = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(payloadCompleto)}`;
}

// Função auxiliar para calcular CRC16
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
// CONFIRMAR PAGAMENTO
// ========================================
async function confirmarPagamento() {
    if (!formaSelecionada) {
        mostrarErro('Selecione uma forma de pagamento');
        return;
    }

    const nome = formaSelecionada.nome_forma.toLowerCase();

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
            mostrarErro('Validade do cartão inválida (MM/AA)');
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

    if (nome.includes('pix')) {
        if (!dadosPagamento.pixChave || dadosPagamento.pixChave.length < 5) {
            mostrarErro('Chave PIX inválida');
            return;
        }
    }

    document.getElementById('mainScreen').style.display = 'none';
    document.getElementById('processingScreen').style.display = 'flex';

    try {
        const total = calcularTotal();

        const pedidoData = {
            cpf: usuario.id,
            data_pedido: new Date().toISOString().split('T')[0],
            valor_total: total,
            itens: carrinho.map(item => ({
                id_produto: item.id_produto,
                quantidade: item.quantidade,
                preco_unitario: item.preco
            }))
        };

        console.log('📦 Criando pedido:', pedidoData);

        const respPedido = await fetch(`${API_BASE_URL}/finalizacao/pedidos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(pedidoData)
        });

        if (!respPedido.ok) throw new Error('Erro ao criar pedido');
        const pedido = await respPedido.json();
        pedidoId = pedido.id_pedido;

        console.log('✅ Pedido criado:', pedidoId);

        const pagamentoData = {
            id_pedido: pedidoId,
            id_forma_pagamento: formaSelecionada.id_forma_pagamento,
            valor_total: total
        };

        console.log('💳 Processando pagamento:', pagamentoData);

        const respPagamento = await fetch(`${API_BASE_URL}/finalizacao/processar-pagamento`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(pagamentoData)
        });

        if (!respPagamento.ok) throw new Error('Erro ao processar pagamento');

        console.log('✅ Pagamento processado com sucesso!');

        document.getElementById('processingScreen').style.display = 'none';
        document.getElementById('successScreen').style.display = 'flex';
        document.getElementById('pedidoNumero').textContent = pedidoId;

        localStorage.removeItem('carrinho');

        setTimeout(() => {
            window.location.href = '../menu.html';
        }, 5000);

    } catch (error) {
        console.error('❌ Erro ao processar pagamento:', error);
        document.getElementById('processingScreen').style.display = 'none';
        document.getElementById('errorScreen').style.display = 'flex';
        document.getElementById('errorMessage').textContent = error.message || 'Erro ao processar pagamento';
    }
}

// ========================================
// FUNÇÕES AUXILIARES
// ========================================
function calcularTotal() {
    return carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0);
}

function copiarCodigoPix() {
    navigator.clipboard.writeText(copiaPix);
    alert('✅ Código PIX copiado para a área de transferência!');
}

function voltarCarrinho() {
    window.location.href = '../carrinho/carrinho.html';
}

function tentarNovamente() {
    location.reload();
}

function mostrarErro(mensagem) {
    const container = document.getElementById('errorContainer');
    container.innerHTML = `<div class="error-message">${mensagem}</div>`;
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}

console.log('✅ finalizacao.js carregado com sucesso!');