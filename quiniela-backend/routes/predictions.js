const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const { getMatchKickoff } = require('../utils/kickoffs');

// Obtener predicciones del usuario conectado y los resultados reales consolidados
router.get('/my', auth, async (req, res) => {
  try {
    // 1. Obtener quiniela del usuario
    const predRes = await db.query(
      'SELECT group_predictions, knockout_predictions FROM predictions WHERE user_id = $1',
      [req.user.id]
    );

    // 2. Obtener los resultados reales configurados por el administrador
    const realRes = await db.query(
      'SELECT group_results, knockout_results FROM real_results ORDER BY id DESC LIMIT 1'
    );

    let groupPredictions = [];
    let knockoutPredictions = {};

    if (predRes.rows.length > 0) {
      groupPredictions = predRes.rows[0].group_predictions;
      knockoutPredictions = predRes.rows[0].knockout_predictions;
    } else {
      // Si por alguna razón no existía el registro, crearlo vacío defensivamente
      await db.query(
        "INSERT INTO predictions (user_id, group_predictions, knockout_predictions) VALUES ($1, '[]'::jsonb, '{}'::jsonb)",
        [req.user.id]
      );
    }

    const realGroupResults = realRes.rows.length > 0 ? realRes.rows[0].group_results : [];
    const realKnockoutResults = realRes.rows.length > 0 ? realRes.rows[0].knockout_results : {};

    return res.status(200).json({
      groupPredictions,
      knockoutPredictions,
      realGroupResults,
      realKnockoutResults
    });
  } catch (error) {
    console.error('Error al cargar predicciones:', error.message);
    return res.status(500).json({ error: 'Error cargando las predicciones desde el servidor.' });
  }
});

// Obtener estadísticas agregadas de predicciones de la comunidad (Marcadores más votados)
router.get('/stats', auth, async (req, res) => {
  try {
    // 1. Obtener todas las predicciones de la base de datos
    const result = await db.query('SELECT group_predictions, knockout_predictions FROM predictions');
    
    // Contenedores para almacenar las frecuencias de los marcadores por ID de partido
    const groupStats = {};
    const knockoutStats = {};

    // Frecuencias totales por partido (para calcular porcentajes)
    const groupTotals = {};
    const knockoutTotals = {};

    result.rows.forEach(row => {
      const gPred = row.group_predictions || [];
      const kPred = row.knockout_predictions || {};

      // A. Agrupar Fase de Grupos
      gPred.forEach(pred => {
        const id = pred.id;
        const s1 = pred.team1Score;
        const s2 = pred.team2Score;
        
        if (s1 !== '' && s2 !== '' && s1 !== null && s2 !== null) {
          const scoreStr = `${s1}-${s2}`;
          if (!groupStats[id]) groupStats[id] = {};
          groupStats[id][scoreStr] = (groupStats[id][scoreStr] || 0) + 1;
          groupTotals[id] = (groupTotals[id] || 0) + 1;
        }
      });

      // B. Agrupar Eliminatorias
      const rounds = ['roundOf32', 'roundOf16', 'quarterfinals', 'semifinals', 'thirdPlace', 'final'];
      rounds.forEach(round => {
        const matches = kPred[round] || [];
        matches.forEach(pred => {
          const id = pred.id;
          const s1 = pred.team1Score;
          const s2 = pred.team2Score;
          
          if (s1 !== '' && s2 !== '' && s1 !== null && s2 !== null) {
            const scoreStr = `${s1}-${s2}`;
            if (!knockoutStats[id]) knockoutStats[id] = {};
            knockoutStats[id][scoreStr] = (knockoutStats[id][scoreStr] || 0) + 1;
            knockoutTotals[id] = (knockoutTotals[id] || 0) + 1;
          }
        });
      });
    });

    // Formatear la respuesta con el top 3 de marcadores por partido
    const statsResponse = {};

    // Helper para procesar frecuencias y tomar el top 3
    const processTopScores = (matchStats, matchTotals) => {
      Object.keys(matchStats).forEach(matchId => {
        const scores = matchStats[matchId];
        const total = matchTotals[matchId] || 1;
        
        const sorted = Object.entries(scores)
          .map(([score, count]) => {
            const pct = Math.round((count / total) * 100);
            return { score, pct, count };
          })
          .sort((a, b) => b.count - a.count)
          .slice(0, 3); // Tomar solo los 3 más votados

        statsResponse[matchId] = sorted;
      });
    };

    processTopScores(groupStats, groupTotals);
    processTopScores(knockoutStats, knockoutTotals);

    return res.status(200).json(statsResponse);
  } catch (error) {
    console.error('Error al calcular estadísticas de predicciones:', error.message);
    return res.status(500).json({ error: 'Error calculando estadísticas en el servidor.' });
  }
});


// Guardar o actualizar predicciones de la quiniela con validación estricta de tiempo de bloqueo
router.post('/save', auth, async (req, res) => {
  const { groupPredictions, knockoutPredictions } = req.body;

  if (!groupPredictions || !knockoutPredictions) {
    return res.status(400).json({ error: 'Faltan datos de predicción para guardar.' });
  }

  // Validar partidos incompletos (donde solo se ha ingresado un marcador de la pareja)
  const isIncomplete = (s1, s2) => {
    const has1 = s1 !== '' && s1 !== null && s1 !== undefined;
    const has2 = s2 !== '' && s2 !== null && s2 !== undefined;
    return (has1 && !has2) || (!has1 && has2);
  };

  const rounds = ['roundOf32', 'roundOf16', 'quarterfinals', 'semifinals', 'thirdPlace', 'final'];
  const hasIncompleteGroup = groupPredictions.some(m => isIncomplete(m.team1Score, m.team2Score));
  const hasIncompleteKnockout = rounds.some(round => 
    (knockoutPredictions[round] || []).some(m => m.team1 && m.team2 && isIncomplete(m.team1Score, m.team2Score))
  );

  if (hasIncompleteGroup || hasIncompleteKnockout) {
    return res.status(400).json({ error: 'No se pueden guardar predicciones con partidos incompletos. Para cada partido, ingresa ambos marcadores o deja ambos vacíos.' });
  }

  try {
    // 0. Obtener la configuración del sistema para bloqueos de fases
    const configRes = await db.query('SELECT key, value FROM system_config');
    const config = {};
    configRes.rows.forEach(row => {
      config[row.key] = row.value === 'true';
    });

    // 1. Obtener predicciones guardadas previamente del usuario para restaurar si un partido está bloqueado
    const prevRes = await db.query(
      'SELECT group_predictions, knockout_predictions FROM predictions WHERE user_id = $1',
      [req.user.id]
    );

    const hasPrev = prevRes.rows.length > 0;
    const prevGroup = hasPrev ? prevRes.rows[0].group_predictions : [];
    const prevKnockout = hasPrev ? prevRes.rows[0].knockout_predictions : {};

    const now = Date.now();
    const isLocked = (kickoffTime) => {
      return now > (new Date(kickoffTime).getTime() - 30 * 60 * 1000);
    };

    // 2. Sanitizar predicciones de la Fase de Grupos
    const sanitizedGroup = groupPredictions.map(match => {
      const kickoff = getMatchKickoff(match.id);
      // Bloquear si la fase completa está bloqueada administrativamente o si el partido ya inició
      if (config.fase_grupos_bloqueada || isLocked(kickoff)) {
        // Restaurar marcadores previos guardados en la base de datos
        const dbMatch = prevGroup.find(m => m.id === match.id);
        return {
          ...match,
          team1Score: dbMatch ? dbMatch.team1Score : '',
          team2Score: dbMatch ? dbMatch.team2Score : ''
        };
      }
      return match;
    });

    // 3. Sanitizar predicciones de la Fase de Eliminatorias
    const sanitizedKnockout = {};
    
    rounds.forEach(roundKey => {
      const incomingMatches = knockoutPredictions[roundKey] || [];
      const dbMatches = prevKnockout[roundKey] || [];
      
      sanitizedKnockout[roundKey] = incomingMatches.map(match => {
        const kickoff = getMatchKickoff(match.id);
        // Bloquear si la fase de eliminatorias completa está bloqueada o si el partido ya inició
        if (config.fase_eliminatorias_bloqueada || isLocked(kickoff)) {
          // Restaurar marcadores y ganadores previos guardados en la base de datos
          const dbMatch = dbMatches.find(m => m.id === match.id);
          return {
            ...match,
            team1Score: dbMatch ? dbMatch.team1Score : '',
            team2Score: dbMatch ? dbMatch.team2Score : '',
            winner: dbMatch ? dbMatch.winner : null
          };
        }
        return match;
      });
    });

    // 4. Guardar los datos completamente sanitizados en PostgreSQL
    await db.query(
      `INSERT INTO predictions (user_id, group_predictions, knockout_predictions, updated_at) 
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id) 
       DO UPDATE SET 
          group_predictions = $2, 
          knockout_predictions = $3, 
          updated_at = CURRENT_TIMESTAMP`,
      [req.user.id, JSON.stringify(sanitizedGroup), JSON.stringify(sanitizedKnockout)]
    );

    // 4.1. Registrar en la tabla de auditoría (predictions_history)
    await db.query(
      `INSERT INTO predictions_history (user_id, changed_by_user_id, action, group_predictions, knockout_predictions)
       VALUES ($1, $1, 'USER_SAVE', $2, $3)`,
      [req.user.id, JSON.stringify(sanitizedGroup), JSON.stringify(sanitizedKnockout)]
    );

    return res.status(200).json({ message: 'Predicciones guardadas con éxito.' });
  } catch (error) {
    console.error('Error al guardar predicciones:', error.message);
    return res.status(500).json({ error: 'Error guardando las predicciones en la base de datos.' });
  }
});

module.exports = router;
