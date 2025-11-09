// Configurações da API
const API_BASE_URL = 'http://localhost:3001/api';

/**
 * Formata um valor numérico para moeda brasileira (R$)
 * @param {number} value - Valor a ser formatado
 * @returns {string} Valor formatado
 */
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value || 0);
}

/**
 * Formata uma data para o formato brasileiro (DD/MM/YYYY)
 * @param {string|Date} date - Data a ser formatada
 * @returns {string} Data formatada
 */
function formatDate(date) {
    if (!date) return '';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    return d.toLocaleDateString('pt-BR');
}

/**
 * Formata o nome do mês em português
 * @param {number} month - Número do mês (1-12)
 * @returns {string} Nome do mês
 */
function getMonthName(month) {
    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month - 1] || '';
}

/**
 * Exibe uma mensagem de carregamento
 * @param {string} message - Mensagem a ser exibida
 */
function showLoading(message = 'Carregando...') {
    // Remove mensagens de erro existentes
    hideMessages();
    
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loadingMessage';
    loadingDiv.className = 'message message-info';
    loadingDiv.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-repeat" viewBox="0 0 16 16" style="animation: spin 1s linear infinite;">
            <path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z"/>
            <path fill-rule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z"/>
        </svg>
        ${message}
    `;
    
    // Tenta adicionar a mensagem em diferentes locais possíveis
    const container = document.querySelector('.report-container') || 
                     document.querySelector('.container') || 
                     document.body;
    
    if (container) {
        container.prepend(loadingDiv);
    } else {
        console.warn('Não foi possível encontrar um container para exibir a mensagem de carregamento');
        document.body.prepend(loadingDiv);
    }
}

/**
 * Remove a mensagem de carregamento
 */
function hideLoading() {
    const loadingElement = document.getElementById('loadingMessage');
    if (loadingElement) {
        loadingElement.remove();
    }
}

/**
 * Exibe uma mensagem de sucesso
 * @param {string} message - Mensagem a ser exibida
 */
function showSuccess(message) {
    showMessage(message, 'success');
}

/**
 * Exibe uma mensagem de erro
 * @param {string} message - Mensagem a ser exibida
 */
function showError(message) {
    showMessage(message, 'error');
}

/**
 * Exibe uma mensagem informativa
 * @param {string} message - Mensagem a ser exibida
 */
function showInfo(message) {
    showMessage(message, 'info');
}

/**
 * Exibe uma mensagem
 * @param {string} message - Mensagem a ser exibida
 * @param {string} type - Tipo da mensagem (success, error, warning, info)
 */
function showMessage(message, type = 'info') {
    hideMessages();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    
    let icon = '';
    switch (type) {
        case 'success':
            icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-circle" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/></svg>';
            break;
        case 'error':
            icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-exclamation-triangle" viewBox="0 0 16 16"><path d="M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.146.146 0 0 1 .054.057l6.857 11.667c.036.06.035.124.002.183a.163.163 0 0 1-.054.06.116.116 0 0 1-.066.017H1.146a.115.115 0 0 1-.066-.017.163.163 0 0 1-.054-.06.176.176 0 0 1 .002-.183L7.884 2.073a.147.147 0 0 1 .054-.057zm1.044-.45a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566z"/><path d="M7.002 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 5.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995z"/></svg>';
            break;
        case 'warning':
            icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-exclamation-triangle" viewBox="0 0 16 16"><path d="M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.146.146 0 0 1 .054.057l6.857 11.667c.036.06.035.124.002.183a.163.163 0 0 1-.054.06.116.116 0 0 1-.066.017H1.146a.115.115 0 0 1-.066-.017.163.163 0 0 1-.054-.06.176.176 0 0 1 .002-.183L7.884 2.073a.147.147 0 0 1 .054-.057zm1.044-.45a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566z"/><path d="M7.002 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 5.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995z"/></svg>';
            break;
        default:
            icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-info-circle" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/></svg>';
    }
    
    messageDiv.innerHTML = `${icon} ${message}`;
    
    // Adiciona a mensagem ao contêiner
    const messagesContainer = document.getElementById('messages-container');
    if (messagesContainer) {
        messagesContainer.appendChild(messageDiv);
        
        // Remove a mensagem após 5 segundos (exceto para erros)
        if (type !== 'error') {
            setTimeout(() => {
                messageDiv.style.opacity = '0';
                setTimeout(() => messageDiv.remove(), 300);
            }, 5000);
        }
    }
}

/**
 * Remove todas as mensagens
 */
function hideMessages() {
    document.querySelectorAll('.message').forEach(el => el.remove());
}

/**
 * Faz uma requisição à API
 * @param {string} endpoint - Endpoint da API
 * @param {Object} params - Parâmetros da requisição
 * @returns {Promise<any>} Resposta da API
 */
async function fetchData(endpoint, params = {}) {
    try {
        // Remove a barra inicial do endpoint se existir
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
        
        // Cria a URL baseada no endpoint limpo
        let url = new URL(`${API_BASE_URL}/${cleanEndpoint}`);
        
        // Adiciona os parâmetros à URL
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== '') {
                url.searchParams.append(key, params[key]);
            }
        });
        
        console.log(`🔍 Fazendo requisição para: ${url.toString()}`);
        
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : undefined
            },
            credentials: 'include', // Importante para enviar cookies
            mode: 'cors' // Garante que o CORS seja tratado corretamente
        });
        
        console.log('📥 Resposta recebida:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
        });
        
        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
                console.error('❌ Erro na resposta:', errorData);
            } catch (e) {
                console.error('❌ Erro ao processar resposta de erro:', e);
                throw new Error(`Erro ${response.status}: ${response.statusText}`);
            }
            throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ Dados recebidos:', data);
        return data;
    } catch (error) {
        console.error('❌ Erro na requisição:', {
            message: error.message,
            stack: error.stack
        });
        throw error;
    }
}

/**
 * Inicializa os tooltips
 */
function initTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

/**
 * Formata um número para o padrão brasileiro
 * @param {number} value - Valor a ser formatado
 * @param {number} decimals - Número de casas decimais
 * @returns {string} Número formatado
 */
function formatNumber(value, decimals = 2) {
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(value || 0);
}

/**
 * Inicializa os tooltips do Bootstrap
 */
function initBootstrapTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// Exporta as funções para uso em outros arquivos
export {
    formatCurrency,
    formatDate,
    getMonthName,
    showLoading,
    hideLoading,
    showSuccess,
    showError,
    showInfo,
    showMessage,
    hideMessages,
    fetchData,
    formatNumber,
    initTooltips,
    initBootstrapTooltips
};
