/* Realtime Bus compartilhado
 * - Inicializa Supabase com window.REALTIME_CONFIG
 * - Assina tabelas e emite CustomEvent 'db:<tabela>'
 * - Fallback: se perder conexão, tenta reconnect com backoff e dispara 'realtime:status'
 */
(function realtimeBus(){
  if (window.realtimeBus) return;

  const DEFAULT_TABLES = ['movimento_comissoes','colaboradores','clientes','produtos','servicos'];
  const state = {
    supabase: null,
    channels: new Map(),
    connected: false,
    retryMs: 1000,
  };

  function dispatch(name, detail) {
    try { window.dispatchEvent(new CustomEvent(name, { detail })); } catch (e) { /* noop */ }
  }

  function initClient() {
    console.log('[realtime-bus] Inicializando cliente...');
    console.log('[realtime-bus] REALTIME_CONFIG:', window.REALTIME_CONFIG);
    
    if (!window.REALTIME_CONFIG || !window.REALTIME_CONFIG.url || !window.REALTIME_CONFIG.anonKey) {
      console.error('[realtime-bus] REALTIME_CONFIG ausente. Defina SUPABASE_URL e SUPABASE_ANON_KEY.');
      return null;
    }
    if (!window.supabase || !window.supabase.createClient) {
      console.error('[realtime-bus] supabase-js não encontrado. Inclua a CDN antes deste script.');
      return null;
    }
    
    console.log('[realtime-bus] Criando cliente Supabase...');
    state.supabase = window.supabase.createClient(window.REALTIME_CONFIG.url, window.REALTIME_CONFIG.anonKey);
    console.log('[realtime-bus] Cliente criado:', state.supabase);
    return state.supabase;
  }

  function subscribeTable(table) {
    if (state.channels.has(table)) return state.channels.get(table);
    if (!state.supabase && !initClient()) return null;

    console.log(`[realtime-bus] Assinando tabela: ${table}`);
    const channel = state.supabase
      .channel(`${table}-changes`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
        console.log(`[realtime-bus] Evento recebido para ${table}:`, payload);
        dispatch(`db:${table}`, payload);
      })
      .subscribe((status) => {
        console.log(`[realtime-bus] Status da conexão para ${table}:`, status);
        state.connected = status === 'SUBSCRIBED';
        dispatch('realtime:status', { connected: state.connected, table });
      });

    state.channels.set(table, channel);
    return channel;
  }

  function subscribeTables(tables) {
    (tables || DEFAULT_TABLES).forEach(subscribeTable);
  }

  window.realtimeBus = { subscribeTable, subscribeTables };

  // Auto-subscribe padrões quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('[realtime-bus] DOM carregado, iniciando assinaturas...');
      subscribeTables(DEFAULT_TABLES);
    });
  } else {
    console.log('[realtime-bus] DOM já carregado, iniciando assinaturas...');
    subscribeTables(DEFAULT_TABLES);
  }
})();


