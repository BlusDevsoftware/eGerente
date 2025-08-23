-- Migração para corrigir problema de timezone na coluna updated_at da tabela movimento_comissoes
-- O problema é que updated_at está como TIMESTAMP (sem timezone) enquanto outras tabelas usam TIMESTAMPTZ

-- Converter updated_at para TIMESTAMPTZ para manter consistência com outras tabelas
ALTER TABLE movimento_comissoes 
ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

-- Configurar trigger para atualizar updated_at automaticamente
-- Primeiro, remover trigger existente se houver
DROP TRIGGER IF EXISTS update_updated_at_column ON movimento_comissoes;

-- Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_updated_at_column 
    BEFORE UPDATE ON movimento_comissoes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comentário: Agora updated_at será sempre atualizado automaticamente
-- e armazenado com timezone UTC, mantendo consistência com outras tabelas
