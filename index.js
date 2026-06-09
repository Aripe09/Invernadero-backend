const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach((line) => {
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

const app = express();
const PORT = process.env.PORT || 3000;
const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist');

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
const clienteRoutes = require('./routes/clienteRoutes');

// Usar rutas
app.use('/', usuarioRoutes);
app.use('/', productoRoutes);
app.use('/', ventaRoutes);
app.use('/', respaldoRoutes);
app.use('/', ticketRoutes);
app.use('/', clienteRoutes);

app.use(express.static(frontendDistPath));

app.use((req, res, next) => {
  if (req.method !== 'GET' || !req.accepts('html')) {
    return next();
  }

  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
