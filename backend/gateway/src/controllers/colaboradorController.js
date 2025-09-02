const supabase = require('../config/supabase');

// Listar todos os colaboradores
const listarColaboradores = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('colaboradores')
            .select('*')
            .order('codigo', { ascending: true });

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Erro ao listar colaboradores:', error);
        res.status(500).json({ error: 'Erro ao listar colaboradores' });
    }
};

// Buscar colaborador por código
const buscarColaborador = async (req, res) => {
    try {
        const { codigo } = req.params;
        console.log('🔍 Buscando colaborador com código:', codigo);
        console.log('Tipo do código:', typeof codigo);
        
        const { data, error } = await supabase
            .from('colaboradores')
            .select('*')
            .eq('codigo', codigo)
            .single();

        if (error) {
            console.error('❌ Erro na consulta:', error);
            throw error;
        }
        
        if (!data) {
            console.log('❌ Colaborador não encontrado para código:', codigo);
            return res.status(404).json({ error: 'Colaborador não encontrado' });
        }

        console.log('✅ Colaborador encontrado:', {
            codigo: data.codigo,
            nome: data.nome,
            email: data.email
        });
        
        res.json(data);
    } catch (error) {
        console.error('❌ Erro ao buscar colaborador:', error);
        res.status(500).json({ error: 'Erro ao buscar colaborador' });
    }
};

// Criar novo colaborador
const criarColaborador = async (req, res) => {
    try {
        const { nome, email, telefone, cargo, data_admissao, status, perfil, foto } = req.body;
        
        // Adicionar departamento padrão se não fornecido
        const departamento = req.body.departamento || 'Geral';

        // Gerar código único
        const { data: ultimoColaborador } = await supabase
            .from('colaboradores')
            .select('codigo')
            .order('codigo', { ascending: false })
            .limit(1);

        const novoCodigo = ultimoColaborador && ultimoColaborador.length > 0 
            ? ultimoColaborador[0].codigo + 1 
            : 1;

        const { data, error } = await supabase
            .from('colaboradores')
            .insert([
                {
                    codigo: novoCodigo,
                    nome,
                    email,
                    telefone,
                    cargo,
                    departamento,
                    data_admissao,
                    status,
                    perfil,
                    foto: foto || null
                }
            ])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(data);
    } catch (error) {
        console.error('Erro ao criar colaborador:', error);
        res.status(500).json({ error: 'Erro ao criar colaborador' });
    }
};

// Atualizar colaborador
const atualizarColaborador = async (req, res) => {
    try {
        const { codigo } = req.params;
        const { nome, email, telefone, cargo, data_admissao, status, perfil, foto } = req.body;
        
        // Adicionar departamento padrão se não fornecido
        const departamento = req.body.departamento || 'Geral';

        const { data, error } = await supabase
            .from('colaboradores')
            .update({
                nome,
                email,
                telefone,
                cargo,
                departamento,
                data_admissao,
                status,
                perfil,
                foto: foto !== undefined ? foto : undefined
            })
            .eq('codigo', codigo)
            .select()
            .single();

        if (error) throw error;
        if (!data) {
            return res.status(404).json({ error: 'Colaborador não encontrado' });
        }

        res.json(data);
    } catch (error) {
        console.error('Erro ao atualizar colaborador:', error);
        res.status(500).json({ error: 'Erro ao atualizar colaborador' });
    }
};

// Excluir colaborador
const excluirColaborador = async (req, res) => {
    try {
        const { codigo } = req.params;
        const { error } = await supabase
            .from('colaboradores')
            .delete()
            .eq('codigo', codigo);

        if (error) throw error;

        res.status(204).send();
    } catch (error) {
        console.error('Erro ao excluir colaborador:', error);
        res.status(500).json({ error: 'Erro ao excluir colaborador' });
    }
};

module.exports = {
    listarColaboradores,
    buscarColaborador,
    criarColaborador,
    atualizarColaborador,
    excluirColaborador
}; 