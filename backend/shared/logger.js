const winston = require('winston');
const { format } = winston;

// Formato personalizado para logs
const logFormat = format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
);

// Configuração do logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service: 'bluepay-api' },
    transports: [
        // Log de erros
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        // Log de todas as mensagens
        new winston.transports.File({
            filename: 'logs/combined.log',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
    ],
});

// Adiciona console transport em desenvolvimento
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: format.combine(
            format.colorize(),
            format.simple()
        ),
    }));
}

// Funções auxiliares
const logError = (error, context = {}) => {
    logger.error({
        message: error.message,
        stack: error.stack,
        ...context,
    });
};

const logInfo = (message, data = {}) => {
    logger.info({
        message,
        ...data,
    });
};

const logWarning = (message, data = {}) => {
    logger.warn({
        message,
        ...data,
    });
};

const logDebug = (message, data = {}) => {
    logger.debug({
        message,
        ...data,
    });
};

module.exports = {
    logger,
    logError,
    logInfo,
    logWarning,
    logDebug,
}; 