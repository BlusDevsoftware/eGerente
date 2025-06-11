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

// Função genérica para buscar registro
const buscarRegistro = async (req, res) => {
    try {
        const { tabela, codigo } = req.params;
        
        // Garantir que o código seja tratado como string
        const codigoStr = codigo.toString().padStart(5, '0');
        
        const { data, error } = await supabase
            .from(tabela)
            .select('*')
            .eq('codigo', codigoStr)
            .single();

        if (error) {
            console.error(`Erro ao buscar registro da tabela ${tabela}:`, error);
            throw error;
        }
        if (!data) {
            return res.status(404).json({ error: 'Registro não encontrado' });
        }

        res.json(data);
    } catch (error) {
        console.error(`Erro ao buscar registro da tabela ${req.params.tabela}:`, error);
        res.status(500).json({ 
            error: `Erro ao buscar registro da tabela ${req.params.tabela}`,
            details: error.message 
        });
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

        let novoCodigo;
        if (ultimoRegistro && ultimoRegistro.length > 0) {
            // Extrair o número do último código (remover zeros à esquerda)
            const ultimoNumero = parseInt(ultimoRegistro[0].codigo);
            novoCodigo = (ultimoNumero + 1).toString().padStart(5, '0');
        } else {
            novoCodigo = '00001';
        }

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

        // Se for a tabela colaboradores, tratar usuario_vinculado
        if (tabela === 'colaboradores') {
            if (dados.usuario_vinculado === '') {
                dados.usuario_vinculado = null;
            } else if (dados.usuario_vinculado) {
                dados.usuario_vinculado = parseInt(dados.usuario_vinculado);
            }
        }

        const { data, error } = await supabase
            .from(tabela)
            .update(dados)
            .eq('codigo', codigo)
            .select()
            .single();

        if (error) {
            console.error(`Erro ao atualizar registro da tabela ${tabela}:`, error);
            throw error;
        }
        if (!data) {
            return res.status(404).json({ error: 'Registro não encontrado' });
        }

        res.json(data);
    } catch (error) {
        console.error(`Erro ao atualizar registro da tabela ${req.params.tabela}:`, error);
        res.status(500).json({ 
            error: `Erro ao atualizar registro da tabela ${req.params.tabela}`,
            details: error.message 
        });
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

        if (error) {
            console.error(`Erro ao excluir registro da tabela ${tabela}:`, error);
            throw error;
        }

        res.json({ message: 'Registro excluído com sucesso' });
    } catch (error) {
        console.error(`Erro ao excluir registro da tabela ${req.params.tabela}:`, error);
        res.status(500).json({ 
            error: `Erro ao excluir registro da tabela ${req.params.tabela}`,
            details: error.message 
        });
    }
};

module.exports = {
    listarRegistros,
    buscarRegistro,
    criarRegistro,
    atualizarRegistro,
    excluirRegistro
}; 