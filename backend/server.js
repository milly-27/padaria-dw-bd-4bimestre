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

// 1. Cookie parser PRIMEIRO
app.use(cookieParser());

// 2. JSON e URL encoded parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Configuração do CORS MELHORADA
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:5500',
      'http://localhost:5500'
    ];
    
    // Em desenvolvimento, permitir qualquer origem
    if (process.env.NODE_ENV === 'development' || !origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Permitir mesmo assim em desenvolvimento
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Accept', 
    'X-Access-Token', 
    'x-access-token',
    'Cache-Control',
    'Pragma',
    'Expires'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range', 'Set-Cookie'],
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Aplicar o CORS
app.use(cors(corsOptions));

// 4. Middleware CORS manual adicional
app.use((req, res, next) => {
  const origin = req.headers.origin || req.headers.host;
  
  // Configurar cabeçalhos CORS manualmente
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Access-Token, x-access-token, Cache-Control, Pragma, Expires');
  res.header('Access-Control-Expose-Headers', 'Content-Range, X-Content-Range, Set-Cookie');
  
  // Se for uma requisição OPTIONS, responder imediatamente
  if (req.method === 'OPTIONS') {
    console.log('🛫 Resposta a preflight CORS');
    return res.status(204).end();
  }
  
  next();
});
// 5. Arquivos estáticos
const caminhoFrontend = path.join(__dirname, '../frontend');
console.log('Caminho frontend:', caminhoFrontend);
app.use(express.static(caminhoFrontend));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 6. Middleware do banco
app.use((req, res, next) => {
  req.db = db;
  next();
});

// 7. Middleware de log
app.use((req, res, next) => {
  console.log(`\n📍 ${req.method} ${req.path}`);
  console.log('🍪 Cookies:', req.cookies);
  console.log('🌐 Origin:', req.headers.origin);
  next();
});

// ============================================
// ROTAS - authRoutes PRIMEIRO
// ============================================

const authRoutes = require('./routes/authRoutes');
app.use('/auth', authRoutes);

const loginRoutes = require('./routes/loginRoutes');
app.use('/login', loginRoutes);

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

const funcionarioRoutes = require('./routes/funcionarioRoutes');
app.use('/funcionarios', funcionarioRoutes);

const clienteRoutes = require('./routes/clienteRoutes');
app.use('/clientes', clienteRoutes);

// Rotas de relatórios
const relatorioRoutes = require('./routes/relatorioRoutes');
app.use('/api/relatorios', relatorioRoutes);

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

app.get('/', (req, res) => {
  res.json({
    message: 'O server está funcionando - essa é a rota raiz!',
    database: 'PostgreSQL',
    timestamp: new Date().toISOString()
  });
});

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

app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado',
    timestamp: new Date().toISOString()
  });
});

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
      console.log(`✅ CORS configurado para aceitar todas as origens (desenvolvimento)`);
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

startServer();