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
    
    // Mostrar o modal
    modal.style.display = 'flex';
    modal.style.opacity = '0';
    requestAnimationFrame(() => {
        modal.style.opacity = '1';
        modal.classList.add('show');
    });
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('userModal');
    if (modal) {
        modal.style.opacity = '0';
        modal.classList.remove('show');
        setTimeout(() => {
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
        }, 300);
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
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Funções de manipulação de usuários
let usuarios = [];
let usuarioAtual = null;

// Carregar usuários ao iniciar a página e configurar listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado, iniciando setup...'); // Debug
    carregarUsuarios();
    setupEventListeners();
});

// Configurar event listeners
function setupEventListeners() {
    // Form de usuário
    let form = document.getElementById('usuarioForm');
    if (form) {
        // Remover qualquer evento de submit anterior para evitar duplicação
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        form = newForm;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            // Decide se é criação ou edição baseado no campo 'codigo'
            if (form.codigo.value) { // Se o campo código não estiver vazio, é edição
                editarUsuarioSubmit(e); // Nova função para lidar com o submit de edição
            } else {
                criarUsuario(e);
            }
        });
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
    const MAX_RETRIES = 5;
    const RETRY_DELAY_MS = 200; // 200ms
    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            console.log(`Carregando usuários (Tentativa ${i + 1}/${MAX_RETRIES})...`); // Debug

            const tbody = document.getElementById('userTableBody');
            if (!tbody) {
                if (i < MAX_RETRIES - 1) {
                    console.warn('Tabela de usuários não encontrada, re-tentando...');
                    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
                    continue;
                } else {
                    console.error('Tabela de usuários não encontrada após múltiplas tentativas.');
                    mostrarToast('Tabela de usuários não encontrada', 'error');
                    return;
                }
            }

            const response = await api.get('/usuarios'); // Corrigido o endpoint
            console.log('Resposta da API:', response); // Debug

            tbody.innerHTML = '';

            if (!response || response.length === 0) {
                console.log('Nenhum usuário encontrado na resposta'); // Debug
                const tr = document.createElement('tr');
                tr.innerHTML = '<td colspan="6" class="text-center">Nenhum usuário encontrado</td>';
                tbody.appendChild(tr);
                return;
            }

            console.log('Processando usuários encontrados:', response.length); // Debug

            response.forEach(usuario => {
                console.log('Processando usuário:', usuario); // Debug
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
            console.log('Tabela atualizada com sucesso'); // Debug
            return; // Sai do loop se o carregamento for bem-sucedido
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
            if (i < MAX_RETRIES - 1) {
                mostrarToast('Erro ao carregar usuários, re-tentando...', 'error');
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
            } else {
                mostrarToast('Erro ao carregar usuários: ' + error.message, 'error');
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
    const filtrados = usuarios.filter(usuario => usuario.tipo === tipo);
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
            <td>${usuario.tipo}</td>
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

    // Gerar código do usuário com 5 dígitos
    const codigo = gerarCodigoUsuario(); // Reutiliza a função existente

    const usuario = {
        codigo: codigo, // Agora a função gerarCodigoUsuario já retorna a string formatada
        nome: formData.get('nome'),
        email: formData.get('email'),
        senha: formData.get('senha'),
        tipo: formData.get('tipo'),
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
        console.log('Visualizando usuário:', codigo); // Debug

        // Buscar dados do usuário usando api.get
        const usuario = await api.get(`/usuarios/${codigo}`); // Corrigido o endpoint

        console.log('Dados do usuário:', usuario); // Debug

        const modal = document.getElementById('userModal'); // ID correto
        const modalTitle = modal.querySelector('#modalTitle');
        const form = document.getElementById('usuarioForm'); // ID correto

        // Configurar o título e ícone do modal
        modalTitle.innerHTML = '<i class="fas fa-eye"></i> Visualizar Usuário';

        // Preencher o formulário com os dados do usuário
        form.codigo.value = usuario.codigo;
        form.nome.value = usuario.nome;
        form.email.value = usuario.email;
        form.tipo.value = usuario.tipo;
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

        // Mostrar o modal com animação
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);
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
        console.log('Editando usuário:', codigo); // Debug

        // Buscar dados do usuário usando api.get
        const usuario = await api.get(`/usuarios/${codigo}`); // Corrigido o endpoint

        const modal = document.getElementById('userModal'); // ID correto
        const modalTitle = modal.querySelector('#modalTitle');
        let form = document.getElementById('usuarioForm'); // ID correto

        modalTitle.textContent = 'Editar Usuário';

        // Preencher o formulário com os dados do usuário
        form.codigo.value = usuario.codigo;
        form.nome.value = usuario.nome;
        form.email.value = usuario.email;
        form.tipo.value = usuario.tipo;
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

        // Remover qualquer evento de submit anterior e recriar para evitar duplicação
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        form = newForm; // Atribuir o novo formulário à variável

        // Mostrar o modal com animação
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);
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
        tipo: formData.get('tipo'),
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
        const response = await api.put(`/usuarios/${usuarioAtualizado.codigo}`, usuarioAtualizado); // Corrigido o endpoint

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
        console.log('Deletando usuário:', codigo); // Debug

        // Mostrar modal de confirmação
        const confirmModal = document.getElementById('confirmModal');
        if (!confirmModal) {
            throw new Error('Modal de confirmação não encontrado');
        }

        const confirmMessage = confirmModal.querySelector('#confirmMessage');
        const confirmButton = confirmModal.querySelector('#confirmButton');
        const cancelButton = confirmModal.querySelector('#cancelButton');

        if (!confirmMessage || !confirmButton || !cancelButton) {
            throw new Error('Elementos do modal de confirmação não encontrados');
        }

        confirmMessage.textContent = 'Tem certeza que deseja excluir este usuário?';
        confirmModal.style.display = 'flex';
        setTimeout(() => confirmModal.classList.add('show'), 10);
        document.body.style.overflow = 'hidden';

        // Configurar eventos dos botões
        confirmButton.onclick = async () => {
            try {
                // Fechar o modal de confirmação
                confirmModal.classList.remove('show');
                setTimeout(() => {
                    confirmModal.style.display = 'none';
                    document.body.style.overflow = 'auto';
                }, 300);

                // Fazer a requisição DELETE usando api.delete
                await api.delete(`/usuarios/${codigo}`); // Corrigido o endpoint

                // Mostrar mensagem de sucesso
                mostrarToast('Usuário excluído com sucesso!', 'success');

                // Recarregar a lista de usuários
                await carregarUsuarios();
            } catch (error) {
                console.error('Erro ao excluir usuário:', error);
                mostrarToast('Erro ao excluir usuário: ' + error.message, 'error');
            }
        };

        cancelButton.onclick = () => {
            confirmModal.classList.remove('show');
            setTimeout(() => {
                confirmModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }, 300);
        };

    } catch (error) {
        console.error('Erro ao preparar exclusão:', error);
        mostrarToast('Erro ao preparar exclusão: ' + error.message, 'error');
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