/**
 * Script para aplicar proteção de autenticação em todas as páginas
 * Este script deve ser incluído em todas as páginas protegidas
 */

// Função para aplicar proteção de autenticação
function applyAuthProtection() {
    // Oculta o conteúdo até validar autenticação e permissão
    try { document.documentElement.style.visibility = 'hidden'; } catch(_) {}
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
        // Vincular/logout novamente após DOM pronto
        bindGlobalLogoutHandler();
        addLogoutButton();
        const isAuthenticated = await window.authGuard.checkAuthentication();
        if (!isAuthenticated) {
            return; // Redirecionará para login automaticamente
        }

        // Atualizar informações do usuário na interface
        updateUserInfo();
        // Aplicar permissões na UI
        try { applyPermissionsToUI(); } catch (_) {}

        // Checar se o usuário tem permissão para a página atual
        const required = getRequiredPermissionForCurrentPage();
        if (required && !window.authGuard.hasPermission(required)) {
            // Redirecionar para a primeira página permitida
            const target = findFirstAllowedPage();
            window.location.replace(target || 'login.html');
            return;
        }

        // Exibir conteúdo após validações
        try { document.documentElement.style.visibility = 'visible'; } catch(_) {}
    });
}

// Função para adicionar botão de logout
function addLogoutButton() {
    // Procurar por botão de logout existente
    const existingLogout = document.querySelector('.logout-button, .logout-button a, [data-logout]');
    if (existingLogout) {
        const bindTarget = existingLogout.matches('a') ? existingLogout : (existingLogout.querySelector('a') || existingLogout);
        bindTarget.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
        // Garantir destino padrão
        if (bindTarget.tagName === 'A') {
            bindTarget.setAttribute('href', 'login.html');
        }
        return;
    }

    // Procurar por sidebar para adicionar botão de logout
    const sidebar = document.querySelector('.sidebar, .nav-menu');
    if (sidebar) {
        const logoutButton = document.createElement('div');
        logoutButton.className = 'logout-button';
        logoutButton.innerHTML = `
            <a href="login.html" data-logout>
                <i class="fas fa-sign-out-alt"></i>
                <span>Sair</span>
            </a>
        `;
        
        sidebar.appendChild(logoutButton);
        
        const link = logoutButton.querySelector('a');
        link.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
}

// Delegação global para capturar cliques em qualquer botão/link de logout
function bindGlobalLogoutHandler() {
    if (bindGlobalLogoutHandler._bound) return;
    document.addEventListener('click', function(e) {
        const target = e.target.closest('[data-logout], .logout-button, .logout-button a');
        if (target) {
            e.preventDefault();
            logout();
        }
    });
    bindGlobalLogoutHandler._bound = true;
}

// Função para fazer logout
function logout() {
    if (confirm('Tem certeza que deseja sair do sistema?')) {
        try {
            if (window.authGuard && typeof window.authGuard.logout === 'function') {
                window.authGuard.logout();
            } else {
                sessionStorage.removeItem('token');
                sessionStorage.removeItem('user');
            }
        } finally {
            window.location.replace('login.html');
        }
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

// Aplica permissões do usuário na interface
function applyPermissionsToUI() {
    const user = window.authGuard ? window.authGuard.getCurrentUser() : null;
    if (!user || !user.permissoes) return;
    const can = (flag) => window.authGuard.hasPermission(flag);

    const menuMap = [
        { selector: 'a[href="colaboradores.html"]', flag: 'cadastros_colaboradores_ver' },
        { selector: 'a[href="clientes.html"]', flag: 'cadastros_clientes_ver' },
        { selector: 'a[href="produtos.html"]', flag: 'cadastros_produtos_ver' },
        { selector: 'a[href="servicos.html"]', flag: 'cadastros_servicos_ver' },
        { selector: 'a[href="lancar-comissao.html"]', flag: 'comissoes_lancar_ver' },
        { selector: 'a[href="movimento-comissao.html"]', flag: 'comissoes_movimento_ver' },
        { selector: 'a[href="consulta-comissao.html"]', flag: 'comissoes_consulta_ver' },
        { selector: 'a[href="recebimento.html"]', flag: 'relatorios_recebimento_ver' },
        { selector: 'a[href="conferencia.html"]', flag: 'relatorios_conferencia_ver' },
        { selector: 'a[href="dinamico.html"]', flag: 'relatorios_dinamico_ver' },
        { selector: 'a[href="manutencao-bd.html"]', flag: 'configuracoes_manutencao_ver' },
        { selector: 'a[href="sincronizar.html"]', flag: 'configuracoes_sincronizar_ver' },
    ];
    menuMap.forEach(({ selector, flag }) => {
        const el = document.querySelector(selector);
        if (el && !can(flag)) {
            const li = el.closest('li') || el;
            li.style.display = 'none';
        }
    });
}

// Mapeia página -> flag de permissão necessária
function getRequiredPermissionForCurrentPage() {
    const file = (location.pathname.split('/').pop() || '').toLowerCase();
    const map = {
        'index.html': 'dashboard_ver',
        'colaboradores.html': 'cadastros_colaboradores_ver',
        'clientes.html': 'cadastros_clientes_ver',
        'produtos.html': 'cadastros_produtos_ver',
        'servicos.html': 'cadastros_servicos_ver',
        'lancar-comissao.html': 'comissoes_lancar_ver',
        'movimento-comissao.html': 'comissoes_movimento_ver',
        'consulta-comissao.html': 'comissoes_consulta_ver',
        'recebimento.html': 'relatorios_recebimento_ver',
        'conferencia.html': 'relatorios_conferencia_ver',
        'dinamico.html': 'relatorios_dinamico_ver',
        'manutencao-bd.html': 'configuracoes_manutencao_ver',
        'sincronizar.html': 'configuracoes_sincronizar_ver'
    };
    return map[file];
}

// Encontra primeira página do menu que o usuário tem permissão para ver
function findFirstAllowedPage() {
    const candidates = [
        { url: 'index.html', flag: 'dashboard_ver' },
        { url: 'colaboradores.html', flag: 'cadastros_colaboradores_ver' },
        { url: 'clientes.html', flag: 'cadastros_clientes_ver' },
        { url: 'produtos.html', flag: 'cadastros_produtos_ver' },
        { url: 'servicos.html', flag: 'cadastros_servicos_ver' },
        { url: 'lancar-comissao.html', flag: 'comissoes_lancar_ver' },
        { url: 'movimento-comissao.html', flag: 'comissoes_movimento_ver' },
        { url: 'consulta-comissao.html', flag: 'comissoes_consulta_ver' },
        { url: 'recebimento.html', flag: 'relatorios_recebimento_ver' },
        { url: 'conferencia.html', flag: 'relatorios_conferencia_ver' },
        { url: 'dinamico.html', flag: 'relatorios_dinamico_ver' },
        { url: 'manutencao-bd.html', flag: 'configuracoes_manutencao_ver' },
        { url: 'sincronizar.html', flag: 'configuracoes_sincronizar_ver' }
    ];
    for (const c of candidates) {
        if (window.authGuard.hasPermission(c.flag)) return c.url;
    }
    return null;
}

// Aplicar proteção automaticamente
applyAuthProtection();
