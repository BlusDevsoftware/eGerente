const supabase = require('../config/supabase');

// Listar todos os produtos
const listarProdutos = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('produtos')
            .select('*')
            .order('codigo', { ascending: true });

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Erro ao listar produtos:', error);
        res.status(500).json({ error: 'Erro ao listar produtos' });
    }
};

// Buscar produto por código
const buscarProduto = async (req, res) => {
    try {
        const { codigo } = req.params;
        const { data, error } = await supabase
            .from('produtos')
            .select('*')
            .eq('codigo', codigo)
            .single();

        if (error) throw error;
        if (!data) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }

        res.json(data);
    } catch (error) {
        console.error('Erro ao buscar produto:', error);
        res.status(500).json({ error: 'Erro ao buscar produto' });
    }
};

// Criar novo produto
const criarProduto = async (req, res) => {
    try {
        const { nome, categoria, preco, estoque, estoque_minimo, fornecedor, status } = req.body;

        const { data, error } = await supabase
            .from('produtos')
            .insert([
                {
                    nome,
                    categoria,
                    preco,
                    estoque,
                    estoque_minimo,
                    fornecedor,
                    status
                }
            ])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(data);
    } catch (error) {
        console.error('Erro ao criar produto:', error);
        res.status(500).json({ error: 'Erro ao criar produto' });
    }
};

// Atualizar produto
const atualizarProduto = async (req, res) => {
    try {
        const { codigo } = req.params;
        const { nome, categoria, preco, estoque, estoque_minimo, fornecedor, status } = req.body;

        const { data, error } = await supabase
            .from('produtos')
            .update({
                nome,
                categoria,
                preco,
                estoque,
                estoque_minimo,
                fornecedor,
                status
            })
            .eq('codigo', codigo)
            .select()
            .single();

        if (error) throw error;
        if (!data) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }

        res.json(data);
    } catch (error) {
        console.error('Erro ao atualizar produto:', error);
        res.status(500).json({ error: 'Erro ao atualizar produto' });
    }
};

// Verificar dependências do produto em movimentações/títulos
const verificarDependenciasProduto = async (codigo) => {
    // Movimento de comissões mantém produtos no campo item_id como lista de "id-descricao"
    // Ex.: "123-Produto A, 456-Produto B". Vamos buscar ocorrências do codigo seguido de '-'.
    try {
        const { data, error } = await supabase
            .from('movimento_comissoes')
            .select('id, item_id')
            .ilike('item_id', `%${codigo}-%`);

        if (error) throw error;
        const movCount = Array.isArray(data) ? data.length : 0;
        const hasDependencies = movCount > 0;
        return {
            hasDependencies,
            counts: {
                movimento_comissoes: movCount
            },
            message: hasDependencies
                ? 'Não é possível excluir: o produto está vinculado a movimentações/títulos.'
                : undefined
        };
    } catch (e) {
        // Em caso de erro na verificação, retornar estado conservador para bloquear
        return {
            hasDependencies: true,
            counts: {},
            message: 'Não foi possível validar vínculos do produto.'
        };
    }
};

// Endpoint: obter dependências
const obterDependenciasProduto = async (req, res) => {
    try {
        const { codigo } = req.params;
        const deps = await verificarDependenciasProduto(codigo);
        return res.json(deps);
    } catch (error) {
        console.error('Erro ao obter dependências do produto:', error);
        return res.status(500).json({ error: 'Erro ao obter dependências do produto' });
    }
};

// Excluir produto (bloqueia se houver vínculos)
const excluirProduto = async (req, res) => {
    try {
        const { codigo } = req.params;

        // 1) Checar dependências
        const deps = await verificarDependenciasProduto(codigo);
        if (deps.hasDependencies) {
            return res.status(409).json({
                code: 'FOREIGN_KEY_VIOLATION',
                message: deps.message || 'Não é possível excluir: existem vínculos.',
                counts: deps.counts
            });
        }

        // 2) Sem dependências: excluir
        const { error } = await supabase
            .from('produtos')
            .delete()
            .eq('codigo', codigo);

        if (error) throw error;

        res.status(204).send();
    } catch (error) {
        console.error('Erro ao excluir produto:', error);
        res.status(500).json({ error: 'Erro ao excluir produto' });
    }
};

module.exports = {
    listarProdutos,
    buscarProduto,
    criarProduto,
    atualizarProduto,
    excluirProduto,
    obterDependenciasProduto
}; 