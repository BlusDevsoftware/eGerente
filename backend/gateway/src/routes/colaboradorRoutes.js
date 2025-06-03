const express = require('express');
const router = express.Router();
const {
    listarColaboradores,
    buscarColaborador,
    criarColaborador,
    atualizarColaborador,
    excluirColaborador
} = require('../controllers/colaboradorController');

// Listar todos os colaboradores
router.get('/', listarColaboradores);

// Buscar colaborador por código
router.get('/:codigo', buscarColaborador);

// Criar novo colaborador
router.post('/', criarColaborador);

// Atualizar colaborador
router.put('/:codigo', atualizarColaborador);

// Excluir colaborador
router.delete('/:codigo', excluirColaborador);

module.exports = router; 