const db = require('../config/db');

const MAX_NOMBRE_CLIENTE = 80;
const MAX_TELEFONO = 20;
const MAX_CORREO = 120;
const MAX_DIRECCION = 180;

const limpiarTexto = (valor) => String(valor || '').trim().replace(/\s+/g, ' ');
const limpiarOpcional = (valor) => {
    const limpio = limpiarTexto(valor);
    return limpio || null;
};

const validarCliente = ({ nombre, telefono, correo, direccion }) => {
    const nombreLimpio = limpiarTexto(nombre);
    const telefonoLimpio = limpiarTexto(telefono);
    const correoLimpio = limpiarTexto(correo).toLowerCase();
    const direccionLimpia = limpiarTexto(direccion);

    if (nombreLimpio.length < 3) return 'El nombre debe tener al menos 3 caracteres';
    if (nombreLimpio.length > MAX_NOMBRE_CLIENTE) return `El nombre es muy largo. Usa maximo ${MAX_NOMBRE_CLIENTE} caracteres`;
    if (telefonoLimpio && !/^[0-9+\-\s()]{7,20}$/.test(telefonoLimpio)) return 'El telefono solo puede llevar numeros, espacios, +, - y parentesis';
    if (correoLimpio && correoLimpio.length > MAX_CORREO) return `El correo es muy largo. Usa maximo ${MAX_CORREO} caracteres`;
    if (correoLimpio && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoLimpio)) return 'Ingresa un correo valido';
    if (direccionLimpia && direccionLimpia.length > MAX_DIRECCION) return `La direccion es muy larga. Usa maximo ${MAX_DIRECCION} caracteres`;

    return '';
};

const normalizarCliente = (body) => ({
    nombre: limpiarTexto(body.nombre),
    telefono: limpiarOpcional(body.telefono),
    correo: limpiarOpcional(body.correo)?.toLowerCase() || null,
    direccion: limpiarOpcional(body.direccion)
});

const crearTablaClientes = async () => {
    const sql = db.isPostgres
        ? `CREATE TABLE IF NOT EXISTS clientes (
            id_cliente SERIAL PRIMARY KEY,
            nombre VARCHAR(80) NOT NULL,
            telefono VARCHAR(20),
            correo VARCHAR(120),
            direccion VARCHAR(180),
            activo BOOLEAN DEFAULT TRUE,
            fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
        : `CREATE TABLE IF NOT EXISTS clientes (
            id_cliente INT AUTO_INCREMENT PRIMARY KEY,
            nombre VARCHAR(80) NOT NULL,
            telefono VARCHAR(20),
            correo VARCHAR(120),
            direccion VARCHAR(180),
            activo TINYINT(1) DEFAULT 1,
            fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;

    await db.promiseQuery(sql);
};

crearTablaClientes().catch((err) => {
    console.error('No se pudo preparar la tabla clientes:', err.message);
});

const getClientes = async (req, res) => {
    try {
        await crearTablaClientes();
        const clientes = await db.promiseQuery(
            'SELECT id_cliente, nombre, telefono, correo, direccion, activo, fecha_registro FROM clientes ORDER BY id_cliente DESC'
        );
        res.json(clientes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const agregarCliente = async (req, res) => {
    const error = validarCliente(req.body);
    if (error) return res.status(400).json({ error });

    const cliente = normalizarCliente(req.body);

    try {
        await crearTablaClientes();
        await db.promiseQuery(
            'INSERT INTO clientes (nombre, telefono, correo, direccion, activo) VALUES (?, ?, ?, ?, ?)',
            [cliente.nombre, cliente.telefono, cliente.correo, cliente.direccion, db.bool(true)]
        );
        res.json({ mensaje: 'Cliente agregado correctamente' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const editarCliente = async (req, res) => {
    const { id } = req.params;
    const error = validarCliente(req.body);
    if (error) return res.status(400).json({ error });

    const cliente = normalizarCliente(req.body);

    try {
        await crearTablaClientes();
        const result = await db.promiseQuery(
            'UPDATE clientes SET nombre = ?, telefono = ?, correo = ?, direccion = ? WHERE id_cliente = ?',
            [cliente.nombre, cliente.telefono, cliente.correo, cliente.direccion, id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Cliente no encontrado' });
        res.json({ mensaje: 'Cliente actualizado correctamente' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const eliminarCliente = async (req, res) => {
    const { id } = req.params;

    try {
        await crearTablaClientes();
        const result = await db.promiseQuery('DELETE FROM clientes WHERE id_cliente = ?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Cliente no encontrado' });
        res.json({ mensaje: 'Cliente eliminado correctamente' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getClientes,
    agregarCliente,
    editarCliente,
    eliminarCliente
};
