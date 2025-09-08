/**
 * Script para aplicar proteção de autenticação em todas as páginas
 * Este script deve ser incluído em todas as páginas protegidas
 */

// Função para aplicar proteção de autenticação
function applyAuthProtection() {
    // Verificar se o AuthGuard está disponível
    if (!window.authGuard) {
        console.error('AuthGuard não encontrado. Certifique-se de incluir auth-guard.js antes deste script.');
        return;
    }

    // Interceptar todas as requisições para adicionar token de autenticação
    const originalFetch = window.fetch;
    window.fetch = function(url, options = {}) {
        // Adicionar headers de autenticação se disponível
        if (window.authGuard && window.authGuard.getToken()) {
            options.headers = {
                ...options.headers,
                ...window.authGuard.getAuthHeaders()
            };
        }
        return originalFetch(url, options);
    };

    // Adicionar botão de logout na sidebar (se existir)
    addLogoutButton();

    // Verificar autenticação quando a página carregar
    document.addEventListener('DOMContentLoaded', async function() {
        console.log('🔐 Verificando autenticação...');
        
        // Forçar verificação de autenticação
        if (window.authGuard) {
            const isAuthenticated = await window.authGuard.checkAuthentication();
            console.log('🔐 Resultado da verificação:', isAuthenticated);
            
            if (!isAuthenticated) {
                console.log('🔐 Usuário não autenticado, redirecionando...');
                return; // Redirecionará para login automaticamente
            }
            
            console.log('🔐 Usuário autenticado, carregando página...');
        } else {
            console.error('🔐 AuthGuard não encontrado!');
        }

        // Atualizar informações do usuário na interface
        updateUserInfo();
    });
}

// Função para adicionar botão de logout
function addLogoutButton() {
    // Procurar por botão de logout existente
    const existingLogout = document.querySelector('.logout-button, [data-logout]');
    if (existingLogout) {
        existingLogout.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
        return;
    }

    // Procurar por sidebar para adicionar botão de logout
    const sidebar = document.querySelector('.sidebar, .nav-menu');
    if (sidebar) {
        const logoutButton = document.createElement('div');
        logoutButton.className = 'logout-button';
        logoutButton.innerHTML = `
            <a href="#" data-logout>
                <i class="fas fa-sign-out-alt"></i>
                <span>Sair</span>
            </a>
        `;
        
        sidebar.appendChild(logoutButton);
        
        logoutButton.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
}

// Função para fazer logout
function logout() {
    if (confirm('Tem certeza que deseja sair do sistema?')) {
        if (window.authGuard) {
            window.authGuard.logout();
        } else {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
        window.location.href = 'login.html';
    }
}

// Função para atualizar informações do usuário na interface
function updateUserInfo() {
    const user = window.authGuard ? window.authGuard.getCurrentUser() : null;
    if (!user) return;

    // Atualizar nome do usuário no header (se existir)
    const userNameElements = document.querySelectorAll('[data-user-name], .user-name, .welcome-text h1');
    userNameElements.forEach(element => {
        if (element.tagName === 'H1') {
            element.textContent = `Bem-vindo, ${user.nome || user.email}`;
        } else {
            element.textContent = user.nome || user.email;
        }
    });

    // Atualizar avatar do usuário (se existir)
    const userAvatarElements = document.querySelectorAll('[data-user-avatar], .user-avatar');
    userAvatarElements.forEach(element => {
        if (user.nome) {
            element.textContent = user.nome.charAt(0).toUpperCase();
        }
    });
}

// Aplicar proteção automaticamente
applyAuthProtection();
