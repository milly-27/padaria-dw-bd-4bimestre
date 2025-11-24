// ========================================
// CARDÁPIO.JS - VERSÃO COMPLETA COM sessionStorage
// ========================================

// Configuração da API
const API_BASE_URL = 'http://localhost:3001';

// Elementos do DOM
const filtroCategoria = document.getElementById('filtroCategoria');
const buscarProduto = document.getElementById('buscarProduto');
const btnBuscar = document.getElementById('btnBuscar');
const btnLimpar = document.getElementById('btnLimpar');
const produtosContainer = document.getElementById('produtosContainer');
const loadingMessage = document.getElementById('loadingMessage');
const emptyMessage = document.getElementById('emptyMessage');
const messageContainer = document.getElementById('messageContainer');

// Variável para armazenar produtos carregados
let produtosCarregados = [];

// ========================================
// MIGRAÇÃO AUTOMÁTICA: localStorage → sessionStorage
// ========================================
function migrarCarrinhoParaSessionStorage() {
    try {
        const carrinhoLocal = localStorage.getItem('carrinho');
        const carrinhoSession = sessionStorage.getItem('carrinho');
        
        if (carrinhoLocal && !carrinhoSession) {
            console.log('🔄 [MIGRAÇÃO] Movendo carrinho para sessionStorage...');
            sessionStorage.setItem('carrinho', carrinhoLocal);
            localStorage.removeItem('carrinho');
            console.log('✅ [MIGRAÇÃO] Concluída!');
        } else if (carrinhoLocal) {
            // Limpar localStorage antigo
            localStorage.removeItem('carrinho');
        }
    } catch (error) {
        console.error('❌ Erro na migração:', error);
    }
}

// ========================================
// OBTER QUANTIDADE DO CARRINHO - sessionStorage
// ========================================
function obterQuantidadeCarrinho() {
    try {
        // SEMPRE buscar do sessionStorage
        const carrinhoStr = sessionStorage.getItem('carrinho');
        
        if (!carrinhoStr) {
            return 0;
        }
        
        const carrinho = JSON.parse(carrinhoStr);
        
        if (!Array.isArray(carrinho)) {
            return 0;
        }
        
        // Somar todas as quantidades
        const total = carrinho.reduce((soma, item) => {
            return soma + (parseInt(item.quantidade) || 0);
        }, 0);
        
        console.log('🛒 [BADGE] Quantidade atual:', total);
        return total;
        
    } catch (error) {
        console.error('❌ Erro ao obter quantidade:', error);
        return 0;
    }
}

// ========================================
// ATUALIZAR CONTADOR DO CARRINHO
// ========================================
function atualizarContadorCarrinho() {
    try {
        const carrinhoCount = document.getElementById('carrinhoCount');
        
        if (!carrinhoCount) {
            console.log('⚠️ Contador do carrinho não encontrado no DOM');
            return;
        }
        
        const quantidade = obterQuantidadeCarrinho();
        
        carrinhoCount.textContent = quantidade;
        
        // Adicionar/remover classe visual se tiver itens
        if (quantidade > 0) {
            carrinhoCount.style.display = 'flex';
        } else {
            carrinhoCount.style.display = 'none';
        }
        
        console.log('✅ [CONTADOR] Atualizado:', quantidade, 'itens');
        
    } catch (error) {
        console.error('❌ Erro ao atualizar contador:', error);
    }
}

// ========================================
// ADICIONAR PRODUTO AO CARRINHO - sessionStorage
// ========================================
function adicionarProdutoAoCarrinho(idProduto) {
    try {
        console.log('➕ [ADICIONAR] ID do produto:', idProduto);
        
        const produto = produtosCarregados.find(p => p.id_produto === idProduto);
        
        if (!produto) {
            mostrarMensagem('Produto não encontrado!', 'error');
            return;
        }
        
        if (produto.quantidade_estoque === 0) {
            mostrarMensagem('Produto esgotado!', 'warning');
            return;
        }
        
        // Buscar carrinho atual do sessionStorage
        let carrinho = [];
        const carrinhoStr = sessionStorage.getItem('carrinho');
        
        if (carrinhoStr) {
            carrinho = JSON.parse(carrinhoStr);
        }
        
        // Verificar se o produto já existe no carrinho
        const itemExistente = carrinho.find(item => item.id_produto === produto.id_produto);
        
        if (itemExistente) {
            // Verificar limite de estoque
            if (itemExistente.quantidade >= produto.quantidade_estoque) {
                mostrarMensagem('Quantidade máxima em estoque já adicionada!', 'warning');
                return;
            }
            itemExistente.quantidade += 1;
            console.log('   Quantidade atualizada:', itemExistente.quantidade);
        } else {
            carrinho.push({
                id_produto: produto.id_produto,
                nome_produto: produto.nome_produto,
                preco: produto.preco,
                imagem_produto: produto.imagem_produto,
                nome_categoria: produto.nome_categoria,
                quantidade: 1
            });
            console.log('   Novo item adicionado ao carrinho');
        }
        
        // Salvar no sessionStorage
        sessionStorage.setItem('carrinho', JSON.stringify(carrinho));
        
        // Limpar localStorage antigo (se existir)
        if (localStorage.getItem('carrinho')) {
            localStorage.removeItem('carrinho');
        }
        
        // Atualizar contador
        atualizarContadorCarrinho();
        
        // Disparar evento para outras páginas
        window.dispatchEvent(new CustomEvent('carrinhoAtualizado', {
            detail: {
                quantidade: obterQuantidadeCarrinho(),
                produto: produto.nome_produto
            }
        }));
        
        // Mostrar mensagem de sucesso
        mostrarMensagem(`${produto.nome_produto} adicionado ao carrinho!`, 'success');
        
        console.log('✅ [CARRINHO] Item adicionado com sucesso!');
        console.log('📊 Total de itens:', obterQuantidadeCarrinho());
        
    } catch (error) {
        console.error('❌ Erro ao adicionar produto ao carrinho:', error);
        mostrarMensagem('Erro ao adicionar produto ao carrinho', 'error');
    }
}

// ========================================
// INICIALIZAÇÃO
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 [CARDÁPIO] Inicializando...');
    
    // 1. Migrar dados antigos
    migrarCarrinhoParaSessionStorage();
    
    // 2. Carregar dados
    carregarCategorias();
    carregarProdutos();
    
    // 3. Atualizar contador inicial
    atualizarContadorCarrinho();
    
    // 4. Escutar eventos de atualização do carrinho
    window.addEventListener('carrinhoAtualizado', (event) => {
        console.log('📢 [EVENTO] Carrinho atualizado:', event.detail);
        atualizarContadorCarrinho();
    });
    
    // 5. Atualizar contador quando a página voltar a ter foco
    window.addEventListener('focus', () => {
        console.log('👁️ [FOCUS] Página em foco, atualizando contador...');
        atualizarContadorCarrinho();
    });
    
    // 6. Escutar mudanças no storage (entre abas)
    window.addEventListener('storage', (event) => {
        if (event.key === 'carrinho' || event.storageArea === sessionStorage) {
            console.log('📢 [STORAGE] Mudança detectada no storage');
            atualizarContadorCarrinho();
        }
    });
    
    console.log('✅ [CARDÁPIO] Inicializado com sucesso!');
});

// ========================================
// EVENT LISTENERS
// ========================================
if (btnBuscar) {
    btnBuscar.addEventListener('click', buscarProdutos);
}

if (btnLimpar) {
    btnLimpar.addEventListener('click', limparFiltros);
}

if (filtroCategoria) {
    filtroCategoria.addEventListener('change', buscarProdutos);
}

// Buscar ao pressionar Enter no campo de busca
if (buscarProduto) {
    buscarProduto.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            buscarProdutos();
        }
    });
}

// ========================================
// FUNÇÃO PARA MOSTRAR MENSAGENS
// ========================================
function mostrarMensagem(texto, tipo = 'info') {
    if (!messageContainer) {
        console.log(`[${tipo.toUpperCase()}] ${texto}`);
        return;
    }
    
    messageContainer.innerHTML = `<div class="message ${tipo}">${texto}</div>`;
    
    setTimeout(() => {
        if (messageContainer) {
            messageContainer.innerHTML = '';
        }
    }, 3000);
}

// ========================================
// CARREGAR CATEGORIAS
// ========================================
async function carregarCategorias() {
    try {
        console.log('📂 [CATEGORIAS] Carregando...');
        
        const response = await fetch(`${API_BASE_URL}/cardapio/categorias`);
        
        if (!response.ok) {
            throw new Error('Erro ao carregar categorias');
        }

        const categorias = await response.json();
        
        // Limpar opções existentes (exceto "Todas as Categorias")
        if (filtroCategoria) {
            filtroCategoria.innerHTML = '<option value="todas">Todas as Categorias</option>';

            categorias.forEach(categoria => {
                const option = document.createElement('option');
                option.value = categoria.id_categoria;
                option.textContent = categoria.nome_categoria;
                filtroCategoria.appendChild(option);
            });
        }
        
        console.log('✅ [CATEGORIAS]', categorias.length, 'categorias carregadas');
        
    } catch (error) {
        console.error('❌ [CATEGORIAS] Erro ao carregar:', error);
        mostrarMensagem('Erro ao carregar categorias', 'error');
    }
}

// ========================================
// CARREGAR PRODUTOS
// ========================================
async function carregarProdutos(categoriaId = 'todas') {
    try {
        console.log('📦 [PRODUTOS] Carregando...');
        
        mostrarLoading(true);
        
        let url = `${API_BASE_URL}/cardapio/produtos`;
        if (categoriaId !== 'todas') {
            url += `?categoria_id=${categoriaId}`;
        }

        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Erro ao carregar produtos');
        }

        const produtos = await response.json();
        
        mostrarLoading(false);
        renderizarProdutos(produtos);
        
        console.log('✅ [PRODUTOS]', produtos.length, 'produtos carregados');
        
    } catch (error) {
        console.error('❌ [PRODUTOS] Erro ao carregar:', error);
        mostrarLoading(false);
        mostrarMensagem('Erro ao carregar produtos', 'error');
    }
}

// ========================================
// BUSCAR PRODUTOS COM FILTROS
// ========================================
async function buscarProdutos() {
    try {
        mostrarLoading(true);
        
        const categoriaId = filtroCategoria ? filtroCategoria.value : 'todas';
        const termoBusca = buscarProduto ? buscarProduto.value.trim().toLowerCase() : '';
        
        console.log('🔍 [BUSCA] Buscando produtos...');
        console.log('   Categoria:', categoriaId);
        console.log('   Termo:', termoBusca || '(vazio)');
        
        let url = `${API_BASE_URL}/cardapio/produtos`;
        if (categoriaId !== 'todas') {
            url += `?categoria_id=${categoriaId}`;
        }

        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Erro ao carregar produtos');
        }

        let produtos = await response.json();
        
        // Filtrar por nome se houver termo de busca
        if (termoBusca) {
            produtos = produtos.filter(produto => 
                produto.nome_produto.toLowerCase().includes(termoBusca)
            );
            console.log(`   ✅ ${produtos.length} produtos encontrados com "${termoBusca}"`);
        }
        
        mostrarLoading(false);
        renderizarProdutos(produtos);
        
        if (produtos.length === 0 && termoBusca) {
            mostrarMensagem(`Nenhum produto encontrado com "${termoBusca}"`, 'warning');
        }
        
    } catch (error) {
        console.error('❌ [BUSCA] Erro ao buscar produtos:', error);
        mostrarLoading(false);
        mostrarMensagem('Erro ao buscar produtos', 'error');
    }
}

// ========================================
// LIMPAR FILTROS
// ========================================
function limparFiltros() {
    console.log('🔄 [FILTROS] Limpando...');
    
    if (filtroCategoria) {
        filtroCategoria.value = 'todas';
    }
    
    if (buscarProduto) {
        buscarProduto.value = '';
    }
    
    carregarProdutos();
    mostrarMensagem('Filtros limpos!', 'info');
}

// ========================================
// MOSTRAR/OCULTAR LOADING
// ========================================
function mostrarLoading(mostrar) {
    if (mostrar) {
        if (loadingMessage) loadingMessage.style.display = 'block';
        if (produtosContainer) produtosContainer.style.display = 'none';
        if (emptyMessage) emptyMessage.style.display = 'none';
    } else {
        if (loadingMessage) loadingMessage.style.display = 'none';
        if (produtosContainer) produtosContainer.style.display = 'grid';
    }
}

// ========================================
// RENDERIZAR PRODUTOS
// ========================================
function renderizarProdutos(produtos) {
    produtosCarregados = produtos; // Armazenar produtos para uso posterior
    
    if (!produtosContainer) return;
    
    produtosContainer.innerHTML = '';
    
    if (produtos.length === 0) {
        produtosContainer.style.display = 'none';
        if (emptyMessage) emptyMessage.style.display = 'block';
        return;
    }
    
    if (emptyMessage) emptyMessage.style.display = 'none';
    produtosContainer.style.display = 'grid';

    produtos.forEach(produto => {
        const produtoCard = criarCardProduto(produto);
        produtosContainer.appendChild(produtoCard);
    });
}

// ========================================
// CRIAR CARD DO PRODUTO
// ========================================
function criarCardProduto(produto) {
    if (!produto) return document.createElement('div');
    
    const card = document.createElement('div');
    card.className = 'produto-card';
    
    try {
        // Determinar classe do estoque
        let estoqueClasse = '';
        let estoqueTexto = `Estoque: ${produto.quantidade_estoque} unidades`;
        let botaoDisabled = '';
        
        if (produto.quantidade_estoque === 0) {
            estoqueClasse = 'estoque-zero';
            estoqueTexto = 'Produto esgotado';
            botaoDisabled = 'disabled';
        } else if (produto.quantidade_estoque <= 5) {
            estoqueClasse = 'estoque-baixo';
            estoqueTexto = `Últimas ${produto.quantidade_estoque} unidades`;
        }
        
        // Construir URL da imagem
        const imagemUrl = produto.imagem_produto 
            ? `${API_BASE_URL}${produto.imagem_produto}`
            : null;
        
        // HTML da imagem
        const imagemHtml = imagemUrl
            ? `<img src="${imagemUrl}" alt="${produto.nome_produto}" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'sem-imagem\\'>Sem imagem</div>';">`
            : '<div class="sem-imagem">Sem imagem disponível</div>';
        
        card.innerHTML = `
            <div class="produto-imagem">
                ${imagemHtml}
            </div>
            <div class="produto-info">
                <h3 class="produto-nome">${produto.nome_produto}</h3>
                <span class="produto-categoria">${produto.nome_categoria}</span>
                <div class="produto-preco">R$ ${Number(produto.preco).toFixed(2).replace('.', ',')}</div>
                <div class="produto-estoque ${estoqueClasse}">${estoqueTexto}</div>
                <button class="btn-adicionar-carrinho" ${botaoDisabled} 
                        onclick="adicionarProdutoAoCarrinho(${produto.id_produto})">
                    ${produto.quantidade_estoque === 0 ? '❌ Esgotado' : '🛒 Adicionar'}
                </button>
            </div>
        `;
        
    } catch (error) {
        console.error('❌ Erro ao criar card do produto:', error);
        card.innerHTML = '<div class="error">Erro ao carregar produto</div>';
    }
    
    return card;
}

// ========================================
// FUNÇÕES GLOBAIS EXPORTADAS
// ========================================
window.adicionarProdutoAoCarrinho = adicionarProdutoAoCarrinho;
window.obterQuantidadeCarrinho = obterQuantidadeCarrinho;
window.atualizarContadorCarrinho = atualizarContadorCarrinho;

// Função para obter o carrinho completo
window.obterCarrinho = () => {
    try {
        const carrinhoStr = sessionStorage.getItem('carrinho');
        if (carrinhoStr) {
            return JSON.parse(carrinhoStr);
        }
    } catch (error) {
        console.error('❌ Erro ao obter carrinho:', error);
    }
    return [];
};

// Função para obter o total do carrinho
window.obterTotalCarrinho = () => {
    try {
        const carrinho = window.obterCarrinho();
        return carrinho.reduce((total, item) => {
            return total + (item.preco * item.quantidade);
        }, 0);
    } catch (error) {
        console.error('❌ Erro ao calcular total:', error);
    }
    return 0;
};

console.log('✅ cardapio.js (sessionStorage) carregado com sucesso!');