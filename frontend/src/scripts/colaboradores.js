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
                <td><span class="status ${colaborador.status}">${colaborador.status}</span></td>
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
        const colaborador = await api.get(`/colaboradores/${codigo}`);
        const modal = document.getElementById('viewModal');
        const content = document.querySelector('.view-details');
        
        content.innerHTML = `
            <div class="detail-row">
                <strong>Código:</strong>
                <span>${colaborador.codigo}</span>
            </div>
            <div class="detail-row">
                <strong>Nome:</strong>
                <span>${colaborador.nome}</span>
            </div>
            <div class="detail-row">
                <strong>Email:</strong>
                <span>${colaborador.email}</span>
            </div>
            <div class="detail-row">
                <strong>Telefone:</strong>
                <span>${colaborador.telefone}</span>
            </div>
            <div class="detail-row">
                <strong>Cargo:</strong>
                <span>${colaborador.cargo}</span>
            </div>
            <div class="detail-row">
                <strong>Data de Admissão:</strong>
                <span>${colaborador.data_admissao}</span>
            </div>
            <div class="detail-row">
                <strong>Status:</strong>
                <span class="status ${colaborador.status}">${colaborador.status}</span>
            </div>
        `;
        
        modal.style.display = 'flex';
    } catch (error) {
        console.error('Erro ao buscar colaborador:', error);
        mostrarToast('Erro ao buscar colaborador', 'error');
    }
}

// Função para editar colaborador
async function editarColaborador(codigo) {
    try {
        const colaborador = await api.get(`/colaboradores/${codigo}`);
        const form = document.getElementById('colaboradorForm');
        
        // Preencher o formulário com os dados do colaborador
        form.codigo.value = colaborador.codigo;
        form.nome.value = colaborador.nome;
        form.email.value = colaborador.email;
        form.telefone.value = colaborador.telefone;
        form.cargo.value = colaborador.cargo;
        form.data_admissao.value = colaborador.data_admissao;
        form.status.value = colaborador.status;
        
        // Alterar o comportamento do formulário para atualização
        form.onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const dados = Object.fromEntries(formData.entries());
            
            try {
                await api.put(`/colaboradores/${codigo}`, dados);
                mostrarToast('Colaborador atualizado com sucesso!', 'success');
                closeModal('colaborador');
                form.reset();
                carregarColaboradores();
            } catch (error) {
                console.error('Erro ao atualizar colaborador:', error);
                mostrarToast('Erro ao atualizar colaborador', 'error');
            }
        };
        
        openModal('colaborador');
    } catch (error) {
        console.error('Erro ao buscar colaborador:', error);
        mostrarToast('Erro ao buscar colaborador', 'error');
    }
}

// Função para excluir colaborador
async function excluirColaborador(codigo) {
    try {
        await api.delete(`/colaboradores/${codigo}`);
        mostrarToast('Colaborador excluído com sucesso!', 'success');
        closeDeleteModal();
        carregarColaboradores();
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

// Carregar colaboradores quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    carregarColaboradores();
    
    // Adicionar evento de submit ao formulário
    const form = document.getElementById('colaboradorForm');
    form.addEventListener('submit', criarColaborador);
});

// Exportar funções para uso global
window.visualizarColaborador = visualizarColaborador;
window.editarColaborador = editarColaborador;
window.excluirColaborador = excluirColaborador;
window.confirmarExclusao = (codigo) => {
    const modal = document.getElementById('deleteModal');
    modal.style.display = 'flex';
    document.getElementById('confirmDeleteBtn').onclick = () => excluirColaborador(codigo);
}; 