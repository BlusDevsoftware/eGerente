// Função de debug para testar a funcionalidade
function debugColaboradores() {
    console.log('🐛 === DEBUG COLABORADORES ===');
    console.log('Testando carregamento de colaboradores...');
    
    // Testar carregamento
    carregarColaboradores().then(() => {
        console.log('✅ Carregamento de colaboradores OK');
        
        // Verificar se há colaboradores na tabela
        const tbody = document.querySelector('.table-container table tbody');
        const rows = tbody.querySelectorAll('tr');
        console.log('📊 Número de colaboradores na tabela:', rows.length);
        
        if (rows.length > 0) {
            // Testar visualização do primeiro colaborador
            const firstRow = rows[0];
            const viewBtn = firstRow.querySelector('.view-btn');
            if (viewBtn) {
                const onclick = viewBtn.getAttribute('onclick');
                console.log('🔍 Primeiro botão de visualização:', onclick);
                
                // Extrair código do onclick
                const match = onclick.match(/visualizarColaborador\((\d+)\)/);
                if (match) {
                    const codigo = match[1];
                    console.log('🧪 Testando visualização do colaborador:', codigo);
                    
                    // Simular clique após 2 segundos
                    setTimeout(() => {
                        visualizarColaborador(codigo);
                    }, 2000);
                }
            }
        }
    }).catch(error => {
        console.error('❌ Erro no debug:', error);
    });
}

// Função para verificar se os dados estão corretos
function verificarDadosColaborador(colaborador, codigoEsperado) {
    console.log('=== VERIFICAÇÃO DE DADOS ===');
    console.log('Código esperado:', codigoEsperado);
    console.log('Código recebido:', colaborador.codigo);
    console.log('Nome:', colaborador.nome);
    console.log('Email:', colaborador.email);
    console.log('Dados completos:', colaborador);
    console.log('==========================');
    
    if (colaborador.codigo != codigoEsperado) {
        console.error('❌ ERRO: Código não confere!');
        return false;
    }
    console.log('✅ Dados verificados com sucesso');
    return true;
}

// Função auxiliar para formatar data em pt-BR
function formatarDataPtBr(dataStr) {
    if (!dataStr) return '';
    const d = new Date(dataStr);
    if (isNaN(d)) return dataStr;
    return d.toLocaleDateString('pt-BR');
}

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
                <td>${formatarDataPtBr(colaborador.data_admissao)}</td>
                <td><span class="status ${colaborador.status.toLowerCase()}">${colaborador.status}</span></td>
                <td class="actions">
                    <button class="action-btn view-btn" onclick="visualizarColaborador('${colaborador.codigo}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit-btn" onclick="editarColaborador('${colaborador.codigo}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="confirmarExclusao('${colaborador.codigo}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
    } catch (error) {
        console.error('Erro ao carregar colaboradores:', error);
        mostrarToast('Erro ao carregar colaboradores', 'error');
        throw error; // Propagar erro para a função principal
    }
}

// Função para criar colaborador
async function criarColaborador(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const colaborador = {
        nome: (formData.get('nome') || '').trim(),
        email: (formData.get('email') || '').trim(),
        telefone: (formData.get('telefone') || '').trim(),
        cargo: (formData.get('cargo') || '').trim(),
        data_admissao: formData.get('data_admissao') ? formData.get('data_admissao') : new Date().toISOString().split('T')[0],
        status: formData.get('status'),
        perfil: formData.get('perfil') || null
    };

    try {
        await api.post('/colaboradores', colaborador);
        mostrarToast('Colaborador criado com sucesso!', 'success');
        carregarColaboradores();
        event.target.reset();
        closeModal();
    } catch (error) {
        if (error.data?.details?.includes('colaboradores_email_key')) {
            mostrarToast('Este email já está cadastrado para outro colaborador.', 'error');
        } else if (error.status === 500) {
            mostrarToast('Erro ao criar colaborador: ' + (error.data?.message || 'verifique os campos e tente novamente.'), 'error');
        } else {
            mostrarToast('Erro ao processar a requisição: ' + (error.data?.message || error.message || ''), 'error');
        }
    }
}

// Função para limpar formulário
function limparFormulario() {
    const form = document.getElementById('colaboradorForm');
    if (form) {
        console.log('🧹 Limpando formulário...');
        form.reset();
        // Limpar campos manualmente para garantir
        form.codigo.value = '';
        form.nome.value = '';
        form.email.value = '';
        form.telefone.value = '';
        form.cargo.value = '';
        form.data_admissao.value = '';
        form.status.value = 'Ativo';
        form.perfil.value = '';
        console.log('✅ Formulário limpo');
    }
}

// Função para visualizar colaborador
async function visualizarColaborador(codigo) {
    try {
        console.log('👁️ Visualizando colaborador com código:', codigo);
        
        // Limpar formulário antes de carregar novos dados
        limparFormulario();
        
        const response = await api.get(`/colaboradores/${codigo}`);
        const colaborador = response;
        
        // Verificar se os dados estão corretos
        if (!verificarDadosColaborador(colaborador, codigo)) {
            throw new Error('Dados incorretos recebidos do servidor');
        }
        
        console.log('Valor do perfil:', colaborador.perfil);

        const modal = document.getElementById('colaboradorModal');
        const modalTitle = modal.querySelector('#modalTitle');
        // Remover event listeners anteriores do formulário antes de adicionar novos
        const formOriginal = document.getElementById('colaboradorForm');
        const formClonado = formOriginal.cloneNode(true);
        formOriginal.parentNode.replaceChild(formClonado, formOriginal);
        const form = document.getElementById('colaboradorForm');

        modalTitle.textContent = 'Visualizar Colaborador';
        
        // Preencher o formulário com os dados do colaborador
        form.codigo.value = colaborador.codigo || '';
        form.status.value = colaborador.status || 'Ativo';
        form.nome.value = colaborador.nome || '';
        form.email.value = colaborador.email || '';
        form.telefone.value = colaborador.telefone || '';
        form.cargo.value = colaborador.cargo || '';
        form.data_admissao.value = colaborador.data_admissao || '';
        form.perfil.value = colaborador.perfil || '';
        console.log('Valor definido no campo perfil (visualizar):', form.perfil.value);

        // Desabilitar todos os campos
        Array.from(form.elements).forEach(element => {
            element.disabled = true;
        });

        // Esconder ações (Cancelar/Salvar) no modo visualização
        const actions = form.querySelector('.form-actions');
        if (actions) {
            actions.style.display = 'none';
        }

        // Mostrar o modal
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Configurar o evento de submit do formulário
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            closeModal();
        });
    } catch (error) {
        console.error('❌ Erro ao visualizar colaborador:', error);
        mostrarToast('Erro ao carregar dados do colaborador: ' + error.message, 'error');
    }
}

// Função para editar colaborador
async function editarColaborador(codigo) {
    try {
        console.log('✏️ Editando colaborador com código:', codigo);
        
        // Limpar formulário antes de carregar novos dados
        limparFormulario();
        
        const response = await api.get(`/colaboradores/${codigo}`);
        const colaborador = response;
        
        // Verificar se os dados estão corretos
        if (!verificarDadosColaborador(colaborador, codigo)) {
            throw new Error('Dados incorretos recebidos do servidor');
        }
        
        console.log('Valor do perfil para edição:', colaborador.perfil);

        const modal = document.getElementById('colaboradorModal');
        const modalTitle = modal.querySelector('#modalTitle');
        // Remover event listeners anteriores do formulário antes de adicionar novos
        const formOriginal = document.getElementById('colaboradorForm');
        const formClonado = formOriginal.cloneNode(true);
        formOriginal.parentNode.replaceChild(formClonado, formOriginal);
        const form = document.getElementById('colaboradorForm');

        modalTitle.textContent = 'Editar Colaborador';
        
        // Preencher o formulário com os dados do colaborador
        form.codigo.value = colaborador.codigo || '';
        form.status.value = colaborador.status || 'Ativo';
        form.nome.value = colaborador.nome || '';
        form.email.value = colaborador.email || '';
        form.telefone.value = colaborador.telefone || '';
        form.cargo.value = colaborador.cargo || '';
        form.data_admissao.value = colaborador.data_admissao || '';
        form.perfil.value = colaborador.perfil || '';
        console.log('Valor definido no campo perfil (editar):', form.perfil.value);

        // Reabilitar campos (exceto código) para edição
        Array.from(form.elements).forEach(element => {
            if (element.name !== 'codigo') {
                element.disabled = false;
            }
        });

        // Garantir que ações estejam visíveis no modo edição
        const actions = form.querySelector('.form-actions');
        if (actions) {
            actions.style.display = 'flex';
        }

        // Mostrar o modal
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Configurar o evento de submit do formulário
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const formData = new FormData(form);
            
            const colaboradorAtualizado = {
                codigo: form.codigo.value,
                nome: formData.get('nome'),
                email: formData.get('email'),
                telefone: formData.get('telefone'),
                cargo: formData.get('cargo'),
                data_admissao: formData.get('data_admissao') ? formData.get('data_admissao') : new Date().toISOString().split('T')[0],
                status: formData.get('status'),
                perfil: formData.get('perfil') || null
            };

            try {
                const response = await api.put(`/colaboradores/${form.codigo.value}`, colaboradorAtualizado);
                
                if (response) {
                    mostrarToast('Colaborador atualizado com sucesso!', 'success');
                    carregarColaboradores();
                    closeModal();
                } else {
                    throw new Error('Resposta inválida do servidor');
                }
            } catch (error) {
                console.error('Erro ao atualizar colaborador:', error);
                if (error.status === 404) {
                    mostrarToast('Colaborador não encontrado.', 'error');
                } else if (error.data?.details?.includes('multiple (or no) rows returned')) {
                    mostrarToast('Erro ao processar a requisição. Por favor, tente novamente.', 'error');
                } else {
                    mostrarToast('Erro ao atualizar colaborador: ' + (error.data?.message || error.message), 'error');
                }
            }
        });
    } catch (error) {
        console.error('❌ Erro ao editar colaborador:', error);
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

// Função para carregar a lista de perfis
async function carregarPerfis() {
    try {
        console.log('Carregando lista de perfis...');
        const perfis = await api.get('/perfis');
        console.log('Perfis carregados:', perfis);
        const select = document.querySelector('select[name="perfil"]');
        
        // Limpar opções existentes
        select.innerHTML = '<option value="">Selecione um perfil</option>';
        
        // Adicionar perfis
        perfis.forEach(perfil => {
            const option = document.createElement('option');
            option.value = perfil.codigo;
            option.textContent = `${perfil.nome}`;
            select.appendChild(option);
        });
        
        console.log('Perfis adicionados ao select:', select.options.length);
        
    } catch (error) {
        console.error('Erro ao carregar perfis:', error);
        mostrarToast('Erro ao carregar lista de perfis', 'error');
        throw error; // Propagar erro para a função principal
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

// Filtro de busca e status (cliente)
function aplicarFiltros() {
    const termo = (document.querySelector('.search-box input')?.value || '').toLowerCase();
    const statusFiltro = (document.querySelector('.filter-options select')?.value || '').toLowerCase();
    const rows = document.querySelectorAll('.table-container table tbody tr');

    rows.forEach(row => {
        const textoLinha = row.innerText.toLowerCase();
        const statusSpan = row.querySelector('.status');
        const statusLinha = statusSpan ? statusSpan.textContent.toLowerCase() : '';

        const passaBusca = termo === '' || textoLinha.includes(termo);
        const passaStatus = statusFiltro === '' || statusLinha === statusFiltro;
        row.style.display = (passaBusca && passaStatus) ? '' : 'none';
    });
}

// Carregar colaboradores quando a página carregar
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Mostrar spinner centralizado ao iniciar
        mostrarSpinner();
        
        // Carregar dados em paralelo
        await Promise.all([
            carregarColaboradores(),
            carregarPerfis()
        ]);
        
        // Ocultar spinner centralizado quando tudo carregar
        ocultarSpinner();
        
        // Executar debug após carregamento (opcional)
        // setTimeout(() => debugColaboradores(), 3000);
        
    } catch (error) {
        console.error('Erro ao inicializar página:', error);
        mostrarToast('Erro ao carregar dados da página', 'error');
        // Ocultar spinner mesmo em caso de erro
        ocultarSpinner();
    }
    
    // Adicionar evento de submit ao formulário apenas para criação
    const form = document.getElementById('colaboradorForm');
    
    // Remover event listeners anteriores
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    // Adicionar event listener apenas para criação
    document.getElementById('colaboradorForm').addEventListener('submit', criarColaborador);

    // Listeners de filtro
    const inputBusca = document.querySelector('.search-box input');
    const selectStatus = document.querySelector('.filter-options select');
    if (inputBusca) inputBusca.addEventListener('input', aplicarFiltros);
    if (selectStatus) selectStatus.addEventListener('change', aplicarFiltros);
});

// Exportar funções para uso global
window.visualizarColaborador = visualizarColaborador;
window.editarColaborador = editarColaborador;
window.excluirColaborador = excluirColaborador;
window.confirmarExclusao = confirmarExclusao;
window.debugColaboradores = debugColaboradores; 