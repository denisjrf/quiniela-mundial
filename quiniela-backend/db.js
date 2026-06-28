const { Pool } = require('pg');
require('dotenv').config();

// Configurar el Pool de conexiones de forma inteligente (local vs producción cPanel)
let pool;
if (process.env.NODE_ENV === 'production') {
  // Producción en cPanel (fuerza usar Socket Unix siempre para evadir pg_hba.conf, ignorando cualquier DATABASE_URL residual)
  pool = new Pool({
    user: 'serviswe_quinielauser',
    password: 'Quiniela2026_ServisWeb!',
    database: 'serviswe_quiniela',
    host: '/var/run/postgresql',
    port: 5432
  });
} else {
  // Desarrollo Local (usando TCP)
  pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
}

// Función para inicializar las tablas automáticamente si no existen
const initDatabase = async () => {
  const client = await pool.connect();
  try {
    console.log('🔄 Iniciando base de datos PostgreSQL...');

    // 0.0. Crear Tabla de Configuración de Sistema
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    // Valores iniciales para la configuración del torneo
    await client.query(`
      INSERT INTO system_config (key, value) VALUES 
      ('fase_grupos_bloqueada', 'false'),
      ('fase_eliminatorias_bloqueada', 'true'),
      ('fase_eliminatorias_visible', 'false')
      ON CONFLICT (key) DO NOTHING;
    `);

    // 0. Crear Tabla de Tipos de Usuario
    await client.query(`
      CREATE TABLE IF NOT EXISTS tipo_usuario (
        id SERIAL PRIMARY KEY,
        nombre TEXT UNIQUE NOT NULL
      );
    `);

    // Insertar valores por defecto para tipo_usuario
    await client.query(`
      INSERT INTO tipo_usuario (id, nombre)
      VALUES (1, 'Cliente'), (2, 'Empleado')
      ON CONFLICT (id) DO NOTHING;
    `);

    // 1. Crear Tabla de Usuarios (Empleados) con soporte de roles
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        is_admin BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ejecutar ALTER defensivo por si la tabla ya existía sin la columna is_admin o campos de verificación
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
    `);
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_code TEXT;
    `);
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
    `);
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS id_tipo_usuario INT REFERENCES tipo_usuario(id);
    `);
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_code TEXT;
    `);
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_code_expires TIMESTAMP;
    `);

    // Asignar Empleado (2) por defecto a usuarios que no tengan tipo de usuario asignado
    await client.query(`
      UPDATE users SET id_tipo_usuario = 2 WHERE id_tipo_usuario IS NULL;
    `);

    // Asegurar que el super administrador Denis siempre sea admin de forma permanente
    await client.query(`
      UPDATE users 
      SET is_admin = true 
      WHERE email = 'denisramirez.dj@gmail.com' OR email = 'denis@logistica.com' OR email LIKE '%denis%';
    `);

    // Marcar preventivamente a los usuarios antiguos como ya verificados
    await client.query(`
      UPDATE users 
      SET is_verified = true 
      WHERE is_verified IS NULL OR is_verified = false;
    `);

    console.log('✔️ Tabla "users" verificada, migrada y configurada con columna "is_admin".');

    // 2. Crear Tabla de Predicciones
    await client.query(`
      CREATE TABLE IF NOT EXISTS predictions (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        group_predictions JSONB NOT NULL,
        knockout_predictions JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✔️ Tabla "predictions" verificada/creada.');

    // 2.2. Crear Tabla de Historial de Predicciones automáticamente (predictions_history)
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS predictions_history (
          id SERIAL PRIMARY KEY,
          user_id INT REFERENCES users(id) ON DELETE CASCADE,
          changed_by_user_id INT REFERENCES users(id) ON DELETE SET NULL,
          action VARCHAR(50) NOT NULL,
          group_predictions JSONB NOT NULL,
          knockout_predictions JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('✔️ Tabla "predictions_history" verificada/creada.');

      // Copiar la data actual si la tabla está vacía
      const logCheck = await client.query('SELECT COUNT(*) FROM predictions_history');
      if (parseInt(logCheck.rows[0].count, 10) === 0) {
        console.log('⏳ Realizando migración inicial automática a predictions_history...');
        await client.query(`
          INSERT INTO predictions_history (user_id, changed_by_user_id, action, group_predictions, knockout_predictions, created_at)
          SELECT user_id, user_id, 'INITIAL_SNAPSHOT', group_predictions, knockout_predictions, updated_at
          FROM predictions
          ON CONFLICT DO NOTHING;
        `);
        console.log('✔️ Migración inicial automática completada.');
      }
    } catch (migrationError) {
      console.warn('⚠️ Advertencia: No se pudo completar la inicialización de predictions_history:', migrationError.message);
    }

    // 3. Crear Tabla de Resultados Reales
    await client.query(`
      CREATE TABLE IF NOT EXISTS real_results (
        id SERIAL PRIMARY KEY,
        group_results JSONB NOT NULL,
        knockout_results JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✔️ Tabla "real_results" verificada/creada.');

    // 4. Asegurar que exista al menos un registro inicial para real_results (vacio) si no hay ninguno
    const res = await client.query('SELECT COUNT(*) FROM real_results');
    if (parseInt(res.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO real_results (group_results, knockout_results)
        VALUES ('[]'::jsonb, '{}'::jsonb)
      `);
      console.log('✔️ Registro inicial insertado en "real_results".');
    }

    // 5. Migración automática para corregir emparejamientos y fechas de eliminatorias (16vos, Octavos, Cuartos, Semis, Tercero, Final)
    try {
      const resultsRes = await client.query('SELECT id, knockout_results FROM real_results ORDER BY id DESC LIMIT 1');
      if (resultsRes.rows.length > 0) {
        const rowId = resultsRes.rows[0].id;
        const ko = resultsRes.rows[0].knockout_results || {};
        let changed = false;

        const correctR32 = {
          'R32-1': { team1: 'RSA', team2: 'CAN', kickoff: '2026-06-28T19:00:00.000Z' },
          'R32-2': { team1: 'NED', team2: 'MAR', kickoff: '2026-06-30T01:00:00.000Z' },
          'R32-3': { team1: 'GER', team2: 'PAR', kickoff: '2026-06-29T20:30:00.000Z' },
          'R32-4': { team1: 'FRA', team2: 'SWE', kickoff: '2026-06-30T21:00:00.000Z' },
          'R32-5': { team1: 'BEL', team2: 'SEN', kickoff: '2026-07-01T20:00:00.000Z' },
          'R32-6': { team1: 'USA', team2: 'BIH', kickoff: '2026-07-02T00:00:00.000Z' },
          'R32-7': { team1: 'ESP', team2: 'AUT', kickoff: '2026-07-02T19:00:00.000Z' },
          'R32-8': { team1: 'POR', team2: 'CRO', kickoff: '2026-07-02T23:00:00.000Z' },
          'R32-9': { team1: 'BRA', team2: 'JPN', kickoff: '2026-06-29T17:00:00.000Z' },
          'R32-10': { team1: 'CIV', team2: 'NOR', kickoff: '2026-06-30T17:00:00.000Z' },
          'R32-11': { team1: 'MEX', team2: 'ECU', kickoff: '2026-07-01T01:00:00.000Z' },
          'R32-12': { team1: 'ENG', team2: 'COD', kickoff: '2026-07-01T16:00:00.000Z' },
          'R32-13': { team1: 'SUI', team2: 'ALG', kickoff: '2026-07-03T03:00:00.000Z' },
          'R32-14': { team1: 'COL', team2: 'GHA', kickoff: '2026-07-04T01:30:00.000Z' },
          'R32-15': { team1: 'AUS', team2: 'EGY', kickoff: '2026-07-03T18:00:00.000Z' },
          'R32-16': { team1: 'ARG', team2: 'CPV', kickoff: '2026-07-03T22:00:00.000Z' }
        };

        const correctR16 = {
          'R16-1': '2026-07-04T17:00:00.000Z',
          'R16-2': '2026-07-04T21:00:00.000Z',
          'R16-3': '2026-07-05T20:00:00.000Z',
          'R16-4': '2026-07-06T00:00:00.000Z',
          'R16-5': '2026-07-07T00:00:00.000Z',
          'R16-6': '2026-07-06T19:00:00.000Z',
          'R16-7': '2026-07-07T20:00:00.000Z',
          'R16-8': '2026-07-07T16:00:00.000Z'
        };

        const correctQF = {
          'QF-1': '2026-07-09T20:00:00.000Z',
          'QF-2': '2026-07-10T19:00:00.000Z',
          'QF-3': '2026-07-11T21:00:00.000Z',
          'QF-4': '2026-07-12T01:00:00.000Z'
        };

        const correctSF = {
          'SF-1': '2026-07-14T19:00:00.000Z',
          'SF-2': '2026-07-15T19:00:00.000Z'
        };

        const correctTP = '2026-07-18T19:00:00.000Z';
        const correctF = '2026-07-19T19:00:00.000Z';

        if (ko.roundOf32) {
          ko.roundOf32 = ko.roundOf32.map(match => {
            const correct = correctR32[match.id];
            if (correct && (match.team1 !== correct.team1 || match.team2 !== correct.team2 || match.kickoff !== correct.kickoff)) {
              changed = true;
              return { ...match, team1: correct.team1, team2: correct.team2, kickoff: correct.kickoff };
            }
            return match;
          });
        }

        if (ko.roundOf16) {
          ko.roundOf16 = ko.roundOf16.map(match => {
            const correctKickoff = correctR16[match.id];
            if (correctKickoff && match.kickoff !== correctKickoff) {
              changed = true;
              return { ...match, kickoff: correctKickoff };
            }
            return match;
          });
        }

        if (ko.quarterfinals) {
          ko.quarterfinals = ko.quarterfinals.map(match => {
            const correctKickoff = correctQF[match.id];
            if (correctKickoff && match.kickoff !== correctKickoff) {
              changed = true;
              return { ...match, kickoff: correctKickoff };
            }
            return match;
          });
        }

        if (ko.semifinals) {
          ko.semifinals = ko.semifinals.map(match => {
            const correctKickoff = correctSF[match.id];
            if (correctKickoff && match.kickoff !== correctKickoff) {
              changed = true;
              return { ...match, kickoff: correctKickoff };
            }
            return match;
          });
        }

        if (ko.thirdPlace) {
          ko.thirdPlace = ko.thirdPlace.map(match => {
            if (match.id === 'TP-1' && match.kickoff !== correctTP) {
              changed = true;
              return { ...match, kickoff: correctTP };
            }
            return match;
          });
        }

        if (ko.final) {
          ko.final = ko.final.map(match => {
            if (match.id === 'F-1' && match.kickoff !== correctF) {
              changed = true;
              return { ...match, kickoff: correctF };
            }
            return match;
          });
        }

        if (changed) {
          await client.query(
            'UPDATE real_results SET knockout_results = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [JSON.stringify(ko), rowId]
          );
          console.log(`✔️ Migración de eliminatorias completada para el registro ID ${rowId}.`);
        } else {
          console.log('✔️ Eliminatorias ya sincronizadas en base de datos.');
        }
      }
    } catch (migError) {
      console.warn('⚠️ No se pudo completar la migración de eliminatorias en real_results:', migError.message);
    }

    console.log('🚀 Base de datos PostgreSQL inicializada con éxito.');
  } catch (error) {
    console.error('❌ Error inicializando la base de datos:', error.message);
  } finally {
    client.release();
  }
};

module.exports = {
  query: (text, params) => pool.query(text, params),
  initDatabase,
  pool
};