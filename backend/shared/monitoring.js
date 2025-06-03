const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');

// Inicializa o Sentry
const initSentry = () => {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        integrations: [
            new ProfilingIntegration(),
        ],
        // Performance Monitoring
        tracesSampleRate: 1.0,
        // Profiling
        profilesSampleRate: 1.0,
    });
};

// Middleware para capturar erros
const errorHandler = (err, req, res, next) => {
    // Captura o erro no Sentry
    Sentry.captureException(err);

    // Log do erro
    console.error('Erro na aplicação:', err);

    // Resposta para o cliente
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production' 
            ? 'Erro interno do servidor' 
            : err.message
    });
};

// Middleware para monitoramento de performance
const performanceMonitor = (req, res, next) => {
    const transaction = Sentry.startTransaction({
        op: 'http.server',
        name: `${req.method} ${req.path}`,
    });

    // Adiciona dados da transação ao request
    req.__sentry_transaction = transaction;

    // Finaliza a transação após a resposta
    res.on('finish', () => {
        transaction.setHttpStatus(res.statusCode);
        transaction.finish();
    });

    next();
};

// Função para capturar mensagens
const captureMessage = (message, level = 'info') => {
    Sentry.captureMessage(message, level);
};

// Função para capturar exceções
const captureException = (error) => {
    Sentry.captureException(error);
};

// Função para adicionar contexto
const setContext = (name, context) => {
    Sentry.setContext(name, context);
};

// Função para adicionar tags
const setTag = (key, value) => {
    Sentry.setTag(key, value);
};

module.exports = {
    initSentry,
    errorHandler,
    performanceMonitor,
    captureMessage,
    captureException,
    setContext,
    setTag,
}; 