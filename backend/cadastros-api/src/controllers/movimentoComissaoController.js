const { supabase } = require('../config/supabase');

// Listar todos os movimentos de comissão
const listarMovimentos = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('movimento_comissoes')
            .select('*')
            .order('id', { ascending: true });
        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Erro ao listar movimentos:', error);
        res.status(500).json({ error: 'Erro ao listar movimentos' });
    }
};

// Buscar movimento por ID
const buscarMovimento = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('movimento_comissoes')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Movimento não encontrado' });
        res.json(data);
    } catch (error) {
        console.error('Erro ao buscar movimento:', error);
        res.status(500).json({ error: 'Erro ao buscar movimento' });
    }
};

// Criar novo movimento
const criarMovimento = async (req, res) => {
    try {
        console.log('Payload recebido para movimento_comissoes:', req.body);
        const movimentos = Array.isArray(req.body) ? req.body : [req.body];
        // Buscar o maior número base já utilizado
        let ultimoNumero = 0;
        const { data: todos, error: errorTodos } = await supabase
            .from('movimento_comissoes')
            .select('numero_titulo');
        if (errorTodos) throw errorTodos;
        if (todos && todos.length > 0) {
            const bases = todos
                .map(t => {
                    const match = (t.numero_titulo || '').match(/^\d{5,}/);
                    return match ? parseInt(match[0], 10) : null;
                })
                .filter(n => n !== null && n > 0);
            if (bases.length > 0) {
                ultimoNumero = Math.max(...bases);
            }
        }
        // Agrupar por colaborador_id
        const grupos = {};
        movimentos.forEach(mov => {
            const key = mov.colaborador_id; // pode ser ajustado para outro critério de agrupamento
            if (!grupos[key]) grupos[key] = [];
            grupos[key].push(mov);
        });
        // Para cada grupo, gerar número base e numerar as parcelas
        const registros = [];
        Object.values(grupos).forEach(parcelas => {
            const numeroBaseStr = (ultimoNumero + 1).toString().padStart(5, '0');
            parcelas.forEach(async (mov, i) => {
                let numeroTitulo = `${numeroBaseStr}-${i + 1}/${parcelas.length}`;
                // Se for título parcial, gere o número com prefixo PAR-
                if (mov.id_titulo_origem) {
                    // Buscar o título de origem
                    const { data: origem, error: errorOrigem } = await supabase
                        .from('movimento_comissoes')
                        .select('numero_titulo')
                        .eq('id', mov.id_titulo_origem)
                        .single();
                    if (errorOrigem) throw errorOrigem;
                    if (origem && origem.numero_titulo) {
                        numeroTitulo = `PAR-${origem.numero_titulo}`;
                    }
                }
                registros.push({
                    ...mov,
                    numero_titulo: numeroTitulo
                });
            });
            ultimoNumero++;
        });
        // Inserir todos os registros
        const { data, error } = await supabase
            .from('movimento_comissoes')
            .insert(registros)
            .select();
        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        console.error('Erro ao criar movimento:', error);
        res.status(500).json({ error: 'Erro ao criar movimento', details: error.message || error });
    }
};

// Atualizar movimento
const atualizarMovimento = async (req, res) => {
    try {
        const { id } = req.params;
        const atualizacao = req.body;
        const { data, error } = await supabase
            .from('movimento_comissoes')
            .update(atualizacao)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Movimento não encontrado' });
        res.json(data);
    } catch (error) {
        console.error('Erro ao atualizar movimento:', error);
        res.status(500).json({ error: 'Erro ao atualizar movimento' });
    }
};

// Excluir movimento
const excluirMovimento = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('movimento_comissoes')
            .delete()
            .eq('id', id);
        if (error) throw error;
        res.json({ message: 'Movimento excluído com sucesso' });
    } catch (error) {
        console.error('Erro ao excluir movimento:', error);
        res.status(500).json({ error: 'Erro ao excluir movimento' });
    }
};

// Buscar produtos de um título específico
const buscarProdutosTitulo = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Buscar o título
        const { data: titulo, error: errorTitulo } = await supabase
            .from('movimento_comissoes')
            .select('*')
            .eq('id', id)
            .single();
            
        if (errorTitulo) throw errorTitulo;
        if (!titulo) return res.status(404).json({ error: 'Título não encontrado' });
        
        // Se não há item_id, retornar array vazio
        if (!titulo.item_id) {
            return res.json([]);
        }
        
        // Processar o item_id que está no formato "codigo-nome,codigo-nome"
        const itens = titulo.item_id.split(',').map(item => {
            const match = item.match(/^(\d{5})-(.+)$/);
            if (match) {
                return {
                    produto_id: match[1],
                    nome: match[2].trim(),
                    quantidade: 1,
                    valor_unitario: titulo.valor_venda || 0,
                    valor_total: titulo.valor_venda || 0
                };
            }
            return null;
        }).filter(Boolean);
        
        res.json(itens);
        
    } catch (error) {
        console.error('Erro ao buscar produtos do título:', error);
        res.status(500).json({ error: 'Erro ao buscar produtos do título' });
    }
};

module.exports = {
    listarMovimentos,
    buscarMovimento,
    criarMovimento,
    atualizarMovimento,
    excluirMovimento,
    buscarProdutosTitulo
}; 