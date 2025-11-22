const API_BASE_URL = 'http://localhost:3001';

// Dados do usuário logado
let userData = null;
let pedidosCache = [];

// ========================================
// INICIALIZAÇÃO
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    verificarLogin();
    configurarEventListeners();
});

function configurarEventListeners() {
    document.getElementById('filterData').addEventListener('change', filtrarPedidos);
    document.getElementById('btnLimparFiltro').addEventListener('click', limparFiltro);
    
    // Fechar modal ao clicar fora
    document.getElementById('modalDetalhes').addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            fecharModal();
        }
    });
    
    // Fechar modal com ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') fecharModal();
    });
}

// ========================================
// VERIFICAR LOGIN
// ========================================
function verificarLogin() {
    const userId = sessionStorage.getItem('userId');
    const userName = sessionStorage.getItem('userName');
    const userEmail = sessionStorage.getItem('userEmail');
    
    if (!userId || !userName) {
        // Não está logado, redirecionar
        alert('Você precisa estar logado para ver suas compras.');
        window.location.href = '../auth/login.html';
        return;
    }
    
    userData = {
        cpf: userId,
        nome: userName,
        email: userEmail || '-'
    };
    
    // Atualizar UI com dados do usuário
    document.getElementById('userName').textContent = userData.nome;
    document.getElementById('userEmail').textContent = userData.email;
    
    // Carregar pedidos
    carregarPedidos();
}

// ========================================
// CARREGAR PEDIDOS
// ========================================
async function carregarPedidos() {
    const container = document.getElementById('pedidosContainer');
    const emptyState = document.getElementById('emptyState');
    
    try {
        // Buscar pedidos do usuário pelo CPF
        const response = await fetch(`${API_BASE_URL}/finalizacao/pedidos?cpf=${userData.cpf}`);
        
        if (!response.ok) {
            throw new Error('Erro ao carregar pedidos');
        }
        
        const pedidos = await response.json();
        pedidosCache = pedidos;
        
        if (pedidos.length === 0) {
            container.innerHTML = '';
            emptyState.classList.remove('hidden');
            atualizarEstatisticas(0, 0);
            return;
        }
        
        emptyState.classList.add('hidden');
        renderizarPedidos(pedidos);
        calcularEstatisticas(pedidos);
        
    } catch (error) {
        console.error('Erro ao carregar pedidos:', error);
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">❌</div>
                <h3>Erro ao carregar pedidos</h3>
                <p>Não foi possível carregar seus pedidos. Tente novamente.</p>
                <button onclick="carregarPedidos()" class="btn-primary">Tentar Novamente</button>
            </div>
        `;
    }
}

// ========================================
// RENDERIZAR PEDIDOS
// ========================================
function renderizarPedidos(pedidos) {
    const container = document.getElementById('pedidosContainer');
    
    if (pedidos.length === 0) {
        container.innerHTML = '';
        document.getElementById('emptyState').classList.remove('hidden');
        return;
    }
    
    document.getElementById('emptyState').classList.add('hidden');
    
    container.innerHTML = pedidos.map(pedido => {
        const data = formatarData(pedido.data_pedido);
        const valor = formatarMoeda(pedido.valor_total);
        const statusClass = getStatusClass(pedido.status_pagamento);
        const statusTexto = pedido.status_pagamento || 'Pendente';
        
        return `
            <div class="pedido-card" data-id="${pedido.id_pedido}">
                <div class="pedido-header">
                    <div class="pedido-icon">🧾</div>
                    <div class="pedido-info">
                        <h3>Pedido #${pedido.id_pedido}</h3>
                        <p>${data}</p>
                    </div>
                </div>
                <div class="pedido-details">
                    <div class="pedido-valor">
                        <span class="valor">${valor}</span>
                        <span class="itens">${pedido.total_itens || '-'} item(ns)</span>
                    </div>
                    <span class="status-badge ${statusClass}">${statusTexto}</span>
                    <button class="btn-detalhes" onclick="verDetalhes(${pedido.id_pedido})">
                        Ver Detalhes
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// ========================================
// CALCULAR ESTATÍSTICAS
// ========================================
function calcularEstatisticas(pedidos) {
    const total = pedidos.length;
    const totalGasto = pedidos.reduce((sum, p) => sum + parseFloat(p.valor_total || 0), 0);
    
    atualizarEstatisticas(total, totalGasto);
}

function atualizarEstatisticas(totalPedidos, totalGasto) {
    document.getElementById('totalPedidos').textContent = totalPedidos;
    document.getElementById('totalGasto').textContent = formatarMoeda(totalGasto);
}

// ========================================
// VER DETALHES DO PEDIDO
// ========================================
async function verDetalhes(pedidoId) {
    const modal = document.getElementById('modalDetalhes');
    const modalItens = document.getElementById('modalItens');
    
    // Mostrar modal com loading
    modalItens.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    modal.classList.remove('hidden');
    
    try {
        const response = await fetch(`${API_BASE_URL}/finalizacao/pedidos/${pedidoId}`);
        
        if (!response.ok) {
            throw new Error('Erro ao carregar detalhes');
        }
        
        const pedido = await response.json();
        
        // Preencher modal
        document.getElementById('modalPedidoId').textContent = pedido.id_pedido;
        document.getElementById('modalData').textContent = formatarData(pedido.data_pedido);
        
        const statusEl = document.getElementById('modalStatus');
        const statusTexto = pedido.pagamento ? 'Pago' : 'Pendente';
        statusEl.textContent = statusTexto;
        statusEl.className = 'status-badge ' + (pedido.pagamento ? 'status-pago' : 'status-pendente');
        
        // Renderizar itens
        if (pedido.itens && pedido.itens.length > 0) {
            modalItens.innerHTML = pedido.itens.map(item => `
                <div class="modal-item">
                    <div class="item-info">
                        <div class="item-img">🍞</div>
                        <div>
                            <div class="item-nome">${item.nome_produto || 'Produto'}</div>
                            <div class="item-qtd">Qtd: ${item.quantidade} x ${formatarMoeda(item.preco_unitario)}</div>
                        </div>
                    </div>
                    <div class="item-preco">${formatarMoeda(item.quantidade * item.preco_unitario)}</div>
                </div>
            `).join('');
        } else {
            modalItens.innerHTML = '<p style="text-align: center; color: var(--text-light);">Sem itens registrados</p>';
        }
        
        document.getElementById('modalTotal').textContent = formatarMoeda(pedido.valor_total);
        
    } catch (error) {
        console.error('Erro ao carregar detalhes:', error);
        modalItens.innerHTML = `
            <div style="text-align: center; color: var(--danger);">
                <p>Erro ao carregar detalhes do pedido.</p>
            </div>
        `;
    }
}

function fecharModal() {
    document.getElementById('modalDetalhes').classList.add('hidden');
}

// ========================================
// FILTROS
// ========================================
function filtrarPedidos() {
    const filtroData = document.getElementById('filterData').value;
    
    if (!filtroData) {
        renderizarPedidos(pedidosCache);
        calcularEstatisticas(pedidosCache);
        return;
    }
    
    const [ano, mes] = filtroData.split('-');
    
    const pedidosFiltrados = pedidosCache.filter(pedido => {
        const dataPedido = new Date(pedido.data_pedido);
        return dataPedido.getFullYear() == ano && (dataPedido.getMonth() + 1) == parseInt(mes);
    });
    
    renderizarPedidos(pedidosFiltrados);
    calcularEstatisticas(pedidosFiltrados);
}

function limparFiltro() {
    document.getElementById('filterData').value = '';
    renderizarPedidos(pedidosCache);
    calcularEstatisticas(pedidosCache);
}

// ========================================
// FUNÇÕES AUXILIARES
// ========================================
function formatarData(dataString) {
    if (!dataString) return '-';
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor || 0);
}

function getStatusClass(status) {
    if (!status) return 'status-pendente';
    const s = status.toLowerCase();
    if (s === 'pago') return 'status-pago';
    if (s === 'cancelado') return 'status-cancelado';
    return 'status-pendente';
}

// Expor funções globalmente
window.verDetalhes = verDetalhes;
window.fecharModal = fecharModal;
window.carregarPedidos = carregarPedidos;