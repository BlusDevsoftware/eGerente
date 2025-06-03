const API_BASE_URL = 'https://clientes-api.vercel.app';

const API_ENDPOINTS = {
  CLIENTES: {
    BASE: '/api/clientes',
    BY_ID: (id) => `/api/clientes/${id}`,
    SEARCH: '/api/clientes/search',
    BY_CPF: (cpf) => `/api/clientes/cpf/${cpf}`
  },
  COMISSOES: {
    BASE: '/api/comissoes',
    BY_ID: (id) => `/api/comissoes/${id}`,
    BY_CLIENTE: (clienteId) => `/api/comissoes/cliente/${clienteId}`,
    BY_COLABORADOR: (colaboradorId) => `/api/comissoes/colaborador/${colaboradorId}`
  },
  CLIENTE_STATS: '/clientes/stats',
  
  // Endereços
  ENDERECOS: '/clientes/enderecos',
  ENDERECO_BY_ID: (id) => `/clientes/enderecos/${id}`,
  
  // Contatos
  CONTATOS: '/clientes/contatos',
  CONTATO_BY_ID: (id) => `/clientes/contatos/${id}`,
};

export { API_BASE_URL, API_ENDPOINTS }; 