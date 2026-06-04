const { Pool } = require('c:/Users/denis/OneDrive/Documents/quiniela/quiniela-backend/node_modules/pg');
require('c:/Users/denis/OneDrive/Documents/quiniela/quiniela-backend/node_modules/dotenv').config({ path: 'c:/Users/denis/OneDrive/Documents/quiniela/quiniela-backend/.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  const client = await pool.connect();
  try {
    const allPredictions = await client.query(`
      SELECT u.id as user_id, u.name, u.id_tipo_usuario, tu.nombre as tipo_usuario_nombre, p.group_predictions, p.knockout_predictions 
      FROM users u
      LEFT JOIN predictions p ON u.id = p.user_id
      LEFT JOIN tipo_usuario tu ON u.id_tipo_usuario = tu.id
    `);

    console.log('Query result rows length:', allPredictions.rows.length);

    const realRes = await client.query(
      'SELECT group_results, knockout_results FROM real_results ORDER BY id DESC LIMIT 1'
    );

    const realGroup = realRes.rows.length > 0 ? realRes.rows[0].group_results : [];
    const realKnockout = realRes.rows.length > 0 ? realRes.rows[0].knockout_results : {};

    const leaderboard = allPredictions.rows.map(userRow => {
      let points = 0;
      let exactHits = 0;
      let outcomeHits = 0;
      let predictionsCount = 0;

      const groupPred = userRow.group_predictions || [];
      const knockoutPred = userRow.knockout_predictions || {};

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

          if (pred.winner === real.winner) {
            points += 3;
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

    const sortedLeaderboard = leaderboard.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.exactHits !== a.exactHits) return b.exactHits - a.exactHits;
      if (b.outcomeHits !== a.outcomeHits) return b.outcomeHits - a.outcomeHits;
      return a.name.localeCompare(b.name);
    });

    console.log('Leaderboard output:');
    console.log(JSON.stringify(sortedLeaderboard, null, 2));

  } catch (error) {
    console.error('Logic Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
