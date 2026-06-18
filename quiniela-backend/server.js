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

// Endpoint temporal para restaurar el partido de Chequia (id: 4) en producción vía web (Protegido por secreto)
app.get('/api/restore-chequia', async (req, res) => {
  if (req.query.secret !== 'servisweb_admin_2026_restore') {
    return res.status(403).json({ error: 'No autorizado' });
  }
  try {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      const CUTOFF_TIME = new Date('2026-06-18T15:30:00.000Z'); // 11:30 AM hora de Venezuela (UTC-4)
      const predictionsRes = await client.query('SELECT user_id, group_predictions, knockout_predictions FROM predictions');
      let updatedCount = 0;
      let logs = [];

      for (let predRow of predictionsRes.rows) {
        const userId = predRow.user_id;
        const groupPred = predRow.group_predictions || [];
        const match4 = groupPred.find(m => m.id === 4);
        if (!match4) continue;
        if (match4.team1Score === '' && match4.team2Score === '') continue;

        // Consultamos todo el historial para este usuario ordenado por fecha de creación
        const histRes = await client.query(
          `SELECT group_predictions, created_at 
           FROM predictions_history 
           WHERE user_id = $1 
           ORDER BY created_at ASC`,
          [userId]
        );

        // Realizamos el filtrado de fechas directamente en JavaScript para máxima compatibilidad con cualquier zona horaria del servidor
        const beforeCutoff = histRes.rows.filter(r => new Date(r.created_at).getTime() < CUTOFF_TIME.getTime());
        const afterCutoff = histRes.rows.filter(r => new Date(r.created_at).getTime() >= CUTOFF_TIME.getTime());

        let targetTeam1Score = '';
        let targetTeam2Score = '';
        let reason = '';

        if (beforeCutoff.length > 0) {
          const lastBefore = beforeCutoff[beforeCutoff.length - 1];
          const histGroup = lastBefore.group_predictions || [];
          const histMatch4 = histGroup.find(m => m.id === 4);
          if (histMatch4) {
            targetTeam1Score = histMatch4.team1Score;
            targetTeam2Score = histMatch4.team2Score;
            reason = `Restaurado a la predicción guardada a tiempo antes del kickoff (guardada el: ${lastBefore.created_at})`;
          } else {
            reason = 'Sin predicción para Chequia vs Sudáfrica antes del inicio. Se deja en blanco.';
          }
        } else {
          reason = 'Sin historial de guardados antes del inicio. Se deja en blanco.';
        }

        // Comprobamos si en las modificaciones tardías el usuario puso algo diferente a su predicción válida
        let hasLateChange = false;
        for (let changeRow of afterCutoff) {
          const changeGroup = changeRow.group_predictions || [];
          const changeMatch4 = changeGroup.find(m => m.id === 4);
          const currentT1 = changeMatch4 ? changeMatch4.team1Score : '';
          const currentT2 = changeMatch4 ? changeMatch4.team2Score : '';
          if (currentT1 !== targetTeam1Score || currentT2 !== targetTeam2Score) {
            hasLateChange = true;
            break;
          }
        }

        if (hasLateChange) {
          logs.push(`Usuario ID ${userId}: Cambió de [${match4.team1Score}-${match4.team2Score}] a [${targetTeam1Score || 'VACÍO'}-${targetTeam2Score || 'VACÍO'}]. Razón: ${reason}`);

          const updatedGroupPred = groupPred.map(m => {
            if (m.id === 4) {
              return { ...m, team1Score: targetTeam1Score, team2Score: targetTeam2Score };
            }
            return m;
          });

          await client.query(`UPDATE predictions SET group_predictions = $1 WHERE user_id = $2`, [JSON.stringify(updatedGroupPred), userId]);
          await client.query(
            `INSERT INTO predictions_history (user_id, changed_by_user_id, action, group_predictions, knockout_predictions, created_at)
             VALUES ($1, NULL, 'SYSTEM_RESTORE_CZE_RSA', $2, $3, CURRENT_TIMESTAMP)`,
            [userId, JSON.stringify(updatedGroupPred), JSON.stringify(predRow.knockout_predictions)]
          );

          updatedCount++;
        }
      }

      await client.query('COMMIT');
      res.status(200).json({
        success: true,
        message: `Restauración completada con éxito. Usuarios corregidos: ${updatedCount}`,
        details: logs
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint temporal de diagnóstico para inspeccionar los pronósticos del partido 4 en producción (Protegido por secreto)
app.get('/api/test-predictions-prod', async (req, res) => {
  if (req.query.secret !== 'servisweb_admin_2026_restore') {
    return res.status(403).json({ error: 'No autorizado' });
  }
  try {
    const client = await db.pool.connect();
    try {
      const predRes = await client.query('SELECT user_id, group_predictions, updated_at FROM predictions');
      const histRes = await client.query('SELECT user_id, action, created_at, group_predictions FROM predictions_history ORDER BY created_at DESC LIMIT 50');
      
      const match4Predictions = [];
      for (let row of predRes.rows) {
        const groupPred = row.group_predictions || [];
        const m4 = groupPred.find(m => m.id === 4);
        if (m4 && (m4.team1Score !== '' || m4.team2Score !== '')) {
          match4Predictions.push({
            userId: row.user_id,
            updatedAt: row.updated_at,
            match4Score: `${m4.team1Score}-${m4.team2Score}`
          });
        }
      }

      const match4History = [];
      for (let row of histRes.rows) {
        const groupPred = row.group_predictions || [];
        const m4 = groupPred.find(m => m.id === 4);
        match4History.push({
          userId: row.user_id,
          action: row.action,
          createdAt: row.created_at,
          match4Score: m4 ? `${m4.team1Score}-${m4.team2Score}` : 'N/A'
        });
      }

      res.status(200).json({
        databaseTime: new Date(),
        match4CurrentPredictions: match4Predictions,
        recentHistory: match4History
      });
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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
