const express = require('express');
const router = express.Router();
const { 
    login, 
    registrarUsuario,
    getUsuarios,
    desactivarUsuario,
    activarUsuario,
    editarUsuario,
    editarPerfil,
    eliminarUsuarioPermanente  // ← IMPORTAR LA FUNCIÓN
} = require('../controllers/usuarioController');

router.post('/login', login);
router.post('/usuarios/registrar', registrarUsuario);
router.get('/usuarios', getUsuarios);
router.delete('/usuarios/:id/desactivar', desactivarUsuario);
router.put('/usuarios/:id/activar', activarUsuario);
router.put('/usuarios/:id/editar', editarUsuario);
router.put('/perfil/:id', editarPerfil);
router.delete('/usuarios/:id/eliminar', eliminarUsuarioPermanente);  // ← AGREGAR ESTA LÍNEA

module.exports = router;