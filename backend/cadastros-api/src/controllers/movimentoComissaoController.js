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
                    // Para títulos parciais, extrair o número após PAR-
                    if (t.numero_titulo && t.numero_titulo.startsWith('PAR-')) {
                        const match = t.numero_titulo.match(/^PAR-(\d{5,})/);
                        return match ? parseInt(match[1], 10) : null;
                    }
                    // Para títulos normais, extrair o número base
                    const match = (t.numero_titulo || '').match(/^(\d{5,})/);
                    return match ? parseInt(match[1], 10) : null;
                })
                .filter(n => n !== null && n > 0);
            if (bases.length > 0) {
                ultimoNumero = Math.max(...bases);
            }
        }
        
        // Agrupar por colaborador_id
        const grupos = {};
        movimentos.forEach(mov => {
            const key = mov.colaborador_id;
            if (!grupos[key]) grupos[key] = [];
            grupos[key].push(mov);
        });
        
        // Para cada grupo, gerar número base e numerar as parcelas
        const registros = [];
        for (const parcelas of Object.values(grupos)) {
            const numeroBaseStr = (ultimoNumero + 1).toString().padStart(5, '0');
            for (let i = 0; i < parcelas.length; i++) {
                const mov = parcelas[i];
                let numeroTitulo = `${numeroBaseStr}-${i + 1}/${parcelas.length}`;
                
                // Se for título parcial, prefixe com PAR- e use número sequencial único
                if (mov.id_titulo_origem) {
                    numeroTitulo = `PAR-${numeroTitulo}`;
                }
                
                registros.push({
                    ...mov,
                    numero_titulo: numeroTitulo
                });
            }
            ultimoNumero++;
        }
        
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

// Buscar produtos de um título
const buscarProdutosTitulo = async (req, res) => {
    try {
        const { id } = req.params;
        const { data: titulo, error: errorTitulo } = await supabase
            .from('movimento_comissoes')
            .select('item_id')
            .eq('id', id)
            .single();
        
        if (errorTitulo) throw errorTitulo;
        if (!titulo) return res.status(404).json({ error: 'Título não encontrado' });
        
        if (!titulo.item_id) {
            return res.json([]);
        }
        
        const produtos = [];
        const itemIds = titulo.item_id.split(',');
        
        for (const itemId of itemIds) {
            const [id, descricao] = itemId.trim().split('-');
            if (id && descricao) {
                produtos.push({
                    id: id.trim(),
                    descricao: descricao.trim()
                });
            }
        }
        
        res.json(produtos);
    } catch (error) {
        console.error('Erro ao buscar produtos do título:', error);
        res.status(500).json({ error: 'Erro ao buscar produtos do título' });
    }
};

// Upload de comprovante de pagamento
const uploadComprovante = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar se o título existe
        const { data: titulo, error: errorTitulo } = await supabase
            .from('movimento_comissoes')
            .select('*')
            .eq('id', id)
            .single();
        
        if (errorTitulo) throw errorTitulo;
        if (!titulo) return res.status(404).json({ error: 'Título não encontrado' });
        
        // Aqui você pode implementar a lógica para salvar o arquivo
        // Por exemplo, salvar no Supabase Storage ou em um diretório local
        // Por enquanto, vamos apenas retornar sucesso
        
        // Atualizar o título com a informação do comprovante
        const { data, error } = await supabase
            .from('movimento_comissoes')
            .update({
                comprovante_anexado: true,
                data_comprovante: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        
        res.json({ 
            message: 'Comprovante anexado com sucesso',
            data: data
        });
    } catch (error) {
        console.error('Erro ao anexar comprovante:', error);
        res.status(500).json({ error: 'Erro ao anexar comprovante' });
    }
};

module.exports = {
    listarMovimentos,
    buscarMovimento,
    criarMovimento,
    atualizarMovimento,
    excluirMovimento,
    buscarProdutosTitulo,
    uploadComprovante
}; 