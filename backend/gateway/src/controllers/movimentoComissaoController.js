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
        const novoMovimento = req.body;
        const { data, error } = await supabase
            .from('movimento_comissoes')
            .insert([novoMovimento])
            .select()
            .single();
        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        console.error('Erro ao criar movimento:', error);
        res.status(500).json({ error: 'Erro ao criar movimento' });
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

// Simular próximo número base para um colaborador
const simularProximoNumeroBase = async (req, res) => {
    try {
        const { colaborador_id } = req.query;
        if (!colaborador_id) {
            return res.status(400).json({ error: 'colaborador_id é obrigatório' });
        }
        // Busca todos os títulos do colaborador
        const { data, error } = await supabase
            .from('movimento_comissoes')
            .select('numero_titulo')
            .eq('colaborador_id', colaborador_id);
        if (error) throw error;
        let usados = (data || [])
            .map(t => {
                const match = (t.numero_titulo || '').match(/^(\d{5})/);
                return match ? parseInt(match[1], 10) : null;
            })
            .filter(n => n !== null && n > 0);
        let proximoNumeroBase = 1;
        if (usados.length > 0) {
            usados.sort((a, b) => a - b);
            // Procurar o menor número não usado
            for (let i = 1; i <= usados[usados.length - 1] + 1; i++) {
                if (!usados.includes(i)) {
                    proximoNumeroBase = i;
                    break;
                }
            }
        }
        return res.json({ proximo_numero_base: proximoNumeroBase.toString().padStart(5, '0') });
    } catch (error) {
        console.error('Erro ao simular próximo número base:', error);
        res.status(500).json({ error: 'Erro ao simular próximo número base' });
    }
};

module.exports = {
    listarMovimentos,
    buscarMovimento,
    criarMovimento,
    atualizarMovimento,
    excluirMovimento,
    simularProximoNumeroBase
}; 