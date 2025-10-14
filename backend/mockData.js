
// Dados mockados para teste sem banco de dados
let pessoas = [
    {
        id_pessoa: 1,
        cpf_pessoa: '12345678901',
        nome_pessoa: 'João Silva',
        email_pessoa: 'joao@email.com',
        senha_pessoa: '123456'
    },
    {
        id_pessoa: 2,
        cpf_pessoa: '98765432100',
        nome_pessoa: 'Maria Santos',
        email_pessoa: 'maria@email.com',
        senha_pessoa: '123456'
    }
];

let produtos = [
    {
        id_produto: 1,
        nome_produto: 'Pão Francês',
        preco: 0.50,
        quantidade_estoque: 100,
        id_categoria: 1,
        imagem_path: null,
        nome_categoria: 'Pães'
    },
    {
        id_produto: 2,
        nome_produto: 'Croissant',
        preco: 3.50,
        quantidade_estoque: 20,
        id_categoria: 1,
        imagem_path: null,
        nome_categoria: 'Pães'
    },
    {
        id_produto: 3,
        nome_produto: 'Bolo de Chocolate',
        preco: 25.00,
        quantidade_estoque: 5,
        id_categoria: 2,
        imagem_path: null,
        nome_categoria: 'Bolos'
    }
];

let categorias = [
    {
        id_categoria: 1,
        nome_categoria: 'Pães'
    },
    {
        id_categoria: 2,
        nome_categoria: 'Bolos'
    },
    {
        id_categoria: 3,
        nome_categoria: 'Doces'
    }
];

let cargos = [
    {
        id_cargo: 1,
        nome_cargo: 'Padeiro'
    },
    {
        id_cargo: 2,
        nome_cargo: 'Vendedor'
    },
    {
        id_cargo: 3,
        nome_cargo: 'Gerente'
    }
];

let funcionarios = [
    {
        cpf_pessoa: '12345678901',
        salario_funcionario: 2500.00,
        id_cargo: 1,
        nome_cargo: 'Padeiro'
    }
];

let clientes = [
    {
        cpf_pessoa: '98765432100'
    }
];

let pedidos = [
    {
        id_pedido: 1,
        data_pedido: '2025-10-03',
        cpf: '12345678901',
        valor_total: 10.50
    },
    {
        id_pedido: 2,
        data_pedido: '2025-10-04',
        cpf: '98765432100',
        valor_total: 25.00
    }
];

let pedidoProdutos = [
    {
        id_pedido: 1,
        id_produto: 1,
        quantidade: 2,
        preco_unitario: 0.50,
        nome_produto: 'Pão Francês'
    },
    {
        id_pedido: 1,
        id_produto: 2,
        quantidade: 1,
        preco_unitario: 3.50,
        nome_produto: 'Croissant'
    }
];

// Funções para simular operações do banco
const mockDatabase = {
    // Pessoas
    async query(sql, params) {
        // Simula a lógica de query para o cadastro
        if (sql.includes("SELECT * FROM pessoa WHERE cpf = $1 OR email_pessoa = $2")) {
            const [cpf, email] = params;
            const existingPerson = pessoas.find(p => p.cpf_pessoa === cpf || p.email_pessoa === email);
            return { rows: existingPerson ? [existingPerson] : [] };
        } else if (sql.includes("INSERT INTO pessoa (cpf, nome_pessoa, email_pessoa, senha_pessoa) VALUES ($1, $2, $3, $4)")) {
            const [cpf, nome, email, senha] = params;
            const novoId = Math.max(...pessoas.map(p => p.id_pessoa), 0) + 1;
            const novaPessoa = {
                id_pessoa: novoId,
                cpf_pessoa: cpf,
                nome_pessoa: nome,
                email_pessoa: email,
                senha_pessoa: senha
            };
            pessoas.push(novaPessoa);
            return { rows: [novaPessoa] };
        } else if (sql.includes("SELECT * FROM pedido ORDER BY id_pedido")) {
            return { rows: pedidos };
        } else if (sql.includes("SELECT * FROM pedido WHERE id_pedido = $1")) {
            const id = params[0];
            const pedido = pedidos.find(p => p.id_pedido == id);
            return { rows: pedido ? [pedido] : [] };
        } else if (sql.includes("INSERT INTO pedido (id_pedido, data_pedido, cpf, valor_total) VALUES ($1, $2, $3, $4)")) {
            const [id_pedido, data_pedido, cpf, valor_total] = params;
            const novoPedido = { id_pedido, data_pedido, cpf, valor_total };
            pedidos.push(novoPedido);
            return { rows: [novoPedido] };
        } else if (sql.includes("UPDATE pedido SET data_pedido = $1, cpf = $2, valor_total = $3 WHERE id_pedido = $4")) {
            const [data_pedido, cpf, valor_total, id_pedido] = params;
            const index = pedidos.findIndex(p => p.id_pedido == id_pedido);
            if (index !== -1) {
                pedidos[index] = { ...pedidos[index], data_pedido, cpf, valor_total };
                return { rows: [pedidos[index]] };
            }
            return { rows: [] };
        } else if (sql.includes("DELETE FROM pedido WHERE id_pedido = $1")) {
            const id = params[0];
            const initialLength = pedidos.length;
            pedidos = pedidos.filter(p => p.id_pedido != id);
            return { rows: initialLength !== pedidos.length ? [{}] : [] };
        } else if (sql.includes("SELECT * FROM pedidoproduto WHERE id_pedido = $1")) {
            const id = params[0];
            const itens = pedidoProdutos.filter(item => item.id_pedido == id);
            return { rows: itens };
        }
        // Adicione mais simulações de query conforme necessário
        return { rows: [] };
    },

    async testConnection() {
        return 'mock';
    },

    // Outras funções mockadas podem ser adicionadas aqui, se necessário
};

module.exports = mockDatabase;

