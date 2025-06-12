const API_BASE_URL = 'https://e-gerente-backend-cadastros-api.vercel.app/api/cadastros';

const api = {
    async get(endpoint) {
        try {
            console.log(`GET ${API_BASE_URL}${endpoint}`);
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                console.error('Erro na resposta:', {
                    status: response.status,
                    statusText: response.statusText,
                    data: errorData
                });
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Resposta não é JSON');
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Erro na requisição GET:', error);
            throw error;
        }
    },

    async post(endpoint, data) {
        try {
            console.log('Enviando requisição POST para:', `${API_BASE_URL}${endpoint}`);
            console.log('Dados da requisição:', data);
            
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            console.log('Status da resposta:', response.status);
            console.log('Headers da resposta:', Object.fromEntries(response.headers.entries()));

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const responseData = await response.json();
                console.log('Resposta completa:', responseData);
                
                if (!response.ok) {
                    console.error('Erro na resposta:', responseData);
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return responseData;
            } else {
                const text = await response.text();
                console.log('Resposta não-JSON:', text);
                throw new Error('Resposta não é JSON');
            }
        } catch (error) {
            console.error('Erro na requisição POST:', error);
            throw error;
        }
    },

    async put(endpoint, data) {
        try {
            console.log('Enviando requisição PUT para:', `${API_BASE_URL}${endpoint}`);
            console.log('Dados da requisição:', data);
            
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            console.log('Status da resposta:', response.status);
            console.log('Headers da resposta:', Object.fromEntries(response.headers.entries()));

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const responseData = await response.json();
                console.log('Resposta completa:', responseData);
                
                if (!response.ok) {
                    console.error('Erro na resposta:', responseData);
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return responseData;
            } else {
                const text = await response.text();
                console.log('Resposta não-JSON:', text);
                throw new Error('Resposta não é JSON');
            }
        } catch (error) {
            console.error('Erro na requisição PUT:', error);
            throw error;
        }
    },

    async delete(endpoint) {
        try {
            console.log(`DELETE ${API_BASE_URL}${endpoint}`);
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                console.error('Erro na resposta:', {
                    status: response.status,
                    statusText: response.statusText,
                    data: errorData
                });
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Resposta não é JSON');
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Erro na requisição DELETE:', error);
            throw error;
        }
    }
};

// Tornar a API disponível globalmente
window.api = api; 