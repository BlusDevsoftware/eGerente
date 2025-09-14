// Realtime Global - Sistema de sincronização para todas as páginas
(function initGlobalRealtime() {
  console.log('[realtime-global] Inicializando sistema de sincronização global...');
  
  let isInitialized = false;
  
  function waitForRealtime() {
    if (window.realtimeBus) {
      console.log('[realtime-global] Realtime bus encontrado, configurando listeners...');
      setupGlobalListeners();
    } else {
      console.log('[realtime-global] Aguardando realtime bus...');
      setTimeout(waitForRealtime, 100);
    }
  }
  
  function setupGlobalListeners() {
    if (isInitialized) return;
    isInitialized = true;
    
    console.log('[realtime-global] Configurando listeners globais...');
    
    // Listener para movimento_comissoes - atualiza páginas que exibem comissões
    window.addEventListener('db:movimento_comissoes', async (ev) => {
      console.log('[realtime-global] Evento movimento_comissoes recebido:', ev.detail);
      
      // Atualizar página de consulta de comissões
      if (typeof consultaComissao !== 'undefined' && consultaComissao) {
        console.log('[realtime-global] Atualizando página de consulta...');
        try {
          if (typeof consultaComissao.carregarMovimentos === 'function') {
            await consultaComissao.carregarMovimentos();
          }
          if (typeof consultaComissao.renderizarTabelaBuilder === 'function') {
            consultaComissao.renderizarTabelaBuilder();
          }
        } catch (e) {
          console.error('[realtime-global] Erro ao atualizar consulta:', e);
        }
      }
      
      // Atualizar página de movimento de comissões
      if (typeof movimentoComissao !== 'undefined' && movimentoComissao) {
        console.log('[realtime-global] Atualizando página de movimento...');
        try {
          if (typeof movimentoComissao.carregarMovimentos === 'function') {
            await movimentoComissao.carregarMovimentos();
          }
        } catch (e) {
          console.error('[realtime-global] Erro ao atualizar movimento:', e);
        }
      }
      
      // Atualizar página de recebimento
      if (typeof carregarTitulos === 'function') {
        console.log('[realtime-global] Atualizando página de recebimento...');
        try {
          await carregarTitulos();
        } catch (e) {
          console.error('[realtime-global] Erro ao atualizar recebimento:', e);
        }
      }
      
      // Atualizar dashboard
      if (typeof dashboard !== 'undefined' && dashboard) {
        console.log('[realtime-global] Atualizando dashboard...');
        try {
          if (typeof dashboard.carregarDados === 'function') {
            await dashboard.carregarDados();
          }
        } catch (e) {
          console.error('[realtime-global] Erro ao atualizar dashboard:', e);
        }
      }
    });
    
    // Listener para colaboradores - atualiza selects e listas
    window.addEventListener('db:colaboradores', async (ev) => {
      console.log('[realtime-global] Evento colaboradores recebido:', ev.detail);
      
      // Atualizar selects de colaboradores
      updateSelects('colaborador', 'colaboradores');
      
      // Forçar recarregamento da página de colaboradores se estiver aberta
      if (window.location.pathname.includes('colaboradores.html')) {
        console.log('[realtime-global] Recarregando página de colaboradores...');
        window.location.reload();
        return;
      }
      
      // Atualizar páginas que dependem de colaboradores
      if (typeof consultaComissao !== 'undefined' && consultaComissao) {
        try {
          if (typeof consultaComissao.carregarColaboradores === 'function') {
            await consultaComissao.carregarColaboradores();
          }
          if (typeof consultaComissao.preencherSelectColaboradores === 'function') {
            consultaComissao.preencherSelectColaboradores();
          }
        } catch (e) {
          console.error('[realtime-global] Erro ao atualizar colaboradores na consulta:', e);
        }
      }
      
      // Atualizar lançamento de comissão se estiver aberto
      if (window.location.pathname.includes('lancar-comissao.html')) {
        console.log('[realtime-global] Atualizando selects na página de lançamento...');
        // Recarregar selects de colaboradores na página de lançamento
        if (typeof carregarColaboradores === 'function') {
          await carregarColaboradores();
        }
      }
    });
    
    // Listener para clientes - atualiza selects e listas
    window.addEventListener('db:clientes', async (ev) => {
      console.log('[realtime-global] Evento clientes recebido:', ev.detail);
      
      // Atualizar selects de clientes
      updateSelects('cliente', 'clientes');
      
      // Forçar recarregamento da página de clientes se estiver aberta
      if (window.location.pathname.includes('clientes.html')) {
        console.log('[realtime-global] Recarregando página de clientes...');
        window.location.reload();
        return;
      }
      
      // Atualizar páginas que dependem de clientes
      if (typeof consultaComissao !== 'undefined' && consultaComissao) {
        try {
          if (typeof consultaComissao.carregarClientes === 'function') {
            await consultaComissao.carregarClientes();
          }
        } catch (e) {
          console.error('[realtime-global] Erro ao atualizar clientes na consulta:', e);
        }
      }
      
      // Atualizar lançamento de comissão se estiver aberto
      if (window.location.pathname.includes('lancar-comissao.html')) {
        console.log('[realtime-global] Atualizando selects na página de lançamento...');
        if (typeof carregarClientes === 'function') {
          await carregarClientes();
        }
      }
    });
    
    // Listener para produtos - atualiza selects e listas
    window.addEventListener('db:produtos', async (ev) => {
      console.log('[realtime-global] Evento produtos recebido:', ev.detail);
      
      // Atualizar selects de produtos
      updateSelects('produto', 'produtos');
      
      // Forçar recarregamento da página de produtos se estiver aberta
      if (window.location.pathname.includes('produtos.html')) {
        console.log('[realtime-global] Recarregando página de produtos...');
        window.location.reload();
        return;
      }
      
      // Atualizar páginas que dependem de produtos
      if (typeof consultaComissao !== 'undefined' && consultaComissao) {
        try {
          if (typeof consultaComissao.carregarProdutos === 'function') {
            consultaComissao.carregarProdutos();
          }
        } catch (e) {
          console.error('[realtime-global] Erro ao atualizar produtos na consulta:', e);
        }
      }
      
      // Atualizar lançamento de comissão se estiver aberto
      if (window.location.pathname.includes('lancar-comissao.html')) {
        console.log('[realtime-global] Atualizando selects na página de lançamento...');
        if (typeof carregarProdutos === 'function') {
          await carregarProdutos();
        }
      }
    });
    
    // Listener para serviços - atualiza selects e listas
    window.addEventListener('db:servicos', async (ev) => {
      console.log('[realtime-global] Evento serviços recebido:', ev.detail);
      
      // Atualizar selects de serviços
      updateSelects('servico', 'servicos');
      
      // Forçar recarregamento da página de serviços se estiver aberta
      if (window.location.pathname.includes('servicos.html')) {
        console.log('[realtime-global] Recarregando página de serviços...');
        window.location.reload();
        return;
      }
      
      // Atualizar páginas que dependem de serviços
      if (typeof consultaComissao !== 'undefined' && consultaComissao) {
        try {
          if (typeof consultaComissao.carregarServicos === 'function') {
            consultaComissao.carregarServicos();
          }
        } catch (e) {
          console.error('[realtime-global] Erro ao atualizar serviços na consulta:', e);
        }
      }
      
      // Atualizar lançamento de comissão se estiver aberto
      if (window.location.pathname.includes('lancar-comissao.html')) {
        console.log('[realtime-global] Atualizando selects na página de lançamento...');
        if (typeof carregarServicos === 'function') {
          await carregarServicos();
        }
      }
    });
    
    // Listener para status de conexão
    window.addEventListener('realtime:status', (ev) => {
      const { connected, table, status } = ev.detail;
      console.log(`[realtime-global] Status da conexão ${table}: ${status} (conectado: ${connected})`);
      
      if (connected) {
        console.log(`[realtime-global] ✅ Realtime conectado para ${table}`);
      } else {
        console.warn(`[realtime-global] ⚠️ Realtime desconectado para ${table}`);
      }
    });
    
    // Listener para erros
    window.addEventListener('realtime:error', (ev) => {
      console.error('[realtime-global] Erro no realtime:', ev.detail);
    });
    
    console.log('[realtime-global] ✅ Listeners globais configurados com sucesso');
  }
  
  function updateSelects(prefix, tableName) {
    const selects = document.querySelectorAll(`select[name*="${prefix}"], select[id*="${prefix}"]`);
    console.log(`[realtime-global] Atualizando ${selects.length} selects de ${prefix}`);
    
    selects.forEach(select => {
      // Se usar Choices.js
      if (select.choicesInstance) {
        try {
          // Recarregar dados do select
          if (typeof window[`recarregarSelect${tableName.charAt(0).toUpperCase() + tableName.slice(1)}`] === 'function') {
            window[`recarregarSelect${tableName.charAt(0).toUpperCase() + tableName.slice(1)}`](select);
          }
        } catch (e) {
          console.error(`[realtime-global] Erro ao atualizar select ${prefix}:`, e);
        }
      }
    });
  }
  
  // Inicializar quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForRealtime);
  } else {
    waitForRealtime();
  }
})();