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
					// Extrair número base considerando prefixos PAR- e AGL-
					if (t.numero_titulo) {
						const pref = t.numero_titulo.match(/^(PAR|AGL)-(\d{5,})/);
						if (pref) return parseInt(pref[2], 10);
						const match = t.numero_titulo.match(/^(\d{5,})/);
						return match ? parseInt(match[1], 10) : null;
					}
					return null;
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

// NOVO: Aglutinar títulos
const aglutinarTitulos = async (req, res) => {
	try {
		console.log('[AGL] Request recebido em /movimento_comissoes/aglutinar:', JSON.stringify(req.body));
		const { ids, observacao, data_vencimento } = req.body || {};
		if (!Array.isArray(ids) || ids.length < 2) {
			console.warn('[AGL] Validação falhou: ids inválidos ou menos de 2 itens:', ids);
			return res.status(400).json({ error: 'Informe pelo menos 2 IDs para aglutinar' });
		}
		// Buscar títulos
		const { data: titulos, error: errFetch } = await supabase
			.from('movimento_comissoes')
			.select('*')
			.in('id', ids);
		if (errFetch) {
			console.error('[AGL] Erro ao buscar títulos:', errFetch);
			throw errFetch;
		}
		console.log('[AGL] Títulos encontrados:', titulos);
		if (!titulos || titulos.length !== ids.length) {
			console.warn('[AGL] Nem todos os títulos foram encontrados. Esperado:', ids.length, 'Recebido:', titulos?.length);
			return res.status(400).json({ error: 'Nem todos os títulos foram encontrados' });
		}
		// Regras: não permitir PAGO e colaboradores diferentes
		const temPago = titulos.some(t => (t.status || '').toUpperCase() === 'PAGO');
		const colabs = Array.from(new Set(titulos.map(t => t.colaborador_id)));
		console.log('[AGL] Validações -> temPago:', temPago, 'colabs:', colabs);
		if (temPago) return res.status(400).json({ error: 'Não é permitido aglutinar títulos pagos' });
		if (colabs.length > 1) return res.status(400).json({ error: 'Selecione títulos do mesmo colaborador' });
		const colaboradorId = colabs[0];
		
		// Somar valores
		const total = titulos.reduce((acc, t) => acc + (parseFloat(t.valor) || 0), 0);
		console.log('[AGL] Soma dos valores:', total);
		
		// Gerar número base
		let ultimoNumero = 0;
		const { data: todos, error: errorTodos } = await supabase
			.from('movimento_comissoes')
			.select('numero_titulo');
		if (errorTodos) {
			console.error('[AGL] Erro ao buscar todos os títulos para base:', errorTodos);
			throw errorTodos;
		}
		if (todos && todos.length > 0) {
			const bases = todos
				.map(t => {
					if (t.numero_titulo) {
						const pref = t.numero_titulo.match(/^(PAR|AGL)-(\d{5,})/);
						if (pref) return parseInt(pref[2], 10);
						const match = t.numero_titulo.match(/^(\d{5,})/);
						return match ? parseInt(match[1], 10) : null;
					}
					return null;
				})
				.filter(n => n !== null && n > 0);
			if (bases.length > 0) ultimoNumero = Math.max(...bases);
		}
		const numeroBaseStr = (ultimoNumero + 1).toString().padStart(5, '0');
		const numeroTituloNovo = `AGL-${numeroBaseStr}-1/1`;
		console.log('[AGL] Próximo número base:', numeroBaseStr, 'numero_titulo:', numeroTituloNovo);
		
		// Criar novo título (com colunas de aglutinação)
		const novo = {
			colaborador_id: colaboradorId,
			numero_titulo: numeroTituloNovo,
			valor: total,
			valor_pago: 0,
			status: 'PENDENTE',
			observacoes: observacao || null,
			descricao: observacao || null,
			data_geracao: new Date().toISOString().split('T')[0],
			data_vencimento: data_vencimento || new Date().toISOString().split('T')[0],
			ids_aglutinados: ids.join(',')
		};
		console.log('[AGL] Novo título a inserir (com colunas):', novo);
		let criado;
		try {
			const { data: criadoArr, error: errCreate } = await supabase
				.from('movimento_comissoes')
				.insert([novo])
				.select();
			if (errCreate) throw errCreate;
			criado = Array.isArray(criadoArr) ? criadoArr[0] : criadoArr;
			console.log('[AGL] Título aglutinado criado (com colunas):', criado);
		} catch (errCreate) {
			console.error('[AGL] Falha ao inserir com colunas (ids_aglutinados). Tentando fallback sem colunas:', errCreate);
			// Fallback: tentar sem as colunas novas caso o schema do deploy ainda não tenha atualizado
			const { ids_aglutinados, ...novoSemCols } = novo;
			const { data: criadoArr2, error: errCreate2 } = await supabase
				.from('movimento_comissoes')
				.insert([novoSemCols])
				.select();
			if (errCreate2) {
				console.error('[AGL] Falha também no fallback sem colunas:', errCreate2);
				throw errCreate2;
			}
			criado = Array.isArray(criadoArr2) ? criadoArr2[0] : criadoArr2;
			console.log('[AGL] Título aglutinado criado no fallback:', criado);
		}
		
		// Atualizar originais como aglutinados (tentativa com id_titulo_aglutinado; fallback sem)
		try {
			const { error: errUpdateOrig } = await supabase
				.from('movimento_comissoes')
				.update({ status: 'AGLUTINADO', id_titulo_aglutinado: criado.id })
				.in('id', ids);
			if (errUpdateOrig) throw errUpdateOrig;
			console.log('[AGL] Originais atualizados com sucesso (com id_titulo_aglutinado):', ids);
		} catch (errUpd) {
			console.warn('[AGL] Falha ao atualizar com id_titulo_aglutinado. Aplicando fallback apenas com status:', errUpd);
			const { error: errUpdateOrig2 } = await supabase
				.from('movimento_comissoes')
				.update({ status: 'AGLUTINADO' })
				.in('id', ids);
			if (errUpdateOrig2) {
				console.error('[AGL] Falha também no fallback de atualização de originais:', errUpdateOrig2);
				throw errUpdateOrig2;
			}
			console.log('[AGL] Originais atualizados com sucesso (fallback):', ids);
		}
		
		return res.status(201).json({ novo: criado });
	} catch (error) {
		console.error('[AGL] Erro ao aglutinar títulos:', error?.message || error);
		res.status(500).json({ error: 'Erro ao aglutinar títulos', details: error.message || String(error) });
	}
};

// NOVO: Diagnóstico do schema de aglutinação
const diagnosticarSchemaAglutinacao = async (req, res) => {
	try {
		// tenta selecionar explicitamente as colunas novas
		const { data, error } = await supabase
			.from('movimento_comissoes')
			.select('id, ids_aglutinados, id_titulo_aglutinado')
			.limit(1);
		if (error) {
			return res.status(200).json({ ok: false, message: 'Seleção falhou', error: String(error) });
		}
		return res.status(200).json({ ok: true, sample: data });
	} catch (e) {
		return res.status(200).json({ ok: false, error: String(e) });
	}
};

module.exports = {
	listarMovimentos,
	buscarMovimento,
	criarMovimento,
	atualizarMovimento,
	excluirMovimento,
	buscarProdutosTitulo,
	uploadComprovante,
	aglutinarTitulos,
	diagnosticarSchemaAglutinacao
}; 