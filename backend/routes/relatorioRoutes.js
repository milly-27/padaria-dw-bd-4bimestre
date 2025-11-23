const express = require('express');
const router = express.Router();
const relatorioController = require('../controllers/relatorioController');

// Rotas de relatórios acessíveis sem autenticação

/**
 * @swagger
 * /api/relatorios/vendas-mensais:
 *   get:
 *     summary: Retorna as vendas mensais
 *     tags: [Relatórios]
 *     parameters:
 *       - in: query
 *         name: ano
 *         schema:
 *           type: integer
 *         description: Ano para filtrar as vendas (opcional, padrão é o ano atual)
 *       - in: query
 *         name: ordenar
 *         schema:
 *           type: string
 *           enum: [mes_numero, totalVendas, quantidadePedidos, ticketMedio]
 *         description: Campo para ordenação (opcional, padrão é 'mes_numero')
 *       - in: query
 *         name: direcao
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Direção da ordenação (ascendente ou descendente, opcional, padrão é 'asc')
 *     responses:
 *       200:
 *         description: Lista de vendas mensais
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       mes:
 *                         type: string
 *                       quantidadePedidos:
 *                         type: integer
 *                       totalVendas:
 *                         type: number
 *                       ticketMedio:
 *                         type: number
 */
router.get('/vendas-mensais', (req, res, next) => {
    console.log('📍 GET /api/relatorios/vendas-mensais');
    console.log('🍪 Cookies:', req.cookies);
    console.log('🌐 Origin:', req.headers.origin);
    console.log('🔑 Headers:', req.headers);
    next();
}, relatorioController.getVendasMensais);

/**
 * @swagger
 * /api/relatorios/produtos-mais-vendidos:
 *   get:
 *     summary: Retorna os produtos mais vendidos
 *     tags: [Relatórios]
 *     parameters:
 *       - in: query
 *         name: dataInicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início para filtrar os produtos (YYYY-MM-DD)
 *       - in: query
 *         name: dataFim
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de fim para filtrar os produtos (YYYY-MM-DD)
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *         description: Número máximo de produtos a retornar (opcional, padrão é 10)
 *     responses:
 *       200:
 *         description: Lista de produtos mais vendidos
 */
router.get('/produtos-mais-vendidos', relatorioController.getProdutosMaisVendidos);

/**
 * @swagger
 * /api/relatorios/clientes-mais-compram:
 *   get:
 *     summary: Retorna os clientes que mais compram
 *     tags: [Relatórios]
 *     parameters:
 *       - in: query
 *         name: dataInicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início para filtrar (YYYY-MM-DD)
 *       - in: query
 *         name: dataFim
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de fim para filtrar (YYYY-MM-DD)
 *       - in: query
 *         name: cpf
 *         schema:
 *           type: string
 *         description: CPF do cliente para filtrar (pode conter ou não formatação)
 *       - in: query
 *         name: nome
 *         schema:
 *           type: string
 *         description: Nome do cliente para busca parcial
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *         description: Número máximo de clientes a retornar (opcional, padrão é 20)
 *       - in: query
 *         name: ordenar
 *         schema:
 *           type: string
 *           enum: [total_compras, quantidade_pedidos, ticket_medio, ultima_compra, nome]
 *         description: Campo para ordenação (opcional, padrão é 'total_compras')
 *       - in: query
 *         name: direcao
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Direção da ordenação (opcional, padrão é 'desc')
 *     responses:
 *       200:
 *         description: Lista de clientes que mais compram
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id_cliente:
 *                         type: integer
 *                       nome:
 *                         type: string
 *                       cpf:
 *                         type: string
 *                       telefone:
 *                         type: string
 *                       email:
 *                         type: string
 *                       quantidade_pedidos:
 *                         type: integer
 *                       total_compras:
 *                         type: number
 *                       ticket_medio:
 *                         type: number
 *                       ultima_compra:
 *                         type: string
 *                         format: date-time
 *                       primeira_compra:
 *                         type: string
 *                         format: date-time
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     periodo:
 *                       type: object
 *                     filtros:
 *                       type: object
 *                     totais:
 *                       type: object
 */
router.get('/clientes-mais-compram', (req, res, next) => {
    console.log('📍 GET /api/relatorios/clientes-mais-compram');
    console.log('📥 Query params:', req.query);
    next();
}, relatorioController.getClientesMaisCompram);

module.exports = router;