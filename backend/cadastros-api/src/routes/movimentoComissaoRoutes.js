const express = require('express');
const router = express.Router();
const movimentoComissaoController = require('../controllers/movimentoComissaoController');

// Rotas para movimento de comissões
router.get('/movimento_comissoes', movimentoComissaoController.listarMovimentos);
router.post('/movimento_comissoes', movimentoComissaoController.criarMovimento);
// NOVO: aglutinação de títulos (deve vir antes das rotas com parâmetros)
router.post('/movimento_comissoes/aglutinar', movimentoComissaoController.aglutinarTitulos);
router.get('/movimento_comissoes/:id', movimentoComissaoController.buscarMovimento);
router.put('/movimento_comissoes/:id', movimentoComissaoController.atualizarMovimento);
router.delete('/movimento_comissoes/:id', movimentoComissaoController.excluirMovimento);
router.get('/movimento_comissoes/:id/produtos', movimentoComissaoController.buscarProdutosTitulo);
router.put('/movimento_comissoes/:id/comprovante', movimentoComissaoController.uploadComprovante);

module.exports = router; 