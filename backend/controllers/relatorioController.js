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
    });};

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
            GROUP BY m.mes
            ORDER BY m.mes`;
            
        // Executar a consulta
        const result = await client.query(query, [`${anoNum}-01-01`]);
        
        console.log(`📊 Resultado da consulta para o ano ${anoNum}:`, result.rowCount, 'meses encontrados');
        
        // Processar os resultados
        const dados = result.rows.map(row => ({
            mes: row.mes_nome.trim(), // Remove espaços em branco extras
            mes_numero: parseInt(row.mes_numero),
            quantidadePedidos: parseInt(row.quantidade_pedidos) || 0,
            totalVendas: parseFloat(row.total_vendas) || 0,
            ticketMedio: parseFloat(row.ticket_medio) || 0
        }));
        
        // Garantir que todos os 12 meses estejam presentes
        const mesesCompletos = Array.from({ length: 12 }, (_, i) => {
            const mesNumero = i + 1;
            const mesExistente = dados.find(m => m.mes_numero === mesNumero);
            
            if (mesExistente) return mesExistente;
            
            return {
                mes: [
                    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
                ][i],
                mes_numero: mesNumero,
                quantidadePedidos: 0,
                totalVendas: 0,
                ticketMedio: 0
            };
        });
        
        // Ordenar por mês
        const dadosOrdenados = mesesCompletos.sort((a, b) => a.mes_numero - b.mes_numero);
        
        // Calcular totais
        const totais = {
            totalPedidos: dados.reduce((sum, item) => sum + item.quantidadePedidos, 0),
            totalVendas: dados.reduce((sum, item) => sum + item.totalVendas, 0),
            mediaTicket: dados.length > 0 
                ? dados.reduce((sum, item) => sum + item.ticketMedio, 0) / dados.length 
                : 0
        };
        
        // Enviar resposta
        res.status(200).json({
            status: 'success',
            data: dadosOrdenados,
            meta: {
                total: dadosOrdenados.length,
                ano: anoNum,
                totais: {
                    pedidos: totais.totalPedidos,
                    vendas: totais.totalVendas,
                    ticketMedio: totais.mediaTicket
                }
            },
            message: 'Dados recuperados com sucesso',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Erro ao buscar vendas mensais:', error);
        handleError(res, error, 'Erro ao processar o relatório de vendas mensais');
    } finally {
        // Liberar o cliente de volta para o pool
        if (client) {
            try {
                await client.release();
                console.log('🔌 Conexão com o banco de dados liberada');
            } catch (releaseError) {
                console.error('Erro ao liberar conexão:', releaseError);
            }
        }
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
        
        // Construir a cláusula WHERE dinamicamente
        const whereConditions = [];
        
        // Adicionar filtro de data inicial
        if (dataInicio) {
            if (!isValidDate(dataInicio)) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Data inicial inválida. Use o formato YYYY-MM-DD.',
                    timestamp: new Date().toISOString()
                });
            }
            whereConditions.push(`p.data_pedido >= $${paramIndex++}`);
            params.push(dataInicio);
        }
        
        // Adicionar filtro de data final
        if (dataFim) {
            if (!isValidDate(dataFim)) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Data final inválida. Use o formato YYYY-MM-DD.',
                    timestamp: new Date().toISOString()
                });
            }
            whereConditions.push(`p.data_pedido <= $${paramIndex++}::date + INTERVAL '1 day'`);
            params.push(dataFim);
        }
        
        // Adicionar limite de resultados
        params.push(limiteNum);
        
        // Construir a consulta SQL
        const query = `
            WITH vendas_por_produto AS (
                SELECT 
                    pr.id_produto,
                    pr.nome_produto,
                    pr.preco as preco_atual,
                    COALESCE(SUM(pp.quantidade), 0) as quantidade_vendida,
                    COALESCE(SUM(pp.quantidade * pp.preco_unitario), 0) as valor_total_vendido,
                    COALESCE(SUM(pp.quantidade * pp.preco_unitario) / NULLIF(SUM(pp.quantidade), 0), 0) as preco_medio_venda
                FROM produto pr
                LEFT JOIN pedidoproduto pp ON pr.id_produto = pp.id_produto
                LEFT JOIN pedido p ON pp.id_pedido = p.id_pedido
                ${whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : ''}
                GROUP BY pr.id_produto, pr.nome_produto, pr.preco
                HAVING COALESCE(SUM(pp.quantidade), 0) > 0
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
        
        console.log('📊 Executando consulta de produtos mais vendidos com parâmetros:', params);
        const result = await client.query(query, params);
        
        if (!result.rows || result.rows.length === 0) {
            return res.status(200).json({
                status: 'success',
                data: [],
                meta: {
                    total: 0,
                    periodo: {
                        dataInicio: dataInicio || 'Não especificada',
                        dataFim: dataFim || 'Não especificada'
                    },
                    totais: {
                        itensVendidos: 0,
                        valorTotalVendido: 0
                    }
                },
                message: 'Nenhum produto vendido encontrado no período selecionado.',
                timestamp: new Date().toISOString()
            });
        }
        
        // Calcular totais
        const totais = result.rows.reduce((acc, item) => ({
            itensVendidos: acc.itensVendidos + parseInt(item.quantidade_vendida) || 0,
            valorTotalVendido: acc.valorTotalVendido + parseFloat(item.valor_total_vendido) || 0
        }), { itensVendidos: 0, valorTotalVendido: 0 });
        
        // Formatar os dados de resposta
        const dadosFormatados = result.rows.map(item => ({
            id: parseInt(item.id_produto),
            nome: item.nome_produto,
            categoria: item.nome_categoria || 'Sem categoria',
            precoAtual: parseFloat(item.preco_atual) || 0,
            quantidadeVendida: parseInt(item.quantidade_vendida) || 0,
            valorTotalVendido: parseFloat(item.valor_total_vendido) || 0,
            precoMedioVenda: parseFloat(item.preco_medio_venda) || 0,
            margemMediaPercentual: parseFloat(item.margem_media_percentual) || 0
        }));
        
        // Enviar resposta
        res.status(200).json({
            status: 'success',
            data: dadosFormatados,
            meta: {
                total: result.rowCount,
                periodo: {
                    dataInicio: dataInicio || 'Não especificada',
                    dataFim: dataFim || 'Não especificada'
                },
                totais: {
                    itensVendidos: totais.itensVendidos,
                    valorTotalVendido: totais.valorTotalVendido,
                    valorMedioPorItem: totais.itensVendidos > 0 
                        ? totais.valorTotalVendido / totais.itensVendidos 
                        : 0
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
                console.log('🔌 Conexão com o banco de dados liberada');
            } catch (releaseError) {
                console.error('Erro ao liberar conexão:', releaseError);
            }
        }
    }
};

/**
 * Relatório de Clientes que Mais Compraram
 * Retorna um relatório com os clientes que mais realizaram compras em um período
 * @param {Object} req - Requisição HTTP
 * @param {Object} res - Resposta HTTP
 */
exports.getClientesMaisCompraram = async (req, res) => {
    console.log('🔍 Iniciando getClientesMaisCompraram');
    const client = await pool.connect();
    
    try {
        // Parâmetros da requisição
        const { dataInicio, dataFim, limite = 10 } = req.query;
        
        // Validar parâmetros
        const limiteNum = Math.min(parseInt(limite), 100) || 10; // Limitar a 100 itens
        const params = [];
        let paramIndex = 1;
        
        // Construir a cláusula WHERE dinamicamente
        const whereConditions = [];
        
        // Adicionar filtro de data inicial
        if (dataInicio) {
            if (!isValidDate(dataInicio)) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Data inicial inválida. Use o formato YYYY-MM-DD.',
                    timestamp: new Date().toISOString()
                });
            }
            whereConditions.push(`p.data_pedido >= $${paramIndex++}`);
            params.push(dataInicio);
        }
        
        // Adicionar filtro de data final
        if (dataFim) {
            if (!isValidDate(dataFim)) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Data final inválida. Use o formato YYYY-MM-DD.',
                    timestamp: new Date().toISOString()
                });
            }
            whereConditions.push(`p.data_pedido <= $${paramIndex++}::date + INTERVAL '1 day'`);
            params.push(dataFim);
        }
        
        // Construir a consulta SQL
        const query = `
            WITH compras_por_cliente AS (
                SELECT 
                    c.id_cliente,
                    c.nome as nome_cliente,
                    c.email,
                    c.telefone,
                    COUNT(DISTINCT p.id_pedido) as total_pedidos,
                    COALESCE(SUM(p.valor_total), 0) as valor_total_gasto,
                    MIN(p.data_pedido) as primeira_compra,
                    MAX(p.data_pedido) as ultima_compra,
                    COUNT(DISTINCT TO_CHAR(p.data_pedido, 'YYYY-MM')) as meses_ativos,
                    COALESCE(SUM(p.valor_total) / NULLIF(COUNT(DISTINCT p.id_pedido), 0), 0) as ticket_medio
                FROM cliente c
                LEFT JOIN pedido p ON c.id_cliente = p.id_cliente
                ${whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : ''}
                GROUP BY c.id_cliente, c.nome, c.email, c.telefone
                HAVING COUNT(DISTINCT p.id_pedido) > 0
                ORDER BY valor_total_gasto DESC, total_pedidos DESC
                LIMIT $${paramIndex}
            )
            SELECT 
                cpc.*,
                (
                    SELECT COUNT(DISTINCT pp.id_produto)
                    FROM pedido p2
                    JOIN pedidoproduto pp ON p2.id_pedido = pp.id_pedido
                    WHERE p2.id_cliente = cpc.id_cliente
                    ${whereConditions.length > 0 ? 'AND ' + whereConditions.join(' AND ') : ''}
                ) as total_produtos_diferentes,
                (
                    SELECT STRING_AGG(DISTINCT cat.nome_categoria, ', ')
                    FROM pedido p3
                    JOIN pedidoproduto pp ON p3.id_pedido = pp.id_pedido
                    JOIN produto pr ON pp.id_produto = pr.id_produto
                    LEFT JOIN categoria cat ON pr.id_categoria = cat.id_categoria
                    WHERE p3.id_cliente = cpc.id_cliente
                    ${whereConditions.length > 0 ? 'AND ' + whereConditions.join(' AND ') : ''}
                    LIMIT 5
                ) as categorias_frequentes
            FROM compras_por_cliente cpc
            ORDER BY cpc.valor_total_gasto DESC, cpc.total_pedidos DESC`;
        
        console.log('📊 Executando consulta de clientes que mais compraram com parâmetros:', params);
        const result = await client.query(query, params);
        
        if (!result.rows || result.rows.length === 0) {
            return res.status(200).json({
                status: 'success',
                data: [],
                meta: {
                    total: 0,
                    periodo: {
                        dataInicio: dataInicio || 'Não especificada',
                        dataFim: dataFim || 'Não especificada'
                    },
                    totais: {
                        clientesAtivos: 0,
                        valorTotalGasto: 0,
                        pedidosRealizados: 0
                    }
                },
                message: 'Nenhum cliente com compras encontrado no período selecionado.',
                timestamp: new Date().toISOString()
            });
        }
        
        // Calcular totais
        const totais = result.rows.reduce((acc, item) => ({
            clientesAtivos: acc.clientesAtivos + 1,
            valorTotalGasto: acc.valorTotalGasto + parseFloat(item.valor_total_gasto) || 0,
            pedidosRealizados: acc.pedidosRealizados + parseInt(item.total_pedidos) || 0
        }), { clientesAtivos: 0, valorTotalGasto: 0, pedidosRealizados: 0 });
        
        // Calcular ticket médio global
        const ticketMedioGlobal = totais.clientesAtivos > 0 
            ? totais.valorTotalGasto / totais.clientesAtivos 
            : 0;
        
        // Formatar os dados de resposta
        const dadosFormatados = result.rows.map((item, index) => ({
            posicao: index + 1,
            id: parseInt(item.id_cliente),
            nome: item.nome_cliente,
            email: item.email,
            telefone: item.telefone,
            totalPedidos: parseInt(item.total_pedidos) || 0,
            valorTotalGasto: parseFloat(item.valor_total_gasto) || 0,
            ticketMedio: parseFloat(item.ticket_medio) || 0,
            primeiraCompra: item.primeira_compra,
            ultimaCompra: item.ultima_compra,
            mesesAtivos: parseInt(item.meses_ativos) || 0,
            totalProdutosDiferentes: parseInt(item.total_produtos_diferentes) || 0,
            categoriasFrequentes: item.categorias_frequentes ? 
                item.categorias_frequentes.split(', ').filter(Boolean) : []
        }));
        
        // Enviar resposta
        res.status(200).json({
            status: 'success',
            data: dadosFormatados,
            meta: {
                total: result.rowCount,
                periodo: {
                    dataInicio: dataInicio || 'Não especificada',
                    dataFim: dataFim || 'Não especificada'
                },
                totais: {
                    clientesAtivos: totais.clientesAtivos,
                    valorTotalGasto: totais.valorTotalGasto,
                    pedidosRealizados: totais.pedidosRealizados,
                    ticketMedioGlobal: ticketMedioGlobal,
                    mediaPedidosPorCliente: totais.clientesAtivos > 0 
                        ? totais.pedidosRealizados / totais.clientesAtivos 
                        : 0
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
        console.error('❌ Erro ao buscar clientes que mais compraram:', error);
        handleError(res, error, 'Erro ao processar o relatório de clientes que mais compraram');
    } finally {
        // Liberar o cliente de volta para o pool
        if (client) {
            try {
                await client.release();
                console.log('🔌 Conexão com o banco de dados liberada');
            } catch (releaseError) {
                console.error('Erro ao liberar conexão:', releaseError);
            }
        }
    }
};

/**
 * Relatório de Clientes que Mais Compraram
 * Retorna um relatório com os clientes que mais realizaram compras em um período
 * @param {Object} req - Requisição HTTP
 * @param {Object} res - Resposta HTTP
 */
exports.getClientesMaisCompraram = async (req, res) => {
    console.log('🔍 Iniciando getClientesMaisCompraram');
    const client = await pool.connect();
    
    try {
        // Parâmetros da requisição
        const { dataInicio, dataFim, limite = 10 } = req.query;
        
        // Validar parâmetros
        const limiteNum = Math.min(parseInt(limite), 100) || 10; // Limitar a 100 itens
        const params = [];
        let paramIndex = 1;
        
        // Construir a cláusula WHERE dinamicamente
        const whereClause = [];
        
        // Adicionar filtro de data inicial
        if (dataInicio) {
            if (!isValidDate(dataInicio)) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Data inicial inválida. Use o formato YYYY-MM-DD.',
                    timestamp: new Date().toISOString()
                });
            }
            whereClause.push(`p.data_pedido >= $${paramIndex++}`);
            params.push(dataInicio);
        }
        
        // Adicionar filtro de data final
        if (dataFim) {
            if (!isValidDate(dataFim)) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Data final inválida. Use o formato YYYY-MM-DD.',
                    timestamp: new Date().toISOString()
                });
            }
            const dataFimAjustada = new Date(dataFim);
            dataFimAjustada.setDate(dataFimAjustada.getDate() + 1);
            params[params.length - 1] = dataFimAjustada.toISOString().split('T')[0];
        }
        
        // Adicionar o limite aos parâmetros
        params.push(parseInt(limite));
        
        const query = `
            SELECT 
                pe.nome_pessoa as cliente,
                pe.cpf,
                COUNT(DISTINCT p.id_pedido) as total_pedidos,
                COALESCE(SUM(p.valor_total), 0) as total_gasto
            FROM pedido p
            JOIN pessoa pe ON p.cpf = pe.cpf
            ${whereClause.length > 0 ? 'WHERE ' + whereClause.join(' AND ') : ''}
            GROUP BY pe.cpf, pe.nome_pessoa
            HAVING COUNT(DISTINCT p.id_pedido) > 0
            ORDER BY total_gasto DESC
            LIMIT $${paramIndex}`;
            
        const result = await client.query(query, params);
        
        if (!result.rows || result.rows.length === 0) {
            return res.status(404).json({ 
                error: 'Nenhum dado encontrado',
                message: 'Não foram encontrados clientes no período selecionado.'
            });
        }
        
        const dados = result.rows.map(item => ({
            cliente: item.cliente,
            totalPedidos: parseInt(item.total_pedidos),
            totalGasto: parseFloat(item.total_gasto || 0)
        }));
        
        res.json({
            status: 'success',
            data: dados,
            total: dados.length,
            message: 'Clientes que mais compraram recuperados com sucesso'
        });
    } catch (error) {
        console.error('Erro detalhado:', error);
        handleError(res, error, 'Erro ao buscar clientes que mais compraram');
    } finally {
        client.release();
    }
};
