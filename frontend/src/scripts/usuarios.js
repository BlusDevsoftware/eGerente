import api from './config/api.js';

// Funções de Modal
export function openModal() {
    const modal = document.getElementById('userModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('usuarioForm');
    
    // Resetar o formulário
    form.reset();
    form.codigo.value = '';
    modalTitle.textContent = 'Novo Usuário';
    
    // Configurar o evento de submit para criação
    form.onsubmit = criarUsuario;
    
    modal.style.display = 'flex';
}

export function closeModal() {
    const modal = document.getElementById('userModal');
    modal.style.display = 'none';
}

export function closeViewModal() {
    const modal = document.getElementById('viewModal');
    modal.style.display = 'none';
}

export function closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    modal.style.display = 'none';
}

// Funções de manipulação de usuários
let usuarios = [];
let usuarioAtual = null;

// Carregar usuários ao iniciar a página
document.addEventListener('DOMContentLoaded', () => {
    carregarUsuarios();
    setupEventListeners();
});

// Configurar event listeners
function setupEventListeners() {
    // Form de usuário
    const form = document.getElementById('usuarioForm');
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
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        filtrarUsuarios(searchTerm);
    });

    // Filtro de status
    const statusFilter = document.querySelector('.filter-options select');
    statusFilter.addEventListener('change', (e) => {
        const status = e.target.value;
        filtrarPorStatus(status);
    });
}

// Gerar código do usuário
function gerarCodigoUsuario() {
    const ultimoUsuario = usuarios.length > 0 ? usuarios[usuarios.length - 1] : null;
    let proximoNumero = 1;
    
    if (ultimoUsuario && ultimoUsuario.codigo_usuario) {
        const ultimoNumero = parseInt(ultimoUsuario.codigo_usuario);
        proximoNumero = ultimoNumero + 1;
    }
    
    return proximoNumero.toString().padStart(5, '0');
}

// Carregar usuários
async function carregarUsuarios() {
    try {
        const response = await api.get('/usuarios');
        usuarios = response.data;
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
            <td>${usuario.codigo_usuario}</td>
            <td>${usuario.nome}</td>
            <td>${usuario.email}</td>
            <td>${usuario.perfil}</td>
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
        usuario.codigo_usuario.includes(termo)
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
        if (data.senha !== data.confirmar_senha) {
            mostrarToast('As senhas não coincidem', 'error');
            return;
        }

        // Gerar código do usuário
        data.codigo_usuario = gerarCodigoUsuario();

        const response = await api.post('/usuarios', data);
        mostrarToast('Usuário criado com sucesso', 'success');
        closeModal();
        carregarUsuarios();
    } catch (error) {
        mostrarToast('Erro ao criar usuário', 'error');
    }
}

// Visualizar usuário
async function visualizarUsuario(codigo) {
    try {
        const response = await api.get(`/usuarios/${codigo}`);
        const usuario = response.data;
        
        const viewDetails = document.querySelector('.view-details');
        viewDetails.innerHTML = `
            <div class="detail-row">
                <strong>Código:</strong>
                <span>${usuario.codigo_usuario}</span>
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
                <strong>Perfil:</strong>
                <span>${usuario.perfil}</span>
            </div>
            <div class="detail-row">
                <strong>Status:</strong>
                <span class="status ${usuario.status}">
                    ${usuario.status === 'ativo' ? 'Ativo' : 'Inativo'}
                </span>
            </div>
        `;

        document.getElementById('viewModal').style.display = 'flex';
    } catch (error) {
        mostrarToast('Erro ao carregar dados do usuário', 'error');
    }
}

// Editar usuário
async function editarUsuario(codigo) {
    try {
        const response = await api.get(`/usuarios/${codigo}`);
        const usuario = response.data;
        
        const form = document.getElementById('usuarioForm');
        form.codigo.value = usuario.codigo;
        form.codigo_usuario.value = usuario.codigo_usuario;
        form.nome.value = usuario.nome;
        form.email.value = usuario.email;
        form.perfil.value = usuario.perfil;
        form.status.value = usuario.status;
        
        // Remover required dos campos de senha
        form.senha.removeAttribute('required');
        form.confirmar_senha.removeAttribute('required');
        
        const modalTitle = document.getElementById('modalTitle');
        modalTitle.innerHTML = '<i class="fas fa-edit"></i> Editar Usuário';
        
        openModal();
    } catch (error) {
        mostrarToast('Erro ao carregar dados do usuário', 'error');
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
        await api.delete(`/usuarios/${codigo}`);
        mostrarToast('Usuário excluído com sucesso', 'success');
        closeDeleteModal();
        carregarUsuarios();
    } catch (error) {
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

// Carregar usuários quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    carregarUsuarios();
    
    // Configurar botão de novo usuário
    document.getElementById('addUserBtn').addEventListener('click', openModal);
}); 