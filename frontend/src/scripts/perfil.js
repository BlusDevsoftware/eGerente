// Funções de Modal
function openModal() {
    const modal = document.getElementById('userModal');
    if (!modal) {
        console.error('Modal de usuário não encontrado');
        mostrarToast('Modal de usuário não encontrado!', 'error');
        return;
    }
    
    // Resetar o formulário
    const form = document.getElementById('usuarioForm');
    if (form) {
        form.reset();
        form.codigo.value = '';
        document.getElementById('modalTitle').innerHTML = '<i class="fas fa-user-plus"></i> Novo Usuário';
        
        // Garantir que os campos de senha sejam obrigatórios para novo usuário
        form.senha.setAttribute('required', 'required');
        form.confirmar_senha.setAttribute('required', 'required');

        // Re-habilitar todos os campos, caso venha de visualização
        Array.from(form.elements).forEach(element => {
            element.disabled = false;
        });
    }
    
    // Mostrar o modal imediatamente, sem animação
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('userModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        const form = document.getElementById('usuarioForm');
        if (form) {
            form.reset();
            // Re-habilitar todos os campos
            Array.from(form.elements).forEach(element => {
                element.disabled = false;
            });
            // Mostrar campos de senha
            form.senha.parentElement.style.display = 'block';
            form.confirmar_senha.parentElement.style.display = 'block';
            // Mostrar botões de ação
            const formActions = form.querySelector('.form-actions');
            if (formActions) {
                formActions.style.display = 'flex';
            }
        }
    }
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

// Funções de manipulação de usuários
let usuarios = [];
let usuarioAtual = null;

// Funções para controlar o spinner centralizado - IDÊNTICAS AO DA ABA DE COLABORADORES
function mostrarSpinner() {
    document.getElementById('loader-usuarios').style.display = 'flex';
}

function ocultarSpinner() {
    document.getElementById('loader-usuarios').style.display = 'none';
}

// Carregar usuários ao iniciar a página e configurar listeners
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Mostrar spinner centralizado ao iniciar
        mostrarSpinner();
        
        // Carregar dados
        await carregarUsuarios();
        
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
    // Form de usuário
    let form = document.getElementById('usuarioForm');
    if (form) {
        // Substituir handler para evitar duplicação
        form.onsubmit = (e) => {
            e.preventDefault();
            if (form.codigo.value) {
                editarUsuarioSubmit(e);
            } else {
                criarUsuario(e);
            }
        };
    }

    // Botão de fechar modal
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            closeModal();
            // closeViewModal(); // Remover se não for mais usado
            closeDeleteModal();
        });
    });

    // Busca
    const searchInput = document.querySelector('.search-box input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            filtrarUsuarios(searchTerm);
        });
    }

    // Filtro de status
    const statusFilter = document.querySelector('.filter-options select');
    if (statusFilter) {
        statusFilter.addEventListener('change', (e) => {
            const status = e.target.value;
            filtrarPorStatus(status);
        });
    }

    // Filtro de tipo
    const tipoFilter = document.getElementById('tipoFilter');
    if (tipoFilter) {
        tipoFilter.addEventListener('change', (e) => {
            const tipo = e.target.value;
            filtrarPorTipo(tipo);
        });
    }
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

// Filtrar por status
function filtrarPorStatus(status) {
    if (!status) {
        atualizarTabela(usuarios);
        return;
    }
    const filtrados = usuarios.filter(usuario => usuario.status === status);
    atualizarTabela(filtrados);
}

// Filtrar por tipo
function filtrarPorTipo(tipo) {
    if (!tipo) {
        atualizarTabela(usuarios);
        return;
    }
    const filtrados = usuarios.filter(usuario => usuario.nivel === tipo);
    atualizarTabela(filtrados);
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

// Criar usuário
async function criarUsuario(event) {
    event.preventDefault();
    const formData = new FormData(event.target);

        // Validar senhas
    if (formData.get('senha') !== formData.get('confirmar_senha')) {
            mostrarToast('As senhas não coincidem', 'error');
            return;
        }

    const usuario = {
        nome: formData.get('nome'),
        email: formData.get('email'),
        senha: formData.get('senha'),
        nivel: formData.get('tipo'),
        status: formData.get('status')
    };

    try {
        await api.post('/usuarios', usuario); // Corrigido o endpoint
        mostrarToast('Usuário criado com sucesso!', 'success');
        carregarUsuarios();
        event.target.reset();
        closeModal();
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        if (error.data?.details?.includes('usuarios_email_key')) {
            mostrarToast('Este email já está cadastrado para outro usuário.', 'error');
        } else if (error.status === 500) {
            mostrarToast('Erro ao criar usuário. Por favor, tente novamente.', 'error');
        } else {
            mostrarToast('Erro ao processar a requisição. Por favor, tente novamente.', 'error');
        }
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

// Adicionar funções ao escopo global
window.openModal = openModal;
window.closeModal = closeModal;
window.closeViewModal = closeViewModal;
window.closeDeleteModal = closeDeleteModal;
window.carregarUsuarios = carregarUsuarios;
window.criarUsuario = criarUsuario;
window.visualizarUsuario = visualizarUsuario;
window.editarUsuario = editarUsuario;
window.editarUsuarioSubmit = editarUsuarioSubmit; // Exportar nova função
window.confirmarExclusao = confirmarExclusao;
window.excluirUsuario = excluirUsuario;
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