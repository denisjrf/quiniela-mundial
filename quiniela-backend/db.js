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
