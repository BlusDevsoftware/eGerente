const cors = require('cors');

// Lista de origens permitidas
const allowedOrigins = [
    'http://localhost:3000', // Desenvolvimento local
    'https://egerente.vercel.app', // Frontend no Vercel
    process.env.FRONTEND_URL // URL do frontend configurada em variável de ambiente
];

// Configuração do CORS
const corsOptions = {
    origin: function (origin, callback) {
        // Permite requisições sem origem (como mobile apps ou curl)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true, // Permite cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

module.exports = cors(corsOptions); 