const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { 
    getProductos, 
    agregarProducto, 
    reabastecerStock, 
    eliminarProducto,
    editarProducto,
    agregarProductoRapido
} = require('../controllers/productoController');

router.get('/productos', getProductos);
router.post('/productos/agregar', upload.single('imagen'), agregarProducto);
router.put('/productos/reabastecer', reabastecerStock);
router.delete('/productos/eliminar/:id', eliminarProducto);
router.put('/productos/editar/:id', upload.single('imagen'), editarProducto); // ← AGREGAR upload.single
router.post('/productos/agregar-rapido', agregarProductoRapido);

module.exports = router;