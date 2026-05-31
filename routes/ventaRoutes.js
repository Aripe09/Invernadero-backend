const express = require('express');
const router = express.Router();
const { 
    venderProducto, 
    getHistorialVentas, 
    getGananciasHoy,
    getHistorialVentasConFiltros,  // NUEVA
    getVendedores,                  // NUEVA
    getProductosVendidos            // NUEVA
} = require('../controllers/ventaController');

// Rutas originales
router.post('/productos/vender', venderProducto);
router.get('/historial-ventas', getHistorialVentas);
router.get('/ganancias-hoy', getGananciasHoy);

// NUEVAS RUTAS (solo agregar estas 3 líneas)
router.get('/historial-ventas/filtros', getHistorialVentasConFiltros);
router.get('/vendedores', getVendedores);
router.get('/productos-vendidos', getProductosVendidos);

module.exports = router;