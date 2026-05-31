const db = require('../config/db');

// ========== FUNCIONES ORIGINALES ==========

// Login
const login = (req, res) => {
    const { username, password } = req.body;
    db.query('SELECT id_usuario, nombre, rol FROM usuarios WHERE username = ? AND password = ? AND activo = 1', [username, password], (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length > 0) res.json({ usuario: results[0] });
        else res.status(401).json({ error: "Usuario o contraseña incorrectos, o usuario inactivo" });
    });
};

// Registrar usuario
const registrarUsuario = (req, res) => {
    const { nombre, username, password, rol } = req.body;
    db.query('INSERT INTO usuarios (nombre, username, password, rol, activo) VALUES (?, ?, ?, ?, 1)', [nombre, username, password, rol], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ mensaje: "Usuario creado" });
    });
};

// Obtener todos los usuarios (excepto el que está logueado)
const getUsuarios = (req, res) => {
    const { id_actual } = req.query;
    let sql = 'SELECT id_usuario, nombre, username, rol, activo FROM usuarios';
    const params = [];
    
    if (id_actual) {
        sql += ' WHERE id_usuario != ?';
        params.push(id_actual);
    }
    
    sql += ' ORDER BY nombre';
    
    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
};

// Dar de baja un usuario (soft delete)
const desactivarUsuario = (req, res) => {
    const { id } = req.params;
    db.query('UPDATE usuarios SET activo = 0 WHERE id_usuario = ?', [id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ mensaje: "Usuario dado de baja correctamente" });
    });
};

// Reactivar un usuario
const activarUsuario = (req, res) => {
    const { id } = req.params;
    db.query('UPDATE usuarios SET activo = 1 WHERE id_usuario = ?', [id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ mensaje: "Usuario reactivado correctamente" });
    });
};

// Editar usuario (por administrador)
const editarUsuario = (req, res) => {
    const { id } = req.params;
    const { nombre, username, rol, password } = req.body;
    
    let sql = 'UPDATE usuarios SET nombre = ?, username = ?, rol = ?';
    const params = [nombre, username, rol];
    
    if (password && password.trim() !== '') {
        sql += ', password = ?';
        params.push(password);
    }
    
    sql += ' WHERE id_usuario = ?';
    params.push(id);
    
    db.query(sql, params, (err) => {
        if (err) return res.status(500).json(err);
        res.json({ mensaje: "Usuario actualizado correctamente" });
    });
};

// ========== NUEVA FUNCIÓN: EDITAR PERFIL PROPIO ==========

const editarPerfil = (req, res) => {
    const { id } = req.params;
    const { nombre, username, password } = req.body;
    
    let sql = 'UPDATE usuarios SET nombre = ?, username = ?';
    const params = [nombre, username];
    
    if (password && password.trim() !== '') {
        sql += ', password = ?';
        params.push(password);
    }
    
    sql += ' WHERE id_usuario = ?';
    params.push(id);
    
    db.query(sql, params, (err) => {
        if (err) return res.status(500).json(err);
        res.json({ mensaje: "Perfil actualizado correctamente" });
    });
};

// ========== ELIMINAR USUARIO DEFINITIVAMENTE ==========
const eliminarUsuarioPermanente = (req, res) => {
    const { id } = req.params;
    
    // Verificar que no sea el administrador principal (id=1)
    if (id == 1) {
        return res.status(400).json({ error: "No se puede eliminar al administrador principal" });
    }
    
    // Primero eliminar las ventas asociadas al usuario
    db.query('DELETE FROM ventas WHERE id_vendedor = ?', [id], (err, ventasResult) => {
        if (err) {
            console.error("Error al eliminar ventas:", err);
            return res.status(500).json({ error: err.message });
        }
        
        // Luego eliminar el usuario
        db.query('DELETE FROM usuarios WHERE id_usuario = ?', [id], (err, userResult) => {
            if (err) return res.status(500).json({ error: err.message });
            if (userResult.affectedRows === 0) {
                return res.status(404).json({ error: "Usuario no encontrado" });
            }
            res.json({ 
                mensaje: "Usuario eliminado permanentemente",
                ventas_eliminadas: ventasResult.affectedRows
            });
        });
    });
};


module.exports = { 
    login, 
    registrarUsuario,
    getUsuarios,
    desactivarUsuario,
    activarUsuario,
    editarUsuario,
    editarPerfil,
    eliminarUsuarioPermanente  // NUEVA
};