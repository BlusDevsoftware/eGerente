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
            produto: '',
            valorMin: '',
            valorMax: ''
        };
        this.paginaAtual = 1;
        this.itensPorPagina = 10;
        this.totalItens = 0;
        
        this.init();
    }

    async init() {
        this.mostrarSpinner();
        try {
            await this.carregarColaboradores();
            await this.carregarMovimentos();
            this.carregarProdutos();
            this.configurarEventos();
            this.atualizarGraficos();
        } catch (error) {
            console.error('Erro ao inicializar consulta:', error);
            this.mostrarToast('Erro ao inicializar a página de consulta', 'error');
        } finally {
            this.ocultarSpinner();
        }
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
        const select = document.getElementById('filtroColaborador');
        if (select) {
            select.innerHTML = '<option value="">Selecionar</option><option value="todos">Todos</option>';
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
            const movimentos = await window.api.get('/movimento_comissoes');
            this.movimentos = movimentos;
            this.totalItens = this.movimentos.length;
            this.aplicarFiltros();
        } catch (error) {
            console.error('Erro ao carregar movimentos:', error);
            this.mostrarToast('Erro ao carregar movimentos', 'error');
        }
    }

    carregarProdutos() {
        // Extrair produtos únicos dos movimentos
        const produtosUnicos = new Set();
        
        this.movimentos.forEach(m => {
            if (m.item_id) {
                const itemIds = m.item_id.split(',');
                itemIds.forEach(itemId => {
                    const parts = itemId.trim().split('-');
                    if (parts.length >= 2) {
                        const nomeProduto = parts.slice(1).join('-');
                        produtosUnicos.add(nomeProduto);
                    }
                });
            }
        });

        // Preencher select de produtos
        const select = document.getElementById('filtroProduto');
        if (select) {
            select.innerHTML = '<option value="">Selecionar</option><option value="todos">Todos</option>';
            
            // Ordenar produtos alfabeticamente
            const produtosOrdenados = Array.from(produtosUnicos).sort();
            
            produtosOrdenados.forEach(produto => {
                const option = document.createElement('option');
                option.value = produto;
                option.textContent = produto;
                select.appendChild(option);
            });
        }
    }

    configurarEventos() {
        // Filtros automáticos
        const filtroContainer = document.querySelector('.advanced-filters');
        if (filtroContainer) {
            filtroContainer.addEventListener('change', (e) => {
                if (e.target.matches('#dataInicial, #dataFinal, #filtroColaborador, #filtroTipo, #filtroProduto')) {
                    this.aplicarFiltros();
                }
            });
        }

        // Botão limpar filtros
        const btnLimpar = document.getElementById('btnLimparFiltros');
        if (btnLimpar) {
            btnLimpar.addEventListener('click', () => {
                const ids = ['filtroColaborador','filtroTipo','filtroProduto','dataInicial','dataFinal'];
                ids.forEach(id => { 
                    const el = document.getElementById(id); 
                    if (el) el.value=''; 
                });
                this.modoFiltroData = 'geracao';
                this.atualizarBotoesModo();
                this.aplicarFiltros();
            });
        }

        // Botões de modo de data
        this.modoFiltroData = 'geracao';
        const btnGeracao = document.getElementById('btnDataGeracao');
        const btnVenc = document.getElementById('btnDataVencimento');
        
        if (btnGeracao) {
            btnGeracao.addEventListener('click', () => { 
                this.modoFiltroData='geracao'; 
                this.atualizarBotoesModo(); 
                this.aplicarFiltros(); 
            });
        }
        
        if (btnVenc) {
            btnVenc.addEventListener('click', () => { 
                this.modoFiltroData='vencimento'; 
                this.atualizarBotoesModo(); 
                this.aplicarFiltros(); 
            });
        }
        
        this.atualizarBotoesModo();

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

    atualizarBotoesModo() {
        const btnGeracao = document.getElementById('btnDataGeracao');
        const btnVenc = document.getElementById('btnDataVencimento');
        
        if (btnGeracao && btnVenc) {
            const ativo = 'height:32px; width:120px; padding:0 10px; border:1.5px solid #90caf9; border-radius:6px; background:#1976D2; color:#fff; font-size:0.9em; cursor:pointer;';
            const inativo = 'height:32px; width:120px; padding:0 10px; border:1.5px solid #90caf9; border-radius:6px; background:#f4faff; color:#1565c0; font-size:0.9em; cursor:pointer;';
            btnGeracao.setAttribute('style', this.modoFiltroData==='geracao' ? ativo : inativo);
            btnVenc.setAttribute('style', this.modoFiltroData==='vencimento' ? ativo : inativo);
        }
    }

    capturarFiltros() {
        this.filtros.dataInicio = document.getElementById('dataInicial')?.value || '';
        this.filtros.dataFim = document.getElementById('dataFinal')?.value || '';
        this.filtros.colaborador = document.getElementById('filtroColaborador')?.value || '';
        this.filtros.tipo = document.getElementById('filtroTipo')?.value || '';
        this.filtros.produto = document.getElementById('filtroProduto')?.value || '';
    }

    aplicarFiltros() {
        this.capturarFiltros();
        
        let movimentosFiltrados = [...this.movimentos];

        // Filtro por data
        if (this.filtros.dataInicio) {
            movimentosFiltrados = movimentosFiltrados.filter(m => {
                const base = this.modoFiltroData === 'vencimento' ? m.data_vencimento : m.data_geracao;
                return base ? new Date(base) >= new Date(this.filtros.dataInicio) : true;
            });
        }
        if (this.filtros.dataFim) {
            movimentosFiltrados = movimentosFiltrados.filter(m => {
                const base = this.modoFiltroData === 'vencimento' ? m.data_vencimento : m.data_geracao;
                return base ? new Date(base) <= new Date(this.filtros.dataFim) : true;
            });
        }

        // Filtro por colaborador
        if (this.filtros.colaborador && this.filtros.colaborador !== 'todos') {
            movimentosFiltrados = movimentosFiltrados.filter(m => 
                m.colaborador_id === this.filtros.colaborador
            );
        }

        // Filtro por tipo
        if (this.filtros.tipo) {
            if (this.filtros.tipo === 'produtos') {
                movimentosFiltrados = movimentosFiltrados.filter(m => 
                    m.tipo === 'PRODUTO'
                );
            } else if (this.filtros.tipo === 'servicos') {
                movimentosFiltrados = movimentosFiltrados.filter(m => 
                    m.tipo === 'SERVICO'
                );
            }
        }

        // Filtro por produto
        if (this.filtros.produto && this.filtros.produto !== 'todos') {
            movimentosFiltrados = movimentosFiltrados.filter(m => {
                if (!m.item_id) return false;
                const itemIds = m.item_id.split(',');
                return itemIds.some(itemId => {
                    const parts = itemId.trim().split('-');
                    if (parts.length >= 2) {
                        const nomeProduto = parts.slice(1).join('-');
                        return nomeProduto === this.filtros.produto;
                    }
                    return false;
                });
            });
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
        
        // Funil de Vendas
        this.atualizarGraficoFunil(movimentos);
    }

    atualizarGraficoStatus(movimentos) {
        // Agrupar por produto (usando item_id para extrair nome do produto)
        const produtoVendas = {};
        
        movimentos.forEach(m => {
            if (m.item_id) {
                // Extrair nome do produto do item_id (formato: "00001-NOME_DO_PRODUTO")
                const itemIds = m.item_id.split(',');
                itemIds.forEach(itemId => {
                    const parts = itemId.trim().split('-');
                    if (parts.length >= 2) {
                        const nomeProduto = parts.slice(1).join('-'); // Pega tudo após o primeiro hífen
                        // Contar quantidade de vendas (não valor)
                        produtoVendas[nomeProduto] = (produtoVendas[nomeProduto] || 0) + 1;
                    }
                });
            }
        });

        // Ordenar por quantidade e pegar top 10
        const sortedProdutos = Object.entries(produtoVendas)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);

        const labels = sortedProdutos.map(([nome]) => nome);
        const values = sortedProdutos.map(([, quantidade]) => quantidade);

        const ctx = document.getElementById('statusChart');
        if (ctx && window.statusChart) {
            window.statusChart.data.labels = labels;
            window.statusChart.data.datasets[0].data = values;
            window.statusChart.update();
        }
    }

    atualizarGraficoColaboradores(movimentos) {
        const colaboradorVendas = {};
        
        movimentos.forEach(m => {
            const colab = this.colaboradores.find(c => c.codigo === m.colaborador_id);
            const nome = colab?.nome || 'N/A';
            // Contar quantidade de vendas (não valor)
            colaboradorVendas[nome] = (colaboradorVendas[nome] || 0) + 1;
        });

        // Ordenar por quantidade e pegar top 10
        const sortedColaboradores = Object.entries(colaboradorVendas)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);

        const labels = sortedColaboradores.map(([nome]) => nome);
        const values = sortedColaboradores.map(([, quantidade]) => quantidade);

        const ctx = document.getElementById('collaboratorChart');
        if (ctx && window.collaboratorChart) {
            window.collaboratorChart.data.labels = labels;
            window.collaboratorChart.data.datasets[0].data = values;
            window.collaboratorChart.update();
        }
    }

    atualizarGraficoMensal(movimentos) {
        const monthlyTotals = {};
        movimentos.forEach(m => {
            const base = this.modoFiltroData === 'vencimento' ? m.data_vencimento : m.data_geracao;
            if (!base) return;
            const data = new Date(base);
            const mesAno = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
            const valor = Number(m.valor) || 0;
            monthlyTotals[mesAno] = (monthlyTotals[mesAno] || 0) + valor;
        });

        // Ordenar por data
        const sortedEvolucao = Object.entries(monthlyTotals)
            .sort(([a], [b]) => a.localeCompare(b));

        const labels = sortedEvolucao.map(([mesAno]) => {
            const [ano, mes] = mesAno.split('-');
            const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            return `${meses[parseInt(mes) - 1]}/${ano}`;
        });
        const values = sortedEvolucao.map(([, valor]) => valor);

        const ctx = document.getElementById('monthlyChart');
        if (ctx && window.monthlyChart) {
            window.monthlyChart.data.labels = labels;
            window.monthlyChart.data.datasets[0].data = values;
            window.monthlyChart.update();
        }
    }

    atualizarGraficoFunil(movimentos) {
        // Criar dados do funil de vendas baseado nos movimentos
        const funilData = {
            'Leads': 0,
            'Oportunidades': 0,
            'Propostas': 0,
            'Negociações': 0,
            'Fechamentos': 0,
            'Vendas Concluídas': 0
        };

        // Analisar cada movimento para categorizar no funil
        movimentos.forEach(m => {
            const valorVenda = Number(m.valor_venda) || 0;
            const status = m.status?.toLowerCase() || '';
            
            // Categorizar baseado no status e valor
            if (status === 'pendente') {
                if (valorVenda < 1000) {
                    funilData['Leads'] += valorVenda;
                } else if (valorVenda < 5000) {
                    funilData['Oportunidades'] += valorVenda;
                } else {
                    funilData['Propostas'] += valorVenda;
                }
            } else if (status === 'pago') {
                if (valorVenda < 2000) {
                    funilData['Negociações'] += valorVenda;
                } else if (valorVenda < 10000) {
                    funilData['Fechamentos'] += valorVenda;
                } else {
                    funilData['Vendas Concluídas'] += valorVenda;
                }
            } else if (status === 'cancelado') {
                // Movimentos cancelados não entram no funil
                return;
            }
        });

        // Preparar dados para o gráfico
        const labels = Object.keys(funilData);
        const values = Object.values(funilData);

        // Atualizar o gráfico
        const ctx = document.getElementById('funnelChart');
        if (ctx && window.funnelChart) {
            window.funnelChart.data.labels = labels;
            window.funnelChart.data.datasets[0].data = values;
            window.funnelChart.update();
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

    mostrarSpinner() {
        const spinner = document.getElementById('loader-consulta');
        if (spinner) {
            spinner.style.display = 'flex';
        }
    }

    ocultarSpinner() {
        const spinner = document.getElementById('loader-consulta');
        if (spinner) {
            spinner.style.display = 'none';
        }
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
