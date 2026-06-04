const db = require('../config/db');

const schemaMysql = `
CREATE TABLE IF NOT EXISTS categorias (
  id_categoria INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT
);

CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  rol VARCHAR(50) NOT NULL,
  activo TINYINT(1) DEFAULT 1
);

CREATE TABLE IF NOT EXISTS productos (
  id_producto INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL UNIQUE,
  precio DECIMAL(10,2) NOT NULL,
  stock INT DEFAULT 0,
  tamano VARCHAR(50),
  imagen_url TEXT,
  id_categoria INT,
  descripcion TEXT
);

CREATE TABLE IF NOT EXISTS ventas (
  id_venta INT AUTO_INCREMENT PRIMARY KEY,
  producto_nombre VARCHAR(120) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  vendedor_nombre VARCHAR(100),
  metodo_pago VARCHAR(50),
  id_vendedor INT,
  folio VARCHAR(80) UNIQUE,
  fecha_venta TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS detalle_ventas (
  id_detalle INT AUTO_INCREMENT PRIMARY KEY,
  id_venta INT,
  id_producto INT,
  cantidad INT NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL
);`;

const schemaPostgres = `
CREATE TABLE IF NOT EXISTS categorias (
  id_categoria SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT
);

CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  rol VARCHAR(50) NOT NULL,
  activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS productos (
  id_producto SERIAL PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL UNIQUE,
  precio NUMERIC(10,2) NOT NULL,
  stock INTEGER DEFAULT 0,
  tamano VARCHAR(50),
  imagen_url TEXT,
  id_categoria INTEGER,
  descripcion TEXT
);

CREATE TABLE IF NOT EXISTS ventas (
  id_venta SERIAL PRIMARY KEY,
  producto_nombre VARCHAR(120) NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  vendedor_nombre VARCHAR(100),
  metodo_pago VARCHAR(50),
  id_vendedor INTEGER,
  folio VARCHAR(80) UNIQUE,
  fecha_venta TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS detalle_ventas (
  id_detalle SERIAL PRIMARY KEY,
  id_venta INTEGER,
  id_producto INTEGER,
  cantidad INTEGER NOT NULL,
  precio_unitario NUMERIC(10,2) NOT NULL
);`;

const categorias = ['Interior', 'Exterior', 'Suculentas', 'Macetas y accesorios'];

const usuarios = [
    ['Administrador', 'admin', '1234', 'administrador', true],
    ['Valeria Gomez', 'valeria', '1234', 'empleado', true],
    ['Carlos Rivera', 'carlos', '1234', 'empleado', true]
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

const q = (sql, params = []) => db.promiseQuery(sql, params);

const asegurarEsquema = async () => {
    const schema = db.isPostgres ? schemaPostgres : schemaMysql;
    const statements = schema.split(';').map((sql) => sql.trim()).filter(Boolean);

    for (const statement of statements) {
        await q(statement);
    }
};

const contar = async (tabla) => {
    const rows = await q(`SELECT COUNT(*) AS total FROM ${tabla}`);
    return Number(rows[0].total);
};

const asegurarCategorias = async () => {
    let insertados = 0;

    for (const nombre of categorias) {
        const rows = await q('SELECT id_categoria FROM categorias WHERE nombre = ? LIMIT 1', [nombre]);
        if (!rows.length) {
            await q('INSERT INTO categorias (nombre) VALUES (?)', [nombre]);
            insertados += 1;
        }
    }

    console.log(`categorias: ${insertados} nuevas, ${categorias.length - insertados} ya existian.`);
};

const asegurarUsuarios = async () => {
    let insertados = 0;

    for (const usuario of usuarios) {
        const rows = await q('SELECT id_usuario FROM usuarios WHERE username = ? LIMIT 1', [usuario[1]]);
        if (!rows.length) {
            await q(
                'INSERT INTO usuarios (nombre, username, password, rol, activo) VALUES (?, ?, ?, ?, ?)',
                [usuario[0], usuario[1], usuario[2], usuario[3], db.bool(usuario[4])]
            );
            insertados += 1;
        }
    }

    console.log(`usuarios: ${insertados} nuevos, ${usuarios.length - insertados} ya existian.`);
};

const asegurarProductos = async () => {
    let insertados = 0;

    for (const producto of productos) {
        const rows = await q('SELECT id_producto FROM productos WHERE nombre = ? LIMIT 1', [producto[0]]);
        if (!rows.length) {
            const categoriaRows = await q('SELECT id_categoria FROM categorias WHERE nombre = ? LIMIT 1', [producto[6]]);
            const idCategoria = categoriaRows[0]?.id_categoria || null;

            await q(
                'INSERT INTO productos (nombre, descripcion, precio, stock, tamano, imagen_url, id_categoria) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [producto[0], producto[1], producto[2], producto[3], producto[4], producto[5], idCategoria]
            );
            insertados += 1;
        }
    }

    console.log(`productos: ${insertados} nuevos, ${productos.length - insertados} ya existian.`);
};

const obtenerUsuarioPorUsername = async (username) => {
    const rows = await q('SELECT id_usuario, nombre FROM usuarios WHERE username = ? LIMIT 1', [username]);
    if (rows.length) return rows[0];

    const admin = await q('SELECT id_usuario, nombre FROM usuarios ORDER BY id_usuario LIMIT 1');
    return admin[0];
};

const obtenerProductoPorNombre = async (nombre) => {
    const rows = await q('SELECT id_producto FROM productos WHERE nombre = ? LIMIT 1', [nombre]);
    return rows[0];
};

const asegurarVentas = async () => {
    const total = await contar('ventas');

    if (total > 0) {
        console.log(`ventas: ya tenia ${total} registros, no se duplico.`);
        return;
    }

    for (const venta of ventas) {
        const vendedor = await obtenerUsuarioPorUsername(venta[2]);
        await q(
            'INSERT INTO ventas (producto_nombre, total, vendedor_nombre, metodo_pago, id_vendedor, folio, fecha_venta) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [venta[0], venta[1], vendedor.nombre, venta[3], vendedor.id_usuario, venta[4], venta[5]]
        );
    }

    console.log(`ventas: se insertaron ${ventas.length} registros.`);
};

const asegurarDetalles = async () => {
    const total = await contar('detalle_ventas');

    if (total > 0) {
        console.log(`detalle_ventas: ya tenia ${total} registros, no se duplico.`);
        return;
    }

    let insertados = 0;

    for (const detalle of detalles) {
        const ventaRows = await q('SELECT id_venta FROM ventas WHERE folio = ? LIMIT 1', [detalle[0]]);
        const producto = await obtenerProductoPorNombre(detalle[1]);

        if (ventaRows.length && producto) {
            await q(
                'INSERT INTO detalle_ventas (id_venta, id_producto, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
                [ventaRows[0].id_venta, producto.id_producto, detalle[2], detalle[3]]
            );
            insertados += 1;
        }
    }

    console.log(`detalle_ventas: se insertaron ${insertados} registros.`);
};

const main = async () => {
    await asegurarEsquema();
    await asegurarCategorias();
    await asegurarUsuarios();
    await asegurarProductos();
    await asegurarVentas();
    await asegurarDetalles();

    const resumen = await q(`
        SELECT 'categorias' AS tabla, COUNT(*) AS total FROM categorias
        UNION ALL SELECT 'usuarios', COUNT(*) FROM usuarios
        UNION ALL SELECT 'productos', COUNT(*) FROM productos
        UNION ALL SELECT 'ventas', COUNT(*) FROM ventas
        UNION ALL SELECT 'detalle_ventas', COUNT(*) FROM detalle_ventas
    `);

    console.table(resumen);
};

main()
    .catch((err) => {
        console.error('No se pudo preparar la base de datos:', err.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        if (db.isPostgres) await db.client.end();
        else db.client.end();
    });
