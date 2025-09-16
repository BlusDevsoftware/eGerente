// Realtime Global - Sistema de sincronização para todas as páginas
(function initGlobalRealtime() {
  console.log('[realtime-global] Inicializando sistema de sincronização global...');
  
  let isInitialized = false;
  
  // Centro simples de notificações (badge no sino + toast)
  const NotificationCenter = (function(){
    function getCurrentUser(){
      try { return window.authGuard?.getCurrentUser?.(); } catch(_) { return null; }
    }
    function storageKey(){
      const user = getCurrentUser();
      return user ? `notifications:${user.codigo}` : null;
    }
    function readList(){
      try {
        const key = storageKey();
        if (!key) return [];
        return JSON.parse(localStorage.getItem(key) || '[]');
      } catch(_) { return []; }
    }
    function writeList(list){
      const key = storageKey();
      if (!key) return;
      try { localStorage.setItem(key, JSON.stringify(list)); } catch(_) {}
      updateBadge();
    }
    function add(notification){
      const list = readList();
      list.unshift({ id: Date.now(), read: false, createdAt: new Date().toISOString(), ...notification });
      writeList(list);
      showToast(notification);
    }
    function countUnread(){ return readList().filter(n => !n.read).length; }
    function updateBadge(){
      const badge = document.querySelector('.notifications .badge');
      if (!badge) return;
      const c = countUnread();
      badge.textContent = String(c);
      badge.style.display = c > 0 ? '' : 'none';
    }
    function markAllRead(){
      const list = readList().map(n => ({ ...n, read: true }));
      writeList(list);
    }
    function showToast(n){
      try {
        const containerId = 'notification-toast-container';
        let container = document.getElementById(containerId);
        if (!container) {
          container = document.createElement('div');
          container.id = containerId;
          container.style.position = 'fixed';
          container.style.bottom = '20px';
          container.style.right = '20px';
          container.style.zIndex = '5000';
          container.style.display = 'flex';
          container.style.flexDirection = 'column';
          container.style.gap = '8px';
          document.body.appendChild(container);
        }
        const toast = document.createElement('div');
        toast.style.cssText = 'background:#fff;border:1px solid #e3f2fd;border-radius:10px;box-shadow:0 4px 16px rgba(33,150,243,0.15);padding:10px 12px;min-width:240px;max-width:360px;display:flex;gap:8px;align-items:flex-start;';
        toast.innerHTML = `
          <i class="fas fa-bell" style="color:#1976D2;margin-top:2px;"></i>
          <div style="flex:1;">
            <div style="font-weight:700;color:#1976D2;font-size:0.95em;">${n.title || 'Notificação'}</div>
            <div style="color:#333;font-size:0.9em;">${n.message || ''}</div>
          </div>
          <button title="Fechar" style="background:none;border:none;color:#666;cursor:pointer;font-size:1.1em;">&times;</button>
        `;
        toast.querySelector('button[title="Fechar"]').onclick = () => toast.remove();
        container.appendChild(toast);
        setTimeout(() => { try { toast.remove(); } catch(_) {} }, 5000);
      } catch(_) {}
    }
    return { add, updateBadge, markAllRead };
  })();
  
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
      try {
        const payload = ev.detail || {};
        const eventType = payload.eventType || payload.type || payload.action;
        const dataNew = payload.new || payload.record || (payload.data && payload.data.new) || null;
        const currentUser = window.authGuard?.getCurrentUser?.();
        if (eventType === 'INSERT' && dataNew && currentUser && String(dataNew.colaborador_id) === String(currentUser.codigo)) {
          NotificationCenter.add({
            type: 'titulo_lancado',
            title: 'Novo título lançado',
            message: `Título ${dataNew.numero_titulo || ''} disponível para você.`,
            data: { id: dataNew.id, numero_titulo: dataNew.numero_titulo }
          });
        }
      } catch (e) {
        console.warn('[realtime-global] Falha ao processar notificação de novo título:', e);
      }
      
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
      
      // Página de colaboradores - atualização seletiva (não recarrega)
      if (window.location.pathname.includes('colaboradores.html')) {
        console.log('[realtime-global] Atualizando página de colaboradores seletivamente...');
        await updateColaboradoresPage();
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
      
      // Página de clientes - atualização seletiva (não recarrega)
      if (window.location.pathname.includes('clientes.html')) {
        console.log('[realtime-global] Atualizando página de clientes seletivamente...');
        await updateClientesPage();
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
      
      // Página de produtos - atualização seletiva (não recarrega)
      if (window.location.pathname.includes('produtos.html')) {
        console.log('[realtime-global] Atualizando página de produtos seletivamente...');
        await updateProdutosPage();
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
      
      // Página de serviços - atualização seletiva (não recarrega)
      if (window.location.pathname.includes('servicos.html')) {
        console.log('[realtime-global] Atualizando página de serviços seletivamente...');
        await updateServicosPage();
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
  
  // Funções de atualização seletiva para páginas de cadastro
  async function updateColaboradoresPage() {
    console.log('[realtime-global] Atualizando página de colaboradores seletivamente...');
    try {
      // Recarregar dados dos colaboradores sem recarregar a página
      if (typeof carregarColaboradores === 'function') {
        await carregarColaboradores();
        console.log('[realtime-global] ✅ Dados de colaboradores atualizados');
      }
      
      // Atualizar tabela se existir
      if (typeof renderizarTabelaColaboradores === 'function') {
        renderizarTabelaColaboradores();
        console.log('[realtime-global] ✅ Tabela de colaboradores atualizada');
      }
    } catch (e) {
      console.error('[realtime-global] Erro ao atualizar página de colaboradores:', e);
    }
  }
  
  async function updateClientesPage() {
    console.log('[realtime-global] Atualizando página de clientes seletivamente...');
    try {
      // Recarregar dados dos clientes sem recarregar a página
      if (typeof carregarClientes === 'function') {
        await carregarClientes();
        console.log('[realtime-global] ✅ Dados de clientes atualizados');
      }
      
      // Atualizar tabela se existir
      if (typeof renderizarTabelaClientes === 'function') {
        renderizarTabelaClientes();
        console.log('[realtime-global] ✅ Tabela de clientes atualizada');
      }
    } catch (e) {
      console.error('[realtime-global] Erro ao atualizar página de clientes:', e);
    }
  }
  
  async function updateProdutosPage() {
    console.log('[realtime-global] Atualizando página de produtos seletivamente...');
    try {
      // Recarregar dados dos produtos sem recarregar a página
      if (typeof carregarProdutos === 'function') {
        await carregarProdutos();
        console.log('[realtime-global] ✅ Dados de produtos atualizados');
      }
      
      // Atualizar tabela se existir
      if (typeof renderizarTabelaProdutos === 'function') {
        renderizarTabelaProdutos();
        console.log('[realtime-global] ✅ Tabela de produtos atualizada');
      }
    } catch (e) {
      console.error('[realtime-global] Erro ao atualizar página de produtos:', e);
    }
  }
  
  async function updateServicosPage() {
    console.log('[realtime-global] Atualizando página de serviços seletivamente...');
    try {
      // Recarregar dados dos serviços sem recarregar a página
      if (typeof carregarServicos === 'function') {
        await carregarServicos();
        console.log('[realtime-global] ✅ Dados de serviços atualizados');
      }
      
      // Atualizar tabela se existir
      if (typeof renderizarTabelaServicos === 'function') {
        renderizarTabelaServicos();
        console.log('[realtime-global] ✅ Tabela de serviços atualizada');
      }
    } catch (e) {
      console.error('[realtime-global] Erro ao atualizar página de serviços:', e);
    }
  }
  
  // Inicializar quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForRealtime);
    document.addEventListener('DOMContentLoaded', () => { try { NotificationCenter.updateBadge(); } catch(_) {} });
  } else {
    waitForRealtime();
    try { NotificationCenter.updateBadge(); } catch(_) {}
  }
})();