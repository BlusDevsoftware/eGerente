const crypto = require('crypto');

class CSRFMiddleware {
    constructor() {
        this.tokens = new Map();
        this.TOKEN_EXPIRATION = 24 * 60 * 60 * 1000; // 24 horas
    }

    // Gera um novo token CSRF
    generateToken() {
        const token = crypto.randomBytes(32).toString('hex');
        const expiration = Date.now() + this.TOKEN_EXPIRATION;
        
        this.tokens.set(token, {
            expiration,
            used: false
        });

        return token;
    }

    // Valida um token CSRF
    validateToken(token) {
        const tokenData = this.tokens.get(token);
        
        if (!tokenData) {
            return false;
        }

        if (Date.now() > tokenData.expiration) {
            this.tokens.delete(token);
            return false;
        }

        if (tokenData.used) {
            this.tokens.delete(token);
            return false;
        }

        tokenData.used = true;
        return true;
    }

    // Middleware para gerar token CSRF
    generateTokenMiddleware(req, res, next) {
        const token = this.generateToken();
        res.setHeader('X-CSRF-Token', token);
        next();
    }

    // Middleware para validar token CSRF
    validateTokenMiddleware(req, res, next) {
        const token = req.headers['x-csrf-token'];

        if (!token) {
            return res.status(403).json({
                error: 'Token CSRF não fornecido'
            });
        }

        if (!this.validateToken(token)) {
            return res.status(403).json({
                error: 'Token CSRF inválido ou expirado'
            });
        }

        next();
    }

    // Limpa tokens expirados periodicamente
    startCleanup() {
        setInterval(() => {
            const now = Date.now();
            for (const [token, data] of this.tokens.entries()) {
                if (now > data.expiration) {
                    this.tokens.delete(token);
                }
            }
        }, 60 * 60 * 1000); // Limpa a cada hora
    }
}

module.exports = new CSRFMiddleware(); 