const db = require('../config/db');
const path = require('path');
const fs = require('fs');

const PUBLIC_URL = process.env.PUBLIC_URL || 'http://localhost:3002';

// Obtener todos los productos
const getProductos = (req, res) => {
    db.query('SELECT * FROM productos', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
};

// Agregar producto con imagen
const agregarProducto = (req, res) => {
    const { nombre, precio, stock, tamano } = req.body;
    const imagen_url = req.file ? `${PUBLIC_URL}/uploads/${req.file.filename}` : null;
    const sql = 'INSERT INTO productos (nombre, precio, stock, tamano, imagen_url, id_categoria, descripcion) VALUES (?, ?, ?, ?, ?, 1, "Sin descripción")';
    db.query(sql, [nombre, precio, stock || 0, tamano || 'Mediano', imagen_url], (err) => {
        if (err) return res.status(500).json({ error: err.sqlMessage });
        res.json({ mensaje: "Guardado" });
    });
};

// Reabastecer stock
const reabastecerStock = (req, res) => {
    const { id_producto, cantidad } = req.body;
    const sql = 'UPDATE productos SET stock = stock + ? WHERE id_producto = ?';
    db.query(sql, [cantidad, id_producto], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ mensaje: "Stock actualizado" });
    });
};

// Eliminar producto
const eliminarProducto = (req, res) => {
    db.query('SELECT imagen_url FROM productos WHERE id_producto = ?', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: "Error" });
        
        if (results[0] && results[0].imagen_url) {
            const imagePath = path.join(__dirname, '..', 'uploads', path.basename(results[0].imagen_url));
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }
        
        db.query('DELETE FROM productos WHERE id_producto = ?', [req.params.id], (err) => {
            if (err) return res.status(500).json({ error: "Error" });
            res.json({ mensaje: "Eliminado" });
        });
    });
};

// Editar producto (CON IMAGEN) - Versión corregida
const editarProducto = (req, res) => {
    const { id } = req.params;
    const { nombre, precio, stock, tamano } = req.body;
    
    console.log("Editando producto:", { id, nombre, precio, stock, tamano });
    console.log("Archivo:", req.file);
    
    // Primero, obtener la imagen actual
    db.query('SELECT imagen_url FROM productos WHERE id_producto = ?', [id], (err, results) => {
        if (err) {
            console.error("Error al obtener imagen actual:", err);
            return res.status(500).json({ error: err.message });
        }
        
        let imagen_url = results[0]?.imagen_url || null;
        
        // Si se subió una nueva imagen
        if (req.file) {
            imagen_url = `${PUBLIC_URL}/uploads/${req.file.filename}`;
            
            // Eliminar imagen anterior si existe
            if (results[0] && results[0].imagen_url) {
                const oldImagePath = path.join(__dirname, '..', 'uploads', path.basename(results[0].imagen_url));
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
        }
        
        // Actualizar producto
        const sql = 'UPDATE productos SET nombre = ?, precio = ?, stock = ?, tamano = ?, imagen_url = ? WHERE id_producto = ?';
        db.query(sql, [nombre, precio, stock, tamano, imagen_url, id], (err, result) => {
            if (err) {
                console.error("Error al actualizar:", err);
                return res.status(500).json({ error: err.sqlMessage });
            }
            console.log("Producto actualizado:", result);
            res.json({ mensaje: "Producto actualizado correctamente" });
        });
    });
};

// Agregar producto rápido (sin imagen, stock en 0)
const agregarProductoRapido = (req, res) => {
    const { nombre, precio, tamano } = req.body;
    
    console.log("Agregando producto rápido:", { nombre, precio, tamano });
    
    const sql = 'INSERT INTO productos (nombre, precio, stock, tamano, imagen_url, id_categoria, descripcion) VALUES (?, ?, 0, ?, NULL, 1, "Producto agregado por venta rápida - Añadir imagen y stock después")';
    
    db.query(sql, [nombre, precio, tamano || 'Mediano'], (err, result) => {
        if (err) {
            console.error("Error al agregar producto rápido:", err);
            return res.status(500).json({ error: err.sqlMessage });
        }
        res.json({ 
            mensaje: "Producto agregado al inventario. Recuerda añadir imagen y stock.",
            id_producto: result.insertId
        });
    });
};

module.exports = { 
    getProductos, 
    agregarProducto, 
    reabastecerStock, 
    eliminarProducto,
    editarProducto,
    agregarProductoRapido
};
