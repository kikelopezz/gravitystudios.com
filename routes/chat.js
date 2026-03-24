const router     = require('express').Router();
const db         = require('../db');
const nodemailer = require('nodemailer');

// POST /api/chat — recibe mensaje del chat en vivo
router.post('/', async (req, res) => {
  const { nombre, mensaje } = req.body;
  if (!nombre || !mensaje) return res.status(400).json({ error: 'Faltan datos.' });

  try {
    // Guardar en BD si existe la tabla (opcional)
    await db.execute(
      `CREATE TABLE IF NOT EXISTS chat_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        mensaje TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
    );
    await db.execute(
      'INSERT INTO chat_messages (nombre, mensaje) VALUES (?, ?)',
      [nombre.trim(), mensaje.trim()]
    );
  } catch (e) {
    console.error('[Chat DB]', e.message);
  }

  // Notificar por email
  if (process.env.SMTP_USER && process.env.NOTIFY_EMAIL) {
    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com', port: 587, secure: false,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      });
      await transporter.sendMail({
        from:    `"Gravity Studios Chat" <${process.env.SMTP_USER}>`,
        to:      process.env.NOTIFY_EMAIL,
        subject: `💬 Nuevo mensaje de chat — ${nombre}`,
        html: `
          <div style="max-width:480px;margin:0 auto;font-family:sans-serif;background:#0d0f0d;border-radius:12px;overflow:hidden;">
            <div style="background:#131613;padding:20px 24px;border-bottom:1px solid rgba(200,255,0,.15);">
              <span style="font-size:18px;font-weight:900;color:#eef0e8;letter-spacing:.04em;">Gravity<span style="color:#c8ff00;">.</span>Studios</span>
              <span style="display:block;font-size:12px;color:#504e48;margin-top:4px;font-family:monospace;">Nuevo mensaje de chat</span>
            </div>
            <div style="padding:20px 24px;">
              <table style="width:100%;">
                <tr><td style="padding:8px 0;font-size:12px;color:#504e48;font-family:monospace;width:80px;">Nombre</td><td style="padding:8px 0;font-size:14px;color:#eef0e8;font-weight:600;">${nombre}</td></tr>
                <tr><td style="padding:8px 0;font-size:12px;color:#504e48;font-family:monospace;">Hora</td><td style="padding:8px 0;font-size:13px;color:#8a8f82;">${new Date().toLocaleString('es-ES')}</td></tr>
              </table>
              <div style="background:#191c19;border-radius:8px;padding:16px;margin-top:16px;">
                <p style="font-size:12px;color:#504e48;font-family:monospace;text-transform:uppercase;letter-spacing:.08em;margin:0 0 8px;">Mensaje</p>
                <p style="font-size:15px;color:#8a8f82;line-height:1.6;margin:0;">${mensaje}</p>
              </div>
            </div>
          </div>`
      });
    } catch (e) {
      console.error('[Chat Email]', e.message);
    }
  }

  console.log(`💬 Chat: ${nombre} — ${mensaje.substring(0, 50)}`);
  return res.json({ ok: true });
});

module.exports = router;
