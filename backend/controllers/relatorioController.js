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
 * Relatório de Produtos Mais Vendidos - CORRIGIDO COM NOMES CORRETOS DAS COLUNAS
 */
exports.getProdutosMaisVendidos = async (req, res) => {
    console.log('🔍 Iniciando getProdutosMaisVendidos');
    const client = await pool.connect();
    
    try {
        const { dataInicio, dataFim, limite = 10 } = req.query;
        
        console.log('📥 Parâmetros recebidos:', { dataInicio, dataFim, limite });
        
        const limiteNum = Math.min(parseInt(limite), 100) || 10;
        const params = [];
        let paramIndex = 1;
        let whereClause = '';
        
        // Validação de datas
        if (dataInicio) {
            if (!isValidDate(dataInicio)) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Data de início inválida. Use o formato YYYY-MM-DD.',
                    timestamp: new Date().toISOString()
                });
            }
            whereClause += ` AND p.data_pedido >= $${paramIndex++}::date`;
            params.push(dataInicio);
        }
        
        if (dataFim) {
            if (!isValidDate(dataFim)) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Data de fim inválida. Use o formato YYYY-MM-DD.',
                    timestamp: new Date().toISOString()
                });
            }
            whereClause += ` AND p.data_pedido <= ($${paramIndex++}::date + INTERVAL '1 day')`;
            params.push(dataFim);
        }
        
        params.push(limiteNum);
        
        // Query CORRIGIDA - usando nome_produto ao invés de nome
        const query = `
            WITH vendas_por_produto AS (
                SELECT 
                    pr.id_produto,
                    pr.nome_produto,
                    pr.preco as preco_atual,
                    pr.id_categoria,
                    COUNT(DISTINCT pp.id_pedido) as quantidade_vendida,
                    SUM(pp.quantidade) as total_itens_vendidos,
                    SUM(pp.quantidade * pp.preco_unitario) as valor_total_vendido,
                    AVG(pp.preco_unitario) as preco_medio_venda,
                    MIN(p.data_pedido) as primeira_venda,
                    MAX(p.data_pedido) as ultima_venda
                FROM produto pr
                INNER JOIN pedidoproduto pp ON pr.id_produto = pp.id_produto
                INNER JOIN pedido p ON pp.id_pedido = p.id_pedido
                WHERE 1=1 ${whereClause}
                GROUP BY pr.id_produto, pr.nome_produto, pr.preco, pr.id_categoria
                ORDER BY quantidade_vendida DESC, valor_total_vendido DESC
                LIMIT $${paramIndex}
            )
            SELECT 
                vp.*,
                COALESCE(c.nome_categoria, 'Sem categoria') as nome_categoria
            FROM vendas_por_produto vp
            LEFT JOIN categoria c ON vp.id_categoria = c.id_categoria
            ORDER BY vp.quantidade_vendida DESC, vp.valor_total_vendido DESC`;
        
        console.log('🔍 Query:', query);
        console.log('🔍 Parâmetros:', params);
        
        const result = await client.query(query, params);
        
        console.log(`📊 Resultado: ${result.rowCount} produtos encontrados`);
        
        // Se não houver resultados
        if (!result.rows || result.rows.length === 0) {
            console.log('⚠️ Nenhum produto encontrado');
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
                message: 'Nenhum dado encontrado para o período selecionado'
            });
        }
        
        // Processar resultados
        const produtos = result.rows.map(produto => ({
            id: produto.id_produto,
            nome: produto.nome_produto || 'Produto sem nome',
            descricao: '', // A tabela produto não tem campo descricao
            categoria: produto.nome_categoria || 'Sem categoria',
            preco_atual: parseFloat(produto.preco_atual) || 0,
            preco_medio_venda: parseFloat(produto.preco_medio_venda) || 0,
            quantidade_vendida: parseInt(produto.quantidade_vendida) || 0,
            total_itens_vendidos: parseInt(produto.total_itens_vendidos) || 0,
            valor_total_vendido: parseFloat(produto.valor_total_vendido) || 0,
            primeira_venda: produto.primeira_venda ? produto.primeira_venda.toISOString().split('T')[0] : null,
            ultima_venda: produto.ultima_venda ? produto.ultima_venda.toISOString().split('T')[0] : null
        }));
        
        console.log('✅ Produtos processados:', produtos.length);
        
        res.status(200).json({
            status: 'success',
            data: produtos,
            meta: {
                total: produtos.length,
                periodo: {
                    dataInicio: dataInicio || null,
                    dataFim: dataFim || null,
                    limite: limiteNum
                },
                timestamp: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('❌ Erro completo:', error);
        console.error('Stack:', error.stack);
        handleError(res, error, 'Erro ao processar o relatório de produtos mais vendidos');
    } finally {
        if (client) {
            client.release();
            console.log('🔒 Conexão liberada');
        }
    }
};