const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: 'invernadero-backend',
    timestamp: new Date().toISOString()
  });
});

// Importar rutas
const usuarioRoutes = require('./routes/usuarioRoutes');
const productoRoutes = require('./routes/productoRoutes');
const ventaRoutes = require('./routes/ventaRoutes');
const respaldoRoutes = require('./routes/respaldoRoutes');
const ticketRoutes = require('./routes/ticketRoutes');

// Usar rutas
app.use('/', usuarioRoutes);
app.use('/', productoRoutes);
app.use('/', ventaRoutes);
app.use('/', respaldoRoutes);
app.use('/', ticketRoutes);

app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
