const supabase = require('../config/supabase');

// Gerar próximo código de perfil
async function gerarProximoCodigo() {
    try {
        const { data, error } = await supabase
            .from('perfis')
            .select('codigo')
            .order('codigo', { ascending: false })
            .limit(1);
        
        if (error) throw error;
        
        const ultimoCodigo = data?.[0]?.codigo || '00000';
        return String(parseInt(ultimoCodigo, 10) + 1).padStart(5, '0');
    } catch (error) {
        console.error('Erro ao gerar próximo código:', error);
        throw error;
    }
}

// Listar perfis
async function listarPerfis(req, res) {
    try {
        const { data, error } = await supabase
            .from('perfis')
            .select('*')
            .order('codigo', { ascending: true });
        
        if (error) throw error;
        
        res.json(data || []);
    } catch (error) {
        console.error('Erro ao listar perfis:', error);
        res.status(500).json({ error: 'Erro ao listar perfis' });
    }
}

// Buscar perfil específico
async function buscarPerfil(req, res) {
    try {
        const { codigo } = req.params;
        
        const { data, error } = await supabase
            .from('perfis')
            .select('*')
            .eq('codigo', codigo)
            .single();
        
        if (error) throw error;
        if (!data) {
            return res.status(404).json({ error: 'Perfil não encontrado' });
        }
        
        res.json(data);
    } catch (error) {
        console.error('Erro ao buscar perfil:', error);
        res.status(500).json({ error: 'Erro ao buscar perfil' });
    }
}

// Buscar permissões do perfil
async function listarPermissoes(req, res) {
    try {
        const { codigo } = req.params;
        
        const { data, error } = await supabase
            .from('perfis_permissoes')
            .select('*')
            .eq('perfil_codigo', codigo)
            .order('secao', { ascending: true });
        
        if (error) throw error;
        
        res.json(data || []);
    } catch (error) {
        console.error('Erro ao listar permissões:', error);
        res.status(500).json({ error: 'Erro ao listar permissões' });
    }
}

// Criar perfil com permissões
async function criarPerfil(req, res) {
    try {
        const { nome, status = 'ativo', permissoes = [] } = req.body || {};
        
        console.log('🔍 DEBUG - Dados recebidos:', { nome, status, permissoes });
        console.log('🔍 DEBUG - Tipo de permissoes:', typeof permissoes, Array.isArray(permissoes));
        
        if (!nome) {
            return res.status(400).json({ error: 'Nome do perfil é obrigatório' });
        }
        
        // Gerar código único
        const novoCodigo = await gerarProximoCodigo();
        console.log('🔍 DEBUG - Novo código gerado:', novoCodigo);
        
        // Inserir perfil
        const { data: perfil, error: errPerfil } = await supabase
            .from('perfis')
            .insert([{ 
                codigo: novoCodigo, 
                nome, 
                status,
                permissoes: {} // Campo JSONB vazio inicialmente
            }])
            .select()
            .single();
        
        if (errPerfil) {
            console.error('❌ Erro ao inserir perfil:', errPerfil);
            throw errPerfil;
        }
        
        console.log('✅ Perfil criado com sucesso:', perfil);
        
        // Inserir permissões se vierem
        if (Array.isArray(permissoes) && permissoes.length > 0) {
            console.log('🔍 DEBUG - Processando permissões:', permissoes);
            
            const rows = permissoes.map(p => ({ 
                perfil_codigo: novoCodigo, 
                ...p 
            }));
            
            console.log('🔍 DEBUG - Rows para inserir:', rows);
            
            const { data: permsData, error: errPerm } = await supabase
                .from('perfis_permissoes')
                .insert(rows)
                .select();
            
            if (errPerm) {
                console.error('❌ Erro ao inserir permissões:', errPerm);
                console.error('❌ Detalhes do erro:', errPerm.details, errPerm.hint);
                throw errPerm;
            }
            
            console.log('✅ Permissões inseridas com sucesso:', permsData);
        } else {
            console.log('⚠️ Nenhuma permissão para inserir ou formato inválido');
        }
        
        res.status(201).json(perfil);
    } catch (error) {
        console.error('❌ Erro ao criar perfil:', error);
        res.status(500).json({ 
            error: 'Erro ao criar perfil', 
            details: error.message 
        });
    }
}

// Atualizar perfil e permissões
async function atualizarPerfil(req, res) {
    try {
        const { codigo } = req.params;
        const { nome, status, permissoes } = req.body || {};
        
        console.log('🔍 DEBUG - Atualizando perfil:', { codigo, nome, status, permissoes });
        
        // Verificar se perfil existe
        const { data: perfilExistente, error: errCheck } = await supabase
            .from('perfis')
            .select('codigo')
            .eq('codigo', codigo)
            .single();
        
        if (errCheck || !perfilExistente) {
            return res.status(404).json({ error: 'Perfil não encontrado' });
        }
        
        // Atualizar perfil
        const updates = {};
        if (nome !== undefined) updates.nome = nome;
        if (status !== undefined) updates.status = status;
        
        let perfilAtualizado = null;
        if (Object.keys(updates).length > 0) {
            const { data, error } = await supabase
                .from('perfis')
                .update(updates)
                .eq('codigo', codigo)
                .select()
                .single();
            
            if (error) throw error;
            perfilAtualizado = data;
        } else {
            perfilAtualizado = perfilExistente;
        }
        
        // Atualizar permissões se vierem
        if (Array.isArray(permissoes)) {
            console.log('🔍 DEBUG - Processando permissões para atualização:', permissoes);
            
            // Primeiro, remover permissões existentes
            const { error: errDelete } = await supabase
                .from('perfis_permissoes')
                .delete()
                .eq('perfil_codigo', codigo);
            
            if (errDelete) {
                console.error('❌ Erro ao deletar permissões existentes:', errDelete);
                throw errDelete;
            }
            
            console.log('✅ Permissões existentes removidas');
            
            // Inserir novas permissões
            if (permissoes.length > 0) {
                const rows = permissoes.map(p => ({ 
                    perfil_codigo: codigo, 
                    ...p 
                }));
                
                console.log('🔍 DEBUG - Rows para inserir na atualização:', rows);
                
                const { data: permsData, error: errInsert } = await supabase
                    .from('perfis_permissoes')
                    .insert(rows)
                    .select();
                
                if (errInsert) {
                    console.error('❌ Erro ao inserir novas permissões:', errInsert);
                    throw errInsert;
                }
                
                console.log('✅ Novas permissões inseridas:', permsData);
            }
        }
        
        res.json(perfilAtualizado);
    } catch (error) {
        console.error('❌ Erro ao atualizar perfil:', error);
        res.status(500).json({ 
            error: 'Erro ao atualizar perfil', 
            details: error.message 
        });
    }
}

// Excluir perfil (cascade remove permissões)
async function excluirPerfil(req, res) {
    try {
        const { codigo } = req.params;
        
        // Verificar se perfil existe
        const { data: perfilExistente, error: errCheck } = await supabase
            .from('perfis')
            .select('codigo')
            .eq('codigo', codigo)
            .single();
        
        if (errCheck || !perfilExistente) {
            return res.status(404).json({ error: 'Perfil não encontrado' });
        }
        
        // Excluir perfil (cascade remove permissões automaticamente)
        const { error } = await supabase
            .from('perfis')
            .delete()
            .eq('codigo', codigo);
        
        if (error) throw error;
        
        res.status(204).send();
    } catch (error) {
        console.error('Erro ao excluir perfil:', error);
        res.status(500).json({ 
            error: 'Erro ao excluir perfil', 
            details: error.message 
        });
    }
}

module.exports = {
    listarPerfis,
    buscarPerfil,
    listarPermissoes,
    criarPerfil,
    atualizarPerfil,
    excluirPerfil
};
