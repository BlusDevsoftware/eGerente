const express = require('express');
const router = express.Router();
const movimentoComissaoController = require('../controllers/movimentoComissaoController');

// Rotas para movimento de comissões
router.get('/', movimentoComissaoController.listarMovimentos);
router.get('/simular-proximo-numero', movimentoComissaoController.simularProximoNumeroBase);
router.get('/:id', movimentoComissaoController.buscarMovimento);
router.get('/:id/produtos', movimentoComissaoController.buscarProdutosTitulo);
router.post('/', movimentoComissaoController.criarMovimento);
router.put('/:id', movimentoComissaoController.atualizarMovimento);
router.put('/:id/comprovante', movimentoComissaoController.uploadComprovante);
router.delete('/:id', movimentoComissaoController.excluirMovimento);

module.exports = router; 