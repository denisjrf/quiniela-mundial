const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Configurar Middleware
app.use(cors()); // Permitir conexiones desde el puerto del frontend (5173)
app.use(express.json()); // Habilitar lectura de JSON en el body

// Middleware defensivo para soportar subcarpetas en hostings como cPanel
app.use((req, res, next) => {
  if (req.url.startsWith('/quiniela-api')) {
    req.url = req.url.substring('/quiniela-api'.length);
    if (req.url === '') req.url = '/';
  }
  next();
});

// Montar Rutas de la API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/predictions', require('./routes/predictions'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/config', require('./routes/config'));

// Endpoint de prueba de salud
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Servidor de la Quiniela en línea y saludable.' });
});

// Inicializar BD y LUEGO arrancar el servidor (evita race conditions y gestiona errores visibles)
db.initDatabase()
  .then(() => {
    console.log('✅ Base de datos PostgreSQL inicializada y lista.');
    app.listen(PORT, () => {
      console.log(`🚀 Servidor de la Quiniela corriendo en el puerto ${PORT}`);
    });
  })
  .catch(err => {
    console.error('💥 Error FATAL inicializando base de datos:', err.message);
    process.exit(1);
  });
