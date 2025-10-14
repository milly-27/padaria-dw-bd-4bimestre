-- Configuração do schema
-- CREATE SCHEMA IF NOT EXISTS loja;
SET search_path TO public;

-- ================================
-- Tabela pessoa (base para cliente e funcionário)
-- ================================
CREATE TABLE IF NOT EXISTS pessoa (
    cpf VARCHAR(11) PRIMARY KEY,
    nome_pessoa VARCHAR(100) NOT NULL,
    email_pessoa VARCHAR(100) NOT NULL UNIQUE,
    senha_pessoa VARCHAR(20) NOT NULL
);

-- ================================
-- Tabela cliente
-- ================================
CREATE TABLE IF NOT EXISTS cliente (
    cpf VARCHAR(11) PRIMARY KEY,
    FOREIGN KEY (cpf) REFERENCES pessoa(cpf)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- ================================
-- Tabela cargo
-- ================================
CREATE TABLE IF NOT EXISTS cargo (
    id_cargo SERIAL PRIMARY KEY,
    nome_cargo VARCHAR(100) NOT NULL UNIQUE
);

-- ================================
-- Tabela funcionario
-- ================================
CREATE TABLE IF NOT EXISTS funcionario (
    cpf VARCHAR(11) PRIMARY KEY,
    id_cargo INT NOT NULL,
    salario DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (cpf) REFERENCES pessoa(cpf)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_cargo) REFERENCES cargo(id_cargo)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ================================
-- Tabela categoria
-- ================================
CREATE TABLE IF NOT EXISTS categoria (
    id_categoria SERIAL PRIMARY KEY,
    nome_categoria VARCHAR(100) NOT NULL UNIQUE
);

-- ================================
-- Tabela produto
-- ================================
CREATE TABLE IF NOT EXISTS produto (
    id_produto SERIAL PRIMARY KEY,
    nome_produto VARCHAR(100) NOT NULL UNIQUE,
    preco DECIMAL(10, 2) NOT NULL,
    id_categoria INT NOT NULL,
    quantidade_estoque INT NOT NULL,
    imagem_produto VARCHAR(255),
    FOREIGN KEY (id_categoria) REFERENCES categoria(id_categoria)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ================================
-- Tabela pedido
-- ================================
CREATE TABLE IF NOT EXISTS pedido (
    id_pedido SERIAL PRIMARY KEY,
    cpf VARCHAR(11) NOT NULL,
    data_pedido DATE NOT NULL,
    valor_total DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (cpf) REFERENCES pessoa(cpf)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- ================================
-- Tabela pedidoproduto
-- ================================
CREATE TABLE IF NOT EXISTS pedidoproduto (
    id_produto INT NOT NULL,
    id_pedido INT NOT NULL,
    quantidade INT NOT NULL,
    preco_unitario DECIMAL(10, 2) NOT NULL,
    PRIMARY KEY (id_produto, id_pedido),
    FOREIGN KEY (id_produto) REFERENCES produto(id_produto)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_pedido) REFERENCES pedido(id_pedido)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- ================================
-- Tabela pagamento
-- ================================
CREATE TABLE IF NOT EXISTS pagamento (
    id_pagamento SERIAL PRIMARY KEY,
    id_pedido INT NOT NULL,
    data_pagamento DATE NOT NULL,
    valor_total DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (id_pedido) REFERENCES pedido(id_pedido)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- ================================
-- Tabela forma_pagamento
-- ================================
CREATE TABLE IF NOT EXISTS forma_pagamento (
    id_forma_pagamento SERIAL PRIMARY KEY,
    nome_forma VARCHAR(50) NOT NULL UNIQUE
);

-- ================================
-- Tabela pagamento_has_formapagamento
-- ================================
CREATE TABLE IF NOT EXISTS pagamento_has_formapagamento (
    id_pagamento_res SERIAL PRIMARY KEY,
    id_pagamento INT NOT NULL,
    id_forma_pagamento INT NOT NULL,
    valor_pago DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (id_pagamento) REFERENCES pagamento(id_pagamento)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_forma_pagamento) REFERENCES forma_pagamento(id_forma_pagamento)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ===================================================================
-- ============================ INSERTS ==============================
-- ===================================================================

-- Pessoa
INSERT INTO pessoa (cpf, nome_pessoa, email_pessoa, senha_pessoa) VALUES
('11111111111','Ana Souza','ana@example.com','1234'),
('22222222222','Carlos Lima','carlos@example.com','1234'),
('33333333333','Mariana Alves','mariana@example.com','1234'),
('44444444444','Pedro Santos','pedro@example.com','1234'),
('55555555555','Juliana Costa','juliana@example.com','1234'),
('66666666666','Roberto Silva','roberto@example.com','1234'),
('77777777777','Fernanda Rocha','fernanda@example.com','1234'),
('88888888888','Lucas Ferreira','lucas@example.com','1234'),
('99999999999','Patrícia Melo','patricia@example.com','1234'),
('10101010101','Ricardo Gomes','ricardo@example.com','1234')
ON CONFLICT (cpf) DO NOTHING;

-- Cargo
INSERT INTO cargo (id_cargo, nome_cargo) VALUES
(1,'Atendente'),
(2,'Padeiro'),
(3,'Confeiteiro'),
(4,'Caixa'),
(5,'Gerente'),
(6,'Auxiliar de Limpeza'),
(7,'Estoquista'),
(8,'Entregador'),
(9,'Supervisor'),
(10,'Balconista')
ON CONFLICT (id_cargo) DO NOTHING;

-- Funcionario
INSERT INTO funcionario (cpf, id_cargo, salario) VALUES
('11111111111',1,2000.00),
('22222222222',2,2500.00),
('33333333333',3,2400.00),
('44444444444',4,1900.00),
('55555555555',5,3500.00),
('66666666666',6,1500.00),
('77777777777',7,1800.00),
('88888888888',8,1700.00),
('99999999999',9,3000.00),
('10101010101',10,2100.00)
ON CONFLICT (cpf) DO NOTHING;

-- Cliente
INSERT INTO cliente (cpf) VALUES
('11111111111'),
('22222222222'),
('33333333333'),
('44444444444'),
('55555555555'),
('66666666666'),
('77777777777'),
('88888888888'),
('99999999999'),
('10101010101')
ON CONFLICT (cpf) DO NOTHING;

-- Categoria
INSERT INTO categoria (id_categoria, nome_categoria) VALUES
(1,'Pães'),
(2,'Bolos'),
(3,'Doces'),
(4,'Salgados'),
(5,'Bebidas'),
(6,'Tortas'),
(7,'Biscoitos'),
(8,'Lanches'),
(9,'Sobremesas'),
(10,'Congelados')
ON CONFLICT (id_categoria) DO NOTHING;

-- Produto
INSERT INTO produto (id_produto, nome_produto, preco, id_categoria, quantidade_estoque) VALUES
(1,'Pão Francês',0.50,1,500),
(2,'Bolo de Chocolate',25.00,2,10),
(3,'Brigadeiro',1.50,3,100),
(4,'Coxinha',5.00,4,50),
(5,'Suco Natural',6.00,5,30),
(6,'Torta de Limão',28.00,6,5),
(7,'Biscoito Caseiro',10.00,7,20),
(8,'Sanduíche Natural',12.00,8,15),
(9,'Pudim',18.00,9,7),
(10,'Pão de Queijo Congelado',22.00,10,12)
ON CONFLICT (id_produto) DO NOTHING;

-- Pedido
INSERT INTO pedido (id_pedido, cpf, data_pedido, valor_total) VALUES
(1,'11111111111','2025-09-01',50.00),
(2,'22222222222','2025-09-02',25.00),
(3,'33333333333','2025-09-03',30.00),
(4,'44444444444','2025-09-04',12.00),
(5,'55555555555','2025-09-05',18.00),
(6,'66666666666','2025-09-06',45.00),
(7,'77777777777','2025-09-07',22.00),
(8,'88888888888','2025-09-08',28.00),
(9,'99999999999','2025-09-09',15.00),
(10,'10101010101','2025-09-10',35.00)
ON CONFLICT (id_pedido) DO NOTHING;

-- Forma de pagamento
INSERT INTO forma_pagamento (id_forma_pagamento, nome_forma) VALUES
(1,'Dinheiro'),
(2,'Cartão Débito'),
(3,'Cartão Crédito'),
(4,'Pix'),
(5,'Vale Alimentação'),
(6,'Transferência'),
(7,'Boleto'),
(8,'Cheque'),
(9,'Carteira Digital'),
(10,'Fiado')
ON CONFLICT (id_forma_pagamento) DO NOTHING;

-- Pagamento
INSERT INTO pagamento (id_pagamento, id_pedido, data_pagamento, valor_total) VALUES
(1,1,'2025-09-01',50.00),
(2,2,'2025-09-02',25.00),
(3,3,'2025-09-03',30.00),
(4,4,'2025-09-04',12.00),
(5,5,'2025-09-05',18.00)
ON CONFLICT (id_pagamento) DO NOTHING;

-- Pagamento_has_formapagamento
INSERT INTO pagamento_has_formapagamento (id_pagamento_res, id_pagamento, id_forma_pagamento, valor_pago) VALUES
(1,1,1,20.00),
(2,1,2,30.00),
(3,2,4,25.00),
(4,3,3,30.00),
(5,4,1,12.00)
ON CONFLICT (id_pagamento_res) DO NOTHING;

-- PedidoProduto
INSERT INTO pedidoproduto (id_produto, id_pedido, quantidade, preco_unitario) VALUES
(1,1,20,0.50),
(3,1,10,1.50),
(2,2,1,25.00),
(4,3,2,5.00),
(5,4,2,6.00)
ON CONFLICT (id_produto, id_pedido) DO NOTHING;
