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
    
    const colaborador = {
        nome: formData.get('nome'),
        email: formData.get('email'),
        telefone: formData.get('telefone'),
        cargo: formData.get('cargo'),
        data_admissao: formData.get('data_admissao') ? formData.get('data_admissao') : new Date().toISOString().split('T')[0],
        status: formData.get('status')
    };

    try {
        const response = await api.post('/colaboradores', colaborador);
        mostrarToast('Colaborador criado com sucesso!', 'success');
        form.reset();
        carregarColaboradores();
    } catch (error) {
        if (error.data?.details?.includes('colaboradores_email_key')) {
            mostrarToast('Este email já está cadastrado para outro colaborador.', 'error');
        }
    }
}

// Função para visualizar colaborador
async function visualizarColaborador(codigo) {
    try {
        const response = await api.get(`/colaboradores/${codigo}`);
        // A resposta já é o objeto do colaborador, não precisa acessar .data
        const colaborador = response;

        const modal = document.getElementById('colaboradorModal');
        const modalTitle = modal.querySelector('#modalTitle');
        const form = document.getElementById('colaboradorForm');

        modalTitle.textContent = 'Visualizar Colaborador';
        
        // Preencher o formulário com os dados do colaborador
        form.codigo.value = colaborador.codigo;
        form.status.value = colaborador.status;
        form.nome.value = colaborador.nome;
        form.email.value = colaborador.email;
        form.telefone.value = colaborador.telefone;
        form.cargo.value = colaborador.cargo;
        form.data_admissao.value = colaborador.data_admissao;
        form.usuario_vinculado.value = colaborador.usuario_vinculado || '';

        // Desabilitar todos os campos
        Array.from(form.elements).forEach(element => {
            element.disabled = true;
        });

        // Mostrar o modal com animação
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);
        document.body.style.overflow = 'hidden';

        // Configurar o evento de submit do formulário
        form.onsubmit = (e) => {
            e.preventDefault();
            closeModal();
        };
    } catch (error) {
        mostrarToast('Erro ao carregar dados do colaborador: ' + error.message, 'error');
    }
}

// Função para editar colaborador
async function editarColaborador(codigo) {
    try {
        console.log('Editando colaborador com código:', codigo);
        const response = await api.get(`/colaboradores/${codigo}`);
        // A resposta já é o objeto do colaborador, não precisa acessar .data
        const colaborador = response;
        console.log('Dados do colaborador carregados:', colaborador);

        const modal = document.getElementById('colaboradorModal');
        const modalTitle = modal.querySelector('#modalTitle');
        const form = document.getElementById('colaboradorForm');

        modalTitle.textContent = 'Editar Colaborador';
        
        // Preencher o formulário com os dados do colaborador
        form.codigo.value = colaborador.codigo;
        form.status.value = colaborador.status;
        form.nome.value = colaborador.nome;
        form.email.value = colaborador.email;
        form.telefone.value = colaborador.telefone;
        form.cargo.value = colaborador.cargo;
        form.data_admissao.value = colaborador.data_admissao;
        form.usuario_vinculado.value = colaborador.usuario_vinculado || '';

        // Mostrar o modal com animação
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);
        document.body.style.overflow = 'hidden';

        // Configurar o evento de submit do formulário
        form.onsubmit = async (event) => {
            event.preventDefault();
            const formData = new FormData(form);
            
            const colaborador = {
                codigo: form.codigo.value,
                nome: formData.get('nome'),
                email: formData.get('email'),
                telefone: formData.get('telefone'),
                cargo: formData.get('cargo'),
                data_admissao: formData.get('data_admissao') ? formData.get('data_admissao') : new Date().toISOString().split('T')[0],
                status: formData.get('status')
            };

            try {
                const response = await api.put(`/colaboradores/${form.codigo.value}`, colaborador);
                mostrarToast('Colaborador atualizado com sucesso!', 'success');
                carregarColaboradores();
                form.reset();
                closeModal();
            } catch (error) {
                if (error.data?.details?.includes('colaboradores_email_key')) {
                    mostrarToast('Este email já está cadastrado para outro colaborador.', 'error');
                } else if (error.data?.details?.includes('multiple (or no) rows returned')) {
                    mostrarToast('Erro ao processar a requisição. Por favor, tente novamente.', 'error');
                }
            }
        };
    } catch (error) {
        console.error('Erro ao carregar dados do colaborador:', error);
        mostrarToast('Erro ao carregar dados do colaborador: ' + error.message, 'error');
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