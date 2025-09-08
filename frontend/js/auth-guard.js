/**
 * Sistema de Proteção de Rotas - Auth Guard
 * Verifica se o usuário está autenticado antes de acessar páginas protegidas
 */

class AuthGuard {
    constructor() {
        this.LOGIN_PAGE = 'login.html';
        this.TOKEN_KEY = 'token';
        this.USER_KEY = 'user';
        this.init();
    }

    // Inicializa o sistema de proteção
    init() {
        // Verificar autenticação quando a página carregar
        if (this.isProtectedPage()) {
            this.checkAuthentication();
        }
    }

    // Verifica se a página atual é protegida (não é login)
    isProtectedPage() {
        const currentPage = window.location.pathname.split('/').pop();
        const currentPath = window.location.pathname;
        
        // Páginas que NÃO precisam de autenticação
        const publicPages = [
            'login.html',
            'index.html', // Página principal de redirecionamento
            ''
        ];
        
        // Se estiver na raiz ou em index.html principal, não é protegida
        if (currentPath === '/' || currentPath === '/index.html' || currentPage === 'index.html') {
            return false;
        }
        
        // Se contém 'src/' na URL, é uma página protegida
        if (currentPath.includes('/src/')) {
            return true;
        }
        
        // Verificar se não é uma página pública
        return !publicPages.includes(currentPage);
    }

    // Verifica se o usuário está autenticado
    isAuthenticated() {
        const token = localStorage.getItem(this.TOKEN_KEY);
        const user = localStorage.getItem(this.USER_KEY);
        
        if (!token || !user) {
            return false;
        }

        try {
            // Verificar se o token não expirou (opcional - pode ser implementado com JWT)
            const userData = JSON.parse(user);
            return userData && userData.email;
        } catch (error) {
            console.error('Erro ao verificar dados do usuário:', error);
            return false;
        }
    }

    // Verifica autenticação e redireciona se necessário
    async checkAuthentication() {
        if (!this.isAuthenticated()) {
            console.log('Usuário não autenticado. Redirecionando para login...');
            this.redirectToLogin();
            return false;
        }

        // Verificar se o token ainda é válido no servidor (opcional)
        const isValid = await this.validateToken();
        if (!isValid) {
            console.log('Token inválido. Redirecionando para login...');
            this.logout();
            this.redirectToLogin();
            return false;
        }

        return true;
    }

    // Valida o token no servidor (opcional)
    async validateToken() {
        try {
            const token = localStorage.getItem(this.TOKEN_KEY);
            const response = await fetch('https://auth-api-e-gerente.vercel.app/api/auth/verify', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            return response.ok;
        } catch (error) {
            console.error('Erro ao validar token:', error);
            return false;
        }
    }

    // Redireciona para a página de login
    redirectToLogin() {
        // Salvar a página atual para redirecionar após login
        const currentPage = window.location.pathname;
        if (currentPage !== `/${this.LOGIN_PAGE}` && !currentPage.includes('login.html')) {
            sessionStorage.setItem('redirectAfterLogin', currentPage);
        }
        
        // Redirecionar para login
        window.location.href = 'src/login.html';
    }

    // Logout do usuário
    logout() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        sessionStorage.removeItem('redirectAfterLogin');
    }

    // Obtém dados do usuário logado
    getCurrentUser() {
        try {
            const userData = localStorage.getItem(this.USER_KEY);
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('Erro ao obter dados do usuário:', error);
            return null;
        }
    }

    // Obtém o token de autenticação
    getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    // Verifica se o usuário tem permissão para acessar uma página
    hasPermission(page) {
        const user = this.getCurrentUser();
        if (!user) return false;

        // Implementar lógica de permissões baseada no perfil do usuário
        // Por enquanto, todos os usuários autenticados têm acesso
        return true;
    }

    // Redireciona para a página salva após login
    redirectAfterLogin() {
        const savedPage = sessionStorage.getItem('redirectAfterLogin');
        if (savedPage && savedPage !== `/${this.LOGIN_PAGE}` && !savedPage.includes('login.html')) {
            sessionStorage.removeItem('redirectAfterLogin');
            window.location.href = savedPage;
        } else {
            window.location.href = 'src/index.html';
        }
    }

    // Adiciona headers de autenticação para requisições
    getAuthHeaders() {
        const token = this.getToken();
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }
}

// Inicializar o AuthGuard quando o DOM carregar
document.addEventListener('DOMContentLoaded', function() {
    window.authGuard = new AuthGuard();
});

// Exportar para uso global
window.AuthGuard = AuthGuard;
