const express = require('express');
const router = express.Router();
const cadastroController = require('../controllers/cadastroController');

// Rotas genéricas para qualquer tabela
router.get('/:tabela', cadastroController.listarRegistros);
router.get('/:tabela/:codigo', cadastroController.buscarRegistro);
router.post('/:tabela', cadastroController.criarRegistro);
router.put('/:tabela/:codigo', cadastroController.atualizarRegistro);
router.delete('/:tabela/:codigo', cadastroController.excluirRegistro);

// Rota específica para alterar senha de colaborador
router.post('/colaboradores/change-password', cadastroController.alterarSenhaColaborador);

// Rotas de autenticação
router.post('/colaboradores/login', cadastroController.login);
router.post('/colaboradores/verify', cadastroController.verifyToken);

module.exports = router; 