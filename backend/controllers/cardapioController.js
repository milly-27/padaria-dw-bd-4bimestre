const { query } = require("../database");
const path = require("path");

exports.abrirCardapio = (req, res) => {
  console.log("cardapioController - Rota /abrirCardapio - abrir o cardápio");
  res.sendFile(path.join(__dirname, "../../frontend/cardapio/cardapio.html"));
};

// Listar produtos por categoria para o cardápio
exports.listarProdutosPorCategoria = async (req, res) => {
  try {
    const { categoria_id } = req.query;
    
    let result;
    if (global.useMockData) {
      result = await global.mockDatabase.listarProdutos();
      // Filtrar por categoria se especificado
      if (categoria_id && categoria_id !== 'todas') {
        result.rows = result.rows.filter(produto => produto.id_categoria == categoria_id);
      }
    } else {
      let queryText = `
        SELECT 
          p.id_produto,
          p.nome_produto,
          p.preco,
          p.quantidade_estoque,
          p.id_categoria,
          p.imagem_produto,
          COALESCE(c.nome_categoria, 'Sem categoria') as nome_categoria
        FROM produto p
        LEFT JOIN categoria c ON p.id_categoria = c.id_categoria
      `;
      
      let queryParams = [];
      
      // Se categoria_id foi fornecido, filtrar por categoria
      if (categoria_id && categoria_id !== 'todas') {
        queryText += ' WHERE p.id_categoria = $1';
        queryParams.push(categoria_id);
      }
      
      queryText += ' ORDER BY COALESCE(c.nome_categoria, \'Sem categoria\'), p.nome_produto';
      
      result = await query(queryText, queryParams);
    }
    
    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao listar produtos para cardápio:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Listar todas as categorias para o filtro
exports.listarCategorias = async (req, res) => {
  try {
    let result;
    if (global.useMockData) {
      result = await global.mockDatabase.listarCategorias();
    } else {
      result = await query(`
        SELECT 
          id_categoria,
          nome_categoria
        FROM categoria
        ORDER BY nome_categoria
      `);
    }
    
    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao listar categorias:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

