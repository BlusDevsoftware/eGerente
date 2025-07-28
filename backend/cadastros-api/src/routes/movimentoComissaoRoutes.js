const express = require('express');
const router = express.Router();
const movimentoComissaoController = require('../controllers/movimentoComissaoController');

// Listar todos os movimentos
router.get('/movimento_comissoes', movimentoComissaoController.listarMovimentos);

// Buscar movimento por ID
router.get('/movimento_comissoes/:id', movimentoComissaoController.buscarMovimento);

// Criar novo movimento
router.post('/movimento_comissoes', movimentoComissaoController.criarMovimento);

// Atualizar movimento
router.put('/movimento_comissoes/:id', movimentoComissaoController.atualizarMovimento);

// Excluir movimento
router.delete('/movimento_comissoes/:id', movimentoComissaoController.excluirMovimento);

// Buscar produtos de um título específico
router.get('/movimento_comissoes/:id/produtos', movimentoComissaoController.buscarProdutosTitulo);

module.exports = router; 