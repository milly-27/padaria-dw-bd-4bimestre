const { pool } = require('../database');

/**
 * Valida se uma string é uma data válida no formato YYYY-MM-DD
 * @param {string} dateString - Data no formato YYYY-MM-DD
 * @returns {boolean} - Retorna true se a data for válida
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
 * Retorna um relatório com as vendas agrupadas por mês
 * @param {Object} req - Requisição HTTP
 * @param {Object} res - Resposta HTTP
 */
exports.getVendasMensais = async (req, res) => {
    console.log('🔍 Iniciando getVendasMensais');
    const client = await pool.connect();
    console.log('✅ Conexão com o banco de dados estabelecida');
    
    try {
        const { ano = new Date().getFullYear() } = req.query;
        
        // Validar ano (entre 2000 e 2100)
        const anoNum = parseInt(ano);
        if (isNaN(anoNum) || anoNum < 2000 || anoNum > 2100) {
            return res.status(400).json({
                status: 'error',
                message: 'Ano inválido. Forneça um ano entre 2000 e 2100.',
                timestamp: new Date().toISOString()
            });
        }
        
        // Obter parâmetros de ordenação
        const { ordenar = 'mes_numero', direcao = 'asc' } = req.query;
        
        // Mapear campos de ordenação para colunas do banco
        const orderByMap = {
            'mes': 'm.mes',
            'mes_numero': 'm.mes',
            'quantidadePedidos': 'quantidade_pedidos',
            'totalVendas': 'total_vendas',
            'ticketMedio': 'ticket_medio'
        };
        
        const orderBy = orderByMap[ordenar] || 'm.mes';
        const orderDirection = direcao === 'desc' ? 'DESC' : 'ASC';
        
        // Consulta otimizada para obter as vendas mensais
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
            
        // Executar a consulta
        console.log(`🔍 Executando consulta para o ano ${anoNum}...`);
        const result = await client.query(query, [`${anoNum}-01-01`]);
        
        console.log(`📊 Resultado da consulta para o ano ${anoNum}:`, result.rowCount, 'meses encontrados');
        
        // Processar os resultados
        const dados = result.rows.map(row => ({
            mes: row.mes_nome ? row.mes_nome.trim() : '',
            mes_numero: parseInt(row.mes_numero) || 0,
            quantidadePedidos: parseInt(row.quantidade_pedidos) || 0,
            totalVendas: parseFloat(row.total_vendas) || 0,
            ticketMedio: parseFloat(row.ticket_medio) || 0
        }));
        
        // Garantir que todos os 12 meses estejam presentes
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
        
        // Ordenar os meses corretamente
        mesesCompletos.sort((a, b) => a.mes_numero - b.mes_numero);
        
        // Calcular totais
        const totais = {
            quantidadePedidos: mesesCompletos.reduce((sum, mes) => sum + mes.quantidadePedidos, 0),
            totalVendas: parseFloat(mesesCompletos.reduce((sum, mes) => sum + mes.totalVendas, 0).toFixed(2)),
            ticketMedioGeral: 0
        };
        
        // Calcular ticket médio geral
        if (totais.quantidadePedidos > 0) {
            totais.ticketMedioGeral = parseFloat((totais.totalVendas / totais.quantidadePedidos).toFixed(2));
        }
        
        // Enviar resposta
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
        console.log('🔒 Conexão com o banco de dados liberada');
    }
};

/**
 * Relatório de Produtos Mais Vendidos
 * Retorna um relatório com os produtos mais vendidos em um período
 * @param {Object} req - Requisição HTTP
 * @param {Object} res - Resposta HTTP
 */
exports.getProdutosMaisVendidos = async (req, res) => {
    console.log('🔍 Iniciando getProdutosMaisVendidos');
    const client = await pool.connect();
    
    try {
        // Parâmetros da requisição
        const { dataInicio, dataFim, limite = 10 } = req.query;
        
        // Validar parâmetros
        const limiteNum = Math.min(parseInt(limite), 100) || 10; // Limitar a 100 itens
        const params = [];
        let paramIndex = 1;
        let whereClause = '';
        
        // Adicionar condições de data, se fornecidas
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
        
        // Adicionar limite
        params.push(limiteNum);
        
        // Construir a consulta SQL
        const query = `
            WITH vendas_por_produto AS (
                SELECT 
                    pr.id_produto,
                    pr.nome as nome_produto,
                    pr.descricao,
                    pr.preco as preco_atual,
                    COUNT(pp.id_pedido) as quantidade_vendida,
                    SUM(pp.quantidade) as total_itens_vendidos,
                    SUM(pp.quantidade * pp.preco_unitario) as valor_total_vendido,
                    AVG(pp.preco_unitario) as preco_medio_venda,
                    MIN(p.data_pedido) as primeira_venda,
                    MAX(p.data_pedido) as ultima_venda
                FROM produto pr
                JOIN pedidoproduto pp ON pr.id_produto = pp.id_produto
                JOIN pedido p ON pp.id_pedido = p.id_pedido
                WHERE 1=1 ${whereClause}
                GROUP BY pr.id_produto, pr.nome, pr.descricao, pr.preco
                ORDER BY quantidade_vendida DESC, valor_total_vendido DESC
                LIMIT $${paramIndex}
            )
            SELECT 
                vp.*,
                c.nome_categoria,
                ROUND((vp.preco_medio_venda / NULLIF(pr.preco, 0) - 1) * 100, 2) as margem_media_percentual
            FROM vendas_por_produto vp
            JOIN produto pr ON vp.id_produto = pr.id_produto
            LEFT JOIN categoria c ON pr.id_categoria = c.id_categoria
            ORDER BY vp.quantidade_vendida DESC, vp.valor_total_vendido DESC`;
        
        console.log('🔍 Executando consulta de produtos mais vendidos com parâmetros:', params);
        const result = await client.query(query, params);
        
        if (!result.rows || result.rows.length === 0) {
            return res.status(200).json({
                status: 'success',
                data: [],
                meta: {
                    total: 0,
                    periodo: {
                        dataInicio: dataInicio || 'Não especificada',
                        dataFim: dataFim || 'Não especificada',
                        limite: limiteNum
                    },
                    timestamp: new Date().toISOString()
                },
                message: 'Nenhum dado encontrado para o período selecionado'
            });
        }
        
        // Processar os resultados
        const produtos = result.rows.map(produto => ({
            id: produto.id_produto,
            nome: produto.nome_produto,
            descricao: produto.descricao || '',
            categoria: produto.nome_categoria || 'Sem categoria',
            precoAtual: parseFloat(produto.preco_atual) || 0,
            precoMedioVenda: parseFloat(produto.preco_medio_venda) || 0,
            margemMediaPercentual: parseFloat(produto.margem_media_percentual) || 0,
            quantidadeVendida: parseInt(produto.quantidade_vendida) || 0,
            totalItensVendidos: parseInt(produto.total_itens_vendidos) || 0,
            valorTotalVendido: parseFloat(produto.valor_total_vendido) || 0,
            primeiraVenda: produto.primeira_venda ? produto.primeira_venda.toISOString().split('T')[0] : null,
            ultimaVenda: produto.ultima_venda ? produto.ultima_venda.toISOString().split('T')[0] : null
        }));
        
        // Enviar resposta
        res.status(200).json({
            status: 'success',
            data: produtos,
            meta: {
                total: produtos.length,
                periodo: {
                    dataInicio: dataInicio || 'Não especificada',
                    dataFim: dataFim || 'Não especificada',
                    limite: limiteNum
                },
                paginacao: {
                    limite: limiteNum,
                    offset: 0
                }
            },
            message: 'Dados recuperados com sucesso',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Erro ao buscar produtos mais vendidos:', error);
        handleError(res, error, 'Erro ao processar o relatório de produtos mais vendidos');
    } finally {
        // Liberar o cliente de volta para o pool
        if (client) {
            try {
                await client.release();
                console.log('🔒 Conexão com o banco de dados liberada');
            } catch (releaseError) {
                console.error('❌ Erro ao liberar conexão:', releaseError);
            }
        }
    }
};
