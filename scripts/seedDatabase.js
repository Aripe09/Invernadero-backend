const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');

if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');

    envFile.split(/\r?\n/).forEach((line) => {
        const cleanLine = line.trim();
        if (!cleanLine || cleanLine.startsWith('#')) return;

        const separatorIndex = cleanLine.indexOf('=');
        if (separatorIndex === -1) return;

        const key = cleanLine.slice(0, separatorIndex).trim();
        const value = cleanLine.slice(separatorIndex + 1).trim();

        if (key && process.env[key] === undefined) {
            process.env[key] = value;
        }
    });
}

const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'invernadero.db',
    multipleStatements: true
};

const categorias = [
    'Interior',
    'Exterior',
    'Suculentas',
    'Macetas y accesorios'
];

const usuarios = [
    ['Administrador', 'admin', '1234', 'administrador', 1],
    ['Valeria Gomez', 'valeria', '1234', 'empleado', 1],
    ['Carlos Rivera', 'carlos', '1234', 'empleado', 1]
];

const productos = [
    ['Monstera deliciosa', 'Planta tropical de hojas grandes para interior.', 380.00, 18, 'Grande', 'http://localhost:3002/uploads/monstera.jpg', 'Interior'],
    ['Pothos dorado', 'Planta colgante resistente y facil de cuidar.', 160.00, 32, 'Mediano', 'http://localhost:3002/uploads/pothos.jpg', 'Interior'],
    ['Sansevieria', 'Lengua de suegra ideal para interiores con poca luz.', 220.00, 24, 'Mediano', 'http://localhost:3002/uploads/sansevieria.jpg', 'Interior'],
    ['Lavanda', 'Planta aromatica de exterior con flores moradas.', 95.00, 45, 'Chico', 'http://localhost:3002/uploads/lavanda.jpg', 'Exterior'],
    ['Rosal mini', 'Rosal compacto para jardin o balcon.', 140.00, 20, 'Chico', 'http://localhost:3002/uploads/rosal.jpg', 'Exterior'],
    ['Echeveria', 'Suculenta decorativa de bajo mantenimiento.', 75.00, 60, 'Chico', 'http://localhost:3002/uploads/echeveria.jpg', 'Suculentas'],
    ['Cactus barril', 'Cactus pequeno resistente al sol directo.', 110.00, 35, 'Chico', 'http://localhost:3002/uploads/cactus.jpg', 'Suculentas'],
    ['Maceta barro mediana', 'Maceta artesanal para plantas medianas.', 130.00, 40, 'Mediano', 'http://localhost:3002/uploads/maceta-barro.jpg', 'Macetas y accesorios'],
    ['Sustrato universal 5 kg', 'Mezcla lista para plantas de interior y exterior.', 85.00, 50, 'Bolsa 5 kg', 'http://localhost:3002/uploads/sustrato.jpg', 'Macetas y accesorios'],
    ['Helecho Boston', 'Helecho frondoso para zonas humedas e iluminadas.', 210.00, 16, 'Mediano', 'http://localhost:3002/uploads/helecho.jpg', 'Interior']
];

const ventas = [
    ['Monstera deliciosa', 760.00, 'valeria', 'efectivo', 'LP-2026-0001', '2026-05-24 10:35:00'],
    ['Pothos dorado', 160.00, 'carlos', 'tarjeta', 'LP-2026-0002', '2026-05-24 12:15:00'],
    ['Echeveria', 225.00, 'valeria', 'efectivo', 'LP-2026-0003', '2026-05-25 09:22:00'],
    ['Lavanda', 190.00, 'carlos', 'efectivo', 'LP-2026-0004', '2026-05-26 16:40:00'],
    ['Sansevieria', 220.00, 'valeria', 'tarjeta', 'LP-2026-0005', '2026-05-27 11:05:00'],
    ['Maceta barro mediana', 260.00, 'carlos', 'efectivo', 'LP-2026-0006', '2026-05-28 14:18:00'],
    ['Sustrato universal 5 kg', 255.00, 'valeria', 'tarjeta', 'LP-2026-0007', '2026-05-29 17:30:00'],
    ['Rosal mini', 280.00, 'carlos', 'efectivo', 'LP-2026-0008', '2026-05-30 10:10:00']
];

const detalles = [
    ['LP-2026-0001', 'Monstera deliciosa', 2, 380.00],
    ['LP-2026-0002', 'Pothos dorado', 1, 160.00],
    ['LP-2026-0003', 'Echeveria', 3, 75.00],
    ['LP-2026-0004', 'Lavanda', 2, 95.00],
    ['LP-2026-0005', 'Sansevieria', 1, 220.00],
    ['LP-2026-0006', 'Maceta barro mediana', 2, 130.00],
    ['LP-2026-0007', 'Sustrato universal 5 kg', 3, 85.00],
    ['LP-2026-0008', 'Rosal mini', 2, 140.00]
];

const contar = async (db, tabla) => {
    const [rows] = await db.query(`SELECT COUNT(*) AS total FROM ${tabla}`);
    return rows[0].total;
};

const insertarSiVacio = async (db, tabla, sql, datos) => {
    const total = await contar(db, tabla);

    if (total > 0) {
        console.log(`${tabla}: ya tenia ${total} registros, no se duplico.`);
        return total;
    }

    await db.query(sql, [datos]);
    console.log(`${tabla}: se insertaron ${datos.length} registros.`);
    return datos.length;
};

const asegurarCategorias = async (db) => {
    let insertados = 0;

    for (const nombre of categorias) {
        const [rows] = await db.query('SELECT id_categoria FROM categorias WHERE nombre = ? LIMIT 1', [nombre]);
        if (!rows.length) {
            await db.query('INSERT INTO categorias (nombre) VALUES (?)', [nombre]);
            insertados += 1;
        }
    }

    console.log(`categorias: ${insertados} nuevas, ${categorias.length - insertados} ya existian.`);
};

const asegurarUsuarios = async (db) => {
    let insertados = 0;

    for (const usuario of usuarios) {
        const [rows] = await db.query('SELECT id_usuario FROM usuarios WHERE username = ? LIMIT 1', [usuario[1]]);
        if (!rows.length) {
            await db.query(
                'INSERT INTO usuarios (nombre, username, password, rol, activo) VALUES (?, ?, ?, ?, ?)',
                usuario
            );
            insertados += 1;
        }
    }

    console.log(`usuarios: ${insertados} nuevos, ${usuarios.length - insertados} ya existian.`);
};

const asegurarProductos = async (db) => {
    let insertados = 0;

    for (const producto of productos) {
        const [rows] = await db.query('SELECT id_producto FROM productos WHERE nombre = ? LIMIT 1', [producto[0]]);
        if (!rows.length) {
            const [categoriaRows] = await db.query('SELECT id_categoria FROM categorias WHERE nombre = ? LIMIT 1', [producto[6]]);
            const idCategoria = categoriaRows[0]?.id_categoria || null;

            await db.query(
                'INSERT INTO productos (nombre, descripcion, precio, stock, tamano, imagen_url, id_categoria) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [producto[0], producto[1], producto[2], producto[3], producto[4], producto[5], idCategoria]
            );
            insertados += 1;
        }
    }

    console.log(`productos: ${insertados} nuevos, ${productos.length - insertados} ya existian.`);
};

const obtenerUsuarioPorUsername = async (db, username) => {
    const [rows] = await db.query('SELECT id_usuario, nombre FROM usuarios WHERE username = ? LIMIT 1', [username]);
    if (rows.length) return rows[0];

    const [admin] = await db.query('SELECT id_usuario, nombre FROM usuarios ORDER BY id_usuario LIMIT 1');
    return admin[0];
};

const obtenerProductoPorNombre = async (db, nombre) => {
    const [rows] = await db.query('SELECT id_producto FROM productos WHERE nombre = ? LIMIT 1', [nombre]);
    return rows[0];
};

const asegurarVentas = async (db) => {
    const total = await contar(db, 'ventas');

    if (total > 0) {
        console.log(`ventas: ya tenia ${total} registros, no se duplico.`);
        return;
    }

    for (const venta of ventas) {
        const vendedor = await obtenerUsuarioPorUsername(db, venta[2]);
        await db.query(
            'INSERT INTO ventas (producto_nombre, total, vendedor_nombre, metodo_pago, id_vendedor, folio, fecha_venta) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [venta[0], venta[1], vendedor.nombre, venta[3], vendedor.id_usuario, venta[4], venta[5]]
        );
    }

    console.log(`ventas: se insertaron ${ventas.length} registros.`);
};

const asegurarDetalles = async (db) => {
    const total = await contar(db, 'detalle_ventas');

    if (total > 0) {
        console.log(`detalle_ventas: ya tenia ${total} registros, no se duplico.`);
        return;
    }

    for (const detalle of detalles) {
        const [ventaRows] = await db.query('SELECT id_venta FROM ventas WHERE folio = ? LIMIT 1', [detalle[0]]);
        const producto = await obtenerProductoPorNombre(db, detalle[1]);

        if (ventaRows.length && producto) {
            await db.query(
                'INSERT INTO detalle_ventas (id_venta, id_producto, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
                [ventaRows[0].id_venta, producto.id_producto, detalle[2], detalle[3]]
            );
        }
    }

    console.log(`detalle_ventas: se insertaron ${detalles.length} registros.`);
};

const main = async () => {
    const db = await mysql.createConnection(config);

    try {
        await db.beginTransaction();

        await asegurarCategorias(db);
        await asegurarUsuarios(db);
        await asegurarProductos(db);
        await asegurarVentas(db);
        await asegurarDetalles(db);

        await db.commit();

        const [resumen] = await db.query(`
            SELECT 'categorias' AS tabla, COUNT(*) AS total FROM categorias
            UNION ALL SELECT 'usuarios', COUNT(*) FROM usuarios
            UNION ALL SELECT 'productos', COUNT(*) FROM productos
            UNION ALL SELECT 'ventas', COUNT(*) FROM ventas
            UNION ALL SELECT 'detalle_ventas', COUNT(*) FROM detalle_ventas
        `);

        console.table(resumen);
    } catch (err) {
        await db.rollback();
        throw err;
    } finally {
        await db.end();
    }
};

main().catch((err) => {
    console.error('No se pudo rellenar la base de datos:', err.message);
    process.exit(1);
});
