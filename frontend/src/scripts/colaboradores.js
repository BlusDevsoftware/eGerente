// Função para carregar colaboradores
async function carregarColaboradores() {
    try {
        const colaboradores = await api.get('/colaboradores');
        const tbody = document.querySelector('.table-container table tbody');
        tbody.innerHTML = '';

        colaboradores.forEach(colaborador => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${colaborador.codigo}</td>
                <td>${colaborador.nome}</td>
                <td>${colaborador.email}</td>
                <td>${colaborador.telefone}</td>
                <td>${colaborador.cargo}</td>
                <td>${colaborador.data_admissao}</td>
                <td><span class="status ${colaborador.status.toLowerCase()}">${colaborador.status}</span></td>
                <td class="actions">
                    <button class="action-btn view-btn" onclick="visualizarColaborador(${colaborador.codigo})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit-btn" onclick="editarColaborador(${colaborador.codigo})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="confirmarExclusao(${colaborador.codigo})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Erro ao carregar colaboradores:', error);
        mostrarToast('Erro ao carregar colaboradores', 'error');
    }
}

// Função para criar colaborador
async function criarColaborador(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const dados = Object.fromEntries(formData.entries());

    try {
        await api.post('/colaboradores', dados);
        mostrarToast('Colaborador criado com sucesso!', 'success');
        closeModal('colaborador');
        form.reset();
        carregarColaboradores();
    } catch (error) {
        console.error('Erro ao criar colaborador:', error);
        mostrarToast('Erro ao criar colaborador', 'error');
    }
}

// Função para visualizar colaborador
async function visualizarColaborador(codigo) {
    try {
        const response = await api.get(`/colaboradores/${codigo}`);
        const colaborador = response;
        
        const viewContent = document.getElementById('viewContent');
        viewContent.innerHTML = `
            <div class="view-row">
                <div class="view-group">
                    <div class="view-label">Código</div>
                    <div class="view-value">${colaborador.codigo}</div>
                </div>
                <div class="view-group">
                    <div class="view-label">Status</div>
                    <div class="view-value">
                        <span class="view-status ${colaborador.status === 'Ativo' ? 'active' : 'inactive'}">
                            ${colaborador.status}
                        </span>
                    </div>
                </div>
            </div>
            <div class="view-row">
                <div class="view-group">
                    <div class="view-label">Nome</div>
                    <div class="view-value">${colaborador.nome}</div>
                </div>
                <div class="view-group">
                    <div class="view-label">Cargo</div>
                    <div class="view-value">${colaborador.cargo}</div>
                </div>
            </div>
            <div class="view-row">
                <div class="view-group">
                    <div class="view-label">Email</div>
                    <div class="view-value">${colaborador.email}</div>
                </div>
                <div class="view-group">
                    <div class="view-label">Telefone</div>
                    <div class="view-value">${colaborador.telefone}</div>
                </div>
            </div>
            <div class="view-row">
                <div class="view-group">
                    <div class="view-label">Departamento</div>
                    <div class="view-value">${colaborador.departamento}</div>
                </div>
                <div class="view-group">
                    <div class="view-label">Data de Admissão</div>
                    <div class="view-value">${colaborador.data_admissao ? new Date(colaborador.data_admissao).toLocaleDateString() : 'Não informada'}</div>
                </div>
            </div>
            <div class="view-row">
                <div class="view-group">
                    <div class="view-label">Usuário Vinculado</div>
                    <div class="view-value">${colaborador.usuario_vinculado || 'Não vinculado'}</div>
                </div>
            </div>
        `;
        
        document.getElementById('viewModal').style.display = 'flex';
    } catch (error) {
        console.error('Erro ao buscar colaborador:', error);
        mostrarToast('Erro ao buscar detalhes do colaborador', 'error');
    }
}

// Função para editar colaborador
async function editarColaborador(codigo) {
    try {
        const colaborador = await api.get(`/colaboradores/${codigo}`);
        const form = document.getElementById('colaboradorForm');
        const modal = document.getElementById('colaboradorModal');
        const modalTitle = modal.querySelector('.modal-header h2');
        
        // Atualizar título do modal
        modalTitle.textContent = 'Editar Colaborador';
        
        // Preencher o formulário com os dados do colaborador
        form.codigo.value = colaborador.codigo;
        form.nome.value = colaborador.nome;
        form.email.value = colaborador.email;
        form.telefone.value = colaborador.telefone;
        form.cargo.value = colaborador.cargo;
        form.data_admissao.value = colaborador.data_admissao;
        form.status.value = colaborador.status;
        form.usuario_vinculado.value = colaborador.usuario_vinculado || '';
        
        // Alterar o comportamento do formulário para atualização
        form.onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const dados = Object.fromEntries(formData.entries());
            
            try {
                await api.put(`/colaboradores/${codigo}`, dados);
                mostrarToast('Colaborador atualizado com sucesso!', 'success');
                closeModal();
                form.reset();
                carregarColaboradores();
            } catch (error) {
                console.error('Erro ao atualizar colaborador:', error);
                mostrarToast('Erro ao atualizar colaborador', 'error');
            }
        };
        
        // Exibir o modal
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    } catch (error) {
        console.error('Erro ao buscar colaborador:', error);
        mostrarToast('Erro ao buscar colaborador', 'error');
    }
}

// Função para excluir colaborador
async function excluirColaborador(codigo) {
    try {
        // Garantir que o código seja uma string com 5 dígitos
        const codigoStr = codigo.toString().padStart(5, '0');
        console.log('Tentando excluir colaborador com código:', codigoStr);
        
        const response = await api.delete(`/colaboradores/${codigoStr}`);
        console.log('Resposta da exclusão:', response);
        
        if (response && response.message) {
            mostrarToast('Colaborador excluído com sucesso!', 'success');
            closeDeleteModal();
            carregarColaboradores();
        } else {
            throw new Error('Resposta inválida do servidor');
        }
    } catch (error) {
        console.error('Erro ao excluir colaborador:', error);
        mostrarToast('Erro ao excluir colaborador', 'error');
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

// Função para carregar a lista de usuários
async function carregarUsuarios() {
    try {
        const usuarios = await api.get('/usuarios');
        const select = document.querySelector('select[name="usuario_vinculado"]');
        
        // Limpar opções existentes
        select.innerHTML = '<option value="">Selecione um usuário</option>';
        
        // Adicionar usuários
        usuarios.forEach(usuario => {
            const option = document.createElement('option');
            option.value = usuario.codigo;
            option.textContent = `${usuario.nome} (${usuario.email})`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        mostrarToast('Erro ao carregar lista de usuários', 'error');
    }
}

// Função para confirmar exclusão
function confirmarExclusao(codigo) {
    const modal = document.getElementById('deleteModal');
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    
    // Remover event listener anterior se existir
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    
    // Adicionar novo event listener
    newConfirmBtn.addEventListener('click', () => excluirColaborador(codigo));
    
    modal.style.display = 'flex';
}

// Carregar colaboradores quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    carregarColaboradores();
    carregarUsuarios();
    
    // Adicionar evento de submit ao formulário
    const form = document.getElementById('colaboradorForm');
    form.addEventListener('submit', criarColaborador);
});

// Exportar funções para uso global
window.visualizarColaborador = visualizarColaborador;
window.editarColaborador = editarColaborador;
window.excluirColaborador = excluirColaborador;
window.confirmarExclusao = confirmarExclusao; 
window.confirmarExclusao = confirmarExclusao; 