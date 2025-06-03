const crypto = require('crypto');
const bcrypt = require('bcrypt');

class PasswordUtils {
    constructor() {
        this.SALT_ROUNDS = 12;
    }

    // Gera um hash seguro para a senha
    async hashPassword(password) {
        try {
            const salt = await bcrypt.genSalt(this.SALT_ROUNDS);
            return await bcrypt.hash(password, salt);
        } catch (error) {
            console.error('Erro ao gerar hash da senha:', error);
            throw new Error('Erro ao processar senha');
        }
    }

    // Verifica se a senha corresponde ao hash
    async verifyPassword(password, hash) {
        try {
            return await bcrypt.compare(password, hash);
        } catch (error) {
            console.error('Erro ao verificar senha:', error);
            throw new Error('Erro ao verificar senha');
        }
    }

    // Gera um token de redefinição de senha
    generateResetToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    // Gera um hash para o token de redefinição
    async hashResetToken(token) {
        try {
            const salt = await bcrypt.genSalt(this.SALT_ROUNDS);
            return await bcrypt.hash(token, salt);
        } catch (error) {
            console.error('Erro ao gerar hash do token:', error);
            throw new Error('Erro ao processar token');
        }
    }

    // Verifica se o token de redefinição é válido
    async verifyResetToken(token, hash) {
        try {
            return await bcrypt.compare(token, hash);
        } catch (error) {
            console.error('Erro ao verificar token:', error);
            throw new Error('Erro ao verificar token');
        }
    }
}

module.exports = new PasswordUtils(); 