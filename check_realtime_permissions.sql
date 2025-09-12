-- Verificar configurações de Realtime no Supabase
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se Realtime está habilitado para as tabelas
SELECT schemaname, tablename, hasreplication 
FROM pg_tables 
WHERE tablename IN ('movimento_comissoes', 'colaboradores', 'clientes', 'produtos', 'servicos');

-- 2. Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('movimento_comissoes', 'colaboradores', 'clientes', 'produtos', 'servicos');

-- 3. Habilitar Realtime para as tabelas (se não estiver habilitado)
ALTER PUBLICATION supabase_realtime ADD TABLE public.movimento_comissoes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.colaboradores;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clientes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.produtos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.servicos;

-- 4. Verificar se as tabelas estão na publicação
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
