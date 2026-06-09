const db = require('../config/db');

const TABLAS_RESPALDO = ['categorias', 'usuarios', 'clientes', 'productos', 'ventas', 'detalle_ventas'];
const COLUMNAS_BOOLEANAS = {
    usuarios: ['activo'],
    clientes: ['activo']
};

const LLAVES_PRIMARIAS = {
    categorias: 'id_categoria',
    usuarios: 'id_usuario',
    clientes: 'id_cliente',
    productos: 'id_producto',
    ventas: 'id_venta',
    detalle_ventas: 'id_detalle'
};

const esquemaMySQL = `CREATE TABLE IF NOT EXISTS categorias (
  id_categoria INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
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

CREATE TABLE IF NOT EXISTS clientes (
  id_cliente INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL,
  telefono VARCHAR(20),
  correo VARCHAR(120),
  direccion VARCHAR(180),
  activo TINYINT(1) DEFAULT 1,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS productos (
  id_producto INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  stock INT DEFAULT 0,
  tamano VARCHAR(50),
  imagen_url TEXT,
  id_categoria INT,
  descripcion TEXT,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ventas (
  id_venta INT AUTO_INCREMENT PRIMARY KEY,
  producto_nombre VARCHAR(120) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  vendedor_nombre VARCHAR(100),
  metodo_pago VARCHAR(50),
  id_vendedor INT,
  folio VARCHAR(80),
  fecha_venta TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS detalle_ventas (
  id_detalle INT AUTO_INCREMENT PRIMARY KEY,
  id_venta INT,
  id_producto INT,
  cantidad INT NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL
);`;

const limpiarMySQL = `SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS detalle_ventas;
DROP TABLE IF EXISTS ventas;
DROP TABLE IF EXISTS productos;
DROP TABLE IF EXISTS clientes;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS categorias;
SET FOREIGN_KEY_CHECKS = 1;`;

const esquemaPostgreSQL = `CREATE TABLE IF NOT EXISTS categorias (
  id_categoria SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
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

CREATE TABLE IF NOT EXISTS clientes (
  id_cliente SERIAL PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL,
  telefono VARCHAR(20),
  correo VARCHAR(120),
  direccion VARCHAR(180),
  activo BOOLEAN DEFAULT TRUE,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS productos (
  id_producto SERIAL PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  precio NUMERIC(10,2) NOT NULL,
  stock INTEGER DEFAULT 0,
  tamano VARCHAR(50),
  imagen_url TEXT,
  id_categoria INTEGER,
  descripcion TEXT,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ventas (
  id_venta SERIAL PRIMARY KEY,
  producto_nombre VARCHAR(120) NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  vendedor_nombre VARCHAR(100),
  metodo_pago VARCHAR(50),
  id_vendedor INTEGER,
  folio VARCHAR(80),
  fecha_venta TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS detalle_ventas (
  id_detalle SERIAL PRIMARY KEY,
  id_venta INTEGER,
  id_producto INTEGER,
  cantidad INTEGER NOT NULL,
  precio_unitario NUMERIC(10,2) NOT NULL
);`;

const limpiarPostgreSQL = `DROP TABLE IF EXISTS detalle_ventas CASCADE;
DROP TABLE IF EXISTS ventas CASCADE;
DROP TABLE IF EXISTS productos CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS categorias CASCADE;`;

const reiniciarSecuenciasPostgreSQL = `SELECT setval(pg_get_serial_sequence('categorias', 'id_categoria'), COALESCE((SELECT MAX(id_categoria) FROM categorias), 1), true);
SELECT setval(pg_get_serial_sequence('usuarios', 'id_usuario'), COALESCE((SELECT MAX(id_usuario) FROM usuarios), 1), true);
SELECT setval(pg_get_serial_sequence('clientes', 'id_cliente'), COALESCE((SELECT MAX(id_cliente) FROM clientes), 1), true);
SELECT setval(pg_get_serial_sequence('productos', 'id_producto'), COALESCE((SELECT MAX(id_producto) FROM productos), 1), true);
SELECT setval(pg_get_serial_sequence('ventas', 'id_venta'), COALESCE((SELECT MAX(id_venta) FROM ventas), 1), true);
SELECT setval(pg_get_serial_sequence('detalle_ventas', 'id_detalle'), COALESCE((SELECT MAX(id_detalle) FROM detalle_ventas), 1), true);`;

const query = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
};

const obtenerDatos = async () => {
    const datos = {};
    const errores = [];

    for (const tabla of TABLAS_RESPALDO) {
        try {
            datos[tabla] = await query(`SELECT * FROM ${tabla}`);
        } catch (err) {
            datos[tabla] = [];
            errores.push({ tabla, mensaje: err.message });
        }
    }

    return { datos, errores };
};

const esColumnaBooleana = (tabla, columna) => {
    return COLUMNAS_BOOLEANAS[tabla]?.includes(columna);
};

const valorSQL = (valor, tipo, tabla, columna) => {
    if (valor === null || valor === undefined) return 'NULL';
    if (tipo === 'postgres' && esColumnaBooleana(tabla, columna)) {
        return valor === true || valor === 1 || valor === '1' ? 'TRUE::boolean' : 'FALSE::boolean';
    }
    if (valor instanceof Date) return `'${valor.toISOString().slice(0, 19).replace('T', ' ')}'`;
    if (typeof valor === 'number') return String(valor);
    if (typeof valor === 'boolean') {
        return tipo === 'postgres' ? (valor ? 'TRUE' : 'FALSE') : (valor ? '1' : '0');
    }

    const texto = String(valor).replace(/'/g, "''");
    return `'${texto}'`;
};

const columnaSQL = (columna, tipo) => {
    return tipo === 'postgres' ? `"${columna}"` : `\`${columna}\``;
};

const tablaSQL = (tabla, tipo) => {
    return tipo === 'postgres' ? `"${tabla}"` : `\`${tabla}\``;
};

const generarInsert = (tabla, filas, tipo) => {
    if (!filas.length) return `-- Tabla ${tabla}: sin registros\n`;

    return filas.map((fila) => {
        const columnas = Object.keys(fila);
        const columnasSQL = columnas.map((columna) => columnaSQL(columna, tipo)).join(', ');
        const valoresSQL = columnas.map((columna) => valorSQL(fila[columna], tipo, tabla, columna)).join(', ');
        const insertBase = `INSERT INTO ${tablaSQL(tabla, tipo)} (${columnasSQL}) VALUES (${valoresSQL})`;

        if (tipo !== 'postgres') {
            return `${insertBase};`;
        }

        const llavePrimaria = LLAVES_PRIMARIAS[tabla];
        return `${insertBase} ON CONFLICT (${columnaSQL(llavePrimaria, tipo)}) DO NOTHING;`;
    }).join('\n');
};

const generarSQL = ({ datos, errores }, tipo) => {
    const fecha = new Date().toISOString();
    const esquema = tipo === 'postgres' ? esquemaPostgreSQL : esquemaMySQL;
    const limpieza = tipo === 'postgres' ? limpiarPostgreSQL : limpiarMySQL;
    const titulo = tipo === 'postgres' ? 'PostgreSQL' : 'MySQL';
    const partes = [
        `-- Respaldo Vivero La Palma (${titulo})`,
        `-- Generado: ${fecha}`,
        '-- Este archivo restaura una copia limpia: elimina y recrea las tablas incluidas.',
        '',
        errores.length ? `-- Avisos: ${errores.map(e => `${e.tabla}: ${e.mensaje}`).join(' | ')}` : '-- Todas las tablas disponibles fueron leidas correctamente',
        '',
        limpieza,
        '',
        esquema,
        ''
    ];

    for (const tabla of TABLAS_RESPALDO) {
        partes.push(`-- Datos de ${tabla}`);
        partes.push(generarInsert(tabla, datos[tabla], tipo));
        partes.push('');
    }

    if (tipo === 'postgres') {
        partes.push('-- Ajuste de secuencias despues de insertar IDs explicitos');
        partes.push(reiniciarSecuenciasPostgreSQL);
        partes.push('');
    }

    return partes.join('\n');
};

const nombreArchivo = (extension) => {
    const fecha = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    return `respaldo-invernadero-${fecha}.${extension}`;
};

const getInfoRespaldos = (req, res) => {
    res.json({
        formatos: [
            { tipo: 'mysql', nombre: 'MySQL', extension: 'sql' },
            { tipo: 'postgres', nombre: 'PostgreSQL', extension: 'sql' },
            { tipo: 'json', nombre: 'JSON', extension: 'json' }
        ],
        tablas: TABLAS_RESPALDO
    });
};

const descargarRespaldo = async (req, res) => {
    const { tipo } = req.params;

    if (!['mysql', 'postgres', 'json'].includes(tipo)) {
        return res.status(400).json({ error: 'Tipo de respaldo no valido' });
    }

    try {
        const respaldo = await obtenerDatos();

        if (tipo === 'json') {
            const contenido = JSON.stringify({
                generado_en: new Date().toISOString(),
                tablas: respaldo.datos,
                avisos: respaldo.errores
            }, null, 2);

            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo('json')}"`);
            return res.send(contenido);
        }

        const contenido = generarSQL(respaldo, tipo);
        res.setHeader('Content-Type', 'application/sql; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo(`${tipo}.sql`)}"`);
        return res.send(contenido);
    } catch (err) {
        return res.status(500).json({ error: 'No se pudo generar el respaldo', detalle: err.message });
    }
};

module.exports = {
    getInfoRespaldos,
    descargarRespaldo
};
