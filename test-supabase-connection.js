// Teste de conexão direta com Supabase
// Execute este script no console do navegador

const SUPABASE_URL = 'https://hnxjjsiwptkybhwspmvd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhueGpqc2l3cHRreWJod3NwbXZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5NzM4MTUsImV4cCI6MjA2NDU0OTgxNX0.C85U2IAaA_OKH1_JCGBagWDQfaIG1FxH_zZupuV8HV4';

console.log('=== TESTE DE CONEXÃO SUPABASE ===');

// 1. Testar conexão básica
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
console.log('Cliente Supabase criado:', supabase);

// 2. Testar consulta simples
supabase.from('colaboradores').select('*').limit(1).then(result => {
    console.log('Consulta de teste:', result);
    if (result.error) {
        console.error('Erro na consulta:', result.error);
    } else {
        console.log('✅ Conexão com banco funcionando');
    }
});

// 3. Testar Realtime
const channel = supabase
    .channel('test-realtime')
    .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'colaboradores' }, 
        (payload) => {
            console.log('✅ Evento Realtime recebido:', payload);
        }
    )
    .subscribe((status, err) => {
        console.log('Status Realtime:', status);
        if (err) {
            console.error('Erro Realtime:', err);
        }
        if (status === 'SUBSCRIBED') {
            console.log('✅ Realtime conectado com sucesso!');
        } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Erro no canal Realtime - verifique permissões RLS');
        } else if (status === 'TIMED_OUT') {
            console.error('❌ Timeout na conexão Realtime');
        }
    });

// 4. Verificar configurações
console.log('URL:', SUPABASE_URL);
console.log('Anon Key:', SUPABASE_ANON_KEY.substring(0, 20) + '...');
