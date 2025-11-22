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

// Carregar dados ao inicializar
document.addEventListener('DOMContentLoaded', () => {
    carregarCategorias();
    carregarProdutos();
    atualizarContadorCarrinho();
});

// Event Listeners
btnBuscar.addEventListener('click', buscarProdutos);
btnLimpar.addEventListener('click', limparFiltros);
filtroCategoria.addEventListener('change', buscarProdutos);

// Buscar ao pressionar Enter no campo de busca
buscarProduto.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        buscarProdutos();
    }
});

// Função para mostrar mensagens
function mostrarMensagem(texto, tipo = 'info') {
    messageContainer.innerHTML = `<div class="message ${tipo}">${texto}</div>`;
    setTimeout(() => {
        messageContainer.innerHTML = '';
    }, 3000);
}

// Função para carregar categorias no filtro
async function carregarCategorias() {
    try {
        const response = await fetch(`${API_BASE_URL}/cardapio/categorias`);
        if (!response.ok) throw new Error('Erro ao carregar categorias');

        const categorias = await response.json();
        
        // Limpar opções existentes (exceto "Todas as Categorias")
        filtroCategoria.innerHTML = '<option value="todas">Todas as Categorias</option>';

        categorias.forEach(categoria => {
            const option = document.createElement('option');
            option.value = categoria.id_categoria;
            option.textContent = categoria.nome_categoria;
            filtroCategoria.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        mostrarMensagem('Erro ao carregar categorias', 'error');
    }
}

// Função para carregar produtos
async function carregarProdutos(categoriaId = 'todas') {
    try {
        mostrarLoading(true);
        
        let url = `${API_BASE_URL}/cardapio/produtos`;
        if (categoriaId !== 'todas') {
            url += `?categoria_id=${categoriaId}`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error('Erro ao carregar produtos');

        const produtos = await response.json();
        
        mostrarLoading(false);
        renderizarProdutos(produtos);
        
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        mostrarLoading(false);
        mostrarMensagem('Erro ao carregar produtos', 'error');
    }
}

// Função para buscar produtos com filtros
async function buscarProdutos() {
    try {
        mostrarLoading(true);
        
        const categoriaId = filtroCategoria.value;
        const termoBusca = buscarProduto.value.trim().toLowerCase();
        
        console.log('🔍 Buscando produtos...');
        console.log('   Categoria:', categoriaId);
        console.log('   Termo de busca:', termoBusca || '(vazio)');
        
        let url = `${API_BASE_URL}/cardapio/produtos`;
        if (categoriaId !== 'todas') {
            url += `?categoria_id=${categoriaId}`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error('Erro ao carregar produtos');

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
        console.error('❌ Erro ao buscar produtos:', error);
        mostrarLoading(false);
        mostrarMensagem('Erro ao buscar produtos', 'error');
    }
}

// Função para limpar filtros
function limparFiltros() {
    console.log('🔄 Limpando filtros...');
    
    filtroCategoria.value = 'todas';
    buscarProduto.value = '';
    
    carregarProdutos();
    mostrarMensagem('Filtros limpos!', 'info');
}

// Função para mostrar/ocultar loading
function mostrarLoading(mostrar) {
    if (mostrar) {
        loadingMessage.style.display = 'block';
        produtosContainer.style.display = 'none';
        emptyMessage.style.display = 'none';
    } else {
        loadingMessage.style.display = 'none';
        produtosContainer.style.display = 'grid';
    }
}

// Variável para armazenar produtos carregados
let produtosCarregados = [];

// Função para renderizar produtos
function renderizarProdutos(produtos) {
    produtosCarregados = produtos; // Armazenar produtos para uso posterior
    produtosContainer.innerHTML = '';
    
    if (produtos.length === 0) {
        produtosContainer.style.display = 'none';
        emptyMessage.style.display = 'block';
        return;
    }
    
    emptyMessage.style.display = 'none';
    produtosContainer.style.display = 'grid';

    produtos.forEach(produto => {
        const produtoCard = criarCardProduto(produto);
        produtosContainer.appendChild(produtoCard);
    });
}

// Função para criar card do produto
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
        
        // HTML da imagem
        const imagemHtml = produto.imagem_produto 
            ? `<img src="${produto.imagem_produto}" alt="${produto.nome_produto}">`
            : '<div class="sem-imagem">Sem imagem disponível</div>';
        
        card.innerHTML = `
            <div class="produto-imagem">
                ${imagemHtml}
            </div>
            <div class="produto-info">
                <h3 class="produto-nome">${produto.nome_produto}</h3>
                <span class="produto-categoria">${produto.nome_categoria}</span>
                <div class="produto-preco">R$ ${Number(produto.preco).toFixed(2)}</div>
                <div class="produto-estoque ${estoqueClasse}">${estoqueTexto}</div>
                <button class="btn-adicionar-carrinho" ${botaoDisabled} 
                        onclick="adicionarProdutoAoCarrinho(${produto.id_produto})">
                    ${produto.quantidade_estoque === 0 ? 'Esgotado' : '🛒 Adicionar'}
                </button>
            </div>
        `;
        
    } catch (error) {
        console.error('❌ Erro ao criar elemento do item:', error);
        card.innerHTML = '<div class="error">Erro ao carregar o item</div>';
    }
    
    return card;
}

// Função para adicionar produto ao carrinho
function adicionarProdutoAoCarrinho(idProduto) {
    const produto = produtosCarregados.find(p => p.id_produto === idProduto);
    if (!produto) {
        mostrarMensagem('Produto não encontrado!', 'error');
        return;
    }
    
    if (produto.quantidade_estoque === 0) {
        mostrarMensagem('Produto esgotado!', 'warning');
        return;
    }
    
    // Carregar carrinho atual
    let carrinho = [];
    const carrinhoSalvo = localStorage.getItem('carrinho');
    if (carrinhoSalvo) {
        try {
            carrinho = JSON.parse(carrinhoSalvo);
        } catch (error) {
            console.error('Erro ao carregar carrinho:', error);
        }
    }
    
    // Verificar se produto já está no carrinho
    const itemExistente = carrinho.find(item => item.id_produto === produto.id_produto);
    
    if (itemExistente) {
        if (itemExistente.quantidade >= produto.quantidade_estoque) {
            mostrarMensagem('Quantidade máxima em estoque já adicionada!', 'warning');
            return;
        }
        itemExistente.quantidade += 1;
    } else {
        carrinho.push({
            id_produto: produto.id_produto,
            nome_produto: produto.nome_produto,
            preco: produto.preco,
            imagem_path: produto.imagem_path,
            nome_categoria: produto.nome_categoria,
            quantidade: 1
        });
    }
    
    // Salvar carrinho
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
    
    // Atualizar contador do carrinho
    atualizarContadorCarrinho();
    
    // Mostrar mensagem de sucesso
    mostrarMensagem(`${produto.nome_produto} adicionado ao carrinho!`, 'success');
}

// Função para atualizar contador do carrinho
function atualizarContadorCarrinho() {
    const carrinhoCount = document.getElementById('carrinhoCount');
    if (!carrinhoCount) return;
    
    let carrinho = [];
    const carrinhoSalvo = localStorage.getItem('carrinho');
    if (carrinhoSalvo) {
        try {
            carrinho = JSON.parse(carrinhoSalvo);
        } catch (error) {
            console.error('Erro ao carregar carrinho:', error);
        }
    }
    
    const totalItens = carrinho.reduce((total, item) => total + item.quantidade, 0);
    carrinhoCount.textContent = totalItens;
}

// Exportar funções globalmente
window.adicionarAoCarrinho = (produto, quantidade = 1) => {
    const itemExistente = carrinho.find(item => item.id_produto === produto.id_produto);
    
    if (itemExistente) {
        itemExistente.quantidade += quantidade;
    } else {
        carrinho.push({
            id_produto: produto.id_produto,
            nome_produto: produto.nome_produto,
            preco: produto.preco,
            quantidade: quantidade
        });
    }
    
    salvarCarrinho();
    atualizarInterface();
    mostrarMensagem(`${produto.nome_produto} adicionado ao carrinho!`, 'success');
};

window.obterQuantidadeItens = () => {
    return carrinho.reduce((total, item) => total + item.quantidade, 0);
};

window.obterTotalCarrinho = () => {
    return calcularTotal();
};

console.log('✅ cardapio.js carregado com sucesso!');