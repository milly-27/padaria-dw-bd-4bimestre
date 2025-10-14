const express = require('express');
const app = express();
const path = require('path');

const cookieParser = require('cookie-parser');
const cors = require('cors');

// Importar a configuração do banco PostgreSQL
const db = require('./database'); // Ajuste o caminho conforme necessário

// Configurações do servidor - quando em produção, você deve substituir o IP e a porta pelo do seu servidor remoto
//const HOST = '192.168.1.100'; // Substitua pelo IP do seu servidor remoto
const HOST = 'localhost'; // Para desenvolvimento local
const PORT_FIXA = 3001; // Porta fixa

// serve a pasta frontend como arquivos estáticos

// serve a pasta frontend como arquivos estáticos

const caminhoFrontend = path.join(__dirname, '../frontend');
console.log('Caminho frontend:', caminhoFrontend);

app.use(express.static(caminhoFrontend));

// Servir arquivos de upload como estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



app.use(cookieParser());

// Middleware para permitir CORS (Cross-Origin Resource Sharing)
// Isso é útil se você estiver fazendo requisições de um frontend que está rodando em um domínio diferente
// ou porta do backend.
// Em produção, você deve restringir isso para domínios específicos por segurança.
// Aqui, estamos permitindo qualquer origem, o que é útil para desenvolvimento, mas deve ser ajustado em produção.
//app.use((req, res, next) => {
 // const allowedOrigins = ['http://127.0.0.1:5500','http://localhost:5500', 'http://127.0.0.1:5501', 'http://localhost:3000', 'http://localhost:3001'];
  //const origin = req.headers.origin;
 // if (allowedOrigins.includes(origin)) {
 //   res.header('Access-Control-Allow-Origin', origin);
 // }
 // res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
//  res.header('Access-Control-Allow-Headers', 'Content-Type');
 // res.header('Access-Control-Allow-Credentials', 'true');

 // if (req.method === 'OPTIONS') {
 //   return res.sendStatus(200); // <-- responde ao preflight
 // }

 // next();
//});
// Middleware CORS — mais seguro e limpo
// Middleware CORS — corrigido
const allowedOrigins = [
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  'http://127.0.0.1:5501',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3002', // ✅ adicionada
  'http://localhost:3002'  // ✅ por segurança, caso mude a origem
];


app.use(cors({
  origin: function (origin, callback) {
    // Permite chamadas sem origem (como Postman)
    if (!origin) return callback(null, true);

    // Verifica se a origem é permitida
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('⚠️ Origem não permitida pelo CORS:', origin);
      callback(null, false); // não lança erro, só bloqueia
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));


// Middleware para adicionar a instância do banco de dados às requisições
app.use((req, res, next) => {
  req.db = db;
  next();
});

// Middlewares
app.use(express.json());

// Middleware de tratamento de erros JSON malformado
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'JSON malformado',
      message: 'Verifique a sintaxe do JSON enviado'
    });
  }
  next(err);
});

// só mexa nessa parte
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Importando as rotas
//const loginRoutes = require('./routes/loginRoutes');
//app.use('/login', loginRoutes);

const menuRoutes = require('./routes/menuRoutes');
app.use('/menu', menuRoutes);

//const pessoaRoutes = require('./routes/pessoaRoutes');
//app.use('/pessoas', pessoaRoutes);

//const questaoRoutes = require('./routes/questaoRoutes');
//app.use('/questao', questaoRoutes);

//const professorRoutes = require('./routes/professorRoutes');
//app.use('/professor', professorRoutes);

//const avaliadorRoutes = require('./routes/avaliadorRoutes');
//app.use('/avaliador', avaliadorRoutes);

//const avaliadoRoutes = require('./routes/avaliadoRoutes');
//app.use('/avaliado', avaliadoRoutes);


//const avaliacaoRoutes = require('./routes/avaliacaoRoutes');
//app.use('/avaliacao', avaliacaoRoutes);

//const avaliacaoHasQuestaoRoutes = require('./routes/avaliacaoHasQuestaoRoutes');
//app.use('/avaliacaoHasQuestao', avaliacaoHasQuestaoRoutes);

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

//const authRoutes = require('./routes/authRoutes');
//app.use('/auth', authRoutes);

// No seu arquivo principal (app.js ou server.js)
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



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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


// Inicialização do servidor
const startServer = async () => {
  try {
    // Testar conexão com o banco antes de iniciar o servidor
    console.log(caminhoFrontend);
    console.log('Testando conexão com PostgreSQL...');
    const connectionTest = await db.testConnection();

    if (connectionTest === 'mock') {
      console.log('🔄 Usando dados mockados para desenvolvimento');
      // Importar dados mockados
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

// Tratamento de sinais para encerramento graceful
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