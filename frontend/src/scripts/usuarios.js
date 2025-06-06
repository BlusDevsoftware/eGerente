import api from './config/api.js';

// Funções de Modal
export function openModal() {
    const modal = document.getElementById('usuarioModal');
    modal.style.display = 'flex';
}

export function closeModal() {
    const modal = document.getElementById('usuarioModal');
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

// Função para carregar usuários
async function carregarUsuarios() {
    try {
        const usuarios = await api.get('/usuarios');
        const tbody = document.querySelector('#usuariosTable tbody');
        tbody.innerHTML = '';

        usuarios.forEach(usuario => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${usuario.codigo}</td>
                <td>${usuario.nome}</td>
                <td>${usuario.email}</td>
                <td>${usuario.perfil}</td>
                <td><span class="status ${usuario.status}">${usuario.status}</span></td>
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
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        mostrarToast('Erro ao carregar usuários', 'error');
    }
}

// Função para criar usuário
async function criarUsuario(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const dados = Object.fromEntries(formData.entries());

    try {
        await api.post('/usuarios', dados);
        mostrarToast('Usuário criado com sucesso!', 'success');
        closeModal();
        form.reset();
        carregarUsuarios();
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        mostrarToast('Erro ao criar usuário', 'error');
    }
}

// Função para visualizar usuário
export async function visualizarUsuario(codigo) {
    try {
        const usuario = await api.get(`/usuarios/${codigo}`);
        const modal = document.getElementById('viewModal');
        const content = document.querySelector('.view-details');
        
        content.innerHTML = `
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
                <strong>Perfil:</strong>
                <span>${usuario.perfil}</span>
            </div>
            <div class="detail-row">
                <strong>Status:</strong>
                <span class="status ${usuario.status}">${usuario.status}</span>
            </div>
        `;
        
        modal.style.display = 'flex';
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        mostrarToast('Erro ao buscar usuário', 'error');
    }
}

// Função para editar usuário
export async function editarUsuario(codigo) {
    try {
        const usuario = await api.get(`/usuarios/${codigo}`);
        const form = document.getElementById('usuarioForm');
        
        // Preencher o formulário com os dados do usuário
        form.codigo.value = usuario.codigo;
        form.nome.value = usuario.nome;
        form.email.value = usuario.email;
        form.perfil.value = usuario.perfil;
        form.status.value = usuario.status;
        
        // Alterar o comportamento do formulário para atualização
        form.onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const dados = Object.fromEntries(formData.entries());
            
            try {
                await api.put(`/usuarios/${codigo}`, dados);
                mostrarToast('Usuário atualizado com sucesso!', 'success');
                closeModal();
                form.reset();
                carregarUsuarios();
            } catch (error) {
                console.error('Erro ao atualizar usuário:', error);
                mostrarToast('Erro ao atualizar usuário', 'error');
            }
        };
        
        openModal();
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        mostrarToast('Erro ao buscar usuário', 'error');
    }
}

// Função para excluir usuário
export async function excluirUsuario(codigo) {
    try {
        await api.delete(`/usuarios/${codigo}`);
        mostrarToast('Usuário excluído com sucesso!', 'success');
        closeDeleteModal();
        carregarUsuarios();
    } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        mostrarToast('Erro ao excluir usuário', 'error');
    }
}

// Função para mostrar toast
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

// Carregar usuários quando a página carregar
document.addEventListener('DOMContentLoaded', carregarUsuarios);

// Função para confirmar exclusão
export function confirmarExclusao(codigo) {
    const modal = document.getElementById('deleteModal');
    modal.style.display = 'flex';
    document.getElementById('confirmDeleteBtn').onclick = () => excluirUsuario(codigo);
} 