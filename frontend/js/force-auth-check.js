/**
 * Script de verificação forçada de autenticação
 * Executa imediatamente para garantir proteção
 */

(function() {
    'use strict';
    
    console.log('🔐 Iniciando verificação forçada de autenticação...');
    
    // Função para verificar se é uma página protegida
    function isProtectedPage() {
        const currentPath = window.location.pathname;
        const currentPage = currentPath.split('/').pop();
        
        console.log('🔐 Página atual:', currentPath, '| Arquivo:', currentPage);
        
        // Páginas públicas (não precisam de autenticação)
        const publicPages = [
            'login.html',
            'index.html' // Página principal de redirecionamento
        ];
        
        // Se estiver na raiz ou em index.html principal, não é protegida
        if (currentPath === '/' || currentPath === '/index.html' || currentPage === 'index.html') {
            console.log('🔐 Página pública (raiz/index principal)');
            return false;
        }
        
        // Se contém 'src/' na URL, é uma página protegida
        if (currentPath.includes('/src/')) {
            console.log('🔐 Página protegida (contém /src/)');
            return true;
        }
        
        // Verificar se não é uma página pública
        const isPublic = publicPages.includes(currentPage);
        console.log('🔐 É página pública?', isPublic);
        
        return !isPublic;
    }
    
    // Função para verificar autenticação
    function checkAuth() {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        console.log('🔐 Token existe?', !!token);
        console.log('🔐 User existe?', !!user);
        
        if (!token || !user) {
            console.log('🔐 Usuário não autenticado');
            return false;
        }
        
        try {
            const userData = JSON.parse(user);
            const hasEmail = userData && userData.email;
            console.log('🔐 Dados do usuário válidos?', hasEmail);
            return hasEmail;
        } catch (error) {
            console.error('🔐 Erro ao verificar dados do usuário:', error);
            return false;
        }
    }
    
    // Função para redirecionar para login
    function redirectToLogin() {
        console.log('🔐 Redirecionando para login...');
        
        // Salvar página atual para redirecionar após login
        const currentPage = window.location.pathname;
        if (currentPage !== '/src/login.html' && !currentPage.includes('login.html')) {
            sessionStorage.setItem('redirectAfterLogin', currentPage);
            console.log('🔐 Página salva para redirecionamento:', currentPage);
        }
        
        // Redirecionar para login
        window.location.href = 'src/login.html';
    }
    
    // Executar verificação imediatamente
    if (isProtectedPage()) {
        console.log('🔐 Página protegida detectada, verificando autenticação...');
        
        if (!checkAuth()) {
            console.log('🔐 Usuário não autenticado, redirecionando...');
            redirectToLogin();
        } else {
            console.log('🔐 Usuário autenticado, permitindo acesso');
        }
    } else {
        console.log('🔐 Página pública, não precisa de autenticação');
    }
    
})();
