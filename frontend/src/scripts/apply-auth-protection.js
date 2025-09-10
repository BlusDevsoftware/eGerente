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

    function addPermGuardStyle() {
        let s = document.getElementById('perm-guard-style');
        if (!s) {
            s = document.createElement('style');
            s.id = 'perm-guard-style';
            s.textContent = `
                .sidebar, .nav-menu { visibility: hidden; }
            `;
            document.head.appendChild(s);
        }
    }

    function removePermGuardStyle() {
        const s = document.getElementById('perm-guard-style');
        if (s && s.parentNode) s.parentNode.removeChild(s);
    }

    document.addEventListener('DOMContentLoaded', async function() {
        bindGlobalLogoutHandler();
        addLogoutButton();
        
        // Adicionar modal de logout se não existir
        addLogoutModal();

        // Evitar flash: ocultar apenas o menu até aplicar permissões
        addPermGuardStyle();

        // Se por algum motivo o authGuard não estiver pronto, não mantenha a página oculta
        if (!window.authGuard) {
            removePermGuardStyle();
            try { document.documentElement.style.visibility = 'visible'; } catch(_) {}
            return;
        }

        // 0) Aplicar classes CSS de permissão no <html> (CSS-first)
        try { addPermissionClassesFromSession(); } catch(_) {}

        // 1) Aplicar imediatamente com base no usuário do storage (elimina flash)
        updateUserInfo();
        try { applyPermissionsToUI(); } catch(_) {}
        removePermGuardStyle();
        try { document.documentElement.style.visibility = 'visible'; } catch(_) {}

        // 2) Validar token em background; se inválido, redireciona
        try {
            const ok = await window.authGuard.checkAuthentication();
            if (!ok) return;
            const required = getRequiredPermissionForCurrentPage();
            if (required && !window.authGuard.hasPermission(required)) {
                const target = findFirstAllowedPage();
                window.location.replace(target || 'login.html');
                return;
            }
        } catch(_) {}
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

function addLogoutModal() {
    // Verificar se o modal já existe
    if (document.getElementById('logoutModal')) {
        return;
    }

    // Criar o modal
    const modalHTML = `
        <!-- Modal de Confirmação de Saída -->
        <div id="logoutModal" class="logout-modal">
            <div class="logout-modal-content">
                <div class="logout-modal-header">
                    <h2><i class="fas fa-sign-out-alt"></i> Confirmar Saída</h2>
                    <button class="logout-close-btn" onclick="closeLogoutModal()">&times;</button>
                </div>
                <div class="logout-modal-body">
                    <div class="logout-icon">
                        <i class="fas fa-sign-out-alt"></i>
                    </div>
                    <div class="logout-message">
                        Tem certeza que deseja sair do sistema?
                    </div>
                    <div class="logout-warning">
                        Você será redirecionado para a tela de login.
                    </div>
                </div>
                <div class="logout-modal-actions">
                    <button class="logout-btn-cancel" onclick="closeLogoutModal()">
                        <i class="fas fa-times"></i>
                        Cancelar
                    </button>
                    <button class="logout-btn-confirm" onclick="confirmLogout()">
                        <i class="fas fa-sign-out-alt"></i>
                        Sair
                    </button>
                </div>
            </div>
        </div>
    `;

    // Adicionar o modal ao final do body
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Adicionar event listeners
    const modal = document.getElementById('logoutModal');
    
    // Fechar modal ao clicar fora
    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeLogoutModal();
        }
    });

    // Fechar modal com ESC
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && modal.style.display === 'flex') {
            closeLogoutModal();
        }
    });
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
    showLogoutModal();
}

function showLogoutModal() {
    const modal = document.getElementById('logoutModal');
    if (modal) {
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);
        document.body.style.overflow = 'hidden';
    }
}

function closeLogoutModal() {
    const modal = document.getElementById('logoutModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }, 300);
    }
}

function confirmLogout() {
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
        { selector: 'a[href="index.html"]', flag: 'dashboard_ver' },
        { selector: 'a[href="colaboradores.html"]', flag: 'cadastros_colaboradores_ver' },
        { selector: 'a[href="clientes.html"]', flag: 'cadastros_clientes_ver' },
        { selector: 'a[href="produtos.html"]', flag: 'cadastros_produtos_ver' },
        { selector: 'a[href="servicos.html"]', flag: 'cadastros_servicos_ver' },
        { selector: 'a[href="perfil.html"]', flag: 'cadastros_perfis_ver' },
        { selector: 'a[href="lancar-comissao.html"]', flag: 'comissoes_lancar_ver' },
        { selector: 'a[href="movimento-comissao.html"]', flag: 'comissoes_movimento_ver' },
        { selector: 'a[href="consulta-comissao.html"]', flag: 'comissoes_consulta_ver' },
        { selector: 'a[href="recebimento.html"]', flag: 'relatorios_recebimento_ver' },
        { selector: 'a[href="conferencia.html"]', flag: 'relatorios_conferencia_ver' },
        { selector: 'a[href="dinamico.html"]', flag: 'relatorios_dinamico_ver' },
        { selector: 'a[href="manutencao-bd.html"]', flag: 'configuracoes_manutencao_ver' },
        { selector: 'a[href="sincronizar.html"]', flag: 'configuracoes_sincronizar_ver' },
    ];
    // 1) Esconder itens sem permissão
    menuMap.forEach(({ selector, flag }) => {
        const el = document.querySelector(selector);
        if (el && !can(flag)) {
            const li = el.closest('li') || el;
            li.style.display = 'none';
        }
    });

    // 2) Esconder grupos de menu (has-submenu) sem nenhum item visível
    const groups = document.querySelectorAll('.has-submenu');
    groups.forEach(group => {
        const submenu = group.querySelector('.submenu');
        if (!submenu) return;
        const childLinks = Array.from(submenu.querySelectorAll('a'));
        const hasVisibleChild = childLinks.some(a => {
            const li = a.closest('li') || a;
            return li && li.style.display !== 'none';
        });
        if (!hasVisibleChild) {
            group.style.display = 'none';
        } else {
            group.style.display = '';
        }
    });
}

function addPermissionClassesFromSession() {
    const user = (window.authGuard && window.authGuard.getCurrentUser && window.authGuard.getCurrentUser())
        || (function(){ try { return JSON.parse(sessionStorage.getItem('user') || 'null'); } catch(_) { return null; } })();
    if (!user || !user.permissoes) return;
    const html = document.documentElement;
    Object.keys(user.permissoes).forEach(function(key){
        if (user.permissoes[key] === true) {
            html.classList.add('perm-' + key);
        }
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
        'perfil.html': 'cadastros_perfis_ver',
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


