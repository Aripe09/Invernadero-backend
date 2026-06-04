const db = require('../config/db');

const syncVenta = async ({ id_producto, cantidad, producto_nombre, totalVenta, vendedor_nombre, metodo_pago, id_vendedor, folio }) => {
    if (!db.hasSyncDatabase) {
        return { skipped: true };
    }

    await db.syncPromiseQuery(
        'UPDATE productos SET stock = stock - ? WHERE id_producto = ?',
        [cantidad, id_producto]
    );

    await db.syncPromiseQuery(
        `INSERT INTO ventas (producto_nombre, total, vendedor_nombre, metodo_pago, id_vendedor, folio)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [producto_nombre, totalVenta, vendedor_nombre, metodo_pago || 'efectivo', id_vendedor, folio || null]
    );

    return { skipped: false };
};

// ========== VENDER PRODUCTO (con folio) ==========
const venderProducto = async (req, res) => {
    const { id_producto, cantidad, vendedor_nombre, producto_nombre, metodo_pago, id_vendedor, folio, precio_unitario } = req.body;
    const cantidadVenta = Number(cantidad);
    const precioPersonalizado = Number(precio_unitario);

    if (!id_producto || !cantidadVenta || cantidadVenta <= 0) {
        return res.status(400).json({ error: "Datos de venta invalidos" });
    }

    try {
        const results = await db.promiseQuery('SELECT precio, stock FROM productos WHERE id_producto = ?', [id_producto]);
        if (results.length === 0) return res.status(404).json({ error: "Producto no encontrado" });

        const { precio, stock } = results[0];
        if (stock < cantidadVenta) return res.status(400).json({ error: "Sin stock" });

        const precioVenta = !Number.isNaN(precioPersonalizado) && precioPersonalizado >= 0
            ? precioPersonalizado
            : Number(precio);
        const totalVenta = precioVenta * cantidadVenta;

        await db.promiseQuery('UPDATE productos SET stock = stock - ? WHERE id_producto = ?', [cantidadVenta, id_producto]);

        try {
            await db.promiseQuery(
                `INSERT INTO ventas (producto_nombre, total, vendedor_nombre, metodo_pago, id_vendedor, folio)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [producto_nombre, totalVenta, vendedor_nombre, metodo_pago || 'efectivo', id_vendedor, folio || null]
            );
        } catch (insertErr) {
            await db.promiseQuery('UPDATE productos SET stock = stock + ? WHERE id_producto = ?', [cantidadVenta, id_producto]);
            throw insertErr;
        }

        let syncWarning = null;
        let syncResult = { skipped: true };

        try {
            syncResult = await syncVenta({
                id_producto,
                cantidad: cantidadVenta,
                producto_nombre,
                totalVenta,
                vendedor_nombre,
                metodo_pago,
                id_vendedor,
                folio
            });
        } catch (syncErr) {
            console.error('Error sincronizando venta en base secundaria:', syncErr);
            syncWarning = syncErr.sqlMessage || syncErr.message;
        }

        res.json({
            mensaje: "Venta exitosa",
            folio,
            sincronizado: !syncResult.skipped && !syncWarning,
            advertencia_sync: syncWarning
        });
    } catch (err) {
        res.status(500).json({ error: err.sqlMessage || err.message });
    }
};

// ========== HISTORIAL DE VENTAS (con folio) ==========
const getHistorialVentas = (req, res) => {
    const fechaSql = db.isPostgres
        ? "TO_CHAR(v.fecha_venta, 'DD/MM/YYYY HH24:MI') as fecha"
        : "DATE_FORMAT(v.fecha_venta, '%d/%m/%Y %H:%i') as fecha";

    const sql = `
        SELECT v.producto_nombre, v.total, u.nombre as vendedor_nombre,
               ${fechaSql},
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
    const sql = db.isPostgres
        ? "SELECT COALESCE(SUM(total), 0) AS total FROM ventas WHERE DATE(fecha_venta) = CURRENT_DATE"
        : "SELECT IFNULL(SUM(total), 0) AS total FROM ventas WHERE DATE(fecha_venta) = CURDATE()";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results[0]);
    });
};

// ========== HISTORIAL CON FILTROS (con folio) ==========
const getHistorialVentasConFiltros = (req, res) => {
    const { fechaInicio, fechaFin, vendedor, producto, folio } = req.query;
    const fechaSql = db.isPostgres
        ? "TO_CHAR(v.fecha_venta, 'DD/MM/YYYY HH24:MI') as fecha"
        : "DATE_FORMAT(v.fecha_venta, '%d/%m/%Y %H:%i') as fecha";
    
    let sql = `
        SELECT v.producto_nombre, v.total, u.nombre as vendedor_nombre,
               ${fechaSql},
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
