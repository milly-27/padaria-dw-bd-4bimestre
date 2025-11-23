const { pool } = require('../database');

/**
 * Valida se uma string é uma data válida no formato YYYY-MM-DD
 */
const isValidDate = (dateString) => {
    if (!dateString) return false;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
};

// Função auxiliar para tratar erros
const handleError = (res, error, message) => {
    console.error(`❌ ${message}:`);
    console.error('Mensagem:', error.message);
    console.error('Stack:', error.stack);
    console.error('Código:', error.code);
    console.error('Detalhe:', error.detail);
    
    res.status(500).json({ 
        status: 'error',
        message: message,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        errorCode: error.code,
        timestamp: new Date().toISOString()
    });
};

/**
 * Relatório de Vendas Mensais
 */
exports.getVendasMensais = async (req, res) => {
    console.log('🔍 Iniciando getVendasMensais');
    let client;
    
    try {
        client = await pool.connect();
        console.log('✅ Conexão estabelecida');
        
        const { ano = new Date().getFullYear() } = req.query;
        const anoNum = parseInt(ano);
        
        if (isNaN(anoNum) || anoNum < 2000 || anoNum > 2100) {
            return res.status(400).json({
                status: 'error',
                message: 'Ano inválido',
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
            
        console.log(`🔍 Executando para ano ${anoNum}...`);
        const result = await client.query(query, [`${anoNum}-01-01`]);
        console.log(`📊 ${result.rowCount} meses encontrados`);
        
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
        handleError(res, error, 'Erro ao processar vendas mensais');
    } finally {
        if (client) {
            client.release();
            console.log('🔒 Conexão liberada');
        }
    }
};

/**
 * Relatório de Produtos Mais Vendidos
 */
exports.getProdutosMaisVendidos = async (req, res) => {
    console.log('🔍 Iniciando getProdutosMaisVendidos');
    console.log('📥 Params:', req.query);
    
    let client;
    
    try {
        client = await pool.connect();
        console.log('✅ Conexão estabelecida');
        
        const { dataInicio, dataFim, limite = 10 } = req.query;
        const limiteNum = Math.min(parseInt(limite) || 10, 100);
        
        const whereConditions = [];
        const params = [];
        let paramIndex = 1;
        
        if (dataInicio && dataInicio.trim() !== '') {
            if (!isValidDate(dataInicio)) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Data de início inválida',
                    timestamp: new Date().toISOString()
                });
            }
            whereConditions.push(`p.data_pedido >= $${paramIndex}::date`);
            params.push(dataInicio);
            paramIndex++;
        }
        
        if (dataFim && dataFim.trim() !== '') {
            if (!isValidDate(dataFim)) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Data de fim inválida',
                    timestamp: new Date().toISOString()
                });
            }
            whereConditions.push(`p.data_pedido <= ($${paramIndex}::date + INTERVAL '1 day' - INTERVAL '1 second')`);
            params.push(dataFim);
            paramIndex++;
        }
        
        const whereClause = whereConditions.length > 0 
            ? 'WHERE ' + whereConditions.join(' AND ')
            : '';
        
        const query = `
            SELECT 
                pr.id_produto,
                pr.nome_produto as nome,
                COALESCE(c.nome_categoria, 'Sem categoria') as categoria,
                COALESCE(SUM(pp.quantidade), 0) as quantidade_vendida,
                COALESCE(SUM(pp.quantidade * pp.preco_unitario), 0) as valor_total_vendido,
                CASE 
                    WHEN SUM(pp.quantidade) > 0 
                    THEN COALESCE(SUM(pp.quantidade * pp.preco_unitario), 0) / SUM(pp.quantidade)
                    ELSE 0 
                END as preco_medio_venda
            FROM produto pr
            LEFT JOIN categoria c ON pr.id_categoria = c.id_categoria
            INNER JOIN pedidoproduto pp ON pr.id_produto = pp.id_produto
            INNER JOIN pedido p ON pp.id_pedido = p.id_pedido
            ${whereClause}
            GROUP BY pr.id_produto, pr.nome_produto, c.nome_categoria
            HAVING SUM(pp.quantidade) > 0
            ORDER BY quantidade_vendida DESC, valor_total_vendido DESC
            LIMIT $${paramIndex}
        `;
        
        params.push(limiteNum);
        
        console.log('🔍 Executando query...');
        const result = await client.query(query, params);
        console.log(`📊 ${result.rowCount} produtos encontrados`);
        
        const produtos = result.rows.map(row => ({
            nome: row.nome || 'Produto sem nome',
            descricao: '',
            categoria: row.categoria,
            quantidade_vendida: parseInt(row.quantidade_vendida) || 0,
            valor_total_vendido: parseFloat(row.valor_total_vendido) || 0,
            preco_medio_venda: parseFloat(row.preco_medio_venda) || 0
        }));
        
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
        handleError(res, error, 'Erro ao processar produtos mais vendidos');
    } finally {
        if (client) {
            client.release();
            console.log('🔒 Conexão liberada');
        }
    }
};

/**
 * Relatório de Clientes que Mais Compram - COM DEBUG COMPLETO
 */
exports.getClientesMaisCompram = async (req, res) => {
    console.log('\n═══════════════════════════════════════');
    console.log('🔍 INICIANDO getClientesMaisCompram');
    console.log('═══════════════════════════════════════');
    console.log('📥 Query params:', JSON.stringify(req.query, null, 2));
    
    let client;
    
    try {
        // Conectar ao banco
        console.log('🔌 Tentando conectar ao banco...');
        client = await pool.connect();
        console.log('✅ Conexão estabelecida com sucesso!');
        
        // Pegar parâmetros
        const { 
            dataInicio, 
            dataFim, 
            limite = 20,
            cpf,
            nome,
            ordenar = 'total_compras',
            direcao = 'desc'
        } = req.query;
        
        console.log('\n📋 Parâmetros processados:');
        console.log('  - dataInicio:', dataInicio || 'não informada');
        console.log('  - dataFim:', dataFim || 'não informada');
        console.log('  - limite:', limite);
        console.log('  - cpf:', cpf || 'não informado');
        console.log('  - nome:', nome || 'não informado');
        
        const limiteNum = Math.min(parseInt(limite) || 20, 100);
        
        // Construir WHERE
        const whereConditions = [];
        const params = [];
        let paramIndex = 1;
        
        if (dataInicio && dataInicio.trim() !== '') {
            if (!isValidDate(dataInicio)) {
                console.log('❌ Data início inválida:', dataInicio);
                return res.status(400).json({
                    status: 'error',
                    message: 'Data de início inválida. Use YYYY-MM-DD.',
                    timestamp: new Date().toISOString()
                });
            }
            whereConditions.push(`p.data_pedido >= $${paramIndex}::date`);
            params.push(dataInicio);
            paramIndex++;
            console.log('✅ Filtro data início aplicado');
        }
        
        if (dataFim && dataFim.trim() !== '') {
            if (!isValidDate(dataFim)) {
                console.log('❌ Data fim inválida:', dataFim);
                return res.status(400).json({
                    status: 'error',
                    message: 'Data de fim inválida. Use YYYY-MM-DD.',
                    timestamp: new Date().toISOString()
                });
            }
            whereConditions.push(`p.data_pedido <= ($${paramIndex}::date + INTERVAL '1 day' - INTERVAL '1 second')`);
            params.push(dataFim);
            paramIndex++;
            console.log('✅ Filtro data fim aplicado');
        }
        
        if (cpf && cpf.trim() !== '') {
            const cpfLimpo = cpf.replace(/[^\d]/g, '');
            if (cpfLimpo.length === 11) {
                whereConditions.push(`c.cpf = $${paramIndex}`);
                params.push(cpfLimpo);
                paramIndex++;
                console.log('✅ Filtro CPF aplicado:', cpfLimpo);
            }
        }
        
        if (nome && nome.trim() !== '') {
            whereConditions.push(`LOWER(c.nome) LIKE LOWER($${paramIndex})`);
            params.push(`%${nome.trim()}%`);
            paramIndex++;
            console.log('✅ Filtro nome aplicado:', nome);
        }
        
        const whereClause = whereConditions.length > 0 
            ? 'WHERE ' + whereConditions.join(' AND ')
            : '';
        
        console.log('\n🔍 WHERE clause:', whereClause || '(sem filtros)');
        console.log('🔍 Parâmetros SQL:', params);
        
        // Ordenação
        const orderByMap = {
            'total_compras': 'total_compras',
            'quantidade_pedidos': 'quantidade_pedidos',
            'ticket_medio': 'ticket_medio',
            'ultima_compra': 'ultima_compra',
            'nome': 'c.nome'
        };
        
        const orderBy = orderByMap[ordenar] || 'total_compras';
        const orderDirection = direcao === 'asc' ? 'ASC' : 'DESC';
        
        console.log('📊 Ordenação:', `${orderBy} ${orderDirection}`);
        
        // Query principal
        const query = `
            SELECT 
                c.id_cliente,
                c.nome,
                c.cpf,
                c.telefone,
                c.email,
                c.data_cadastro,
                COALESCE(COUNT(DISTINCT p.id_pedido), 0) as quantidade_pedidos,
                COALESCE(SUM(p.valor_total), 0) as total_compras,
                CASE 
                    WHEN COUNT(DISTINCT p.id_pedido) > 0 
                    THEN COALESCE(SUM(p.valor_total), 0) / COUNT(DISTINCT p.id_pedido)
                    ELSE 0 
                END as ticket_medio,
                MAX(p.data_pedido) as ultima_compra,
                MIN(p.data_pedido) as primeira_compra
            FROM cliente c
            LEFT JOIN pedido p ON c.id_cliente = p.id_cliente
            ${whereClause}
            GROUP BY c.id_cliente, c.nome, c.cpf, c.telefone, c.email, c.data_cadastro
            HAVING COUNT(DISTINCT p.id_pedido) > 0
            ORDER BY ${orderBy} ${orderDirection}
            LIMIT $${paramIndex}
        `;
        
        params.push(limiteNum);
        
        console.log('\n🔍 QUERY COMPLETA:');
        console.log(query);
        console.log('\n🔍 PARAMS:', params);
        
        console.log('\n⏳ Executando query...');
        const result = await client.query(query, params);
        console.log(`✅ Query executada com sucesso!`);
        console.log(`📊 Resultado: ${result.rowCount} clientes encontrados`);
        
        if (result.rowCount > 0) {
            console.log('📋 Primeiro resultado:', result.rows[0]);
        }
        
        // Processar resultados
        const clientes = result.rows.map(row => ({
            id_cliente: parseInt(row.id_cliente),
            nome: row.nome || 'Cliente sem nome',
            cpf: row.cpf ? row.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : 'N/A',
            telefone: row.telefone || 'N/A',
            email: row.email || 'N/A',
            data_cadastro: row.data_cadastro,
            quantidade_pedidos: parseInt(row.quantidade_pedidos) || 0,
            total_compras: parseFloat(row.total_compras) || 0,
            ticket_medio: parseFloat(row.ticket_medio) || 0,
            ultima_compra: row.ultima_compra,
            primeira_compra: row.primeira_compra
        }));
        
        // Calcular totais
        const totais = {
            total_clientes: clientes.length,
            total_pedidos: clientes.reduce((sum, c) => sum + c.quantidade_pedidos, 0),
            total_vendas: clientes.reduce((sum, c) => sum + c.total_compras, 0),
            ticket_medio_geral: 0
        };
        
        if (totais.total_pedidos > 0) {
            totais.ticket_medio_geral = parseFloat((totais.total_vendas / totais.total_pedidos).toFixed(2));
        }
        
        console.log('\n📊 TOTAIS CALCULADOS:');
        console.log(JSON.stringify(totais, null, 2));
        
        console.log('\n✅ Retornando resposta com sucesso!');
        console.log('═══════════════════════════════════════\n');
        
        res.status(200).json({
            status: 'success',
            data: clientes,
            meta: {
                total: clientes.length,
                periodo: {
                    dataInicio: dataInicio || null,
                    dataFim: dataFim || null,
                    limite: limiteNum
                },
                filtros: {
                    cpf: cpf || null,
                    nome: nome || null
                },
                totais: totais,
                timestamp: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.log('\n❌❌❌ ERRO DETECTADO ❌❌❌');
        console.log('Mensagem:', error.message);
        console.log('Código:', error.code);
        console.log('Detalhe:', error.detail);
        console.log('Hint:', error.hint);
        console.log('Stack:', error.stack);
        console.log('═══════════════════════════════════════\n');
        
        handleError(res, error, 'Erro ao processar o relatório de clientes que mais compram');
    } finally {
        if (client) {
            client.release();
            console.log('🔒 Conexão liberada');
        }
    }
};