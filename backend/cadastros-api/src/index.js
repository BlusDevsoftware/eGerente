const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const corsMiddleware = require('./middleware/cors');
const cadastroRoutes = require('./routes/cadastroRoutes');

const app = express();

// Configurações de segurança
app.use(helmet());
app.use(corsMiddleware);
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100 // limite de 100 requisições por IP
});
app.use(limiter);

// Rotas
app.use('/api/cadastros', cadastroRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Inicialização do servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
}); 