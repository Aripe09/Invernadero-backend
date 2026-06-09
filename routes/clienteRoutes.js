const express = require('express');
const router = express.Router();

const {
    getClientes,
    agregarCliente,
    editarCliente,
    eliminarCliente
} = require('../controllers/clienteController');

router.get('/clientes', getClientes);
router.post('/clientes/agregar', agregarCliente);
router.put('/clientes/editar/:id', editarCliente);
router.delete('/clientes/eliminar/:id', eliminarCliente);

module.exports = router;
