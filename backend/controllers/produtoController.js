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

// ============================================
// CRIAR PRODUTO - VERSÃO COM ID.PNG
// ============================================
exports.criarProduto = async (req, res) => {
  console.log("REQ.BODY:", req.body);
  console.log("REQ.FILE:", req.file);
  
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

    // ============================================
    // BUSCAR PRÓXIMO ID DISPONÍVEL
    // ============================================
    console.log('🔢 Buscando próximo ID disponível...');
    const maxIdResult = await query('SELECT MAX(id_produto) as max_id FROM produto');
    const maxId = maxIdResult.rows[0].max_id || 0;
    const proximoId = maxId + 1;
    
    console.log(`   Último ID no banco: ${maxId}`);
    console.log(`   Próximo ID será: ${proximoId}`);

    let imagemProduto = null;

    // ============================================
    // PROCESSAR IMAGEM COM NOME: ID.PNG
    // ============================================
    if (req.file) {
      console.log('📸 Processando imagem...');
      
      // Nome do arquivo: ID.png
      const novoNomeArquivo = `${proximoId}.png`;
      const caminhoAntigo = req.file.path;
      const caminhoNovo = path.join(__dirname, '../uploads/images', novoNomeArquivo);
      
      console.log(`   Renomeando: ${path.basename(caminhoAntigo)} → ${novoNomeArquivo}`);
      
      // Verificar se já existe arquivo com esse nome e remover
      if (fs.existsSync(caminhoNovo)) {
        console.log(`   ⚠️ Arquivo ${novoNomeArquivo} já existe, removendo...`);
        fs.unlinkSync(caminhoNovo);
      }
      
      // Renomear e mover o arquivo
      fs.renameSync(caminhoAntigo, caminhoNovo);
      imagemProduto = `/uploads/images/${novoNomeArquivo}`;
      
      console.log(`   ✅ Imagem salva: ${imagemProduto}`);
    }

    // ============================================
    // INSERIR PRODUTO COM ID EXPLÍCITO
    // ============================================
    console.log('💾 Inserindo produto no banco...');
    const result = await query(
      "INSERT INTO produto (id_produto, nome_produto, preco, quantidade_estoque, id_categoria, imagem_produto) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [proximoId, nome_produto, preco, quantidade_estoque, id_categoria, imagemProduto]
    );

    console.log('✅ Produto criado com sucesso!');
    console.log(`   ID: ${proximoId}`);
    console.log(`   Nome: ${nome_produto}`);
    console.log(`   Imagem: ${imagemProduto || 'Sem imagem'}`);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("❌ Erro ao criar produto:", error);

    // Verifica se é erro de violação de constraint NOT NULL
    if (error.code === "23502") {
      return res.status(400).json({
        error: "Dados obrigatórios não fornecidos",
      });
    }

    // Verifica se é erro de ID duplicado
    if (error.code === '23505') {
      return res.status(400).json({
        error: 'ID duplicado',
        message: 'Já existe um produto com este ID. Tente novamente.',
        detail: error.detail
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

// ============================================
// ATUALIZAR PRODUTO - VERSÃO COM ID.PNG
// ============================================
exports.atualizarProduto = async (req, res) => {
  console.log("REQ.BODY:", req.body);
  console.log("REQ.FILE:", req.file);
  
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

    // ============================================
    // PROCESSAR NOVA IMAGEM COM NOME: ID.PNG
    // ============================================
    if (req.file) {
      console.log('📸 Processando nova imagem...');
      
      // Nome do arquivo: ID.png (usa o ID do produto)
      const novoNomeArquivo = `${id}.png`;
      const caminhoAntigo = req.file.path;
      const caminhoNovo = path.join(__dirname, '../uploads/images', novoNomeArquivo);
      
      console.log(`   Renomeando: ${path.basename(caminhoAntigo)} → ${novoNomeArquivo}`);
      
      // Remover imagem antiga se existir (com qualquer extensão)
      if (currentProduct.imagem_produto) {
        const caminhoImagemAntiga = path.join(__dirname, '..', currentProduct.imagem_produto);
        if (fs.existsSync(caminhoImagemAntiga)) {
          console.log(`   🗑️ Removendo imagem antiga: ${path.basename(caminhoImagemAntiga)}`);
          fs.unlinkSync(caminhoImagemAntiga);
        }
      }
      
      // Verificar se já existe arquivo com esse nome e remover
      if (fs.existsSync(caminhoNovo)) {
        console.log(`   ⚠️ Arquivo ${novoNomeArquivo} já existe, removendo...`);
        fs.unlinkSync(caminhoNovo);
      }
      
      // Renomear e mover o arquivo
      fs.renameSync(caminhoAntigo, caminhoNovo);
      updatedFields.imagem_produto = `/uploads/images/${novoNomeArquivo}`;
      
      console.log(`   ✅ Nova imagem salva: ${updatedFields.imagem_produto}`);
    }

    // Atualiza o produto
    const updateResult = await query(
      `UPDATE produto 
       SET nome_produto = $1, preco = $2, quantidade_estoque = $3, id_categoria = $4, imagem_produto = $5 
       WHERE id_produto = $6 RETURNING *`,
      [updatedFields.nome_produto, updatedFields.preco, updatedFields.quantidade_estoque, 
       updatedFields.id_categoria, updatedFields.imagem_produto, id]
    );

    console.log('✅ Produto atualizado com sucesso!');
    console.log(`   ID: ${id}`);
    console.log(`   Imagem: ${updatedFields.imagem_produto || 'Sem alteração'}`);

    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error("❌ Erro ao atualizar produto:", error);
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

    // Remover imagem se existir
    const produto = existingPersonResult.rows[0];
    if (produto.imagem_produto) {
      const caminhoImagem = path.join(__dirname, '..', produto.imagem_produto);
      if (fs.existsSync(caminhoImagem)) {
        console.log(`🗑️ Removendo imagem: ${path.basename(caminhoImagem)}`);
        fs.unlinkSync(caminhoImagem);
      }
    }

    // Deleta a produto (as constraints CASCADE cuidarão das dependências)
    await query("DELETE FROM produto WHERE id_produto = $1", [id]);

    console.log(`✅ Produto ${id} deletado com sucesso!`);
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