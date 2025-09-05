-- Migration: Adicionar campos básicos de autenticação à tabela colaboradores
-- Data: 2025-01-27
-- Descrição: Adiciona campos para sistema de login com senha temporária

-- 1. Adicionar campos essenciais de autenticação
ALTER TABLE colaboradores ADD COLUMN senha_hash VARCHAR(255);
ALTER TABLE colaboradores ADD COLUMN perfil_id INT;
ALTER TABLE colaboradores ADD COLUMN status VARCHAR(20) DEFAULT 'ativo';
ALTER TABLE colaboradores ADD COLUMN primeiro_acesso BOOLEAN DEFAULT true;

-- 2. Garantir que email seja único
ALTER TABLE colaboradores ADD CONSTRAINT uq_colaboradores_email UNIQUE (email);

-- 3. Adicionar foreign key para perfil
ALTER TABLE colaboradores ADD CONSTRAINT fk_colaboradores_perfil 
    FOREIGN KEY (perfil_id) REFERENCES perfis_permissoes(id);

-- 4. Criar índice para performance
CREATE INDEX idx_colaboradores_email ON colaboradores(email);

-- 5. Comentários explicativos
COMMENT ON COLUMN colaboradores.senha_hash IS 'Hash da senha criptografada com bcrypt';
COMMENT ON COLUMN colaboradores.perfil_id IS 'ID do perfil de permissões do colaborador';
COMMENT ON COLUMN colaboradores.status IS 'Status do colaborador: ativo, inativo, bloqueado';
COMMENT ON COLUMN colaboradores.primeiro_acesso IS 'Indica se é o primeiro acesso (força troca de senha)';
