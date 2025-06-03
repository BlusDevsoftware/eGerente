const express = require('express');
const router = express.Router();
const colaboradorController = require('../controllers/colaboradorController');

// Listar todos os colaboradores
router.get('/colaboradores', colaboradorController.listarColaboradores);

// Buscar colaborador por código
router.get('/colaboradores/:codigo', colaboradorController.buscarColaborador);

// Criar novo colaborador
router.post('/colaboradores', colaboradorController.criarColaborador);

// Atualizar colaborador
router.put('/colaboradores/:codigo', colaboradorController.atualizarColaborador);

// Excluir colaborador
router.delete('/colaboradores/:codigo', colaboradorController.excluirColaborador);

module.exports = router; 