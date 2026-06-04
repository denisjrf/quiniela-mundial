const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { sendVerificationEmail } = require('../utils/email');

// Registro de Usuario
router.post('/register', async (req, res) => {
  const { name, email, password, id_tipo_usuario } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Por favor, rellene todos los campos.' });
  }

  try {
    // 1. Verificar si el email ya existe
    const userExist = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (userExist.rows.length > 0) {
      return res.status(400).json({ error: 'El correo electrónico ya está registrado.' });
    }

    // 2. Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Guardar usuario con código de verificación
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const userType = (id_tipo_usuario === 1 || id_tipo_usuario === 2) ? id_tipo_usuario : 2;
    const newUser = await db.query(
      'INSERT INTO users (name, email, password_hash, verification_code, is_verified, id_tipo_usuario) VALUES ($1, $2, $3, $4, false, $5) RETURNING id, name, email, id_tipo_usuario',
      [name.trim(), email.toLowerCase().trim(), passwordHash, verificationCode, userType]
    );

    const userId = newUser.rows[0].id;

    // 4. Inicializar de forma defensiva sus predicciones vacías en la base de datos
    await db.query(
      "INSERT INTO predictions (user_id, group_predictions, knockout_predictions) VALUES ($1, '[]'::jsonb, '{}'::jsonb)",
      [userId]
    );

    // 5. Enviar correo de verificación asíncronamente
    try {
      await sendVerificationEmail(email.toLowerCase().trim(), name.trim(), verificationCode);
      console.log(`✉️ Correo de verificación enviado con éxito a ${email}`);
    } catch (mailError) {
      console.error('❌ Error enviando correo de verificación:', mailError.message);
      console.log(`💡 Código de verificación de prueba (log local): ${verificationCode}`);
    }

    return res.status(201).json({ 
      message: '¡Registro exitoso! Por favor, verifica tu correo electrónico con el código enviado.', 
      requiresVerification: true,
      email: email.toLowerCase().trim()
    });
  } catch (error) {
    console.error('Error en registro:', error.message);
    return res.status(500).json({ error: 'Error interno del servidor en el registro.' });
  }
});

// Inicio de Sesión
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Por favor, ingrese correo y contraseña.' });
  }

  try {
    // 1. Buscar usuario
    const userRes = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (userRes.rows.length === 0) {
      return res.status(400).json({ error: 'El correo electrónico o la contraseña son incorrectos.' });
    }

    const user = userRes.rows[0];

    // 2. Verificar contraseña
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'El correo electrónico o la contraseña son incorrectos.' });
    }

    // 2.5 Verificar si la cuenta está verificada
    if (!user.is_verified) {
      return res.status(400).json({
        error: 'Tu cuenta aún no está verificada. Por favor, introduce el código enviado a tu correo.',
        requiresVerification: true,
        email: user.email
      });
    }

    // 3. Crear y firmar JWT
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, is_admin: user.is_admin, id_tipo_usuario: user.id_tipo_usuario },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // Token expira en 7 días
    );

    return res.status(200).json({
      message: 'Sesión iniciada con éxito.',
      token,
      user: { id: user.id, name: user.name, email: user.email, is_admin: user.is_admin, id_tipo_usuario: user.id_tipo_usuario }
    });
  } catch (error) {
    console.error('Error en login:', error.message);
    return res.status(500).json({ error: 'Error interno del servidor en el inicio de sesión.' });
  }
});

// Ruta para verificar el código de registro
router.post('/verify', async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: 'Por favor, proporcione el correo y el código de verificación.' });
  }

  try {
    const userRes = await db.query('SELECT id, verification_code, is_verified FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const user = userRes.rows[0];

    if (user.is_verified) {
      return res.status(400).json({ error: 'Esta cuenta ya ha sido verificada anteriormente.' });
    }

    if (user.verification_code !== code.trim()) {
      return res.status(400).json({ error: 'El código de verificación introducido es incorrecto.' });
    }

    // Marcar usuario como verificado y borrar el código temporal
    await db.query(
      'UPDATE users SET is_verified = true, verification_code = NULL WHERE id = $1',
      [user.id]
    );

    return res.status(200).json({ message: '¡Cuenta verificada con éxito! Ya puedes iniciar sesión.' });
  } catch (error) {
    console.error('Error en verificación:', error.message);
    return res.status(500).json({ error: 'Error interno del servidor en la verificación.' });
  }
});

module.exports = router;
