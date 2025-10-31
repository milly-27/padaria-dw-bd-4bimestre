const express = require('express');
const app = express();
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');

// Importar a configuração do banco PostgreSQL
const db = require('./database');

// Configurações do servidor
const HOST = 'localhost';
const PORT_FIXA = 3001;

// ============================================
// MIDDLEWARES - ORDEM CORRETA É CRUCIAL!
// ============================================

// 1. PRIMEIRO: Arquivos estáticos
const caminhoFrontend = path.join(__dirname, '../frontend');
console.log('Caminho frontend:', caminhoFrontend);
app.use(express.static(caminhoFrontend));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 2. SEGUNDO: Cookie parser ANTES do CORS
app.use(cookieParser());

// 3. TERCEIRO: JSON parser
app.use(express.json());

// 4. QUARTO: CORS configurado corretamente
const allowedOrigins = [
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  'http://127.0.0.1:5501',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3002',
  'http://localhost:3002'
];

app.use(cors({
  origin: function (origin, callback) {
    // Permite requisições sem origem (mesma origem, Postman, etc)
    if (!origin) {
      console.log('✅ Requisição da mesma origem permitida');
      return callback(null, true);
    }

    // Verifica se a origem está na lista permitida
    if (allowedOrigins.includes(origin)) {
      console.log('✅ Origem permitida:', origin);
      callback(null, true);
    } else {
      console.warn('⚠️ Origem bloqueada:', origin);
      callback(null, false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // ESSENCIAL para cookies funcionarem
  optionsSuccessStatus: 200
}));

// 5. QUINTO: Middleware do banco
app.use((req, res, next) => {
  req.db = db;
  next();
});

// 6. SEXTO: Middleware de erro JSON
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'JSON malformado',
      message: 'Verifique a sintaxe do JSON enviado'
    });
  }
  next(err);
});

// 7. SÉTIMO: Middleware de log de cookies (para debug)
app.use((req, res, next) => {
  console.log(`\n📍 ${req.method} ${req.path}`);
  console.log('🍪 Cookies recebidos:', req.cookies);
  
  // Intercepta res.cookie para logar quando cookies são definidos
  const originalCookie = res.cookie.bind(res);
  res.cookie = function(name, value, options) {
    console.log(`🍪 Definindo cookie: ${name} = ${value}`);
    return originalCookie(name, value, options);
  };
  
  next();
});

// ============================================
// ROTAS
// ============================================

const menuRoutes = require('./routes/menuRoutes');
app.use('/menu', menuRoutes);

const cargoRoutes = require('./routes/cargoRoutes');
app.use('/cargos', cargoRoutes);

const categoriaRoutes = require('./routes/categoriaRoutes');
app.use('/categorias', categoriaRoutes);

const pessoaRoutes = require('./routes/pessoaRoutes');
app.use('/pessoas', pessoaRoutes);

const produtoRoutes = require('./routes/produtoRoutes');
app.use('/produtos', produtoRoutes);

const loginRoutes = require('./routes/loginRoutes');
app.use('/login', loginRoutes);

const funcionarioRoutes = require('./routes/funcionarioRoutes');
app.use('/funcionarios', funcionarioRoutes);

const clienteRoutes = require('./routes/clienteRoutes');
app.use('/clientes', clienteRoutes);

const cardapioRoutes = require('./routes/cardapioRoutes');
app.use('/cardapio', cardapioRoutes);

const pedidoRoutes = require('./routes/pedidoRoutes');
app.use('/pedido', pedidoRoutes);

const pedidoprodutoRoutes = require('./routes/pedidoprodutoRoutes');
app.use('/pedidoproduto', pedidoprodutoRoutes);

const pagamentoRoutes = require('./routes/pagamentoRoutes');
app.use('/pagamento', pagamentoRoutes);

const forma_pagamentoRoutes = require('./routes/forma_pagamentoRoutes');
app.use('/forma_pagamentos', forma_pagamentoRoutes);

const pagamento_has_formapagamentoRoutes = require('./routes/pagamento_has_formapagamentoRoutes');
app.use('/pagamento_has_formapagamentos', pagamento_has_formapagamentoRoutes);

// ============================================
// ROTAS PADRÃO
// ============================================

// Rota padrão
app.get('/', (req, res) => {
  res.json({
    message: 'O server está funcionando - essa é a rota raiz!',
    database: 'PostgreSQL',
    timestamp: new Date().toISOString()
  });
});

// Rota para testar a conexão com o banco
app.get('/health', async (req, res) => {
  try {
    const connectionTest = await db.testConnection();

    if (connectionTest) {
      res.status(200).json({
        status: 'OK',
        message: 'Servidor e banco de dados funcionando',
        database: 'PostgreSQL',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        status: 'ERROR',
        message: 'Problema na conexão com o banco de dados',
        database: 'PostgreSQL',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Erro no health check:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Erro interno do servidor',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ============================================
// MIDDLEWARES DE ERRO (DEVEM SER OS ÚLTIMOS)
// ============================================

// Middleware global de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);

  res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado',
    timestamp: new Date().toISOString()
  });
});

// Middleware para rotas não encontradas (404)
app.use((req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    message: `A rota ${req.originalUrl} não existe`,
    timestamp: new Date().toISOString()
  });
});

// ============================================
// INICIALIZAÇÃO DO SERVIDOR
// ============================================

const startServer = async () => {
  try {
    console.log(caminhoFrontend);
    console.log('Testando conexão com PostgreSQL...');
    const connectionTest = await db.testConnection();

    if (connectionTest === 'mock') {
      console.log('🔄 Usando dados mockados para desenvolvimento');
      const mockData = require('./mockData');
      global.useMockData = true;
      global.mockDatabase = mockData;
    } else if (!connectionTest) {
      console.error('❌ Falha na conexão com PostgreSQL');
      process.exit(1);
    } else {
      console.log('✅ PostgreSQL conectado com sucesso');
    }

    const PORT = process.env.PORT || PORT_FIXA;

    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando em http://${HOST}:${PORT}`);
      console.log(`📊 Health check disponível em http://${HOST}:${PORT}/health`);
      console.log(`🗄️ Banco de dados: PostgreSQL`);
      console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    });

  } catch (error) {
    console.error('❌ Erro ao iniciar o servidor:', error);
    process.exit(1);
  }
};

// ============================================
// TRATAMENTO DE SINAIS
// ============================================

process.on('SIGINT', async () => {
  console.log('\n🔄 Encerrando servidor...');

  try {
    await db.pool.end();
    console.log('✅ Conexões com PostgreSQL encerradas');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao encerrar conexões:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\n🔄 SIGTERM recebido, encerrando servidor...');

  try {
    await db.pool.end();
    console.log('✅ Conexões com PostgreSQL encerradas');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao encerrar conexões:', error);
    process.exit(1);
  }
});

// Iniciar o servidor
startServer();