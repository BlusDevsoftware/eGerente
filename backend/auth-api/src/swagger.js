const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API de Autenticação BluePay',
            version: '1.0.0',
            description: 'Documentação da API de autenticação do sistema BluePay',
        },
        servers: [
            {
                url: 'https://auth-api-bluepay.vercel.app',
                description: 'Servidor de Produção',
            },
            {
                url: 'http://localhost:3000',
                description: 'Servidor Local',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
    },
    apis: ['./src/routes/*.js'], // Caminho para os arquivos de rota
};

const specs = swaggerJsdoc(options);

module.exports = specs; 