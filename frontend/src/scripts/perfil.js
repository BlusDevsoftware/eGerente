// Funções de Modal de Perfil

// Função global para renderizar matriz de permissões
function renderPermissionsMatrix(permissoes = {}) {
    const c = document.getElementById('permissionsMatrix');
    if (!c) return;
    c.innerHTML = '';
    const iconByAction = {
        ver: 'fa-eye',
        criar: 'fa-plus',
        editar: 'fa-pen',
        excluir: 'fa-trash',
        exportar: 'fa-file-export',
        executar: 'fa-play'
    };
    const grupos = [
        { titulo: 'Dashboard', acoes: ['ver'] },
        { titulo: 'Cadastros/Colaboradores', acoes: ['ver','criar','editar','excluir'] },
        { titulo: 'Cadastros/Clientes', acoes: ['ver','criar','editar','excluir'] },
        { titulo: 'Cadastros/Produtos', acoes: ['ver','criar','editar','excluir'] },
        { titulo: 'Cadastros/Serviços', acoes: ['ver','criar','editar','excluir'] },
        { titulo: 'Comissões/Lançar', acoes: ['ver','criar'] },
        { titulo: 'Comissões/Movimento', acoes: ['ver','criar','editar','excluir'] },
        { titulo: 'Comissões/Consulta', acoes: ['ver'] },
        { titulo: 'Relatórios/Recebimento', acoes: ['ver','exportar'] },
        { titulo: 'Relatórios/Conferência', acoes: ['ver','exportar'] },
        { titulo: 'Relatórios/Dinâmico', acoes: ['ver','exportar'] },
        { titulo: 'Configurações/Manutenção BD', acoes: ['ver','executar'] },
        { titulo: 'Configurações/Sincronizar', acoes: ['ver','executar'] },
    ];
    grupos.forEach((g, gi) => {
        const box = document.createElement('div');
        box.className = 'perm-group';
        const title = document.createElement('div');
        title.className = 'perm-title';
        title.innerHTML = `<i class="fas fa-folder"></i> ${g.titulo}`;
        const row = document.createElement('div');
        row.className = 'perm-actions';
        g.acoes.forEach(acao => {
            const label = document.createElement('label');
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.name = `perm_${gi}_${acao}`;
            cb.checked = Boolean(permissoes[g.titulo]?.includes(acao));
            cb.addEventListener('change', () => {
                if (!permissoes[g.titulo]) permissoes[g.titulo] = [];
                // Se marcar criar/editar/excluir, garantir 'ver' marcado
                if (acao !== 'ver' && cb.checked) {
                    const viewCb = c.querySelector(`input[name="perm_${gi}_ver"]`);
                    if (viewCb && !viewCb.checked) {
                        viewCb.checked = true;
                        if (!permissoes[g.titulo].includes('ver')) permissoes[g.titulo].push('ver');
                    }
                }
                // Se desmarcar 'ver', desmarca as demais opções
                if (acao === 'ver' && !cb.checked) {
                    g.acoes.forEach(a2 => {
                        if (a2 !== 'ver') {
                            const other = c.querySelector(`input[name="perm_${gi}_${a2}"]`);
                            if (other && other.checked) other.checked = false;
                        }
                    });
                    delete permissoes[g.titulo];
                    return;
                }
                if (cb.checked) {
                    if (!permissoes[g.titulo].includes(acao)) permissoes[g.titulo].push(acao);
                } else {
                    permissoes[g.titulo] = permissoes[g.titulo].filter(a => a !== acao);
                    if (permissoes[g.titulo].length === 0) delete permissoes[g.titulo];
                }
            });
            const icon = document.createElement('i');
            icon.className = `fas ${iconByAction[acao] || 'fa-check'}`;
            const span = document.createElement('span');
            span.textContent = acao;
            label.appendChild(cb);
            label.appendChild(icon);
            label.appendChild(span);
            row.appendChild(label);
        });
        box.appendChild(title);
        box.appendChild(row);
        c.appendChild(box);
    });
    const form = document.getElementById('perfilForm');
    if (form) {
        form._permissoesAtual = permissoes;
    }
}

function openPerfilModal() {
    const modal = document.getElementById('perfilModal');
    if (!modal) {
        console.error('Modal de perfil não encontrado');
        mostrarToast('Modal de perfil não encontrado!', 'error');
        return;
    }
    const form = document.getElementById('perfilForm');
    if (!form) return;
        form.reset();
    document.getElementById('perfilModalTitle').innerHTML = '<i class="fas fa-user-shield"></i> Novo Perfil';
    // Garante estrutura em memória
    if (!window.perfisMemoria) {
        window.perfisMemoria = [];
    }
    // Em criação, não definir código; backend gera automaticamente
    form.codigo.value = '';
    form.codigo_perfil.value = '';
    // Renderiza matriz de permissões (básica por enquanto)
    renderPermissionsMatrix({});
    modal.style.display = 'flex';
    modal.classList.remove('show');
    modal.style.opacity = '1';
    document.body.style.overflow = 'hidden';
}

function closePerfilModal() {
    const modal = document.getElementById('perfilModal');
    if (!modal) return;
    modal.style.opacity = '0';
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
}

function closeViewModal() {
    // Esta função pode ser removida se o mesmo modal for usado para visualizar e editar
    const modal = document.getElementById('viewModal'); // Verifique se este modal ainda existe no HTML
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }, 300);
    }
}

// Dados cacheados desta página
window.perfisMemoria = [];

// Funções para controlar o spinner centralizado - IDÊNTICAS AO DA ABA DE COLABORADORES
function mostrarSpinner() {
    document.getElementById('loader-usuarios').style.display = 'flex';
}

function ocultarSpinner() {
    document.getElementById('loader-usuarios').style.display = 'none';
}

// Visualizar perfil
async function visualizarPerfil(codigo) {
    try {
        const perfil = await api.get(`/perfis/${parseInt(codigo, 10)}`);
        // Reaproveita o modal de perfil em modo somente leitura
        const form = document.getElementById('perfilForm');
        document.getElementById('perfilModalTitle').innerHTML = '<i class="fas fa-eye"></i> Visualizar Perfil';
        form.codigo.value = perfil.codigo || '';
        form.codigo_perfil.value = (perfil.codigo || '').toString().padStart(5, '0');
        form.nome.value = perfil.nome || '';
        // Renderizar permissões marcadas
        const mapa = mapearPermsPorSecao(perfil.permissoes || []);
        renderPermissionsMatrix(mapa);
        // Desabilitar campos
        Array.from(form.elements).forEach(el => el.disabled = true);
        const modal = document.getElementById('perfilModal');
        modal.style.display = 'flex';
        modal.style.opacity = '1';
        document.body.style.overflow = 'hidden';
    } catch (error) {
        console.error('Erro ao visualizar perfil:', error);
        mostrarToast('Erro ao visualizar perfil', 'error');
    }
}

// Editar perfil
async function editarPerfil(codigo) {
    try {
        const perfil = await api.get(`/perfis/${parseInt(codigo, 10)}`);
        const form = document.getElementById('perfilForm');
        document.getElementById('perfilModalTitle').innerHTML = '<i class="fas fa-edit"></i> Editar Perfil';
        form.codigo.value = perfil.codigo || '';
        form.codigo_perfil.value = (perfil.codigo || '').toString().padStart(5, '0');
        form.nome.value = perfil.nome || '';
        const mapa = mapearPermsPorSecao(perfil.permissoes || []);
        renderPermissionsMatrix(mapa);
        // Habilitar campos
        Array.from(form.elements).forEach(el => el.disabled = false);
        const modal = document.getElementById('perfilModal');
        modal.style.display = 'flex';
        modal.style.opacity = '1';
        document.body.style.overflow = 'hidden';
    } catch (error) {
        console.error('Erro ao editar perfil:', error);
        mostrarToast('Erro ao editar perfil', 'error');
    }
}

// Confirmar exclusão de perfil
function confirmarExclusaoPerfil(codigo) {
    try {
        const modal = document.getElementById('deleteModal');
        const confirmBtn = document.getElementById('confirmDeleteBtn');
        if (!modal || !confirmBtn) return;
        const newBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
        newBtn.addEventListener('click', async () => {
            await excluirPerfil(codigo);
        });
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);
        document.body.style.overflow = 'hidden';
    } catch (error) {
        console.error('Erro ao preparar exclusão do perfil:', error);
    }
}

// Excluir perfil
async function excluirPerfil(codigo) {
    try {
        await api.delete(`/perfis/${parseInt(codigo, 10)}`);
        mostrarToast('Perfil excluído com sucesso!', 'success');
        closeDeleteModal();
        await carregarPerfis();
    } catch (error) {
        console.error('Erro ao excluir perfil:', error);
        mostrarToast('Erro ao excluir perfil', 'error');
    }
}

// Carregar perfis (mesma animação/fluxo da aba de Serviços)
async function carregarPerfis() {
    try {
        // Mostrar spinner ao iniciar carregamento
        mostrarSpinner();

        const tbody = document.getElementById('profilesTableBody');
        if (!tbody) {
            console.error('Tabela de perfis não encontrada.');
            return;
        }

        const perfis = await api.get('/perfis');

        tbody.innerHTML = '';
        (perfis || []).forEach((perfil) => {
            const tr = document.createElement('tr');
            const codigo = (perfil.codigo ?? '').toString().padStart(5, '0');
            const nome = perfil.nome ?? '';
            const permissoesResumo = Array.isArray(perfil.permissoes)
                ? `${perfil.permissoes.length} seção(ões)`
                : '';
            tr.innerHTML = `
                <td>${codigo}</td>
                <td>${nome}</td>
                <td>${permissoesResumo}</td>
                <td class="actions">
                    <button class="action-btn view-btn" title="Visualizar" onclick="visualizarPerfil('${codigo}')"><i class="fas fa-eye"></i></button>
                    <button class="action-btn edit-btn" title="Editar" onclick="editarPerfil('${codigo}')"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-btn" title="Excluir" onclick="confirmarExclusaoPerfil('${codigo}')"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Erro ao carregar perfis:', error);
        if (typeof mostrarToast === 'function') {
            mostrarToast('Erro ao carregar perfis', 'error');
        }
    } finally {
        // Ocultar spinner após carregar (com sucesso ou erro)
        ocultarSpinner();
    }
}

// Carregar perfis ao iniciar a página e configurar listeners
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Mostrar spinner centralizado ao iniciar
        mostrarSpinner();
        
        // Carregar dados de perfis via API
        await carregarPerfis();
        
        // Ocultar spinner centralizado quando tudo carregar
        ocultarSpinner();
    } catch (error) {
        console.error('Erro ao inicializar página:', error);
        // Ocultar spinner mesmo em caso de erro
        ocultarSpinner();
    }
    
    setupEventListeners();
});

// Configurar event listeners
function setupEventListeners() {
    // Form de perfil
    let form = document.getElementById('perfilForm');
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            await salvarPerfil(e);
        };
    }

    // Botão de fechar modal
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            closePerfilModal();
            // closeViewModal(); // Remover se não for mais usado
            closeDeleteModal();
        });
    });

    // Busca
    const searchInput = document.querySelector('.search-box input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            filtrarPerfis(searchTerm);
        });
    }

    // Filtro de status
    // sem filtro de status nesta aba

    // Filtro de tipo
    // sem filtro de tipo nesta aba
}

// Código é gerado no backend

// Carregar usuários
async function carregarUsuarios() {
    const MAX_RETRIES = 5;
    const RETRY_DELAY_MS = 200; // 200ms
    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            // Mostrar spinner ao iniciar carregamento
            mostrarSpinner();
            const tbody = document.getElementById('userTableBody');
            if (!tbody) {
                if (i < MAX_RETRIES - 1) {
                    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
                    continue;
                } else {
                    console.error('Tabela de usuários não encontrada após múltiplas tentativas.');
                    mostrarToast('Tabela de usuários não encontrada', 'error');
                    return;
                }
            }

            const response = await api.get('/usuarios');
            tbody.innerHTML = '';
        
            if (!response || response.length === 0) {
                const tr = document.createElement('tr');
                tr.innerHTML = '<td colspan="6" class="text-center">Nenhum usuário encontrado</td>';
                tbody.appendChild(tr);
                return;
            }
        
            response.forEach(usuario => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${usuario.codigo.toString().padStart(5, '0')}</td>
                    <td>${usuario.nome}</td>
                    <td>${usuario.email}</td>
                    <td>${usuario.nivel}</td>
                    <td>
                        <span class="status ${usuario.status}">
                            ${usuario.status === 'ativo' ? 'Ativo' : 'Inativo'}
                        </span>
                    </td>
                    <td class="actions">
                        <button class="action-btn view-btn" onclick="visualizarUsuario('${usuario.codigo}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn edit-btn" onclick="editarUsuario('${usuario.codigo}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" onclick="confirmarExclusao('${usuario.codigo}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        
            usuarios = response;
            
            // Ocultar spinner após carregar com sucesso
            ocultarSpinner();
            return; // Sai do loop se o carregamento for bem-sucedido
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
            if (i < MAX_RETRIES - 1) {
                mostrarToast('Erro ao carregar usuários, re-tentando...', 'error');
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
            } else {
                mostrarToast('Erro ao carregar usuários: ' + error.message, 'error');
                // Ocultar spinner mesmo em caso de erro
                ocultarSpinner();
            }
        }
    }
}

// Filtrar usuários
function filtrarUsuarios(termo) {
    const filtrados = usuarios.filter(usuario => 
        usuario.nome.toLowerCase().includes(termo) ||
        usuario.email.toLowerCase().includes(termo) ||
        usuario.codigo.toString().includes(termo)
    );
    atualizarTabela(filtrados);
}

// Helpers para permissões/tabela
function mapearPermsPorSecao(permsArray) {
    const mapa = {};
    (permsArray || []).forEach(p => {
        const acoes = [];
        if (p.ver) acoes.push('ver');
        if (p.criar) acoes.push('criar');
        if (p.editar) acoes.push('editar');
        if (p.excluir) acoes.push('excluir');
        if (p.exportar) acoes.push('exportar');
        if (p.executar) acoes.push('executar');
        if (acoes.length) mapa[p.secao] = acoes;
    });
    return mapa;
}

// Atualizar tabela (reutilizada para filtros)
function atualizarTabela(usuarios) {
    const tbody = document.getElementById('userTableBody');
    if (!tbody) {
        console.error('TBody da tabela de usuários não encontrado para atualização.');
        return;
    }
    tbody.innerHTML = '';

    if (usuarios.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="6" class="text-center">Nenhum usuário encontrado</td>';
        tbody.appendChild(tr);
        return;
    }

    usuarios.forEach(usuario => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${usuario.codigo.toString().padStart(5, '0')}</td>
            <td>${usuario.nome}</td>
            <td>${usuario.email}</td>
            <td>${usuario.nivel}</td>
            <td>
                <span class="status ${usuario.status}">
                    ${usuario.status === 'ativo' ? 'Ativo' : 'Inativo'}
                </span>
            </td>
            <td class="actions">
                <button class="action-btn view-btn" onclick="visualizarUsuario('${usuario.codigo}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn edit-btn" onclick="editarUsuario('${usuario.codigo}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" onclick="confirmarExclusao('${usuario.codigo}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Salvar perfil (criar/atualizar) contra a API
async function salvarPerfil(e) {
    const form = e.target;
    const data = new FormData(form);
    const nome = data.get('nome');
    const permissoesMapa = form._permissoesAtual || {};
    // Converter mapa em array de linhas
    const permissoes = Object.entries(permissoesMapa).map(([secao, acoes]) => ({
        secao,
        ver: acoes.includes('ver'),
        criar: acoes.includes('criar'),
        editar: acoes.includes('editar'),
        excluir: acoes.includes('excluir'),
        exportar: acoes.includes('exportar'),
        executar: acoes.includes('executar'),
    }));
    try {
        if (form.codigo.value) {
            await api.put(`/perfis/${form.codigo.value}`, { nome, permissoes });
            mostrarToast('Perfil atualizado com sucesso!', 'success');
        } else {
            await api.post('/perfis', { nome, permissoes });
            mostrarToast('Perfil criado com sucesso!', 'success');
        }
        closePerfilModal();
        await carregarPerfis();
    } catch (error) {
        console.error('Erro ao salvar perfil:', error);
        mostrarToast('Erro ao salvar perfil', 'error');
    }
}

// Visualizar usuário
async function visualizarUsuario(codigo) {
    try {
        const usuario = await api.get(`/usuarios/${codigo}`);

        const modal = document.getElementById('userModal'); // ID correto
        const modalTitle = modal.querySelector('#modalTitle');
        const form = document.getElementById('usuarioForm'); // ID correto

        // Configurar o título e ícone do modal
        modalTitle.innerHTML = '<i class="fas fa-eye"></i> Visualizar Usuário';

        // Preencher o formulário com os dados do usuário
        form.codigo.value = usuario.codigo;
        form.nome.value = usuario.nome;
        form.email.value = usuario.email;
        form.tipo.value = usuario.nivel;
        form.status.value = usuario.status;

        // Desabilitar todos os campos
        Array.from(form.elements).forEach(element => {
            element.disabled = true;
        });

        // Esconder campos de senha
        form.senha.parentElement.style.display = 'none';
        form.confirmar_senha.parentElement.style.display = 'none';

        // Esconder botões de ação do formulário
        const formActions = form.querySelector('.form-actions');
        if (formActions) {
            formActions.style.display = 'none';
        }

        // Mostrar o modal imediatamente
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Configurar o evento de submit do formulário para fechar o modal
        form.onsubmit = (e) => {
            e.preventDefault();
            closeModal();
        };

    } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        mostrarToast('Erro ao carregar dados do usuário: ' + error.message, 'error');
    }
}

// Editar usuário (função que abre o modal de edição)
async function editarUsuario(codigo) {
    try {
        const usuario = await api.get(`/usuarios/${codigo}`);

        const modal = document.getElementById('userModal'); // ID correto
        const modalTitle = modal.querySelector('#modalTitle');
        let form = document.getElementById('usuarioForm'); // ID correto

        modalTitle.textContent = 'Editar Usuário';
        
        // Preencher o formulário com os dados do usuário
        form.codigo.value = usuario.codigo;
        form.nome.value = usuario.nome;
        form.email.value = usuario.email;
        form.tipo.value = usuario.nivel;
        form.status.value = usuario.status;

        // Reativar e mostrar campos de senha para edição, mas torná-los opcionais
        form.senha.value = ''; // Limpar para que o usuário insira nova senha se quiser
        form.confirmar_senha.value = '';
        form.senha.removeAttribute('required');
        form.confirmar_senha.removeAttribute('required');
        form.senha.parentElement.style.display = 'block';
        form.confirmar_senha.parentElement.style.display = 'block';

        // Re-habilitar todos os campos
        Array.from(form.elements).forEach(element => {
            element.disabled = false;
        });

        // Substituir handler anterior
        form.onsubmit = null;

        // Mostrar o modal imediatamente
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // O evento de submit será tratado por editarUsuarioSubmit
        form.onsubmit = (e) => { // Sobrescreve o onsubmit padrão para chamar a função de edição
            editarUsuarioSubmit(e); // Chama a nova função para o submit
        };

    } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        mostrarToast('Erro ao carregar dados do usuário: ' + error.message, 'error');
    }
}

// Nova função para lidar com o submit do formulário de edição
async function editarUsuarioSubmit(event) {
            event.preventDefault();
    const form = event.target;
            const formData = new FormData(form);
            
    const usuarioAtualizado = {
                codigo: form.codigo.value,
                nome: formData.get('nome'),
                email: formData.get('email'),
                nivel: formData.get('tipo'),
                status: formData.get('status')
            };

            const senha = formData.get('senha');
    const confirmarSenha = formData.get('confirmar_senha');
            
            if (senha || confirmarSenha) {
                if (senha !== confirmarSenha) {
            mostrarToast('As senhas não coincidem', 'error');
            return;
                }
        usuarioAtualizado.senha = senha;
            }

            try {
        const response = await api.put(`/usuarios/${usuarioAtualizado.codigo}`, usuarioAtualizado);

        if (response) {
                mostrarToast('Usuário atualizado com sucesso!', 'success');
                carregarUsuarios();
            form.reset();
            closeModal();
        } else {
            throw new Error('Resposta inválida do servidor');
        }
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        if (error.status === 404) {
            mostrarToast('Usuário não encontrado.', 'error');
        } else if (error.data?.details?.includes('multiple (or no) rows returned')) {
            mostrarToast('Erro ao processar a requisição. Por favor, tente novamente.', 'error');
        } else {
            mostrarToast('Erro ao atualizar usuário: ' + (error.data?.message || error.message), 'error');
        }
    }
}

// Função para confirmar exclusão
function confirmarExclusao(codigo) {
    try {
        const modal = document.getElementById('deleteModal');
        if (!modal) {
            throw new Error('Modal de confirmação não encontrado');
        }

        const confirmBtn = document.getElementById('confirmDeleteBtn');
        if (!confirmBtn) {
            throw new Error('Botão de confirmação não encontrado');
        }

        // Remover event listener anterior se existir
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        // Adicionar novo event listener
        newConfirmBtn.addEventListener('click', () => {
            excluirUsuario(codigo);
        });
        
        // Mostrar o modal
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);
        document.body.style.overflow = 'hidden';

    } catch (error) {
        console.error('Erro ao preparar exclusão:', error);
        mostrarToast('Erro ao preparar exclusão: ' + error.message, 'error');
    }
}

// Função para excluir usuário
async function excluirUsuario(codigo) {
    try {
        await api.delete(`/usuarios/${codigo}`);
        mostrarToast('Usuário excluído com sucesso!', 'success');
        closeDeleteModal();
        await carregarUsuarios();
    } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        mostrarToast('Erro ao excluir usuário: ' + error.message, 'error');
    }
}

// Mostrar toast
function mostrarToast(mensagem, tipo) {
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.innerHTML = `
        <i class="fas ${tipo === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${mensagem}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    
    document.querySelector('.toast-container').appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Adicionar funções ao escopo global (Perfil)
window.openPerfilModal = openPerfilModal;
window.closePerfilModal = closePerfilModal;
window.mostrarToast = mostrarToast;

function fecharModal() {
    const modal = document.getElementById('modalUsuario');
    if (modal) {
        // Adicionar animação de saída
        const modalContent = modal.querySelector('.modal-content');
            modalContent.style.transform = 'translateY(-20px)';
            modalContent.style.opacity = '0';

        // Remover o modal após a animação
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }, 300);
    }
} 