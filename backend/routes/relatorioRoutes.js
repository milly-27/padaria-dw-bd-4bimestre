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
// Rota de vendas mensais
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


module.exports = router;
