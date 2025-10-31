\c avap

-- Verifica se as tabelas necessárias existem
SELECT 'pedido' AS tabela, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pedido') 
            THEN 'Existe' ELSE 'Não existe' END AS status
UNION ALL
SELECT 'pedidoproduto' AS tabela, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pedidoproduto') 
            THEN 'Existe' ELSE 'Não existe' END AS status
UNION ALL
SELECT 'produto' AS tabela, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'produto') 
            THEN 'Existe' ELSE 'Não existe' END AS status
UNION ALL
SELECT 'pessoa' AS tabela, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pessoa') 
            THEN 'Existe' ELSE 'Não existe' END AS status
UNION ALL
SELECT 'cliente' AS tabela, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cliente') 
            THEN 'Existe' ELSE 'Não existe' END AS status;
