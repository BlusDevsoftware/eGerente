// Consulta de Comissões - Funcionalidades
class ConsultaComissao {
    constructor() {
        this.movimentos = [];
        this.colaboradores = [];
        this.filtros = {
            dataInicio: '',
            dataFim: '',
            colaborador: '',
            tipo: '',
            status: '',
            valorMin: '',
            valorMax: ''
        };
        this.paginaAtual = 1;
        this.itensPorPagina = 10;
        this.totalItens = 0;
        
        this.init();
    }

    async init() {
        await this.carregarColaboradores();
        await this.carregarMovimentos();
        this.configurarEventos();
        this.atualizarGraficos();
    }

    async carregarColaboradores() {
        try {
            const colaboradores = await window.api.get('/colaboradores');
            this.colaboradores = colaboradores;
            this.preencherSelectColaboradores();
        } catch (error) {
            console.error('Erro ao carregar colaboradores:', error);
            this.mostrarToast('Erro ao carregar colaboradores', 'error');
        }
    }

    preencherSelectColaboradores() {
        const select = document.querySelector('.filter-group:nth-child(2) select');
        if (select) {
            select.innerHTML = '<option value="">Todos</option>';
            this.colaboradores.forEach(colab => {
                const option = document.createElement('option');
                option.value = colab.codigo;
                option.textContent = colab.nome;
                select.appendChild(option);
            });
        }
    }

    async carregarMovimentos() {
        try {
            this.mostrarLoading(true);
            const movimentos = await window.api.get('/movimento_comissoes');
            this.movimentos = movimentos;
            this.totalItens = this.movimentos.length;
            this.aplicarFiltros();
        } catch (error) {
            console.error('Erro ao carregar movimentos:', error);
            this.mostrarToast('Erro ao carregar movimentos', 'error');
        } finally {
            this.mostrarLoading(false);
        }
    }

    configurarEventos() {
        // Botão consultar
        const btnConsultar = document.querySelector('.btn-primary');
        if (btnConsultar) {
            btnConsultar.addEventListener('click', () => this.aplicarFiltros());
        }

        // Filtros
        const inputs = document.querySelectorAll('.advanced-filters input, .advanced-filters select');
        inputs.forEach(input => {
            input.addEventListener('change', () => this.capturarFiltros());
        });

        // Ações da tabela
        document.addEventListener('click', (e) => {
            if (e.target.closest('.view-btn')) {
                const id = e.target.closest('tr').dataset.id;
                this.visualizarMovimento(id);
            } else if (e.target.closest('.edit-btn')) {
                const id = e.target.closest('tr').dataset.id;
                this.editarMovimento(id);
            } else if (e.target.closest('.delete-btn')) {
                const id = e.target.closest('tr').dataset.id;
                this.excluirMovimento(id);
            }
        });

        // Botões de exportação
        const btnExportar = document.querySelector('button:has(.fa-file-export)');
        if (btnExportar) {
            btnExportar.addEventListener('click', () => this.exportarDados());
        }

        const btnImprimir = document.querySelector('button:has(.fa-print)');
        if (btnImprimir) {
            btnImprimir.addEventListener('click', () => this.imprimirDados());
        }
    }

    capturarFiltros() {
        const dataInputs = document.querySelectorAll('.date-range input');
        this.filtros.dataInicio = dataInputs[0]?.value || '';
        this.filtros.dataFim = dataInputs[1]?.value || '';
        
        const colaboradorSelect = document.querySelector('.filter-group:nth-child(2) select');
        this.filtros.colaborador = colaboradorSelect?.value || '';
        
        const tipoSelect = document.querySelector('.filter-group:nth-child(3) select');
        this.filtros.tipo = tipoSelect?.value || '';
        
        const statusSelect = document.querySelector('.filter-group:nth-child(4) select');
        this.filtros.status = statusSelect?.value || '';
        
        const valorInputs = document.querySelectorAll('.value-range input');
        this.filtros.valorMin = valorInputs[0]?.value || '';
        this.filtros.valorMax = valorInputs[1]?.value || '';
    }

    aplicarFiltros() {
        this.capturarFiltros();
        
        let movimentosFiltrados = [...this.movimentos];

        // Filtro por data
        if (this.filtros.dataInicio) {
            movimentosFiltrados = movimentosFiltrados.filter(m => 
                new Date(m.data_geracao) >= new Date(this.filtros.dataInicio)
            );
        }
        if (this.filtros.dataFim) {
            movimentosFiltrados = movimentosFiltrados.filter(m => 
                new Date(m.data_geracao) <= new Date(this.filtros.dataFim)
            );
        }

        // Filtro por colaborador
        if (this.filtros.colaborador) {
            movimentosFiltrados = movimentosFiltrados.filter(m => 
                m.colaborador_id === this.filtros.colaborador
            );
        }

        // Filtro por tipo
        if (this.filtros.tipo) {
            movimentosFiltrados = movimentosFiltrados.filter(m => 
                m.tipo.toLowerCase() === this.filtros.tipo.toLowerCase()
            );
        }

        // Filtro por status
        if (this.filtros.status) {
            movimentosFiltrados = movimentosFiltrados.filter(m => 
                m.status.toLowerCase() === this.filtros.status.toLowerCase()
            );
        }

        // Filtro por valor
        if (this.filtros.valorMin) {
            movimentosFiltrados = movimentosFiltrados.filter(m => 
                parseFloat(m.valor) >= parseFloat(this.filtros.valorMin)
            );
        }
        if (this.filtros.valorMax) {
            movimentosFiltrados = movimentosFiltrados.filter(m => 
                parseFloat(m.valor) <= parseFloat(this.filtros.valorMax)
            );
        }

        this.movimentosFiltrados = movimentosFiltrados;
        this.totalItens = movimentosFiltrados.length;
        this.paginaAtual = 1;
        
        this.renderizarTabela();
        this.atualizarGraficos();
        this.mostrarToast(`${movimentosFiltrados.length} movimentos encontrados`, 'info');
    }

    renderizarTabela() {
        const tbody = document.querySelector('table tbody');
        if (!tbody) return;

        const movimentos = this.movimentosFiltrados || this.movimentos;
        const inicio = (this.paginaAtual - 1) * this.itensPorPagina;
        const fim = inicio + this.itensPorPagina;
        const movimentosPagina = movimentos.slice(inicio, fim);

        tbody.innerHTML = '';

        if (movimentosPagina.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 20px; color: #666;">
                        Nenhum movimento encontrado
                    </td>
                </tr>
            `;
            return;
        }

        movimentosPagina.forEach(movimento => {
            const colaborador = this.colaboradores.find(c => c.codigo === movimento.colaborador_id);
            const row = document.createElement('tr');
            row.dataset.id = movimento.id;
            
            row.innerHTML = `
                <td>${this.formatarData(movimento.data_geracao)}</td>
                <td>${colaborador?.nome || 'N/A'}</td>
                <td>${movimento.tipo}</td>
                <td>${this.formatarMoeda(movimento.valor_venda)}</td>
                <td>${this.formatarMoeda(movimento.valor)}</td>
                <td><span class="status ${this.getStatusClass(movimento.status)}">${movimento.status}</span></td>
                <td>
                    <button class="action-btn view-btn" title="Visualizar"><i class="fas fa-eye"></i></button>
                    <button class="action-btn edit-btn" title="Editar"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-btn" title="Excluir"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(row);
        });

        this.renderizarPaginacao();
    }

    renderizarPaginacao() {
        const totalPaginas = Math.ceil(this.totalItens / this.itensPorPagina);
        if (totalPaginas <= 1) return;

        const tableContainer = document.querySelector('.table-container');
        let paginacao = tableContainer.querySelector('.pagination');
        
        if (!paginacao) {
            paginacao = document.createElement('div');
            paginacao.className = 'pagination';
            tableContainer.appendChild(paginacao);
        }

        let html = '';
        
        // Botão anterior
        html += `<button class="page-btn" ${this.paginaAtual === 1 ? 'disabled' : ''} onclick="consultaComissao.irParaPagina(${this.paginaAtual - 1})">
            <i class="fas fa-chevron-left"></i>
        </button>`;

        // Páginas
        for (let i = 1; i <= totalPaginas; i++) {
            if (i === 1 || i === totalPaginas || (i >= this.paginaAtual - 2 && i <= this.paginaAtual + 2)) {
                html += `<button class="page-btn ${i === this.paginaAtual ? 'active' : ''}" onclick="consultaComissao.irParaPagina(${i})">${i}</button>`;
            } else if (i === this.paginaAtual - 3 || i === this.paginaAtual + 3) {
                html += '<span class="page-ellipsis">...</span>';
            }
        }

        // Botão próximo
        html += `<button class="page-btn" ${this.paginaAtual === totalPaginas ? 'disabled' : ''} onclick="consultaComissao.irParaPagina(${this.paginaAtual + 1})">
            <i class="fas fa-chevron-right"></i>
        </button>`;

        paginacao.innerHTML = html;
    }

    irParaPagina(pagina) {
        this.paginaAtual = pagina;
        this.renderizarTabela();
    }

    atualizarGraficos() {
        const movimentos = this.movimentosFiltrados || this.movimentos;
        
        // Gráfico de Status
        this.atualizarGraficoStatus(movimentos);
        
        // Gráfico de Colaboradores
        this.atualizarGraficoColaboradores(movimentos);
        
        // Gráfico Mensal
        this.atualizarGraficoMensal(movimentos);
    }

    atualizarGraficoStatus(movimentos) {
        const statusCount = {};
        movimentos.forEach(m => {
            statusCount[m.status] = (statusCount[m.status] || 0) + 1;
        });

        const ctx = document.getElementById('statusChart');
        if (ctx && window.statusChart) {
            window.statusChart.data.datasets[0].data = Object.values(statusCount);
            window.statusChart.data.labels = Object.keys(statusCount);
            window.statusChart.update();
        }
    }

    atualizarGraficoColaboradores(movimentos) {
        const colaboradorTotals = {};
        movimentos.forEach(m => {
            const colab = this.colaboradores.find(c => c.codigo === m.colaborador_id);
            const nome = colab?.nome || 'N/A';
            colaboradorTotals[nome] = (colaboradorTotals[nome] || 0) + parseFloat(m.valor);
        });

        const ctx = document.getElementById('collaboratorChart');
        if (ctx && window.collaboratorChart) {
            window.collaboratorChart.data.labels = Object.keys(colaboradorTotals);
            window.collaboratorChart.data.datasets[0].data = Object.values(colaboradorTotals);
            window.collaboratorChart.update();
        }
    }

    atualizarGraficoMensal(movimentos) {
        const monthlyTotals = {};
        movimentos.forEach(m => {
            const mes = new Date(m.data_geracao).toLocaleDateString('pt-BR', { month: 'short' });
            monthlyTotals[mes] = (monthlyTotals[mes] || 0) + parseFloat(m.valor);
        });

        const ctx = document.getElementById('monthlyChart');
        if (ctx && window.monthlyChart) {
            window.monthlyChart.data.labels = Object.keys(monthlyTotals);
            window.monthlyChart.data.datasets[0].data = Object.values(monthlyTotals);
            window.monthlyChart.update();
        }
    }

    async visualizarMovimento(id) {
        try {
            const movimento = await window.api.get(`/movimento_comissoes/${id}`);
            this.mostrarModalVisualizacao(movimento);
        } catch (error) {
            console.error('Erro ao carregar movimento:', error);
            this.mostrarToast('Erro ao carregar movimento', 'error');
        }
    }

    mostrarModalVisualizacao(movimento) {
        const colaborador = this.colaboradores.find(c => c.codigo === movimento.colaborador_id);
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Visualizar Movimento</h2>
                    <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Número do Título</label>
                            <input type="text" value="${movimento.numero_titulo}" readonly>
                        </div>
                        <div class="form-group">
                            <label>Data de Geração</label>
                            <input type="date" value="${movimento.data_geracao}" readonly>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Colaborador</label>
                            <input type="text" value="${colaborador?.nome || 'N/A'}" readonly>
                        </div>
                        <div class="form-group">
                            <label>Tipo</label>
                            <input type="text" value="${movimento.tipo}" readonly>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Valor da Venda</label>
                            <input type="text" value="${this.formatarMoeda(movimento.valor_venda)}" readonly>
                        </div>
                        <div class="form-group">
                            <label>Valor da Comissão</label>
                            <input type="text" value="${this.formatarMoeda(movimento.valor)}" readonly>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Status</label>
                            <input type="text" value="${movimento.status}" readonly>
                        </div>
                        <div class="form-group">
                            <label>Data de Vencimento</label>
                            <input type="date" value="${movimento.data_vencimento}" readonly>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Observações</label>
                        <textarea readonly>${movimento.observacoes || ''}</textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="this.closest('.modal').remove()">Fechar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    async editarMovimento(id) {
        try {
            const movimento = await window.api.get(`/movimento_comissoes/${id}`);
            this.mostrarModalEdicao(movimento);
        } catch (error) {
            console.error('Erro ao carregar movimento:', error);
            this.mostrarToast('Erro ao carregar movimento', 'error');
        }
    }

    mostrarModalEdicao(movimento) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Editar Movimento</h2>
                    <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="editForm">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Status</label>
                                <select name="status" required>
                                    <option value="pendente" ${movimento.status === 'pendente' ? 'selected' : ''}>Pendente</option>
                                    <option value="pago" ${movimento.status === 'pago' ? 'selected' : ''}>Pago</option>
                                    <option value="cancelado" ${movimento.status === 'cancelado' ? 'selected' : ''}>Cancelado</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Data de Pagamento</label>
                                <input type="date" name="data_pagamento" value="${movimento.data_pagamento || ''}">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Valor Pago</label>
                                <input type="number" name="valor_pago" step="0.01" value="${movimento.valor_pago || ''}">
                            </div>
                            <div class="form-group">
                                <label>Data de Vencimento</label>
                                <input type="date" name="data_vencimento" value="${movimento.data_vencimento}" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Observações</label>
                            <textarea name="observacoes">${movimento.observacoes || ''}</textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="this.closest('.modal').remove()">Cancelar</button>
                    <button class="btn-primary" onclick="consultaComissao.salvarEdicao(${movimento.id})">Salvar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    async salvarEdicao(id) {
        try {
            const form = document.getElementById('editForm');
            const formData = new FormData(form);
            const dados = Object.fromEntries(formData.entries());
            
            // Converter valores numéricos
            if (dados.valor_pago) dados.valor_pago = parseFloat(dados.valor_pago);
            
            await window.api.put(`/movimento_comissoes/${id}`, dados);
            this.mostrarToast('Movimento atualizado com sucesso!', 'success');
            document.querySelector('.modal').remove();
            await this.carregarMovimentos();
        } catch (error) {
            console.error('Erro ao salvar edição:', error);
            this.mostrarToast('Erro ao salvar alterações', 'error');
        }
    }

    async excluirMovimento(id) {
        // Usar o sistema de bloqueio de exclusão
        if (typeof deleteWithCheck === 'function') {
            const movimento = this.movimentos.find(m => m.id === id);
            if (movimento) {
                await deleteWithCheck(
                    'movimento_comissoes',
                    id,
                    () => {
                        this.mostrarToast('Movimento excluído com sucesso!', 'success');
                        this.carregarMovimentos();
                    }
                );
            }
        } else {
            // Fallback para exclusão direta
            if (confirm('Tem certeza que deseja excluir este movimento?')) {
                try {
                    await window.api.delete(`/movimento_comissoes/${id}`);
                    this.mostrarToast('Movimento excluído com sucesso!', 'success');
                    await this.carregarMovimentos();
                } catch (error) {
                    console.error('Erro ao excluir movimento:', error);
                    this.mostrarToast('Erro ao excluir movimento', 'error');
                }
            }
        }
    }

    exportarDados() {
        const movimentos = this.movimentosFiltrados || this.movimentos;
        const csv = this.gerarCSV(movimentos);
        this.downloadCSV(csv, 'movimentos_comissoes.csv');
        this.mostrarToast('Dados exportados com sucesso!', 'success');
    }

    gerarCSV(movimentos) {
        const headers = ['Data', 'Colaborador', 'Tipo', 'Valor Venda', 'Comissão', 'Status', 'Número Título'];
        const rows = movimentos.map(m => {
            const colaborador = this.colaboradores.find(c => c.codigo === m.colaborador_id);
            return [
                this.formatarData(m.data_geracao),
                colaborador?.nome || 'N/A',
                m.tipo,
                m.valor_venda,
                m.valor,
                m.status,
                m.numero_titulo
            ];
        });

        return [headers, ...rows].map(row => 
            row.map(cell => `"${cell}"`).join(',')
        ).join('\n');
    }

    downloadCSV(csv, filename) {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    imprimirDados() {
        const movimentos = this.movimentosFiltrados || this.movimentos;
        const printWindow = window.open('', '_blank');
        
        const html = `
            <html>
                <head>
                    <title>Relatório de Comissões</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                        .header { text-align: center; margin-bottom: 20px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Relatório de Comissões</h1>
                        <p>Gerado em: ${new Date().toLocaleDateString('pt-BR')}</p>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Colaborador</th>
                                <th>Tipo</th>
                                <th>Valor Venda</th>
                                <th>Comissão</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${movimentos.map(m => {
                                const colaborador = this.colaboradores.find(c => c.codigo === m.colaborador_id);
                                return `
                                    <tr>
                                        <td>${this.formatarData(m.data_geracao)}</td>
                                        <td>${colaborador?.nome || 'N/A'}</td>
                                        <td>${m.tipo}</td>
                                        <td>${this.formatarMoeda(m.valor_venda)}</td>
                                        <td>${this.formatarMoeda(m.valor)}</td>
                                        <td>${m.status}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </body>
            </html>
        `;
        
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
    }

    mostrarLoading(mostrar) {
        const tbody = document.querySelector('table tbody');
        if (mostrar) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 20px;">
                        <i class="fas fa-spinner fa-spin"></i> Carregando...
                    </td>
                </tr>
            `;
        }
    }

    mostrarToast(mensagem, tipo = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${tipo}`;
        toast.innerHTML = `
            <i class="fas fa-${this.getToastIcon(tipo)}"></i>
            <span>${mensagem}</span>
            <button onclick="this.parentElement.remove()">&times;</button>
        `;
        
        const container = document.querySelector('.toast-container') || this.criarToastContainer();
        container.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => toast.remove(), 5000);
    }

    criarToastContainer() {
        const container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    }

    getToastIcon(tipo) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            info: 'info-circle'
        };
        return icons[tipo] || 'info-circle';
    }

    formatarData(data) {
        return new Date(data).toLocaleDateString('pt-BR');
    }

    formatarMoeda(valor) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    }

    getStatusClass(status) {
        const classes = {
            pendente: 'pending',
            pago: 'paid',
            cancelado: 'cancelled'
        };
        return classes[status.toLowerCase()] || 'pending';
    }
}

// Inicializar quando a página carregar
let consultaComissao;
document.addEventListener('DOMContentLoaded', () => {
    consultaComissao = new ConsultaComissao();
});
