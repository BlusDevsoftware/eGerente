const { supabase } = require('../config/supabase');

// Função para gerar senha temporária
function gerarSenhaTemporaria() {
    const maiusculas = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const minusculas = 'abcdefghijklmnopqrstuvwxyz';
    const numeros = '0123456789';
    const especiais = '!@#$%&*';
    
    let senha = '';
    
    // Adicionar 2 caracteres de cada tipo
    for (let i = 0; i < 2; i++) {
        senha += maiusculas.charAt(Math.floor(Math.random() * maiusculas.length));
        senha += minusculas.charAt(Math.floor(Math.random() * minusculas.length));
        senha += numeros.charAt(Math.floor(Math.random() * numeros.length));
        senha += especiais.charAt(Math.floor(Math.random() * especiais.length));
    }
    
    // Embaralhar a senha
    return senha.split('').sort(() => Math.random() - 0.5).join('');
}

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

        // Se for a tabela colaboradores, adicionar departamento padrão, tratar usuario_vinculado e gerar senha temporária
        if (tabela === 'colaboradores') {
            dadosParaInserir.departamento = 'Geral';
            
            // Converter usuario_vinculado vazio para null
            if (dadosParaInserir.usuario_vinculado === '') {
                dadosParaInserir.usuario_vinculado = null;
            } else if (dadosParaInserir.usuario_vinculado) {
                dadosParaInserir.usuario_vinculado = parseInt(dadosParaInserir.usuario_vinculado);
            }
            
            // Gerar senha temporária (8 caracteres: 2 maiúsculas + 2 minúsculas + 2 números + 2 especiais)
            const senhaTemporaria = gerarSenhaTemporaria();
            dadosParaInserir.senha_temporaria = senhaTemporaria;
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
        
        // Garantir que o código seja tratado como string
        const codigoStr = codigo.toString().padStart(5, '0');
        
        console.log(`Tentando excluir registro da tabela ${tabela} com código ${codigoStr}`);
        
        const { data, error } = await supabase
            .from(tabela)
            .delete()
            .eq('codigo', codigoStr)
            .select();

        if (error) {
            console.error(`Erro ao excluir registro da tabela ${tabela}:`, error);
            throw error;
        }

        if (!data || data.length === 0) {
            return res.status(404).json({ error: 'Registro não encontrado' });
        }

        console.log(`Registro excluído com sucesso:`, data);
        res.json({ message: 'Registro excluído com sucesso', data });
    } catch (error) {
        console.error(`Erro ao excluir registro da tabela ${req.params.tabela}:`, error);
        res.status(500).json({ 
            error: `Erro ao excluir registro da tabela ${req.params.tabela}`,
            details: error.message 
        });
    }
};

// Função para alterar senha de colaborador
const alterarSenhaColaborador = async (req, res) => {
    try {
        const { email, novaSenha } = req.body;

        if (!email || !novaSenha) {
            return res.status(400).json({ 
                error: 'Email e nova senha são obrigatórios' 
            });
        }

        // Validar força da senha
        const passwordValidation = validatePasswordStrength(novaSenha);
        if (passwordValidation.strength < 4) {
            return res.status(400).json({ 
                error: 'A senha não atende aos requisitos mínimos de segurança',
                requirements: passwordValidation.requirements
            });
        }

        // Buscar colaborador por email
        const { data: colaborador, error: searchError } = await supabase
            .from('colaboradores')
            .select('*')
            .eq('email', email)
            .single();

        if (searchError || !colaborador) {
            return res.status(404).json({ 
                error: 'Colaborador não encontrado' 
            });
        }

        // Verificar se tem senha temporária (primeiro acesso)
        if (!colaborador.senha_temporaria) {
            return res.status(400).json({ 
                error: 'Este colaborador já alterou sua senha anteriormente' 
            });
        }

        // Atualizar senha e remover senha temporária
        const { data, error } = await supabase
            .from('colaboradores')
            .update({
                senha: novaSenha, // TODO: Implementar hash da senha
                senha_temporaria: null // Remove a senha temporária
            })
            .eq('email', email)
            .select()
            .single();

        if (error) {
            throw error;
        }

        res.json({ 
            message: 'Senha alterada com sucesso',
            colaborador: {
                codigo: data.codigo,
                nome: data.nome,
                email: data.email
            }
        });

    } catch (error) {
        console.error('Erro ao alterar senha do colaborador:', error);
        res.status(500).json({ 
            error: 'Erro ao alterar senha do colaborador',
            details: error.message 
        });
    }
};

// Função para validar força da senha (mesma lógica do frontend)
function validatePasswordStrength(password) {
    const requirements = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[!@#$%&*]/.test(password)
    };
    
    const strength = Object.values(requirements).filter(Boolean).length;
    return { requirements, strength };
}

module.exports = {
    listarRegistros,
    buscarRegistro,
    criarRegistro,
    atualizarRegistro,
    excluirRegistro,
    alterarSenhaColaborador
}; 