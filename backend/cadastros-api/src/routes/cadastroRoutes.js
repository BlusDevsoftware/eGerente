const express = require('express');
const router = express.Router();
const cadastroController = require('../controllers/cadastroController');

// Rotas genéricas para qualquer tabela
router.get('/:tabela', cadastroController.listarRegistros);
router.get('/:tabela/:codigo', cadastroController.buscarRegistro);
router.post('/:tabela', cadastroController.criarRegistro);
router.put('/:tabela/:codigo', cadastroController.atualizarRegistro);
router.delete('/:tabela/:codigo', cadastroController.excluirRegistro);

module.exports = router; 