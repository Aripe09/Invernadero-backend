const db = require('../config/db');

// ========== VENDER PRODUCTO (con folio) ==========
const venderProducto = (req, res) => {
    const { id_producto, cantidad, vendedor_nombre, producto_nombre, metodo_pago, id_vendedor, folio } = req.body;

    db.query('SELECT precio, stock FROM productos WHERE id_producto = ?', [id_producto], (err, results) => {
        if (err || results.length === 0) return res.status(500).json(err);
        const { precio, stock } = results[0];
        if (stock < cantidad) return res.status(400).json({ error: "Sin stock" });

        db.query('UPDATE productos SET stock = stock - ? WHERE id_producto = ?', [cantidad, id_producto], () => {
            const totalVenta = precio * cantidad;
            db.query(
                `INSERT INTO ventas (producto_nombre, total, vendedor_nombre, metodo_pago, id_vendedor, folio)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [producto_nombre, totalVenta, vendedor_nombre, metodo_pago || 'efectivo', id_vendedor, folio || null],
                (errV) => {
                    if (errV) return res.status(500).json(errV);
                    res.json({ mensaje: "Venta exitosa", folio: folio });
                }
            );
        });
    });
};

// ========== HISTORIAL DE VENTAS (con folio) ==========
const getHistorialVentas = (req, res) => {
    const sql = `
        SELECT v.producto_nombre, v.total, u.nombre as vendedor_nombre,
               DATE_FORMAT(v.fecha_venta, '%d/%m/%Y %H:%i') as fecha,
               v.folio
        FROM ventas v
        JOIN usuarios u ON v.id_vendedor = u.id_usuario
        ORDER BY v.fecha_venta DESC
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
};

// ========== GANANCIAS DEL DÍA ==========
const getGananciasHoy = (req, res) => {
    const sql = "SELECT IFNULL(SUM(total), 0) AS total FROM ventas WHERE DATE(fecha_venta) = CURDATE()";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results[0]);
    });
};

// ========== HISTORIAL CON FILTROS (con folio) ==========
const getHistorialVentasConFiltros = (req, res) => {
    const { fechaInicio, fechaFin, vendedor, producto, folio } = req.query;
    
    let sql = `
        SELECT v.producto_nombre, v.total, u.nombre as vendedor_nombre,
               DATE_FORMAT(v.fecha_venta, '%d/%m/%Y %H:%i') as fecha,
               v.folio
        FROM ventas v
        JOIN usuarios u ON v.id_vendedor = u.id_usuario
        WHERE 1=1
    `;
    const params = [];

    if (fechaInicio) {
        sql += ` AND DATE(v.fecha_venta) >= ?`;
        params.push(fechaInicio);
    }
    if (fechaFin) {
        sql += ` AND DATE(v.fecha_venta) <= ?`;
        params.push(fechaFin);
    }
    if (vendedor && vendedor !== 'todos') {
        sql += ` AND u.nombre = ?`;
        params.push(vendedor);
    }
    if (producto && producto !== 'todos') {
        sql += ` AND v.producto_nombre = ?`;
        params.push(producto);
    }
    if (folio && folio.trim() !== '') {
        sql += ` AND v.folio LIKE ?`;
        params.push(`%${folio}%`);
    }
    
    sql += ` ORDER BY v.fecha_venta DESC`;

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
};

// ========== OBTENER VENDEDORES ==========
const getVendedores = (req, res) => {
    const sql = `
        SELECT DISTINCT u.nombre as vendedor_nombre
        FROM ventas v
        JOIN usuarios u ON v.id_vendedor = u.id_usuario
        ORDER BY u.nombre
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results.map(r => r.vendedor_nombre));
    });
};

// ========== OBTENER PRODUCTOS VENDIDOS ==========
const getProductosVendidos = (req, res) => {
    const sql = "SELECT DISTINCT producto_nombre FROM ventas ORDER BY producto_nombre";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results.map(r => r.producto_nombre));
    });
};

module.exports = {
    venderProducto,
    getHistorialVentas,
    getGananciasHoy,
    getHistorialVentasConFiltros,
    getVendedores,
    getProductosVendidos
};