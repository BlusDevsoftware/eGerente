class RateLimiter {
    constructor() {
        this.requests = new Map();
        this.WINDOW_MS = 15 * 60 * 1000; // 15 minutos
        this.MAX_REQUESTS = 100; // Máximo de requisições por janela
    }

    // Middleware de rate limiting
    middleware(req, res, next) {
        const ip = req.ip;
        const now = Date.now();
        
        // Limpa requisições antigas
        this.cleanup(now);

        // Obtém ou cria registro de requisições para o IP
        let ipRequests = this.requests.get(ip) || {
            count: 0,
            resetTime: now + this.WINDOW_MS
        };

        // Verifica se a janela de tempo expirou
        if (now > ipRequests.resetTime) {
            ipRequests = {
                count: 0,
                resetTime: now + this.WINDOW_MS
            };
        }

        // Incrementa contador
        ipRequests.count++;
        this.requests.set(ip, ipRequests);

        // Adiciona headers de rate limit
        res.setHeader('X-RateLimit-Limit', this.MAX_REQUESTS);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, this.MAX_REQUESTS - ipRequests.count));
        res.setHeader('X-RateLimit-Reset', Math.ceil(ipRequests.resetTime / 1000));

        // Verifica se excedeu o limite
        if (ipRequests.count > this.MAX_REQUESTS) {
            return res.status(429).json({
                error: 'Muitas requisições. Tente novamente mais tarde.'
            });
        }

        next();
    }

    // Limpa requisições antigas
    cleanup(now) {
        for (const [ip, data] of this.requests.entries()) {
            if (now > data.resetTime) {
                this.requests.delete(ip);
            }
        }
    }
}

module.exports = new RateLimiter(); 