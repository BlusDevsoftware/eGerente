// Configuração da API
const API_URL = 'https://e-gerente-backend-cadastros-api.vercel.app/api/cadastros';

// Função para fazer requisições GET
async function get(endpoint) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw { status: response.status, data: errorData };
        }
        return await response.json();
    } catch (error) {
        throw error;
    }
}

// Função para fazer requisições POST
async function post(endpoint, data) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw { status: response.status, data: errorData };
        }
        return await response.json();
    } catch (error) {
        throw error;
    }
}

// Função para fazer requisições PUT
async function put(endpoint, data) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw { status: response.status, data: errorData };
        }
        return await response.json();
    } catch (error) {
        throw error;
    }
}

// Função para fazer requisições DELETE
async function del(endpoint) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw { status: response.status, data: errorData };
        }
        return await response.json();
    } catch (error) {
        throw error;
    }
}

// Exporta as funções da API
export const api = {
    get,
    post,
    put,
    delete: del
};

// Tornar a API disponível globalmente
window.api = api; 