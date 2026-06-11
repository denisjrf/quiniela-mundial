const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const { sendBroadcastEmail } = require('../utils/email');

// Guardar o actualizar los marcadores reales de la competición (Solo Super Administrador - Denis)
router.post('/results', auth, async (req, res) => {
  const { groupResults, knockoutResults } = req.body;

  if (!groupResults || !knockoutResults) {
    return res.status(400).json({ error: 'Faltan datos de resultados reales para guardar.' });
  }

  // Validar estrictamente que solo el Super Administrador (Denis) pueda alterar marcadores reales oficiales
  const isSuperAdmin = req.user && (
    req.user.email === 'denis@logistica.com' ||
    req.user.email.toLowerCase().includes('denis')
  );

  if (!isSuperAdmin) {
    return res.status(403).json({ error: 'Acceso denegado. Solo el Super Administrador puede guardar resultados oficiales.' });
  }

  try {
    // Buscar el ID del último registro de real_results para actualizarlo
    const lastRow = await db.query('SELECT id FROM real_results ORDER BY id DESC LIMIT 1');
    
    if (lastRow.rows.length > 0) {
      const rowId = lastRow.rows[0].id;
      await db.query(
        'UPDATE real_results SET group_results = $1, knockout_results = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
        [JSON.stringify(groupResults), JSON.stringify(knockoutResults), rowId]
      );
    } else {
      await db.query(
        'INSERT INTO real_results (group_results, knockout_results) VALUES ($1, $2)',
        [JSON.stringify(groupResults), JSON.stringify(knockoutResults)]
      );
    }

    return res.status(200).json({ message: 'Resultados reales oficiales actualizados con éxito en el servidor.' });
  } catch (error) {
    console.error('Error al actualizar resultados reales:', error.message);
    return res.status(500).json({ error: 'Error guardando los resultados reales en el servidor.' });
  }
});

// Obtener todos los usuarios registrados (Super Admin y Admins comunes)
router.get('/users', auth, async (req, res) => {
  const isAdmin = req.user && (
    req.user.is_admin || 
    req.user.email === 'denis@logistica.com' ||
    req.user.email.toLowerCase().includes('denis')
  );

  if (!isAdmin) {
    return res.status(403).json({ error: 'Acceso denegado. No tiene privilegios de administración.' });
  }

  try {
    const result = await db.query(`
      SELECT u.id, u.name, u.email, u.is_admin, u.created_at, u.id_tipo_usuario, tu.nombre as tipo_usuario_nombre
      FROM users u
      LEFT JOIN tipo_usuario tu ON u.id_tipo_usuario = tu.id
      ORDER BY u.name ASC
    `);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error al obtener lista de usuarios:', error.message);
    return res.status(500).json({ error: 'Error interno obteniendo usuarios registrados.' });
  }
});

// Promover o revocar privilegios de administración (Solo Super Administrador - Denis)
router.put('/users/:id/toggle-admin', auth, async (req, res) => {
  const isSuperAdmin = req.user && (
    req.user.email === 'denis@logistica.com' ||
    req.user.email.toLowerCase().includes('denis')
  );

  if (!isSuperAdmin) {
    return res.status(403).json({ error: 'Acceso denegado. Solo el Super Administrador puede reasignar privilegios.' });
  }

  const userId = parseInt(req.params.id, 10);
  if (isNaN(userId)) {
    return res.status(400).json({ error: 'ID de usuario no válido.' });
  }

  try {
    // 1. Obtener detalles del usuario a modificar
    const userRes = await db.query('SELECT name, email, is_admin FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado en el sistema.' });
    }

    const targetUser = userRes.rows[0];

    // 2. Proteger a Denis de ser revocado por accidente
    if (targetUser.email === 'denis@logistica.com' || targetUser.email.toLowerCase().includes('denis')) {
      return res.status(400).json({ error: 'Operación denegada. El Super Administrador no puede ser degradado.' });
    }

    // 3. Alternar el valor is_admin
    const updated = await db.query(
      'UPDATE users SET is_admin = NOT is_admin WHERE id = $1 RETURNING id, name, email, is_admin',
      [userId]
    );

    return res.status(200).json({
      message: `El rol de ${updated.rows[0].name} ha sido actualizado con éxito.`,
      user: updated.rows[0]
    });
  } catch (error) {
    console.error('Error al alternar privilegios de administrador:', error.message);
    return res.status(500).json({ error: 'Error interno alternando privilegios en el servidor.' });
  }
});

// Enviar un correo masivo personalizado a todos los usuarios verificados (Solo Admins)
router.post('/broadcast-email', auth, async (req, res) => {
  const { subject, message } = req.body;

  if (!subject || !message) {
    return res.status(400).json({ error: 'Falta el asunto o el cuerpo del mensaje.' });
  }

  const isAdmin = req.user && (
    req.user.is_admin || 
    req.user.email === 'denis@logistica.com' ||
    req.user.email.toLowerCase().includes('denis')
  );

  if (!isAdmin) {
    return res.status(403).json({ error: 'Acceso denegado. No tiene privilegios de administración.' });
  }

  try {
    // Obtener todos los usuarios verificados del sistema
    const usersRes = await db.query('SELECT name, email FROM users WHERE is_verified = true');
    const users = usersRes.rows;

    if (users.length === 0) {
      return res.status(200).json({ message: 'No hay usuarios verificados registrados a quienes enviar el correo.' });
    }

    // Enviar correos uno por uno de forma asíncrona pero controlando errores
    const sentList = [];
    const failedList = [];

    for (const user of users) {
      try {
        await sendBroadcastEmail(user.email, user.name, subject, message);
        sentList.push(user.email);
      } catch (err) {
        console.error(`Error enviando correo masivo a ${user.email}:`, err.message);
        failedList.push({ email: user.email, error: err.message });
      }
    }

    return res.status(200).json({
      message: `Proceso de envío finalizado. Enviados con éxito: ${sentList.length}. Fallidos: ${failedList.length}.`,
      sentCount: sentList.length,
      failedCount: failedList.length,
      failures: failedList
    });
  } catch (error) {
    console.error('Error general enviando correo masivo:', error.message);
    return res.status(500).json({ error: 'Error interno procesando el envío masivo en el servidor.' });
  }
});

module.exports = router;
