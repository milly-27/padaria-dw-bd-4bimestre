const { Pool } = require('pg');
const dotenv = require('dotenv');

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

// Configuração da conexão com o banco de dados
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'padaria',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
    // Opções adicionais para o pool de conexões
    max: 20, // Número máximo de clientes no pool
    idleTimeoutMillis: 30000, // Tempo em ms que um cliente pode ficar inativo antes de ser desconectado
    connectionTimeoutMillis: 2000, // Tempo máximo para tentar conectar
});

// Testa a conexão com o banco de dados
pool.connect((err, client, release) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
        return;
    }
    console.log('✅ Conexão com o banco de dados estabelecida com sucesso!');
    release();
});

// Exporta o pool de conexões
module.exports = {
    query: (text, params) => {
        console.log('Executando query:', { text, params });
        return pool.query(text, params);
    },
    // Adiciona um método para obter um cliente diretamente do pool
    getClient: async () => {
        const client = await pool.connect();
        const query = client.query;
        const release = client.release;
        
        // Define um timeout para evitar vazamentos de cliente
        const timeout = setTimeout(() => {
            console.error('Um cliente foi retirado do pool por muito tempo!');
            console.error(new Error('Possível vazamento de cliente'));
        }, 5000);
        
        // Sobrescreve o método release para limpar o timeout
        client.release = () => {
            clearTimeout(timeout);
            client.release = release;
            return release.apply(client);
        };
        
        // Adiciona um método query ao cliente
        client.query = (...args) => {
            console.log('Executando query no cliente:', args[0]);
            return query.apply(client, args);
        };
        
        return client;
    },
    // Método para encerrar o pool de conexões
    end: () => {
        return pool.end();
    }
};
