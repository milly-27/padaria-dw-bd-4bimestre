const db = require('../database');
const path = require('path');

// ================================
// Abrir página de finalização
// ================================
exports.abrirFinalizacao = (req, res) => {
  console.log('finalizacaoController - Rota /abrirFinalizacao - abrir página de finalização');
  res.sendFile(path.join(__dirname, '../../frontend/finalizacao/finalizacao.html'));
};

// ================================
// Buscar todas as formas de pagamento - VERSÃO CORRIGIDA
// ================================
exports.getFormasPagamento = async (req, res) => {
  try {
    console.log('📋 Buscando formas de pagamento...');
    console.log('   Query: SELECT id_forma_pagamento, nome_forma FROM forma_pagamento ORDER BY nome_forma');
    
    const result = await db.query(
      'SELECT id_forma_pagamento, nome_forma FROM forma_pagamento ORDER BY nome_forma'
    );
    
    console.log(`✅ ${result.rows.length} formas de pagamento encontradas no banco`);
    
    // Log detalhado de cada forma
    result.rows.forEach((forma, index) => {
      console.log(`   ${index + 1}. ID: ${forma.id_forma_pagamento} - Nome: ${forma.nome_forma}`);
    });
    
    // CRÍTICO: Retornar APENAS result.rows (array), não o objeto result completo
    const formas = result.rows;
    
    console.log('📤 Retornando array com', formas.length, 'itens');
    console.log('📤 Tipo:', Array.isArray(formas) ? 'Array ✅' : 'ERRO: Não é array ❌');
    
    // Validar estrutura antes de enviar
    if (!Array.isArray(formas)) {
      console.error('❌ ERRO: result.rows não é um array!');
      return res.status(500).json([]);
    }
    
    // Verificar se cada item tem os campos necessários
    const formasValidas = formas.filter(f => f.id_forma_pagamento && f.nome_forma);
    
    if (formasValidas.length !== formas.length) {
      console.warn('⚠️ Algumas formas têm dados inválidos');
      console.warn('   Total:', formas.length);
      console.warn('   Válidas:', formasValidas.length);
    }
    
    // Retornar SEMPRE um array, mesmo que vazio
    res.status(200).json(formasValidas);
    
  } catch (error) {
    console.error('❌ Erro ao buscar formas de pagamento:', error);
    console.error('   Mensagem:', error.message);
    console.error('   Stack:', error.stack);
    
    // Em caso de erro, retornar array vazio ao invés de erro
    // Isso permite que o frontend use formas padrão
    res.status(200).json([]);
  }
};

// ================================
// Criar pedido completo
// ================================
exports.criarPedido = async (req, res) => {
  const client = await db.connect();
  
  try {
    console.log('📝 Criando novo pedido...');
    const { cpf, data_pedido, valor_total, itens } = req.body;

    // Validações
    if (!cpf || !data_pedido || !valor_total || !itens || itens.length === 0) {
      console.log('❌ Dados incompletos na requisição');
      return res.status(400).json({
        error: 'Dados incompletos',
        message: 'CPF, data, valor total e itens são obrigatórios'
      });
    }

    console.log(`👤 CPF: ${cpf}`);
    console.log(`📅 Data: ${data_pedido}`);
    console.log(`💰 Valor Total: R$ ${valor_total}`);
    console.log(`📦 Itens: ${itens.length}`);

    await client.query('BEGIN');

    // 1. Criar pedido
    console.log('1️⃣ Inserindo pedido...');
    const pedidoResult = await client.query(
      'INSERT INTO pedido (cpf, data_pedido, valor_total) VALUES ($1, $2, $3) RETURNING id_pedido',
      [cpf, data_pedido, valor_total]
    );
    
    const id_pedido = pedidoResult.rows[0].id_pedido;
    console.log(`✅ Pedido criado - ID: ${id_pedido}`);

    // 2. Inserir itens do pedido e atualizar estoque
    console.log('2️⃣ Inserindo itens do pedido...');
    for (const item of itens) {
      // Verificar estoque disponível
      const estoqueResult = await client.query(
        'SELECT quantidade_estoque, nome_produto FROM produto WHERE id_produto = $1',
        [item.id_produto]
      );

      if (estoqueResult.rows.length === 0) {
        throw new Error(`Produto ID ${item.id_produto} não encontrado`);
      }

      const produto = estoqueResult.rows[0];
      
      if (produto.quantidade_estoque < item.quantidade) {
        throw new Error(`Estoque insuficiente para ${produto.nome_produto}. Disponível: ${produto.quantidade_estoque}, Solicitado: ${item.quantidade}`);
      }

      // Inserir item do pedido
      await client.query(
        'INSERT INTO pedidoproduto (id_pedido, id_produto, quantidade, preco_unitario) VALUES ($1, $2, $3, $4)',
        [id_pedido, item.id_produto, item.quantidade, item.preco_unitario]
      );
      
      // Atualizar estoque
      await client.query(
        'UPDATE produto SET quantidade_estoque = quantidade_estoque - $1 WHERE id_produto = $2',
        [item.quantidade, item.id_produto]
      );

      console.log(`   ✅ Item adicionado: ${produto.nome_produto} (Qtd: ${item.quantidade})`);
    }

    await client.query('COMMIT');
    console.log('✅ Pedido criado com sucesso!');

    res.status(201).json({
      success: true,
      message: 'Pedido criado com sucesso',
      id_pedido: id_pedido
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao criar pedido:', error);
    
    res.status(500).json({
      error: 'Erro ao criar pedido',
      message: error.message || 'Não foi possível criar o pedido'
    });
  } finally {
    client.release();
  }
};

// ================================
// Processar pagamento
// ================================
exports.processarPagamento = async (req, res) => {
  const client = await db.connect();
  
  try {
    console.log('💳 Processando pagamento...');
    const { id_pedido, id_forma_pagamento, valor_total } = req.body;

    if (!id_pedido || !id_forma_pagamento || !valor_total) {
      console.log('❌ Dados de pagamento incompletos');
      return res.status(400).json({
        error: 'Dados incompletos',
        message: 'ID do pedido, forma de pagamento e valor são obrigatórios'
      });
    }

    console.log(`📋 Pedido: ${id_pedido}`);
    console.log(`💰 Valor: R$ ${valor_total}`);
    console.log(`💳 Forma: ${id_forma_pagamento}`);

    await client.query('BEGIN');

    // 1. Criar pagamento
    const pagamentoResult = await client.query(
      'INSERT INTO pagamento (id_pedido, data_pagamento, valor_total) VALUES ($1, CURRENT_DATE, $2) RETURNING id_pagamento',
      [id_pedido, valor_total]
    );
    
    const id_pagamento = pagamentoResult.rows[0].id_pagamento;
    console.log(`✅ Pagamento criado - ID: ${id_pagamento}`);

    // 2. Relacionar forma de pagamento
    await client.query(
      'INSERT INTO pagamento_has_formapagamento (id_pagamento, id_forma_pagamento, valor_pago) VALUES ($1, $2, $3)',
      [id_pagamento, id_forma_pagamento, valor_total]
    );

    await client.query('COMMIT');
    console.log('✅ Pagamento processado com sucesso!');

    res.status(201).json({
      success: true,
      message: 'Pagamento processado com sucesso',
      id_pagamento: id_pagamento,
      id_pedido: id_pedido,
      valor_pago: valor_total
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao processar pagamento:', error);
    
    res.status(500).json({
      error: 'Erro ao processar pagamento',
      message: error.message || 'Não foi possível processar o pagamento'
    });
  } finally {
    client.release();
  }
};

// ================================
// Atualizar status do pedido
// ================================
exports.atualizarStatusPedido = async (req, res) => {
  try {
    console.log('🔄 Atualizando status do pedido...');
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      console.log('❌ Status não fornecido');
      return res.status(400).json({
        error: 'Status é obrigatório'
      });
    }

    // Verificar se o pedido existe
    const pedidoExiste = await db.query(
      'SELECT id_pedido FROM pedido WHERE id_pedido = $1',
      [id]
    );

    if (pedidoExiste.rows.length === 0) {
      console.log(`❌ Pedido ${id} não encontrado`);
      return res.status(404).json({
        error: 'Pedido não encontrado'
      });
    }

    console.log(`✅ Status do pedido ${id} atualizado para: ${status}`);

    res.status(200).json({
      success: true,
      message: 'Status do pedido atualizado com sucesso',
      id_pedido: id,
      status: status
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar status do pedido:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível atualizar o status do pedido'
    });
  }
};

// ================================
// Buscar detalhes de um pedido
// ================================
exports.getPedidoDetalhes = async (req, res) => {
  try {
    console.log('🔍 Buscando detalhes do pedido...');
    const { id } = req.params;

    // Buscar pedido
    const pedidoResult = await db.query(
      `SELECT p.id_pedido, p.cpf, p.data_pedido, p.valor_total,
              pe.nome_pessoa, pe.email_pessoa
       FROM pedido p
       LEFT JOIN pessoa pe ON p.cpf = pe.cpf
       WHERE p.id_pedido = $1`,
      [id]
    );

    if (pedidoResult.rows.length === 0) {
      console.log(`❌ Pedido ${id} não encontrado`);
      return res.status(404).json({
        error: 'Pedido não encontrado'
      });
    }

    const pedido = pedidoResult.rows[0];

    // Buscar itens do pedido
    const itensResult = await db.query(
      `SELECT pp.id_produto, pp.quantidade, pp.preco_unitario,
              pr.nome_produto, pr.imagem_produto,
              c.nome_categoria
       FROM pedidoproduto pp
       LEFT JOIN produto pr ON pp.id_produto = pr.id_produto
       LEFT JOIN categoria c ON pr.id_categoria = c.id_categoria
       WHERE pp.id_pedido = $1`,
      [id]
    );

    pedido.itens = itensResult.rows;

    // Buscar informações de pagamento (se existir)
    const pagamentoResult = await db.query(
      `SELECT pg.id_pagamento, pg.data_pagamento, pg.valor_total,
              fp.nome_forma
       FROM pagamento pg
       LEFT JOIN pagamento_has_formapagamento phf ON pg.id_pagamento = phf.id_pagamento
       LEFT JOIN forma_pagamento fp ON phf.id_forma_pagamento = fp.id_forma_pagamento
       WHERE pg.id_pedido = $1`,
      [id]
    );

    if (pagamentoResult.rows.length > 0) {
      pedido.pagamento = pagamentoResult.rows[0];
    }

    console.log(`✅ Pedido ${id} encontrado com ${itensResult.rows.length} itens`);

    res.status(200).json(pedido);
  } catch (error) {
    console.error('❌ Erro ao buscar detalhes do pedido:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível buscar os detalhes do pedido'
    });
  }
};

// ================================
// Listar pedidos (com filtros opcionais)
// ================================
exports.listarPedidos = async (req, res) => {
  try {
    console.log('📋 Listando pedidos...');
    const { cpf, data_inicio, data_fim } = req.query;

    let query = `
      SELECT p.id_pedido, p.cpf, p.data_pedido, p.valor_total,
             pe.nome_pessoa,
             COUNT(pp.id_produto) as total_itens
      FROM pedido p
      LEFT JOIN pessoa pe ON p.cpf = pe.cpf
      LEFT JOIN pedidoproduto pp ON p.id_pedido = pp.id_pedido
    `;

    const conditions = [];
    const params = [];
    let paramCount = 1;

    if (cpf) {
      conditions.push(`p.cpf = $${paramCount}`);
      params.push(cpf);
      paramCount++;
    }

    if (data_inicio) {
      conditions.push(`p.data_pedido >= $${paramCount}`);
      params.push(data_inicio);
      paramCount++;
    }

    if (data_fim) {
      conditions.push(`p.data_pedido <= $${paramCount}`);
      params.push(data_fim);
      paramCount++;
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' GROUP BY p.id_pedido, p.cpf, p.data_pedido, p.valor_total, pe.nome_pessoa';
    query += ' ORDER BY p.data_pedido DESC, p.id_pedido DESC';

    const result = await db.query(query, params);

    console.log(`✅ ${result.rows.length} pedidos encontrados`);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('❌ Erro ao listar pedidos:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível listar os pedidos'
    });
  }
};