const { query } = require("../database");
const path = require("path");
const fs = require('fs');

exports.abrirCrudProduto = (req, res) => {
  console.log("produtoController - Rota /abrirCrudProduto - abrir o crudProduto");
  res.sendFile(path.join(__dirname, "../../frontend/produto/produto.html"));
};

// MODIFICADO: Agora retorna o nome da categoria junto com os dados do produto
exports.listarProdutos = async (req, res) => {
  try {
    let result;
    if (global.useMockData) {
      result = await global.mockDatabase.listarProdutos();
    } else {
      // LEFT JOIN com a tabela categoria para obter o nome da categoria (inclui produtos sem categoria)
      result = await query(`
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
        ORDER BY p.id_produto
      `);
    }
    
    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao listar produtos:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

exports.criarProduto = async (req, res) => {
  console.log("REQ.BODY:", req.body); // <--- mostra o que chegou do frontend
  console.log("REQ.FILE:", req.file); // <--- mostra o arquivo enviado
  
  try {
    const { nome_produto, preco, quantidade_estoque, id_categoria } = req.body;

    // Validação básica
    if (!nome_produto) {
      return res.status(400).json({
        error: "Nome do produto é obrigatório",
      });
    }

    if (isNaN(preco) || isNaN(quantidade_estoque)) {
      return res.status(400).json({ error: "Preço e quantidade_estoque devem ser números válidos" });
    }

    // Validação para id_categoria
    if (isNaN(id_categoria) || id_categoria === null || id_categoria === undefined) {
      return res.status(400).json({ error: "ID da categoria é obrigatório e deve ser um número válido" });
    }

    let imagemProduto = null;

    // Se há arquivo de imagem, processar o upload
    if (req.file) {
      // Gerar nome único para a imagem
      const timestamp = Date.now();
      const extensao = path.extname(req.file.originalname);
      const novoNomeArquivo = `produto_${timestamp}${extensao}`;
      const caminhoAntigo = req.file.path;
      const caminhoNovo = path.join(__dirname, '../uploads/images', novoNomeArquivo);
      
      // Renomear e mover o arquivo
      fs.renameSync(caminhoAntigo, caminhoNovo);
      imagemProduto = `/uploads/images/${novoNomeArquivo}`;
    }

    // Criar produto com imagem
    const result = await query(
      "INSERT INTO produto (nome_produto, preco, quantidade_estoque, id_categoria, imagem_produto) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [nome_produto, preco, quantidade_estoque, id_categoria, imagemProduto]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Erro ao criar produto:", error);

    // Verifica se é erro de violação de constraint NOT NULL
    if (error.code === "23502") {
      return res.status(400).json({
        error: "Dados obrigatórios não fornecidos",
      });
    }

    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

exports.obterProduto = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: "ID deve ser um número válido" });
    }

    const result = await query(
      "SELECT * FROM produto WHERE id_produto = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Produto não encontrada" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Erro ao obter produto:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

exports.atualizarProduto = async (req, res) => {
  console.log("REQ.BODY:", req.body); // <--- mostra o que chegou do frontend
  console.log("REQ.FILE:", req.file); // <--- mostra o arquivo enviado
  
  try {
    const id = parseInt(req.params.id);
    const { nome_produto, preco, quantidade_estoque, id_categoria } = req.body;

    if (isNaN(preco) || isNaN(quantidade_estoque)) {
      return res.status(400).json({ error: "Preço e quantidade_estoque devem ser números válidos" });
    }

    // Validação para id_categoria
    if (isNaN(id_categoria) || id_categoria === null || id_categoria === undefined) {
      return res.status(400).json({ error: "ID da categoria é obrigatório e deve ser um número válido" });
    }

    // Verifica se o produto existe
    const existingProductResult = await query(
      "SELECT * FROM produto WHERE id_produto = $1",
      [id]
    );

    if (existingProductResult.rows.length === 0) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    // Constrói a query de atualização dinamicamente para campos não nulos
    const currentProduct = existingProductResult.rows[0];
    const updatedFields = {
      nome_produto: nome_produto !== undefined ? nome_produto : currentProduct.nome_produto,
      preco: preco !== undefined ? preco : currentProduct.preco,
      quantidade_estoque: quantidade_estoque !== undefined ? quantidade_estoque : currentProduct.quantidade_estoque,
      id_categoria: id_categoria !== undefined ? id_categoria : currentProduct.id_categoria,
      imagem_produto: currentProduct.imagem_produto
    };

    // Se há arquivo de imagem, processar o upload
    if (req.file) {
      // Remover imagem antiga se existir
      if (currentProduct.imagem_produto) {
        const caminhoImagemAntiga = path.join(__dirname, '..', currentProduct.imagem_produto);
        if (fs.existsSync(caminhoImagemAntiga)) {
          fs.unlinkSync(caminhoImagemAntiga);
        }
      }
      
      // Gerar nome único para a nova imagem
      const timestamp = Date.now();
      const extensao = path.extname(req.file.originalname);
      const novoNomeArquivo = `produto_${id}_${timestamp}${extensao}`;
      const caminhoAntigo = req.file.path;
      const caminhoNovo = path.join(__dirname, '../uploads/images', novoNomeArquivo);
      
      // Renomear e mover o arquivo
      fs.renameSync(caminhoAntigo, caminhoNovo);
      updatedFields.imagem_produto = `/uploads/images/${novoNomeArquivo}`;
    }

    // Atualiza o produto
    const updateResult = await query(
      `UPDATE produto 
       SET nome_produto = $1, preco = $2, quantidade_estoque = $3, id_categoria = $4, imagem_produto = $5 
       WHERE id_produto = $6 RETURNING *`,
      [updatedFields.nome_produto, updatedFields.preco, updatedFields.quantidade_estoque, 
       updatedFields.id_categoria, updatedFields.imagem_produto, id]
    );

    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error("Erro ao atualizar produto:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

exports.deletarProduto = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // Verifica se a produto existe
    const existingPersonResult = await query(
      "SELECT * FROM produto WHERE id_produto = $1",
      [id]
    );

    if (existingPersonResult.rows.length === 0) {
      return res.status(404).json({ error: "Produto não encontrada" });
    }

    // Deleta a produto (as constraints CASCADE cuidarão das dependências)
    await query("DELETE FROM produto WHERE id_produto = $1", [id]);

    res.status(204).send();
  } catch (error) {
    console.error("Erro ao deletar produto:", error);

    // Verifica se é erro de violação de foreign key (dependências)
    if (error.code === "23503") {
      return res.status(400).json({
        error: "Não é possível deletar produto com dependências associadas",
      });
    }

    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

