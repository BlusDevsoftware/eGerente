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
        return currentPage !== this.LOGIN_PAGE && currentPage !== '' && currentPage !== 'index.html';
    }

    // Verifica se o usuário está autenticado
    isAuthenticated() {
        const token = sessionStorage.getItem(this.TOKEN_KEY);
        const user = sessionStorage.getItem(this.USER_KEY);
        
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
            const token = sessionStorage.getItem(this.TOKEN_KEY);
            const response = await fetch('https://e-gerente-backend-cadastros-api.vercel.app/api/cadastros/colaboradores/verify', {
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
        if (currentPage !== `/${this.LOGIN_PAGE}`) {
            sessionStorage.setItem('redirectAfterLogin', currentPage);
        }
        
        window.location.href = this.LOGIN_PAGE;
    }

    // Logout do usuário
    logout() {
        sessionStorage.removeItem(this.TOKEN_KEY);
        sessionStorage.removeItem(this.USER_KEY);
        sessionStorage.removeItem('redirectAfterLogin');
    }

    // Obtém dados do usuário logado
    getCurrentUser() {
        try {
            const userData = sessionStorage.getItem(this.USER_KEY);
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('Erro ao obter dados do usuário:', error);
            return null;
        }
    }

    // Obtém o token de autenticação
    getToken() {
        return sessionStorage.getItem(this.TOKEN_KEY);
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
        if (savedPage && savedPage !== `/${this.LOGIN_PAGE}`) {
            sessionStorage.removeItem('redirectAfterLogin');
            window.location.href = savedPage;
        } else {
            window.location.href = 'index.html';
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
