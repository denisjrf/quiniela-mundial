const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// Obtener la clasificación general de todos los empleados
router.get('/', auth, async (req, res) => {
  try {
    // 1. Obtener todos los usuarios, sus predicciones y tipo de usuario
    const allPredictions = await db.query(`
      SELECT u.id as user_id, u.name, u.id_tipo_usuario, tu.nombre as tipo_usuario_nombre, p.group_predictions, p.knockout_predictions 
      FROM users u
      LEFT JOIN predictions p ON u.id = p.user_id
      LEFT JOIN tipo_usuario tu ON u.id_tipo_usuario = tu.id
      WHERE u.email != 'denis@gmail.com'
    `);

    // 2. Obtener los resultados reales actuales
    const realRes = await db.query(
      'SELECT group_results, knockout_results FROM real_results ORDER BY id DESC LIMIT 1'
    );

    const realGroup = realRes.rows.length > 0 ? realRes.rows[0].group_results : [];
    const realKnockout = realRes.rows.length > 0 ? realRes.rows[0].knockout_results : {};

    // 3. Calcular puntos para cada usuario
    const leaderboard = allPredictions.rows.map(userRow => {
      let points = 0;
      let exactHits = 0;
      let outcomeHits = 0;
      let predictionsCount = 0;

      const groupPred = userRow.group_predictions || [];
      const knockoutPred = userRow.knockout_predictions || {};

      // A. Evaluar Fase de Grupos
      groupPred.forEach(pred => {
        const predT1 = pred.team1Score;
        const predT2 = pred.team2Score;
        
        if (predT1 !== '' && predT2 !== '' && predT1 !== null && predT2 !== null) {
          predictionsCount++;
        }

        const real = realGroup.find(m => m.id === pred.id);
        if (!real || real.team1Score === '' || real.team2Score === '' || real.team1Score === null || real.team2Score === null) return;

        const p1 = parseInt(predT1, 10);
        const p2 = parseInt(predT2, 10);
        const r1 = parseInt(real.team1Score, 10);
        const r2 = parseInt(real.team2Score, 10);

        if (isNaN(p1) || isNaN(p2) || isNaN(r1) || isNaN(r2)) return;

        if (p1 === r1 && p2 === r2) {
          points += 3;
          exactHits++;
        } else {
          const predSign = Math.sign(p1 - p2);
          const realSign = Math.sign(r1 - r2);
          if (predSign === realSign) {
            points += 1;
            outcomeHits++;
          }
        }
      });

      // B. Evaluar Eliminatorias (Aciertos de Ganadores)
      const rounds = ['roundOf32', 'roundOf16', 'quarterfinals', 'semifinals', 'thirdPlace', 'final'];
      rounds.forEach(round => {
        knockoutPred[round]?.forEach(pred => {
          const predT1 = pred.team1Score;
          const predT2 = pred.team2Score;

          if (predT1 !== '' && predT2 !== '' && predT1 !== null && predT2 !== null) {
            predictionsCount++;
          }

          const real = realKnockout[round]?.find(m => m.id === pred.id);
          if (!real || !real.winner || !pred.winner) return;

          if (real.went_to_penalties) {
            // Si fue a penales: solo 1 punto por acertar el ganador
            if (pred.winner === real.winner) {
              points += 1;
              outcomeHits++;
            }
          } else if (pred.winner === real.winner) {
            points += 3; // 3 puntos por ganador acertado en tiempo normal
            exactHits++;
          }
        });
      });

      return {
        id: userRow.user_id,
        name: userRow.name,
        id_tipo_usuario: userRow.id_tipo_usuario,
        tipo_usuario_nombre: userRow.tipo_usuario_nombre || (userRow.id_tipo_usuario === 1 ? 'Cliente' : 'Empleado'),
        predictionsCount,
        points,
        exactHits,
        outcomeHits
      };
    });

    // 4. Ordenar el Leaderboard: Puntos DESC, ExactHits DESC, OutcomeHits DESC, Alfabético ASC
    const sortedLeaderboard = leaderboard.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.exactHits !== a.exactHits) return b.exactHits - a.exactHits;
      if (b.outcomeHits !== a.outcomeHits) return b.outcomeHits - a.outcomeHits;
      return a.name.localeCompare(b.name);
    });

    return res.status(200).json(sortedLeaderboard);
  } catch (error) {
    console.error('Error calculando el Leaderboard:', error.message);
    return res.status(500).json({ error: 'Error calculando la clasificación en el servidor.' });
  }
});

module.exports = router;
