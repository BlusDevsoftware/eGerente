const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');

class AuthController {
  // Gerar senha temporária aleatória
  gerarSenhaTemporaria() {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let senha = '';
    for (let i = 0; i < 8; i++) {
      senha += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return senha;
  }

  // Login do colaborador
  async login(req, res) {
    try {
      const { email, senha } = req.body;

      if (!email || !senha) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email e senha são obrigatórios' 
        });
      }

      // Buscar colaborador por email
      const { data: colaborador, error } = await supabase
        .from('colaboradores')
        .select('*')
        .eq('email', email)
        .eq('status', 'ativo')
        .single();

      if (error || !colaborador) {
        return res.status(401).json({ 
          success: false, 
          message: 'Credenciais inválidas' 
        });
      }

      // Verificar senha
      const senhaValida = await bcrypt.compare(senha, colaborador.senha_hash);
      if (!senhaValida) {
        return res.status(401).json({ 
          success: false, 
          message: 'Credenciais inválidas' 
        });
      }

      // Gerar JWT
      const token = jwt.sign(
        { 
          colaborador_id: colaborador.codigo,
          perfil_id: colaborador.perfil_id,
          email: colaborador.email
        },
        process.env.JWT_SECRET || 'sua-chave-secreta',
        { expiresIn: '8h' }
      );

      // Atualizar último login
      await supabase
        .from('colaboradores')
        .update({ ultimo_login: new Date().toISOString() })
        .eq('codigo', colaborador.codigo);

      res.json({
        success: true,
        message: 'Login realizado com sucesso',
        data: {
          accessToken: token,
          user: {
            codigo: colaborador.codigo,
            nome: colaborador.nome,
            email: colaborador.email,
            perfil_id: colaborador.perfil_id,
            primeiro_acesso: colaborador.primeiro_acesso
          }
        }
      });

    } catch (error) {
      console.error('Erro no login:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  }

  // Trocar senha (primeiro acesso)
  async changePassword(req, res) {
    try {
      const { senha_atual, nova_senha } = req.body;
      const colaborador_id = req.user.colaborador_id;

      if (!senha_atual || !nova_senha) {
        return res.status(400).json({ 
          success: false, 
          message: 'Senha atual e nova senha são obrigatórias' 
        });
      }

      // Buscar colaborador
      const { data: colaborador, error } = await supabase
        .from('colaboradores')
        .select('*')
        .eq('codigo', colaborador_id)
        .single();

      if (error || !colaborador) {
        return res.status(404).json({ 
          success: false, 
          message: 'Colaborador não encontrado' 
        });
      }

      // Verificar senha atual
      const senhaValida = await bcrypt.compare(senha_atual, colaborador.senha_hash);
      if (!senhaValida) {
        return res.status(400).json({ 
          success: false, 
          message: 'Senha atual incorreta' 
        });
      }

      // Criptografar nova senha
      const novaSenhaHash = await bcrypt.hash(nova_senha, 10);

      // Atualizar senha e marcar como não primeiro acesso
      const { error: updateError } = await supabase
        .from('colaboradores')
        .update({ 
          senha_hash: novaSenhaHash,
          primeiro_acesso: false,
          senha_temporaria: false
        })
        .eq('codigo', colaborador_id);

      if (updateError) {
        return res.status(500).json({ 
          success: false, 
          message: 'Erro ao atualizar senha' 
        });
      }

      res.json({
        success: true,
        message: 'Senha alterada com sucesso'
      });

    } catch (error) {
      console.error('Erro ao trocar senha:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  }

  // Verificar token (middleware)
  async verifyToken(req, res, next) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ 
          success: false, 
          message: 'Token não fornecido' 
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sua-chave-secreta');
      req.user = decoded;
      next();

    } catch (error) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token inválido' 
      });
    }
  }
}

module.exports = new AuthController();
