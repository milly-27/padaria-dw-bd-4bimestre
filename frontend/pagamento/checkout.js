// Configuração da API
const API_BASE_URL = 'http://localhost:3001';

// Elementos do DOM
const messageContainer = document.getElementById('messageContainer');
const pedidoNumero = document.getElementById('pedidoNumero');
const pedidoTotal = document.getElementById('pedidoTotal');
const pixSection = document.getElementById('pix-section');
const cartaoSection = document.getElementById('cartao-section');
const qrcodeContainer = document.getElementById('qrcode');
const codigoPix = document.getElementById('codigoPix');
const btnCopiarPix = document.getElementById('btnCopiarPix');
const btnPagoPix = document.getElementById('btnPagoPix');
const formCartao = document.getElementById('formCartao');
const modal = document.getElementById('modalConfirmacao');
const modalNumeroPedido = document.getElementById('modalNumeroPedido');
const modalValorPedido = document.getElementById('modalValorPedido');
const btnFecharModal = document.getElementById('btnFecharModal');

// Variáveis globais
let pedidoId = null;
let valorTotal = 0;

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    // Obter dados da URL
    const urlParams = new URLSearchParams(window.location.search);
    pedidoId = urlParams.get('pedido_id');
    valorTotal = parseFloat(urlParams.get('total')) || 0;

    // Verificar se temos um pedido válido
    if (!pedidoId || isNaN(valorTotal) || valorTotal <= 0) {
        mostrarMensagem('Pedido inválido ou não encontrado.', 'error');
        return;
    }

    // Atualizar interface
    atualizarInterface();
    
    // Configurar event listeners
    configurarEventListeners();
    
    // Inicializar PIX (método padrão)
    inicializarPix();
});

// Configurar event listeners
function configurarEventListeners() {
    // Alternar entre PIX e Cartão
    document.querySelectorAll('input[name="metodo-pagamento"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'pix') {
                pixSection.style.display = 'block';
                cartaoSection.style.display = 'none';
            } else {
                pixSection.style.display = 'none';
                cartaoSection.style.display = 'block';
            }
        });
    });

    // Botão copiar PIX
    btnCopiarPix.addEventListener('click', copiarCodigoPix);
    
    // Botão de confirmação de pagamento PIX
    btnPagoPix.addEventListener('click', confirmarPagamentoPix);
    
    // Formulário de cartão
    formCartao.addEventListener('submit', processarPagamentoCartao);
    
    // Fechar modal
    btnFecharModal.addEventListener('click', () => {
        modal.style.display = 'none';
        window.location.href = '../cardapio/cardapio.html';
    });
    
    // Máscara para número do cartão
    document.getElementById('numeroCartao').addEventListener('input', formatarNumeroCartao);
    
    // Máscara para validade
    document.getElementById('validade').addEventListener('input', formatarValidade);
}

// Atualizar interface
function atualizarInterface() {
    pedidoNumero.textContent = pedidoId;
    pedidoTotal.textContent = valorTotal.toFixed(2).replace('.', ',');
}

// Inicializar PIX
async function inicializarPix() {
    try {
        // Em um ambiente real, você faria uma chamada para sua API para gerar o QR Code
        // Aqui estamos simulando um código PIX
        const qrCodeData = {
            pedidoId: pedidoId,
            valor: valorTotal,
            chavePix: 'sua-chave-pix@exemplo.com',
            nomeBeneficiario: 'Padaria do Seu Zé',
            cidade: 'Sua Cidade',
            txId: `PIX${Date.now()}`
        };
        
        // Gerar código PIX copia e cola
        const codigoPixText = `00020126330014BR.GOV.BCB.PIX0111${qrCodeData.chavePix}5204000053039865802BR5914PADARIA SEU ZOE6008BRASILIA62070503***${qrCodeData.txId}6304`;
        codigoPix.value = codigoPixText;
        
        // Gerar QR Code (usando a biblioteca QRCode.js)
        if (typeof QRCode !== 'undefined') {
            qrcodeContainer.innerHTML = ''; // Limpar QR Code anterior
            new QRCode(qrcodeContainer, {
                text: codigoPixText,
                width: 200,
                height: 200,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.H
            });
        }
        
    } catch (error) {
        console.error('Erro ao inicializar PIX:', error);
        mostrarMensagem('Erro ao configurar pagamento PIX. Tente novamente.', 'error');
    }
}

// Copiar código PIX
function copiarCodigoPix() {
    codigoPix.select();
    document.execCommand('copy');
    mostrarMensagem('Código PIX copiado para a área de transferência!', 'success');
}

// Confirmar pagamento PIX
async function confirmarPagamentoPix() {
    try {
        // Em um ambiente real, você verificaria o status do pagamento na API do seu gateway de pagamento
        // Aqui estamos simulando um pagamento bem-sucedido após 2 segundos
        mostrarMensagem('Processando pagamento PIX...', 'info');
        
        setTimeout(async () => {
            try {
                // Atualizar status do pedido para pago
                const response = await fetch(`${API_BASE_URL}/api/pedidos/${pedidoId}/status`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'pago' })
                });
                
                if (!response.ok) throw new Error('Erro ao atualizar status do pedido');
                
                // Mostrar mensagem de sucesso
                mostrarMensagem('Pagamento confirmado com sucesso!', 'success');
                
                // Exibir modal de confirmação
                modalNumeroPedido.textContent = pedidoId;
                modalValorPedido.textContent = `R$ ${valorTotal.toFixed(2).replace('.', ',')}`;
                modal.style.display = 'flex';
                
            } catch (error) {
                console.error('Erro ao confirmar pagamento:', error);
                mostrarMensagem('Erro ao confirmar pagamento. Tente novamente.', 'error');
            }
        }, 2000);
        
    } catch (error) {
        console.error('Erro ao processar pagamento PIX:', error);
        mostrarMensagem('Erro ao processar pagamento PIX. Tente novamente.', 'error');
    }
}

// Processar pagamento com cartão
async function processarPagamentoCartao(e) {
    e.preventDefault();
    
    // Validar cartão
    if (!validarCartao()) {
        return;
    }
    
    try {
        mostrarMensagem('Processando pagamento com cartão...', 'info');
        
        // Em um ambiente real, você enviaria os dados do cartão para sua API de pagamento
        // Aqui estamos simulando um processamento de cartão
        setTimeout(async () => {
            try {
                // Atualizar status do pedido para pago
                const response = await fetch(`${API_BASE_URL}/api/pedidos/${pedidoId}/status`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'pago' })
                });
                
                if (!response.ok) throw new Error('Erro ao atualizar status do pedido');
                
                // Mostrar mensagem de sucesso
                mostrarMensagem('Pagamento aprovado com sucesso!', 'success');
                
                // Exibir modal de confirmação
                modalNumeroPedido.textContent = pedidoId;
                modalValorPedido.textContent = `R$ ${valorTotal.toFixed(2).replace('.', ',')}`;
                modal.style.display = 'flex';
                
            } catch (error) {
                console.error('Erro ao processar pagamento:', error);
                mostrarMensagem('Erro ao processar pagamento. Verifique os dados e tente novamente.', 'error');
            }
        }, 2000);
        
    } catch (error) {
        console.error('Erro ao processar cartão:', error);
        mostrarMensagem('Erro ao processar cartão. Tente novamente.', 'error');
    }
}

// Validar cartão de crédito
function validarCartao() {
    const numero = document.getElementById('numeroCartao').value.replace(/\D/g, '');
    const nome = document.getElementById('nomeTitular').value.trim();
    const validade = document.getElementById('validade').value;
    const cvv = document.getElementById('cvv').value;
    
    // Validar número do cartão (algoritmo de Luhn)
    if (!validarNumeroCartao(numero)) {
        mostrarMensagem('Número de cartão inválido.', 'error');
        return false;
    }
    
    // Validar nome do titular
    if (nome.length < 3) {
        mostrarMensagem('Nome do titular inválido.', 'error');
        return false;
    }
    
    // Validar data de validade (MM/AA)
    if (!/^\d{2}\/\d{2}$/.test(validade)) {
        mostrarMensagem('Data de validade inválida. Use o formato MM/AA.', 'error');
        return false;
    }
    
    // Validar CVV
    if (!/^\d{3,4}$/.test(cvv)) {
        mostrarMensagem('CVV inválido. Deve conter 3 ou 4 dígitos.', 'error');
        return false;
    }
    
    return true;
}

// Validar número do cartão usando o algoritmo de Luhn
function validarNumeroCartao(numero) {
    // Remover espaços e traços
    numero = numero.replace(/\D/g, '');
    
    // O número deve ter entre 13 e 19 dígitos
    if (!/^\d{13,19}$/.test(numero)) {
        return false;
    }
    
    // Algoritmo de Luhn
    let soma = 0;
    let deveDobrar = false;
    
    // Percorre os dígitos do cartão da direita para a esquerda
    for (let i = numero.length - 1; i >= 0; i--) {
        let digito = parseInt(numero.charAt(i));
        
        if (deveDobrar) {
            digito *= 2;
            if (digito > 9) {
                digito = (digito % 10) + 1;
            }
        }
        
        soma += digito;
        deveDobrar = !deveDobrar;
    }
    
    return (soma % 10) === 0;
}

// Formatar número do cartão (adiciona espaços a cada 4 dígitos)
function formatarNumeroCartao(e) {
    let value = e.target.value.replace(/\D/g, '');
    
    // Limitar a 16 dígitos
    value = value.substring(0, 16);
    
    // Adicionar espaço a cada 4 dígitos
    value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    
    e.target.value = value;
}

// Formatar data de validade (MM/AA)
function formatarValidade(e) {
    let value = e.target.value.replace(/\D/g, '');
    
    // Limitar a 4 dígitos
    value = value.substring(0, 4);
    
    // Adicionar barra após 2 dígitos
    if (value.length > 2) {
        value = value.substring(0, 2) + '/' + value.substring(2);
    }
    
    e.target.value = value;
}

// Mostrar mensagem
function mostrarMensagem(mensagem, tipo = 'info') {
    messageContainer.innerHTML = `
        <div class="message ${tipo}">
            ${mensagem}
        </div>
    `;
    
    // Remover mensagem após 5 segundos
    if (tipo !== 'info') {
        setTimeout(() => {
            messageContainer.innerHTML = '';
        }, 5000);
    }
}
