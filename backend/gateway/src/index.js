const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');

const app = express();

// Configurações de segurança
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100 // limite de 100 requisições por IP
});
app.use(limiter);

// Configuração dos serviços
const services = {
    auth: {
        url: process.env.AUTH_API_URL || 'https://auth-api-bluepay.vercel.app',
        path: '/api/auth'
    },
    clientes: {
        url: process.env.CLIENTES_API_URL || 'https://clientes-api-bluepay.vercel.app',
        path: '/api/clientes'
    },
    colaboradores: {
        url: process.env.COLABORADORES_API_URL || 'https://colaboradores-api-bluepay.vercel.app',
        path: '/api/colaboradores'
    },
    servicos: {
        url: process.env.SERVICOS_API_URL || 'https://servicos-api-bluepay.vercel.app',
        path: '/api/servicos'
    }
};

// Configuração do proxy para cada serviço
Object.entries(services).forEach(([service, config]) => {
    app.use(
        config.path,
        createProxyMiddleware({
            target: config.url,
            changeOrigin: true,
            pathRewrite: {
                [`^${config.path}`]: ''
            },
            onError: (err, req, res) => {
                console.error(`Erro no serviço ${service}:`, err);
                res.status(500).json({
                    error: `Serviço ${service} indisponível`
                });
            }
        })
    );
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Inicialização do servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Gateway API rodando na porta ${PORT}`);
}); 