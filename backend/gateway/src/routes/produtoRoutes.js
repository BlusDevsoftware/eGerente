const express = require('express');
const router = express.Router();
const {
    listarProdutos,
    buscarProduto,
    criarProduto,
    atualizarProduto,
    excluirProduto,
    obterDependenciasProduto
} = require('../controllers/produtoController');

// Listar todos os produtos
router.get('/', listarProdutos);

// Buscar produto por código
router.get('/:codigo', buscarProduto);

// Criar novo produto
router.post('/', criarProduto);

// Atualizar produto
router.put('/:codigo', atualizarProduto);

// Excluir produto
router.delete('/:codigo', excluirProduto);

// Endpoint de dependências para bloqueio de exclusão
router.get('/:codigo/dependencies', obterDependenciasProduto);

module.exports = router; 