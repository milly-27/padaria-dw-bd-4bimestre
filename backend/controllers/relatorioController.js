const { pool } = require('../database');

/**
 * Valida se uma string é uma data válida no formato YYYY-MM-DD
 */
const isValidDate = (dateString) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
};

// Função auxiliar para tratar erros
const handleError = (res, error, message) => {
    console.error(`${message}:`, error);
    res.status(500).json({ 
        status: 'error',
        message: message,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        timestamp: new Date().toISOString()
    });
};

/**
 * Relatório de Vendas Mensais
 */
exports.getVendasMensais = async (req, res) => {
    console.log('🔍 Iniciando getVendasMensais');
    const client = await pool.connect();
    console.log('✅ Conexão com o banco de dados estabelecida');
    
    try {
        const { ano = new Date().getFullYear() } = req.query;
        
        // Validar ano
        const anoNum = parseInt(ano);
        if (isNaN(anoNum) || anoNum < 2000 || anoNum > 2100) {
            return res.status(400).json({
                status: 'error',
                message: 'Ano inválido. Forneça um ano entre 2000 e 2100.',
                timestamp: new Date().toISOString()
            });
        }
        
        const { ordenar = 'mes_numero', direcao = 'asc' } = req.query;
        
        const orderByMap = {
            'mes': 'm.mes',
            'mes_numero': 'm.mes',
            'quantidadePedidos': 'quantidade_pedidos',
            'totalVendas': 'total_vendas',
            'ticketMedio': 'ticket_medio'
        };
        
        const orderBy = orderByMap[ordenar] || 'm.mes';
        const orderDirection = direcao === 'desc' ? 'DESC' : 'ASC';
        
        const query = `
            WITH meses AS (
                SELECT generate_series(
                    DATE_TRUNC('year', $1::date),
                    DATE_TRUNC('year', $1::date) + INTERVAL '1 year' - INTERVAL '1 day',
                    INTERVAL '1 month'
                ) AS mes
            )
            SELECT 
                EXTRACT(MONTH FROM m.mes)::integer as mes_numero,
                TO_CHAR(m.mes, 'TMMonth') as mes_nome,
                COALESCE(COUNT(DISTINCT p.id_pedido), 0) as quantidade_pedidos,
                COALESCE(SUM(p.valor_total), 0) as total_vendas,
                CASE 
                    WHEN COUNT(DISTINCT p.id_pedido) > 0 
                    THEN COALESCE(SUM(p.valor_total), 0) / COUNT(DISTINCT p.id_pedido)
                    ELSE 0 
                END as ticket_medio
            FROM meses m
            LEFT JOIN pedido p ON 
                EXTRACT(MONTH FROM p.data_pedido) = EXTRACT(MONTH FROM m.mes) AND
                EXTRACT(YEAR FROM p.data_pedido) = EXTRACT(YEAR FROM m.mes)
            WHERE EXTRACT(YEAR FROM m.mes) = EXTRACT(YEAR FROM $1::date)
            GROUP BY m.mes, EXTRACT(MONTH FROM m.mes), TO_CHAR(m.mes, 'TMMonth')
            ORDER BY ${orderBy} ${orderDirection}`;
            
        console.log(`🔍 Executando consulta para o ano ${anoNum}...`);
        const result = await client.query(query, [`${anoNum}-01-01`]);
        
        console.log(`📊 Resultado: ${result.rowCount} meses encontrados`);
        
        const dados = result.rows.map(row => ({
            mes: row.mes_nome ? row.mes_nome.trim() : '',
            mes_numero: parseInt(row.mes_numero) || 0,
            quantidadePedidos: parseInt(row.quantidade_pedidos) || 0,
            totalVendas: parseFloat(row.total_vendas) || 0,
            ticketMedio: parseFloat(row.ticket_medio) || 0
        }));
        
        const mesesCompletos = Array.from({ length: 12 }, (_, i) => {
            const mesNumero = i + 1;
            const mesExistente = dados.find(m => m.mes_numero === mesNumero);
            
            if (mesExistente) return mesExistente;
            
            const data = new Date(anoNum, i, 1);
            return {
                mes: data.toLocaleString('pt-BR', { month: 'long' }),
                mes_numero: mesNumero,
                quantidadePedidos: 0,
                totalVendas: 0,
                ticketMedio: 0
            };
        });
        
        mesesCompletos.sort((a, b) => a.mes_numero - b.mes_numero);
        
        const totais = {
            quantidadePedidos: mesesCompletos.reduce((sum, mes) => sum + mes.quantidadePedidos, 0),
            totalVendas: parseFloat(mesesCompletos.reduce((sum, mes) => sum + mes.totalVendas, 0).toFixed(2)),
            ticketMedioGeral: 0
        };
        
        if (totais.quantidadePedidos > 0) {
            totais.ticketMedioGeral = parseFloat((totais.totalVendas / totais.quantidadePedidos).toFixed(2));
        }
        
        res.status(200).json({
            status: 'success',
            data: mesesCompletos,
            meta: {
                ano: anoNum,
                total_meses: mesesCompletos.length,
                totais: totais,
                timestamp: new Date().toISOString()
            }
        });
        
    } catch (error) {
        handleError(res, error, 'Erro ao processar o relatório de vendas mensais');
    } finally {
        client.release();
        console.log('🔒 Conexão liberada');
    }
};

/**
 * Relatório de Produtos Mais Vendidos - MOSTRA TODOS OS PRODUTOS COM LEFT JOIN
 */
exports.getProdutosMaisVendidos = async (req, res) => {
    console.log('🔍 Iniciando getProdutosMaisVendidos');
    console.log('📥 Query params recebidos:', req.query);
    
    let client;
    
    try {
        client = await pool.connect();
        console.log('✅ Conexão com banco estabelecida');
        
        const { dataInicio, dataFim, limite = 10 } = req.query;
        
        const limiteNum = Math.min(parseInt(limite) || 10, 100);
        const params = [];
        let whereConditions = [];
        let paramIndex = 1;
        
        // Validação e construção de filtros de data
        if (dataInicio && dataInicio.trim() !== '') {
            if (!isValidDate(dataInicio)) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Data de início inválida. Use o formato YYYY-MM-DD.',
                    timestamp: new Date().toISOString()
                });
            }
            whereConditions.push(`(p.data_pedido IS NULL OR p.data_pedido >= ${paramIndex}::date)`);
            params.push(dataInicio);
            paramIndex++;
            console.log(`📅 Filtro data início: ${dataInicio}`);
        }
        
        if (dataFim && dataFim.trim() !== '') {
            if (!isValidDate(dataFim)) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Data de fim inválida. Use o formato YYYY-MM-DD.',
                    timestamp: new Date().toISOString()
                });
            }
            whereConditions.push(`(p.data_pedido IS NULL OR p.data_pedido <= (${paramIndex}::date + INTERVAL '1 day' - INTERVAL '1 second'))`);
            params.push(dataFim);
            paramIndex++;
            console.log(`📅 Filtro data fim: ${dataFim}`);
        }
        
        // Adicionar o limite como último parâmetro
        params.push(limiteNum);
        
        const whereClause = whereConditions.length > 0 
            ? 'WHERE ' + whereConditions.join(' AND ')
            : '';
        
        console.log('🔍 WHERE Clause construída:', whereClause);
        console.log('🔍 Parâmetros:', params);
        
        // DIAGNÓSTICO: Verificar dados existentes
        console.log('\n🔍 === DIAGNÓSTICO DO BANCO ===');
        
        const diagnostico = await client.query(`
            SELECT 
                (SELECT COUNT(*) FROM produto) as total_produtos,
                (SELECT COUNT(*) FROM pedido) as total_pedidos,
                (SELECT COUNT(*) FROM pedidoproduto) as total_itens_pedido,
                (SELECT COUNT(*) FROM categoria) as total_categorias
        `);
        console.log('📊 Contadores:', diagnostico.rows[0]);
        
        // Verificar quais produtos têm vendas
        const produtosComVendas = await client.query(`
            SELECT 
                COUNT(DISTINCT pr.id_produto) as produtos_com_vendas,
                COUNT(DISTINCT pp.id_produto) as produtos_vendidos
            FROM produto pr
            LEFT JOIN pedidoproduto pp ON pr.id_produto = pp.id_produto
        `);
        console.log('🔍 Análise de vendas:', produtosComVendas.rows[0]);
        
        console.log('=== FIM DIAGNÓSTICO ===\n');
        
        // Query PRINCIPAL - AGORA COM LEFT JOIN PARA MOSTRAR TODOS OS PRODUTOS
        const query = `
            SELECT 
                pr.id_produto,
                pr.nome_produto,
                pr.preco as preco_atual,
                pr.quantidade_estoque,
                COALESCE(c.nome_categoria, 'Sem categoria') as categoria,
                COALESCE(SUM(pp.quantidade), 0) as quantidade_vendida,
                COALESCE(COUNT(DISTINCT pp.id_pedido), 0) as numero_pedidos,
                COALESCE(SUM(pp.quantidade * pp.preco_unitario), 0) as valor_total_vendido,
                COALESCE(AVG(pp.preco_unitario), 0) as preco_medio_venda,
                MIN(p.data_pedido) as primeira_venda,
                MAX(p.data_pedido) as ultima_venda
            FROM produto pr
            LEFT JOIN categoria c ON pr.id_categoria = c.id_categoria
            LEFT JOIN pedidoproduto pp ON pr.id_produto = pp.id_produto
            LEFT JOIN pedido p ON pp.id_pedido = p.id_pedido
            ${whereClause}
            GROUP BY pr.id_produto, pr.nome_produto, pr.preco, pr.quantidade_estoque, c.nome_categoria
            ORDER BY quantidade_vendida DESC, valor_total_vendido DESC, pr.nome_produto ASC
            LIMIT ${paramIndex}
        `;
        
        console.log('\n🔍 === EXECUTANDO QUERY PRINCIPAL ===');
        console.log('Query:', query);
        console.log('Parâmetros completos:', params);
        
        const result = await client.query(query, params);
        
        console.log(`\n✅ Query executada! Linhas retornadas: ${result.rowCount}`);
        
        if (result.rowCount === 0) {
            console.log('\n⚠️ Nenhum produto encontrado no banco de dados!');
            
            return res.status(200).json({
                status: 'success',
                data: [],
                meta: {
                    total: 0,
                    periodo: {
                        dataInicio: dataInicio || null,
                        dataFim: dataFim || null,
                        limite: limiteNum
                    },
                    timestamp: new Date().toISOString()
                },
                message: 'Nenhum produto cadastrado no banco de dados'
            });
        }
        
        // Processar resultados - AGORA INCLUI PRODUTOS SEM VENDAS
        const produtos = result.rows.map(produto => ({
            id: produto.id_produto,
            nome: produto.nome_produto || 'Produto sem nome',
            descricao: '', // Não existe na estrutura atual
            categoria: produto.categoria,
            preco_atual: parseFloat(produto.preco_atual) || 0,
            preco_medio_venda: parseFloat(produto.preco_medio_venda) || 0,
            quantidade_vendida: parseInt(produto.quantidade_vendida) || 0,
            quantidade_estoque: parseInt(produto.quantidade_estoque) || 0,
            numero_pedidos: parseInt(produto.numero_pedidos) || 0,
            valor_total_vendido: parseFloat(produto.valor_total_vendido) || 0,
            primeira_venda: produto.primeira_venda ? produto.primeira_venda.toISOString().split('T')[0] : null,
            ultima_venda: produto.ultima_venda ? produto.ultima_venda.toISOString().split('T')[0] : null
        }));
        
        console.log(`✅ ${produtos.length} produtos processados com sucesso`);
        console.log('📦 Primeiro produto:', produtos[0]);
        
        // Separar produtos com e sem vendas para análise
        const produtosComVenda = produtos.filter(p => p.quantidade_vendida > 0);
        const produtosSemVenda = produtos.filter(p => p.quantidade_vendida === 0);
        
        console.log(`📊 Produtos com vendas: ${produtosComVenda.length}`);
        console.log(`📊 Produtos sem vendas: ${produtosSemVenda.length}`);
        
        res.status(200).json({
            status: 'success',
            data: produtos,
            meta: {
                total: produtos.length,
                produtos_com_vendas: produtosComVenda.length,
                produtos_sem_vendas: produtosSemVenda.length,
                periodo: {
                    dataInicio: dataInicio || null,
                    dataFim: dataFim || null,
                    limite: limiteNum
                },
                timestamp: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('\n❌ === ERRO COMPLETO ===');
        console.error('Mensagem:', error.message);
        console.error('Stack:', error.stack);
        console.error('Código:', error.code);
        console.error('Detalhes:', error.detail);
        console.error('======================\n');
        
        handleError(res, error, 'Erro ao processar o relatório de produtos mais vendidos');
    } finally {
        if (client) {
            client.release();
            console.log('🔒 Conexão com banco liberada\n');
        }
    }
};