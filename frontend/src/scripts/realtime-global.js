// Realtime Global - Conecta todas as páginas ao realtime
(function initGlobalRealtime() {
  console.log('[realtime-global] Inicializando...');
  
  // Aguardar DOM e realtime-bus estarem prontos
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
    // Listener para movimento_comissoes - atualiza páginas que exibem comissões
    window.addEventListener('db:movimento_comissoes', async (ev) => {
      console.log('[realtime-global] Evento movimento_comissoes:', ev.detail);
      
      // Se estiver na página de consulta, recarregar dados
      if (typeof consultaComissao !== 'undefined' && consultaComissao) {
        console.log('[realtime-global] Atualizando página de consulta...');
        try {
          await consultaComissao.carregarMovimentos();
          consultaComissao.renderizarTabelaBuilder();
        } catch (e) {
          console.error('[realtime-global] Erro ao atualizar consulta:', e);
        }
      }
      
      // Se estiver na página de movimento, recarregar dados
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
      
      // Se estiver no dashboard, recarregar dados
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
      console.log('[realtime-global] Evento colaboradores:', ev.detail);
      
      // Atualizar selects de colaboradores em todas as páginas
      const selects = document.querySelectorAll('select[name*="colaborador"], select[id*="colaborador"]');
      selects.forEach(select => {
        if (select.choicesInstance) {
          // Se usar Choices.js, recarregar
          if (typeof recarregarSelectColaboradores === 'function') {
            recarregarSelectColaboradores(select);
          }
        }
      });
    });
    
    // Listener para clientes - atualiza selects e listas
    window.addEventListener('db:clientes', async (ev) => {
      console.log('[realtime-global] Evento clientes:', ev.detail);
      
      // Atualizar selects de clientes em todas as páginas
      const selects = document.querySelectorAll('select[name*="cliente"], select[id*="cliente"]');
      selects.forEach(select => {
        if (select.choicesInstance) {
          // Se usar Choices.js, recarregar
          if (typeof recarregarSelectClientes === 'function') {
            recarregarSelectClientes(select);
          }
        }
      });
    });
    
    // Listener para produtos - atualiza selects e listas
    window.addEventListener('db:produtos', async (ev) => {
      console.log('[realtime-global] Evento produtos:', ev.detail);
      
      // Atualizar selects de produtos em todas as páginas
      const selects = document.querySelectorAll('select[name*="produto"], select[id*="produto"]');
      selects.forEach(select => {
        if (select.choicesInstance) {
          // Se usar Choices.js, recarregar
          if (typeof recarregarSelectProdutos === 'function') {
            recarregarSelectProdutos(select);
          }
        }
      });
    });
    
    // Listener para serviços - atualiza selects e listas
    window.addEventListener('db:servicos', async (ev) => {
      console.log('[realtime-global] Evento servicos:', ev.detail);
      
      // Atualizar selects de serviços em todas as páginas
      const selects = document.querySelectorAll('select[name*="servico"], select[id*="servico"]');
      selects.forEach(select => {
        if (select.choicesInstance) {
          // Se usar Choices.js, recarregar
          if (typeof recarregarSelectServicos === 'function') {
            recarregarSelectServicos(select);
          }
        }
      });
    });
    
    console.log('[realtime-global] Listeners configurados com sucesso');
  }
  
  // Inicializar quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForRealtime);
  } else {
    waitForRealtime();
  }
})();
