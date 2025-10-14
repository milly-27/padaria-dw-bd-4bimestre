// controllers/carrinhoController.js

class CarrinhoController {
    constructor(db) {
        this.db = db;
    }

    // ================================
    // Buscar todas as formas de pagamento
    // ================================
    async getFormasPagamento(req, res) {
        const client = await this.db.connect();
        try {
            const result = await client.query(
                'SELECT id_forma_pagamento, nome_forma FROM forma_pagamento ORDER BY nome_forma'
            );
            res.status(200).json(result.rows);
        } catch (error) {
            console.error('Erro ao buscar formas de pagamento:', error);
            res.status(500).json({
                error: 'Erro interno do servidor',
                message: 'Não foi possível carregar as formas de pagamento'
            });
        } finally {
            client.release();
        }
    }

    // ================================
    // Criar ou atualizar pedido no carrinho (sem finalizar pagamento)
    // ================================
    async salvarCarrinho(req, res) {
        const client = await this.db.connect();
        try {
            const { cpf, itens, valor_total } = req.body;

            if (!cpf || !itens || itens.length === 0) {
                return res.status(400).json({
                    error: 'Dados incompletos',
                    message: 'CPF e itens são obrigatórios'
                });
            }

            await client.query('BEGIN');

            // Verifica se já existe um pedido aberto para esse CPF
            let pedidoResult = await client.query(
                'SELECT id_pedido FROM pedido WHERE cpf = $1 ORDER BY data_pedido DESC LIMIT 1',
                [cpf]
            );

            let id_pedido;
            if (pedidoResult.rows.length === 0) {
                // Cria um novo pedido
                const insertPedido = await client.query(
                    'INSERT INTO pedido (cpf, data_pedido, valor_total) VALUES ($1, CURRENT_DATE, $2) RETURNING id_pedido',
                    [cpf, valor_total]
                );
                id_pedido = insertPedido.rows[0].id_pedido;
            } else {
                // Atualiza o valor_total do pedido existente
                id_pedido = pedidoResult.rows[0].id_pedido;
                await client.query(
                    'UPDATE pedido SET valor_total = $1 WHERE id_pedido = $2',
                    [valor_total, id_pedido]
                );
            }

            await client.query('COMMIT');

            res.status(200).json({
                success: true,
                message: 'Carrinho salvo com sucesso',
                id_pedido
            });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Erro ao salvar carrinho:', error);
            res.status(500).json({
                error: 'Erro interno do servidor',
                message: 'Não foi possível salvar o carrinho'
            });
        } finally {
            client.release();
        }
    }

    // ================================
    // Finalizar pedido: salvar itens na pedidoproduto
    // ================================
    async finalizarPedido(req, res) {
        const client = await this.db.connect();
        try {
            const { id_pedido, itens } = req.body;

            if (!id_pedido || !itens || itens.length === 0) {
                return res.status(400).json({
                    error: 'Dados incompletos',
                    message: 'ID do pedido e itens são obrigatórios'
                });
            }

            await client.query('BEGIN');

            // Limpa itens antigos, se existirem
            await client.query('DELETE FROM pedidoproduto WHERE id_pedido = $1', [id_pedido]);

            // Insere itens do pedido
            for (const item of itens) {
                await client.query(
                    'INSERT INTO pedidoproduto (id_produto, id_pedido, quantidade, preco_unitario) VALUES ($1, $2, $3, $4)',
                    [item.id_produto, id_pedido, item.quantidade, item.preco_unitario]
                );
            }

            await client.query('COMMIT');

            res.status(201).json({
                success: true,
                message: 'Pedido finalizado com os produtos',
                id_pedido
            });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Erro ao finalizar pedido:', error);
            res.status(500).json({
                error: 'Erro interno do servidor',
                message: 'Não foi possível finalizar o pedido'
            });
        } finally {
            client.release();
        }
    }

    // ================================
    // Processar pagamento
    // ================================
    async processarPagamento(req, res) {
        const client = await this.db.connect();
        try {
            const { id_pedido, id_forma_pagamento, valor_total } = req.body;

            if (!id_pedido || !id_forma_pagamento || !valor_total) {
                return res.status(400).json({
                    error: 'Dados incompletos',
                    message: 'ID do pedido, forma de pagamento e valor são obrigatórios'
                });
            }

            await client.query('BEGIN');

            // Insere pagamento
            const pagamentoResult = await client.query(
                'INSERT INTO pagamento (id_pedido, data_pagamento, valor_total) VALUES ($1, CURRENT_DATE, $2) RETURNING id_pagamento',
                [id_pedido, valor_total]
            );
            const id_pagamento = pagamentoResult.rows[0].id_pagamento;

            // Insere relacionamento com forma de pagamento
            await client.query(
                'INSERT INTO pagamento_has_formapagamento (id_pagamento, id_forma_pagamento, valor_pago) VALUES ($1, $2, $3)',
                [id_pagamento, id_forma_pagamento, valor_total]
            );

            await client.query('COMMIT');

            res.status(201).json({
                success: true,
                message: 'Pagamento processado com sucesso',
                id_pagamento,
                id_pedido,
                valor_pago: valor_total
            });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Erro ao processar pagamento:', error);
            res.status(500).json({
                error: 'Erro interno do servidor',
                message: 'Não foi possível processar o pagamento'
            });
        } finally {
            client.release();
        }
    }

    // ================================
    // Buscar detalhes de um pedido
    // ================================
    async getPedido(req, res) {
        try {
            const { id } = req.params;

            const pedidoResult = await this.db.query(
                'SELECT id_pedido, cpf, data_pedido, valor_total FROM pedido WHERE id_pedido = $1',
                [id]
            );

            if (pedidoResult.rows.length === 0) {
                return res.status(404).json({
                    error: 'Pedido não encontrado',
                    message: 'O pedido solicitado não existe'
                });
            }

            const itensResult = await this.db.query(
                `SELECT pp.id_produto, pp.quantidade, pp.preco_unitario, pr.nome_produto
                 FROM pedidoproduto pp
                 LEFT JOIN produto pr ON pp.id_produto = pr.id_produto
                 WHERE pp.id_pedido = $1`,
                [id]
            );

            res.status(200).json({
                ...pedidoResult.rows[0],
                itens: itensResult.rows
            });
        } catch (error) {
            console.error('Erro ao buscar pedido:', error);
            res.status(500).json({
                error: 'Erro interno do servidor',
                message: 'Não foi possível buscar o pedido'
            });
        }
    }

    // ================================
    // Listar todos os pedidos
    // ================================
    async listarPedidos(req, res) {
        try {
            const result = await this.db.query(
                `SELECT 
                    p.id_pedido,
                    p.cpf,
                    p.data_pedido,
                    p.valor_total,
                    CASE 
                        WHEN pg.id_pagamento IS NOT NULL THEN 'Pago'
                        ELSE 'Pendente'
                    END as status_pagamento
                 FROM pedido p
                 LEFT JOIN pagamento pg ON p.id_pedido = pg.id_pedido
                 ORDER BY p.data_pedido DESC, p.id_pedido DESC`
            );

            res.status(200).json(result.rows);
        } catch (error) {
            console.error('Erro ao listar pedidos:', error);
            res.status(500).json({
                error: 'Erro interno do servidor',
                message: 'Não foi possível listar os pedidos'
            });
        }
    }
}

module.exports = CarrinhoController;
