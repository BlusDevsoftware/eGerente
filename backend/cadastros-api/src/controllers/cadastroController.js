const { supabase } = require('../config/supabase');

// Função genérica para listar registros
const listarRegistros = async (req, res) => {
    try {
        const { tabela } = req.params;
        const { data, error } = await supabase
            .from(tabela)
            .select('*')
            .order('codigo', { ascending: true });

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error(`Erro ao listar registros da tabela ${req.params.tabela}:`, error);
        res.status(500).json({ error: `Erro ao listar registros da tabela ${req.params.tabela}` });
    }
};

// Função genérica para buscar registro por código
const buscarRegistro = async (req, res) => {
    try {
        const { tabela, codigo } = req.params;
        const { data, error } = await supabase
            .from(tabela)
            .select('*')
            .eq('codigo', codigo)
            .single();

        if (error) throw error;
        if (!data) {
            return res.status(404).json({ error: 'Registro não encontrado' });
        }

        res.json(data);
    } catch (error) {
        console.error(`Erro ao buscar registro da tabela ${req.params.tabela}:`, error);
        res.status(500).json({ error: `Erro ao buscar registro da tabela ${req.params.tabela}` });
    }
};

// Função genérica para criar registro
const criarRegistro = async (req, res) => {
    try {
        const { tabela } = req.params;
        const dados = req.body;

        // Gerar código único
        const { data: ultimoRegistro } = await supabase
            .from(tabela)
            .select('codigo')
            .order('codigo', { ascending: false })
            .limit(1);

        const novoCodigo = ultimoRegistro && ultimoRegistro.length > 0 
            ? ultimoRegistro[0].codigo + 1 
            : 1;

        // Preparar dados para inserção
        const dadosParaInserir = {
            ...dados,
            codigo: novoCodigo
        };

        // Se for a tabela colaboradores, adicionar departamento padrão e tratar usuario_vinculado
        if (tabela === 'colaboradores') {
            dadosParaInserir.departamento = 'Geral';
            
            // Converter usuario_vinculado vazio para null
            if (dadosParaInserir.usuario_vinculado === '') {
                dadosParaInserir.usuario_vinculado = null;
            } else if (dadosParaInserir.usuario_vinculado) {
                dadosParaInserir.usuario_vinculado = parseInt(dadosParaInserir.usuario_vinculado);
            }
        }

        const { data, error } = await supabase
            .from(tabela)
            .insert([dadosParaInserir])
            .select()
            .single();

        if (error) {
            console.error(`Erro ao inserir na tabela ${tabela}:`, error);
            throw error;
        }

        res.status(201).json(data);
    } catch (error) {
        console.error(`Erro ao criar registro na tabela ${req.params.tabela}:`, error);
        res.status(500).json({ 
            error: `Erro ao criar registro na tabela ${req.params.tabela}`,
            details: error.message 
        });
    }
};

// Função genérica para atualizar registro
const atualizarRegistro = async (req, res) => {
    try {
        const { tabela, codigo } = req.params;
        const dados = req.body;

        const { data, error } = await supabase
            .from(tabela)
            .update(dados)
            .eq('codigo', codigo)
            .select()
            .single();

        if (error) throw error;
        if (!data) {
            return res.status(404).json({ error: 'Registro não encontrado' });
        }

        res.json(data);
    } catch (error) {
        console.error(`Erro ao atualizar registro da tabela ${req.params.tabela}:`, error);
        res.status(500).json({ error: `Erro ao atualizar registro da tabela ${req.params.tabela}` });
    }
};

// Função genérica para excluir registro
const excluirRegistro = async (req, res) => {
    try {
        const { tabela, codigo } = req.params;
        const { error } = await supabase
            .from(tabela)
            .delete()
            .eq('codigo', codigo);

        if (error) throw error;

        res.status(204).send();
    } catch (error) {
        console.error(`Erro ao excluir registro da tabela ${req.params.tabela}:`, error);
        res.status(500).json({ error: `Erro ao excluir registro da tabela ${req.params.tabela}` });
    }
};

module.exports = {
    listarRegistros,
    buscarRegistro,
    criarRegistro,
    atualizarRegistro,
    excluirRegistro
}; 