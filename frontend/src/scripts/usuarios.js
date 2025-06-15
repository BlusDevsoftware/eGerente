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
        // Garante que o código seja uma string de 5 dígitos
        const codigoStr = codigo.toString().padStart(5, '0');
        
        const response = await fetch(`${API_URL}/usuarios/${codigoStr}`);
        if (!response.ok) {
            throw new Error('Erro ao carregar dados do usuário');
        }
        
        const usuario = await response.json();
        
        // Configura o modal e o formulário
        const modal = document.getElementById('userModal');
        if (!modal) {
            throw new Error('Modal não encontrado');
        }

        const form = document.getElementById('userForm');
        if (!form) {
            throw new Error('Formulário não encontrado');
        }

        const modalTitle = modal.querySelector('.modal-title');
        if (!modalTitle) {
            throw new Error('Título do modal não encontrado');
        }
        
        // Limpa o formulário e configura os campos
        form.reset();
        
        // Preenche os campos com os dados do usuário
        const codigoInput = form.querySelector('#codigo');
        const nomeInput = form.querySelector('#nome');
        const emailInput = form.querySelector('#email');
        const tipoInput = form.querySelector('#tipo');
        
        if (codigoInput) codigoInput.value = usuario.codigo;
        if (nomeInput) nomeInput.value = usuario.nome;
        if (emailInput) emailInput.value = usuario.email;
        if (tipoInput) tipoInput.value = usuario.tipo;
        
        // Remove os campos de senha do modal de visualização
        const senhaFields = form.querySelectorAll('.senha-fields');
        senhaFields.forEach(field => field.style.display = 'none');
        
        // Remove os botões do modal de visualização
        const modalFooter = modal.querySelector('.modal-footer');
        if (modalFooter) {
            modalFooter.style.display = 'none';
        }
        
        // Desabilita todos os campos
        form.querySelectorAll('input, select').forEach(field => {
            field.disabled = true;
        });
        
        // Atualiza o título do modal
        modalTitle.innerHTML = '<i class="fas fa-eye me-2"></i>Visualizar Usuário';
        
        // Exibe o modal com animação
        modal.style.display = 'block';
        modal.classList.add('show');
        document.body.classList.add('modal-open');
        
        // Adiciona animação suave
        const modalDialog = modal.querySelector('.modal-dialog');
        if (modalDialog) {
            modalDialog.style.transform = 'translate(0, 0)';
            modalDialog.style.opacity = '1';
        }
        
    } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        mostrarToast('Erro ao carregar dados do usuário: ' + error.message, 'error');
    }
}

// Editar usuário
async function editarUsuario(codigo) {
    try {
        // Garante que o código seja uma string de 5 dígitos
        const codigoStr = codigo.toString().padStart(5, '0');
        
        const response = await fetch(`${API_URL}/usuarios/${codigoStr}`);
        if (!response.ok) {
            throw new Error('Erro ao carregar dados do usuário');
        }
        
        const usuario = await response.json();
        
        // Configura o modal e o formulário
        const modal = document.getElementById('userModal');
        if (!modal) {
            throw new Error('Modal não encontrado');
        }

        const form = document.getElementById('userForm');
        if (!form) {
            throw new Error('Formulário não encontrado');
        }

        const modalTitle = modal.querySelector('.modal-title');
        if (!modalTitle) {
            throw new Error('Título do modal não encontrado');
        }

        const modalFooter = modal.querySelector('.modal-footer');
        if (!modalFooter) {
            throw new Error('Rodapé do modal não encontrado');
        }
        
        // Limpa o formulário e configura os campos
        form.reset();
        
        // Preenche os campos com os dados do usuário
        const codigoInput = form.querySelector('#codigo');
        const nomeInput = form.querySelector('#nome');
        const emailInput = form.querySelector('#email');
        const tipoInput = form.querySelector('#tipo');
        const senhaInput = form.querySelector('#senha');
        const confirmarSenhaInput = form.querySelector('#confirmarSenha');
        
        if (codigoInput) codigoInput.value = usuario.codigo;
        if (nomeInput) nomeInput.value = usuario.nome;
        if (emailInput) emailInput.value = usuario.email;
        if (tipoInput) tipoInput.value = usuario.tipo;
        
        // Mostra os campos de senha no modal de edição
        const senhaFields = form.querySelectorAll('.senha-fields');
        senhaFields.forEach(field => field.style.display = 'block');
        
        // Mostra os botões no modal de edição
        modalFooter.style.display = 'flex';
        
        // Habilita todos os campos exceto o código
        form.querySelectorAll('input, select').forEach(field => {
            field.disabled = field.id === 'codigo';
        });
        
        // Remove a obrigatoriedade dos campos de senha
        if (senhaInput) senhaInput.required = false;
        if (confirmarSenhaInput) confirmarSenhaInput.required = false;
        
        // Atualiza o título do modal
        modalTitle.innerHTML = '<i class="fas fa-edit me-2"></i>Editar Usuário';
        
        // Exibe o modal com animação
        modal.style.display = 'block';
        modal.classList.add('show');
        document.body.classList.add('modal-open');
        
        // Adiciona animação suave
        const modalDialog = modal.querySelector('.modal-dialog');
        if (modalDialog) {
            modalDialog.style.transform = 'translate(0, 0)';
            modalDialog.style.opacity = '1';
        }
        
    } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        mostrarToast('Erro ao carregar dados do usuário: ' + error.message, 'error');
    }
}

async function salvarEdicaoUsuario() {
    try {
        const form = document.getElementById('formUsuario');
        const codigo = form.querySelector('#codigo').value;
        const nome = form.querySelector('#nome').value;
        const email = form.querySelector('#email').value;
        const senha = form.querySelector('#senha').value;
        const confirmarSenha = form.querySelector('#confirmarSenha').value;
        const tipo = form.querySelector('#tipo').value;
        const status = form.querySelector('#status').value;

        // Validar senha se fornecida
        if (senha && senha !== confirmarSenha) {
            mostrarToast('As senhas não coincidem', 'error');
            return;
        }

        const usuarioData = {
            nome,
            email,
            tipo,
            status
        };

        // Adicionar senha apenas se fornecida
        if (senha) {
            usuarioData.senha = senha;
        }

        const response = await fetch(`${API_URL}/usuarios/${codigo}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(usuarioData)
        });

        if (!response.ok) {
            throw new Error('Erro ao atualizar usuário');
        }

        mostrarToast('Usuário atualizado com sucesso!', 'success');
        fecharModal();
        carregarUsuarios();
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        mostrarToast('Erro ao atualizar usuário: ' + error.message, 'error');
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
    const modal = document.getElementById('userModal');
    if (modal) {
        modal.style.opacity = '0';
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
            // Reabilitar todos os campos ao fechar o modal
            const form = document.getElementById('usuarioForm');
            if (form) {
                Array.from(form.elements).forEach(element => {
                    element.disabled = false;
                });
            }
        }, 300);
    }
} 