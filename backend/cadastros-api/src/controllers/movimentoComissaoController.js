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
        // Buscar o maior número sequencial global já utilizado UMA ÚNICA VEZ
        let ultimoNumero = 0;
        try {
            const { data: todos, error: errorTodos } = await supabase
                .from('movimento_comissoes')
                .select('numero_titulo');
            if (errorTodos) throw errorTodos;
            if (todos && todos.length > 0) {
                const bases = todos
                    .map(t => {
                        const match = (t.numero_titulo || '').match(/^(\d{5,})/);
                        return match ? parseInt(match[1], 10) : null;
                    })
                    .filter(n => n !== null && n > 0);
                if (bases.length > 0) {
                    ultimoNumero = Math.max(...bases);
                }
            }
        } catch (e) {
            ultimoNumero = 0;
        }
        // Montar os registros para todos os colaboradores, incrementando o número para cada colaborador
        const registros = [];
        for (let i = 0; i < movimentos.length; i++) {
            const mov = movimentos[i];
            // Se já veio com numero_titulo no formato de parcela, apenas insere
            if (mov.numero_titulo && /-\d+\/\d+$/.test(mov.numero_titulo)) {
                const { qtd_parcelas: _qtd_parcelas, ...movSemQtdParcelas } = mov;
                registros.push({
                    ...movSemQtdParcelas
                });
                continue;
            }
            // Caso contrário, gera as parcelas normalmente
            const qtd_parcelas = mov.qtd_parcelas ? parseInt(mov.qtd_parcelas) : 1;
            const proximoNumero = ultimoNumero + 1;
            const numeroBaseStr = proximoNumero.toString().padStart(5, '0');
            for (let parcela = 1; parcela <= qtd_parcelas; parcela++) {
                let numeroTitulo = numeroBaseStr;
                // Sempre gerar sufixo -parcela/total, mesmo para parcela única
                numeroTitulo += `-${parcela}/${qtd_parcelas}`;
                const { qtd_parcelas: _qtd_parcelas, ...movSemQtdParcelas } = mov;
                registros.push({
                    ...movSemQtdParcelas,
                    numero_titulo: numeroTitulo
                });
            }
            ultimoNumero++;
        }
        // Inserir todos os registros de uma vez
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
        const { error } = await supabase
            .from('movimento_comissoes')
            .delete()
            .eq('id', id);
        if (error) throw error;
        res.status(204).send();
    } catch (error) {
        console.error('Erro ao excluir movimento:', error);
        res.status(500).json({ error: 'Erro ao excluir movimento' });
    }
};

module.exports = {
    listarMovimentos,
    buscarMovimento,
    criarMovimento,
    atualizarMovimento,
    excluirMovimento
}; 