/**
 * Proteção Universal de Autenticação
 * Script que pode ser incluído em qualquer página para proteção automática
 */

(function() {
    'use strict';
    
    // Configurações
    const CONFIG = {
        LOGIN_PAGE: 'src/login.html',
        TOKEN_KEY: 'token',
        USER_KEY: 'user',
        REDIRECT_KEY: 'redirectAfterLogin'
    };
    
    // Log com prefixo
    function log(message) {
        console.log('🔐 [AuthProtection]', message);
    }
    
    // Verificar se é página protegida
    function isProtectedPage() {
        const path = window.location.pathname;
        const page = path.split('/').pop();
        
        log(`Verificando página: ${path} (${page})`);
        
        // Páginas públicas
        const publicPages = ['login.html', 'index.html'];
        
        // Se está na raiz ou index principal
        if (path === '/' || path === '/index.html' || page === 'index.html') {
            log('Página pública: raiz/index principal');
            return false;
        }
        
        // Se contém /src/, é protegida
        if (path.includes('/src/')) {
            log('Página protegida: contém /src/');
            return true;
        }
        
        // Verificar se não é pública
        const isPublic = publicPages.includes(page);
        log(`É página pública? ${isPublic}`);
        
        return !isPublic;
    }
    
    // Verificar autenticação
    function isAuthenticated() {
        const token = localStorage.getItem(CONFIG.TOKEN_KEY);
        const user = localStorage.getItem(CONFIG.USER_KEY);
        
        log(`Token: ${!!token}, User: ${!!user}`);
        
        if (!token || !user) {
            return false;
        }
        
        try {
            const userData = JSON.parse(user);
            return userData && userData.email;
        } catch (error) {
            log('Erro ao parsear dados do usuário: ' + error.message);
            return false;
        }
    }
    
    // Redirecionar para login
    function redirectToLogin() {
        log('Redirecionando para login...');
        
        // Salvar página atual
        const currentPage = window.location.pathname;
        if (currentPage !== `/${CONFIG.LOGIN_PAGE}` && !currentPage.includes('login.html')) {
            sessionStorage.setItem(CONFIG.REDIRECT_KEY, currentPage);
            log(`Página salva: ${currentPage}`);
        }
        
        // Redirecionar
        window.location.href = CONFIG.LOGIN_PAGE;
    }
    
    // Função principal
    function protectPage() {
        log('Iniciando proteção da página...');
        
        if (isProtectedPage()) {
            log('Página protegida detectada');
            
            if (!isAuthenticated()) {
                log('Usuário não autenticado - redirecionando');
                redirectToLogin();
                return false;
            } else {
                log('Usuário autenticado - permitindo acesso');
                return true;
            }
        } else {
            log('Página pública - sem proteção necessária');
            return true;
        }
    }
    
    // Executar proteção
    const isProtected = protectPage();
    
    // Exportar funções para uso global
    window.AuthProtection = {
        protectPage,
        isAuthenticated,
        redirectToLogin,
        isProtectedPage
    };
    
    log(`Proteção aplicada: ${isProtected ? 'SUCESSO' : 'REDIRECIONANDO'}`);
    
})();
