const db = require('../config/db');

const TABLAS_RESPALDO = ['categorias', 'usuarios', 'productos', 'ventas', 'detalle_ventas'];

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

CREATE TABLE IF NOT EXISTS productos (
  id_producto INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
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

CREATE TABLE IF NOT EXISTS productos (
  id_producto SERIAL PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
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

const valorSQL = (valor, tipo) => {
    if (valor === null || valor === undefined) return 'NULL';
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
        const valoresSQL = columnas.map((columna) => valorSQL(fila[columna], tipo)).join(', ');

        return `INSERT INTO ${tablaSQL(tabla, tipo)} (${columnasSQL}) VALUES (${valoresSQL});`;
    }).join('\n');
};

const generarSQL = ({ datos, errores }, tipo) => {
    const fecha = new Date().toISOString();
    const esquema = tipo === 'postgres' ? esquemaPostgreSQL : esquemaMySQL;
    const titulo = tipo === 'postgres' ? 'PostgreSQL' : 'MySQL';
    const partes = [
        `-- Respaldo Vivero La Palma (${titulo})`,
        `-- Generado: ${fecha}`,
        '',
        errores.length ? `-- Avisos: ${errores.map(e => `${e.tabla}: ${e.mensaje}`).join(' | ')}` : '-- Todas las tablas disponibles fueron leidas correctamente',
        '',
        esquema,
        ''
    ];

    for (const tabla of TABLAS_RESPALDO) {
        partes.push(`-- Datos de ${tabla}`);
        partes.push(generarInsert(tabla, datos[tabla], tipo));
        partes.push('');
    }

    return partes.join('\n');
};

const nombreArchivo = (extension) => {
    const fecha = new Date().toISOString().slice(0, 10);
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
