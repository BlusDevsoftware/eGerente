const { supabase } = require('../config/supabase');

// Listar todos os colaboradores
const listarColaboradores = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('colaboradores')
            .select('*, usuarios(*)')
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
        const { data, error } = await supabase
            .from('colaboradores')
            .select('*, usuarios(*)')
            .eq('codigo', codigo)
            .single();

        if (error) throw error;
        if (!data) {
            return res.status(404).json({ error: 'Colaborador não encontrado' });
        }

        res.json(data);
    } catch (error) {
        console.error('Erro ao buscar colaborador:', error);
        res.status(500).json({ error: 'Erro ao buscar colaborador' });
    }
};

// Criar novo colaborador
const criarColaborador = async (req, res) => {
    try {
        const { nome, email, telefone, cargo, departamento, status, senha } = req.body;

        // Primeiro, criar o usuário
        const { data: usuarioData, error: usuarioError } = await supabase
            .from('usuarios')
            .insert([
                {
                    nome,
                    email,
                    senha, // TODO: Implementar hash da senha
                    tipo: 'colaborador',
                    status
                }
            ])
            .select()
            .single();

        if (usuarioError) throw usuarioError;

        // Depois, criar o colaborador
        const { data: colaboradorData, error: colaboradorError } = await supabase
            .from('colaboradores')
            .insert([
                {
                    usuario_id: usuarioData.codigo,
                    nome,
                    email,
                    telefone,
                    cargo,
                    departamento,
                    status
                }
            ])
            .select()
            .single();

        if (colaboradorError) throw colaboradorError;

        res.status(201).json(colaboradorData);
    } catch (error) {
        console.error('Erro ao criar colaborador:', error);
        res.status(500).json({ error: 'Erro ao criar colaborador' });
    }
};

// Atualizar colaborador
const atualizarColaborador = async (req, res) => {
    try {
        const { codigo } = req.params;
        const { nome, email, telefone, cargo, departamento, status, senha } = req.body;

        // Buscar o colaborador para obter o usuario_id
        const { data: colaborador, error: buscaError } = await supabase
            .from('colaboradores')
            .select('usuario_id')
            .eq('codigo', codigo)
            .single();

        if (buscaError) throw buscaError;
        if (!colaborador) {
            return res.status(404).json({ error: 'Colaborador não encontrado' });
        }

        // Atualizar o usuário
        const { error: usuarioError } = await supabase
            .from('usuarios')
            .update({
                nome,
                email,
                senha: senha ? senha : undefined, // Só atualiza a senha se for fornecida
                status
            })
            .eq('codigo', colaborador.usuario_id);

        if (usuarioError) throw usuarioError;

        // Atualizar o colaborador
        const { data, error } = await supabase
            .from('colaboradores')
            .update({
                nome,
                email,
                telefone,
                cargo,
                departamento,
                status
            })
            .eq('codigo', codigo)
            .select()
            .single();

        if (error) throw error;

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

        // Buscar o colaborador para obter o usuario_id
        const { data: colaborador, error: buscaError } = await supabase
            .from('colaboradores')
            .select('usuario_id')
            .eq('codigo', codigo)
            .single();

        if (buscaError) throw buscaError;
        if (!colaborador) {
            return res.status(404).json({ error: 'Colaborador não encontrado' });
        }

        // Excluir o colaborador
        const { error: colaboradorError } = await supabase
            .from('colaboradores')
            .delete()
            .eq('codigo', codigo);

        if (colaboradorError) throw colaboradorError;

        // Excluir o usuário
        const { error: usuarioError } = await supabase
            .from('usuarios')
            .delete()
            .eq('codigo', colaborador.usuario_id);

        if (usuarioError) throw usuarioError;

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