const nodemailer = require('nodemailer');

// Configuración del transporte de correo SMTP mediante variables de entorno
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'mail.servis-web.com',
  port: parseInt(process.env.SMTP_PORT, 10) || 465,
  secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465' || true, // secure:true para puerto 465, secure:false para 587
  auth: {
    user: process.env.SMTP_USER || 'no-reply@servis-web.com',
    pass: process.env.SMTP_PASS || ''
  },
  tls: {
    rejectUnauthorized: false // Permite conexiones SMTP en hostings compartidos que a veces usan certificados autofirmados
  }
});

/**
 * Envía un correo con el código de verificación al usuario recién registrado.
 * @param {string} email - Correo del destinatario.
 * @param {string} name - Nombre del destinatario.
 * @param {string} code - Código numérico de 6 dígitos.
 */
const sendVerificationEmail = async (email, name, code) => {
  const mailOptions = {
    from: `"Quiniela Grupo Giraud 2026" <${process.env.SMTP_USER || 'no-reply@servis-web.com'}>`,
    to: email,
    subject: '⚽ Código de Verificación - Quiniela Grupo Giraud 2026',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1a202c; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <div style="text-align: center; border-bottom: 2px solid #00ff87; padding-bottom: 20px; margin-bottom: 20px;">
          <h1 style="color: #0f172a; margin: 0; font-size: 24px;">⚽ Quiniela Grupo Giraud 2026</h1>
          <p style="color: #64748b; font-size: 14px; margin: 5px 0 0 0; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Verificación de Cuenta</p>
        </div>
        
        <h2 style="color: #0f172a; font-size: 18px; margin-top: 0;">¡Hola, ${name}!</h2>
        <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
          Gracias por registrarte en la <strong>Quiniela de Grupo Giraud Premium 2026</strong>. Para poder activar tu cuenta, iniciar sesión y comenzar a colocar tus pronósticos, ingresa el siguiente código de verificación en la aplicación:
        </p>
        
        <div style="text-align: center; margin: 30px 0; padding: 18px; background-color: #f8fafc; border-radius: 10px; border: 1px dashed #00bb66;">
          <span style="font-family: 'Courier New', monospace; font-size: 38px; font-weight: bold; letter-spacing: 6px; color: #00bb66;">${code}</span>
        </div>
        
        <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 20px;">
          Este código de verificación tiene una validez temporal. Si tú no has iniciado este proceso de registro, por favor ignora este correo con total tranquilidad.
        </p>
        
        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; text-align: center; font-size: 12px; color: #94a3b8;">
          <p style="margin: 0; font-weight: bold;">Quiniela Grupo Giraud Premium © 2026</p>
          <p style="margin: 4px 0 0 0;">Desarrollado y desplegado de forma segura en servidor corporativo PostgreSQL.</p>
        </div>
      </div>
    `,
    text: `Hola, ${name}!\n\nGracias por registrarte en la Quiniela de Grupo Giraud Premium 2026.\n\nPara poder activar tu cuenta, iniciar sesión y comenzar a colocar tus pronósticos, ingresa el siguiente código de verificación en la aplicación:\n\nCódigo: ${code}\n\nSi no has iniciado este proceso, ignora este correo.\n\nQuiniela Grupo Giraud Premium © 2026`
  };

  return transporter.sendMail(mailOptions);
};

module.exports = {
  sendVerificationEmail
};
