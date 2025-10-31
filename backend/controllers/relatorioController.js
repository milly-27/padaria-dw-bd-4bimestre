const { pool } = require('../database');

// Função auxiliar para tratar erros
const handleError = (res, error, message) => {
    console.error(`${message}:`, error);
    res.status(500).json({ 
        error: message,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
};

// Relatório de Vendas Mensais
exports.getVendasMensais = async (req, res) => {
    const client = await pool.connect();
    try {
        const { ano = new Date().getFullYear() } = req.query;
        
        const query = `
            SELECT 
                EXTRACT(MONTH FROM p.data_pedido) as mes,
                COUNT(DISTINCT p.id) as quantidade_pedidos,
                COALESCE(SUM(pp.quantidade * pp.valor_unitario), 0) as total_vendas,
                CASE 
                    WHEN COUNT(DISTINCT p.id) > 0 
                    THEN COALESCE(SUM(pp.quantidade * pp.valor_unitario), 0) / COUNT(DISTINCT p.id)
                    ELSE 0 
                END as ticket_medio
            FROM pedido p
            JOIN pedidoproduto pp ON p.id = pp.pedido_id
            WHERE p.status = 'FINALIZADO' AND EXTRACT(YEAR FROM p.data_pedido) = $1
            GROUP BY EXTRACT(MONTH FROM p.data_pedido)
            ORDER BY mes`;
            
        const result = await client.query(query, [ano]);
        
        // Mapear para o formato esperado pelo frontend
        const meses = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        
        const dados = meses.map((nomeMes, index) => {
            const mesDados = result.rows.find(r => parseInt(r.mes) === (index + 1)) || {
                quantidade_pedidos: 0,
                total_vendas: '0',
                ticket_medio: '0'
            };
            
            return {
                mes: nomeMes,
                quantidadePedidos: parseInt(mesDados.quantidade_pedidos),
                totalVendas: parseFloat(mesDados.total_vendas),
                ticketMedio: parseFloat(mesDados.ticket_medio)
            };
        });
        
        if (!dados || !Array.isArray(dados)) {
            return res.status(404).json({ 
                error: 'Nenhum dado encontrado',
                message: 'Não foram encontrados dados para o período selecionado.'
            });
        }
        
        res.json({
            status: 'success',
            data: dados,
            total: dados.length,
            message: 'Dados recuperados com sucesso'
        });
    } catch (error) {
        handleError(res, error, 'Erro ao buscar vendas mensais');
    }
};

// Relatório de Produtos Mais Vendidos
exports.getProdutosMaisVendidos = async (req, res) => {
    try {
        const { dataInicio, dataFim, limite = 10 } = req.query;
        
        let whereClause = "WHERE p.status = 'FINALIZADO' ";
        const params = [];
        
        if (dataInicio && dataFim) {
            whereClause += "AND DATE(p.data_pedido) BETWEEN ? AND ? ";
            params.push(dataInicio, dataFim);
        }
        
        const limitClause = parseInt(limite) > 0 ? `LIMIT ${parseInt(limite)}` : '';
        
        const query = `
            SELECT 
                pr.id,
                pr.nome as nome_produto,
                c.nome as categoria,
                pr.imagem,
                SUM(pp.quantidade) as quantidade_vendida,
                SUM(pp.quantidade * pp.valor_unitario) as total_arrecadado,
            FROM pedidoproduto pp
            JOIN produto pr ON pp.produto_id = pr.id
            JOIN pedido p ON pp.pedido_id = p.id
            ${whereClause}
            GROUP BY pr.nome
            ORDER BY quantidade_vendida DESC
            LIMIT $${paramCount}`;
            
        const result = await client.query(query, queryParams);
        
        if (!result.rows || result.rows.length === 0) {
            return res.status(404).json({ 
                error: 'Nenhum dado encontrado',
                message: 'Não foram encontrados dados para o período selecionado.'
            });
        }
        
        const dados = result.rows.map(item => ({
            produto: item.produto,
            quantidadeVendida: parseInt(item.quantidade_vendida),
            totalVendido: parseFloat(item.total_vendido || 0)
        }));
        
        res.json({
            status: 'success',
            data: dados,
            total: dados.length,
            message: 'Dados recuperados com sucesso'
        });
    } catch (error) {
        handleError(res, error, 'Erro ao buscar produtos mais vendidos');
    } finally {
        client.release();
    }
};

// Relatório de Clientes que Mais Compraram
exports.getClientesMaisCompraram = async (req, res) => {
    const client = await pool.connect();
    try {
        const { dataInicio, dataFim, limite = 10 } = req.query;
        
        let whereClause = '';
        const queryParams = [limite];
        let paramCount = 1;
        
        if (dataInicio && dataFim) {
            whereClause = `AND p.data_pedido BETWEEN $1 AND $2`;
            queryParams.unshift(dataFim, dataInicio);
            paramCount = 3; // Update parameter count for PostgreSQL
        }
        
        const query = `
            SELECT 
                c.nome as cliente,
                COUNT(DISTINCT p.id) as total_pedidos,
                COALESCE(SUM(pp.quantidade * pp.valor_unitario), 0) as total_gasto
            FROM cliente c
            JOIN pedido p ON c.id = p.cliente_id
            JOIN pedidoproduto pp ON p.id = pp.pedido_id
            WHERE p.status = 'FINALIZADO' ${whereClause}
            GROUP BY c.id, c.nome
            ORDER BY total_gasto DESC
            LIMIT $${paramCount}`;
            
        const result = await client.query(query, queryParams);
        
        if (!result.rows || result.rows.length === 0) {
            return res.status(404).json({ 
                error: 'Nenhum dado encontrado',
                message: 'Não foram encontrados dados para o período selecionado.'
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
            message: 'Clientes que mais compraram recuperados com sucesso',
            params: { dataInicio, dataFim, limite }
        });
    } catch (error) {
        handleError(res, error, 'Erro ao buscar clientes que mais compraram');
    }
};
