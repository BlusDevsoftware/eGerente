/** Proteção de autenticação e permissões (cópia para /src/scripts) */

function applyAuthProtection() {
    const originalFetch = window.fetch;
    window.fetch = function(url, options = {}) {
        if (window.authGuard && window.authGuard.getToken()) {
            options.headers = { ...options.headers, ...window.authGuard.getAuthHeaders() };
        }
        return originalFetch(url, options);
    };

    addLogoutButton();

    document.addEventListener('DOMContentLoaded', async function() {
        bindGlobalLogoutHandler();
        addLogoutButton();

        // Se por algum motivo o authGuard não estiver pronto, não mantenha a página oculta
        if (!window.authGuard) {
            try { document.documentElement.style.visibility = 'visible'; } catch(_) {}
            return;
        }

        const ok = await window.authGuard.checkAuthentication();
        if (!ok) {
            // O próprio guard fará o redirect; evite tela branca
            try { document.documentElement.style.visibility = 'visible'; } catch(_) {}
            return;
        }
        updateUserInfo();
        try { applyPermissionsToUI(); } catch(_) {}
        const required = getRequiredPermissionForCurrentPage();
        if (required && !window.authGuard.hasPermission(required)) {
            const target = findFirstAllowedPage();
            window.location.replace(target || 'login.html');
            return;
        }
        try { document.documentElement.style.visibility = 'visible'; } catch(_) {}
    });
}

function addLogoutButton() {
    const existingLogout = document.querySelector('.logout-button, .logout-button a, [data-logout]');
    if (existingLogout) {
        const bindTarget = existingLogout.matches('a') ? existingLogout : (existingLogout.querySelector('a') || existingLogout);
        bindTarget.addEventListener('click', function(e) { e.preventDefault(); logout(); });
        if (bindTarget.tagName === 'A') bindTarget.setAttribute('href', 'login.html');
        return;
    }
}

function bindGlobalLogoutHandler() {
    if (bindGlobalLogoutHandler._bound) return;
    document.addEventListener('click', function(e) {
        const target = e.target.closest('[data-logout], .logout-button, .logout-button a');
        if (target) { e.preventDefault(); logout(); }
    });
    bindGlobalLogoutHandler._bound = true;
}

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

function updateUserInfo() {
    const user = window.authGuard ? window.authGuard.getCurrentUser() : null;
    if (!user) return;
    const userNameElements = document.querySelectorAll('[data-user-name], .user-name, .welcome-text h1');
    userNameElements.forEach(element => {
        if (element.tagName === 'H1') element.textContent = `Bem-vindo, ${user.nome || user.email}`;
        else element.textContent = user.nome || user.email;
    });
}

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
        if (el && !can(flag)) { const li = el.closest('li') || el; li.style.display = 'none'; }
    });
}

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
    for (const c of candidates) { if (window.authGuard.hasPermission(c.flag)) return c.url; }
    return null;
}

applyAuthProtection();


