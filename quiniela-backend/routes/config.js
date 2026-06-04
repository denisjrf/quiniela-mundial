const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// Obtener la configuración de fases (Público)
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT key, value FROM system_config');
    const config = {};
    result.rows.forEach(row => {
      config[row.key] = row.value === 'true' ? true : row.value === 'false' ? false : row.value;
    });
    return res.status(200).json(config);
  } catch (error) {
    console.error('Error al obtener configuración:', error.message);
    return res.status(500).json({ error: 'Error obteniendo configuración del torneo.' });
  }
});

// Actualizar la configuración (Solo Administrador)
router.post('/update', auth, async (req, res) => {
  const isAdmin = req.user && (
    req.user.is_admin || 
    req.user.email === 'denis@logistica.com' ||
    req.user.email.toLowerCase().includes('denis')
  );

  if (!isAdmin) {
    return res.status(403).json({ error: 'Acceso denegado. No tiene privilegios de administración.' });
  }

  const { settings } = req.body;
  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ error: 'Datos de configuración inválidos.' });
  }

  try {
    for (const [key, val] of Object.entries(settings)) {
      await db.query(
        'INSERT INTO system_config (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
        [key, String(val)]
      );
    }
    return res.status(200).json({ message: 'Configuración actualizada correctamente.' });
  } catch (error) {
    console.error('Error al actualizar configuración:', error.message);
    return res.status(500).json({ error: 'Error guardando la configuración en la base de datos.' });
  }
});

module.exports = router;
