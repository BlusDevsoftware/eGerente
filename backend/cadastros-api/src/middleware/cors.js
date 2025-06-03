const cors = require('cors');

const corsOptions = {
    origin: process.env.CORS_ORIGIN || 'https://e-gerente.vercel.app',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

module.exports = cors(corsOptions); 