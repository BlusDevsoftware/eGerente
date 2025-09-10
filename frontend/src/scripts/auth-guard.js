/**
 * Sistema de Proteção de Rotas - Auth Guard (cópia para /src/scripts)
 */

// Early redirect to avoid any flash before login
(function earlyAuthRedirect(){
    try {
        var LOGIN_PAGE = 'login.html';
        var currentPage = window.location.pathname.split('/').pop();
        // Treat every page except login as protected for the early guard
        var isProtected = currentPage !== LOGIN_PAGE;
        if (isProtected) {
            var hasToken = !!sessionStorage.getItem('token');
            var hasUser = !!sessionStorage.getItem('user');
            if (!hasToken || !hasUser) {
                // Use replace to avoid creating a back entry
                window.location.replace(LOGIN_PAGE);
            }
        }
    } catch(_) {}
})();

class AuthGuard {
    constructor() {
        this.LOGIN_PAGE = 'login.html';
        this.TOKEN_KEY = 'token';
        this.USER_KEY = 'user';
        this.init();
    }

    init() {
        if (this.isProtectedPage()) {
            this.checkAuthentication();
        }
    }

    isProtectedPage() {
        const currentPage = window.location.pathname.split('/').pop();
        // Protect all pages except the login page
        return currentPage !== this.LOGIN_PAGE;
    }

    isAuthenticated() {
        const token = sessionStorage.getItem(this.TOKEN_KEY);
        const user = sessionStorage.getItem(this.USER_KEY);
        if (!token || !user) return false;
        try {
            const userData = JSON.parse(user);
            return userData && userData.email;
        } catch {
            return false;
        }
    }

    async checkAuthentication() {
        if (!this.isAuthenticated()) {
            this.redirectToLogin();
            return false;
        }
        const isValid = await this.validateToken();
        if (!isValid) {
            this.logout();
            this.redirectToLogin();
            return false;
        }
        return true;
    }

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
        } catch {
            return false;
        }
    }

    redirectToLogin() {
        const currentPage = window.location.pathname;
        if (currentPage !== `/${this.LOGIN_PAGE}`) {
            sessionStorage.setItem('redirectAfterLogin', currentPage);
        }
        window.location.href = this.LOGIN_PAGE;
    }

    logout() {
        sessionStorage.removeItem(this.TOKEN_KEY);
        sessionStorage.removeItem(this.USER_KEY);
        sessionStorage.removeItem('redirectAfterLogin');
    }

    getCurrentUser() {
        try {
            const userData = sessionStorage.getItem(this.USER_KEY);
            return userData ? JSON.parse(userData) : null;
        } catch {
            return null;
        }
    }

    getToken() { return sessionStorage.getItem(this.TOKEN_KEY); }

    hasPermission(flagOrSection, action) {
        const user = this.getCurrentUser();
        if (!user) return false;
        const perms = user.permissoes || {};
        if (typeof flagOrSection === 'string' && !action) {
            return perms[flagOrSection] === true;
        }
        if (typeof flagOrSection === 'string' && typeof action === 'string') {
            const key = `${flagOrSection}_${action}`;
            return perms[key] === true;
        }
        return false;
    }

    redirectAfterLogin() {
        const savedPage = sessionStorage.getItem('redirectAfterLogin');
        if (savedPage && savedPage !== `/${this.LOGIN_PAGE}`) {
            sessionStorage.removeItem('redirectAfterLogin');
            window.location.href = savedPage;
        } else {
            window.location.href = 'index.html';
        }
    }

    getAuthHeaders() {
        const token = this.getToken();
        return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    }
}

document.addEventListener('DOMContentLoaded', function() {
    window.authGuard = new AuthGuard();
});

window.AuthGuard = AuthGuard;


