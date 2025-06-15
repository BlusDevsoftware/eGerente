// Funções de Modal
function openModal() {
    const modal = document.getElementById('userModal');
    if (!modal) {
        console.error('Modal não encontrado');
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
    }
    
    // Mostrar o modal
    modal.style.display = 'flex';
    modal.style.opacity = '0';
    requestAnimationFrame(() => {
        modal.style.opacity = '1';
        modal.classList.add('show');
    });
}

function closeModal() {
    const modal = document.getElementById('userModal');
    if (modal) {
        modal.style.opacity = '0';
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
}

function closeViewModal() {
    const modal = document.getElementById('viewModal');
    if (modal) modal.style.display = 'none';
}

function closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    if (modal) modal.style.display = 'none';
}

// Funções de manipulação de usuários
let usuarios = [];
let usuarioAtual = null;

// Carregar usuários ao iniciar a página e configurar listeners
// (Apenas um DOMContentLoaded)
document.addEventListener('DOMContentLoaded', () => {
    carregarUsuarios();
    setupEventListeners();
});

// Configurar event listeners
function setupEventListeners() {
    // Form de usuário
    const form = document.getElementById('usuarioForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            if (data.codigo) {
                editarUsuario(data);
            } else {
                criarUsuario(data);
            }
        });
    }

    // Botão de fechar modal
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            closeModal();
            closeViewModal();
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
}

// Gerar código do usuário
function gerarCodigoUsuario() {
    const ultimoUsuario = usuarios.length > 0 ? usuarios[usuarios.length - 1] : null;
    let proximoNumero = 1;
    
    if (ultimoUsuario && ultimoUsuario.codigo) {
        // Converter para número, remover zeros à esquerda e incrementar
        const ultimoNumero = parseInt(ultimoUsuario.codigo.toString().replace(/^0+/, ''));
        proximoNumero = ultimoNumero + 1;
    }
    
    // Garantir que o número tenha 5 dígitos com zeros à esquerda
    return proximoNumero.toString().padStart(5, '0');
}

// Carregar usuários
async function carregarUsuarios() {
    try {
        const response = await api.get('/usuarios');
        usuarios = response;
        atualizarTabela(usuarios);
    } catch (error) {
        mostrarToast('Erro ao carregar usuários', 'error');
    }
}

// Atualizar tabela
function atualizarTabela(usuarios) {
    const tbody = document.getElementById('userTableBody');
    tbody.innerHTML = '';

    usuarios.forEach(usuario => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${usuario.codigo.toString().padStart(5, '0')}</td>
            <td>${usuario.nome}</td>
            <td>${usuario.email}</td>
            <td>${usuario.tipo}</td>
            <td>
                <span class="status ${usuario.status}">
                    ${usuario.status === 'ativo' ? 'Ativo' : 'Inativo'}
                </span>
            </td>
            <td class="actions">
                <button class="action-btn view-btn" onclick="visualizarUsuario(${usuario.codigo})">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn edit-btn" onclick="editarUsuario(${usuario.codigo})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" onclick="confirmarExclusao(${usuario.codigo})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
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

// Criar usuário
async function criarUsuario(data) {
    try {
        // Validar senhas
        if (data.senha !== data.confirmar_senha) {
            mostrarToast('As senhas não coincidem', 'error');
            return;
        }

        // Gerar código do usuário
        const codigo = gerarCodigoUsuario();

        // Preparar dados para envio
        const usuarioData = {
            nome: data.nome,
            email: data.email,
            senha: data.senha,
            tipo: data.tipo || 'user',
            status: data.status || 'ativo',
            codigo: codigo.toString()
        };

        await api.post('/usuarios', usuarioData);
        
        mostrarToast('Usuário criado com sucesso', 'success');
        closeModal();
        carregarUsuarios();
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        if (error.data?.details?.includes('usuarios_email_key')) {
            mostrarToast('Este email já está cadastrado para outro usuário.', 'error');
        } else if (error.status === 500) {
            console.error('Erro interno do servidor:', error.status);
            mostrarToast('Erro ao criar usuário. Por favor, tente novamente.', 'error');
        } else {
            mostrarToast('Erro ao processar a requisição. Por favor, tente novamente.', 'error');
        }
    }
}

// Visualizar usuário
async function visualizarUsuario(codigo) {
    try {
        const response = await fetch(`${API_URL}/usuarios/${codigo}`);
        if (!response.ok) {
            throw new Error('Erro ao carregar dados do usuário');
        }
        const usuario = await response.json();

        // Criar o conteúdo do modal
        const modalContent = `
            <div class="modal-header">
                <h2><i class="fas fa-user"></i> Detalhes do Usuário</h2>
                <button class="close-modal" onclick="fecharModal()">&times;</button>
            </div>
            <div class="view-details">
                <div class="detail-row">
                    <strong>Código:</strong>
                    <span>${usuario.codigo}</span>
                </div>
                <div class="detail-row">
                    <strong>Nome:</strong>
                    <span>${usuario.nome}</span>
                </div>
                <div class="detail-row">
                    <strong>Email:</strong>
                    <span>${usuario.email}</span>
                </div>
                <div class="detail-row">
                    <strong>Tipo:</strong>
                    <span>${usuario.tipo === 'admin' ? 'Administrador' : 'Usuário'}</span>
                </div>
                <div class="detail-row">
                    <strong>Status:</strong>
                    <span class="status ${usuario.status === 'ativo' ? 'ativo' : 'inativo'}">
                        ${usuario.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </span>
                </div>
            </div>
        `;

        // Atualizar o conteúdo do modal
        const modal = document.getElementById('modal');
        modal.querySelector('.modal-content').innerHTML = modalContent;

        // Mostrar o modal com animação
        modal.classList.add('show');
    } catch (error) {
        console.error('Erro ao visualizar usuário:', error);
        mostrarToast('Erro ao carregar dados do usuário: ' + error.message, 'error');
    }
}

// Editar usuário
async function editarUsuario(codigo) {
    try {
        const response = await api.get(`/usuarios/${codigo}`);
        const usuario = response;
        
        const modal = document.getElementById('usuarioModal');
        const modalTitle = modal.querySelector('#modalTitle');
        let form = document.getElementById('usuarioForm');

        modalTitle.innerHTML = '<i class="fas fa-edit"></i> Editar Usuário';
        
        // Preencher o formulário com os dados do usuário
        form.codigo.value = usuario.codigo;
        form.nome.value = usuario.nome;
        form.email.value = usuario.email;
        form.tipo.value = usuario.tipo;
        form.status.value = usuario.status;
        
        // Remover required dos campos de senha
        form.senha.removeAttribute('required');
        form.confirmar_senha.removeAttribute('required');

        // Remover qualquer evento de submit anterior
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        form = newForm;

        // Mostrar o modal com animação
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);
        document.body.style.overflow = 'hidden';

        // Configurar o evento de submit do formulário
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const formData = new FormData(form);
            
            const usuarioData = {
                codigo: form.codigo.value,
                nome: formData.get('nome'),
                email: formData.get('email'),
                tipo: formData.get('tipo'),
                status: formData.get('status')
            };

            // Adicionar senha apenas se foi preenchida
            if (formData.get('senha')) {
                if (formData.get('senha') !== formData.get('confirmar_senha')) {
                    mostrarToast('As senhas não coincidem', 'error');
                    return;
                }
                usuarioData.senha = formData.get('senha');
            }

            try {
                const response = await api.put(`/usuarios/${form.codigo.value}`, usuarioData);
                
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
                } else if (error.data?.details?.includes('usuarios_email_key')) {
                    mostrarToast('Este email já está cadastrado para outro usuário.', 'error');
                } else {
                    mostrarToast('Erro ao atualizar usuário: ' + (error.data?.message || error.message), 'error');
                }
            }
        });
    } catch (error) {
        mostrarToast('Erro ao carregar dados do usuário: ' + error.message, 'error');
    }
}

// Confirmar exclusão
function confirmarExclusao(codigo) {
    usuarioAtual = codigo;
    document.getElementById('deleteModal').style.display = 'flex';
    
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    confirmBtn.onclick = () => excluirUsuario(codigo);
}

// Excluir usuário
async function excluirUsuario(codigo) {
    try {
        // Garantir que o código seja uma string com 5 dígitos
        const codigoStr = codigo.toString().padStart(5, '0');
        
        const response = await api.delete(`/usuarios/${codigoStr}`);
        
        if (response && response.message) {
            mostrarToast('Usuário excluído com sucesso!', 'success');
            closeDeleteModal();
            carregarUsuarios();
        } else {
            throw new Error('Resposta inválida do servidor');
        }
    } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        mostrarToast('Erro ao excluir usuário', 'error');
    }
}

// Mostrar toast
function mostrarToast(mensagem, tipo = 'info') {
    const toastContainer = document.querySelector('.toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    
    const icon = tipo === 'success' ? 'check-circle' :
                tipo === 'error' ? 'exclamation-circle' : 'info-circle';
    
    toast.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${mensagem}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;
    
    toastContainer.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
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
window.confirmarExclusao = confirmarExclusao;
window.excluirUsuario = excluirUsuario;
window.mostrarToast = mostrarToast;

function fecharModal() {
    const modal = document.getElementById('modal');
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
} 