const router     = require('express').Router();
const rateLimit  = require('express-rate-limit');
const db         = require('../db');
const nodemailer = require('nodemailer');

// Rate limiter for contact form — 5 submissions per 15 min per IP
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Demasiadas solicitudes. Inténtalo de nuevo más tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Escape HTML to prevent XSS in email templates ──
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Generador de ticket ──────────────────────
function ticket() {
  return 'TK-' + Date.now().toString(36).toUpperCase() + '-' +
         Math.random().toString(36).substring(2, 5).toUpperCase();
}

// ── Configuración del email ──────────────────
function crearTransporte() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  return nodemailer.createTransport({
    host:   'smtp.gmail.com',
    port:   587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

// ── Template del email ───────────────────────
function buildEmail(datos, tk) {
  const servicios = {
    web:           'Página Web',
    discord_bot:   'Discord Bot',
    video_editing: 'Video Editing',
    gta_script:    'GTA V Script',
    otro:          'Otro'
  };

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#0e0d0b;font-family:'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#161511;border:1px solid rgba(255,255,255,.08);border-radius:12px;overflow:hidden;">

    <!-- Cabecera -->
    <div style="background:#1e1d18;padding:28px 32px;border-bottom:1px solid rgba(255,255,255,.08);">
      <div style="font-size:22px;font-weight:900;color:#f0ede6;letter-spacing:.04em;">
        Gravity<span style="color:#c8ff00;">.</span>Studios
      </div>
      <div style="font-size:13px;color:#504e48;margin-top:4px;font-family:monospace;">
        Nueva solicitud recibida
      </div>
    </div>

    <!-- Ticket -->
    <div style="padding:24px 32px 0;">
      <div style="display:inline-block;background:rgba(200,255,0,.08);border:1px solid rgba(200,255,0,.2);border-radius:8px;padding:8px 16px;">
        <span style="font-family:monospace;font-size:13px;color:#c8ff00;font-weight:700;">
          ${tk}
        </span>
      </div>
    </div>

    <!-- Datos -->
    <div style="padding:24px 32px;">

      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,.05);font-size:12px;color:#504e48;font-family:monospace;text-transform:uppercase;letter-spacing:.08em;width:120px;">Nombre</td>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,.05);font-size:14px;color:#f0ede6;font-weight:600;">${escapeHtml(datos.nombre)}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,.05);font-size:12px;color:#504e48;font-family:monospace;text-transform:uppercase;letter-spacing:.08em;">Email</td>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,.05);font-size:14px;color:#c8ff00;">${escapeHtml(datos.email)}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,.05);font-size:12px;color:#504e48;font-family:monospace;text-transform:uppercase;letter-spacing:.08em;">Discord</td>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,.05);font-size:14px;color:#a09d96;">${escapeHtml(datos.discord) || '—'}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,.05);font-size:12px;color:#504e48;font-family:monospace;text-transform:uppercase;letter-spacing:.08em;">Servicio</td>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,.05);font-size:14px;color:#a09d96;">${escapeHtml(servicios[datos.servicio] || datos.servicio)}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,.05);font-size:12px;color:#504e48;font-family:monospace;text-transform:uppercase;letter-spacing:.08em;">Pack</td>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,.05);font-size:14px;color:#a09d96;">${escapeHtml(datos.pack) || '—'}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,.05);font-size:12px;color:#504e48;font-family:monospace;text-transform:uppercase;letter-spacing:.08em;">Presupuesto</td>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,.05);font-size:14px;color:#a09d96;">${escapeHtml(datos.presupuesto) || '—'}</td>
        </tr>
      </table>

      <!-- Descripción -->
      <div style="margin-top:20px;">
        <div style="font-size:12px;color:#504e48;font-family:monospace;text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;">Descripción</div>
        <div style="background:#1e1d18;border:1px solid rgba(255,255,255,.06);border-radius:8px;padding:16px;font-size:14px;color:#a09d96;line-height:1.7;">
          ${escapeHtml(datos.descripcion)}
        </div>
      </div>

      <!-- CTA -->
      <div style="margin-top:24px;text-align:center;">
        <a href="${escapeHtml(process.env.APP_URL || '')}/crm"
           style="display:inline-block;background:#c8ff00;color:#000;font-weight:700;font-size:14px;padding:12px 28px;border-radius:8px;text-decoration:none;">
          Ver en el CRM →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding:16px 32px;border-top:1px solid rgba(255,255,255,.05);text-align:center;">
      <span style="font-size:11px;color:#504e48;font-family:monospace;">
        Gravity Studios CRM · Notificación automática
      </span>
    </div>

  </div>
</body>
</html>`;
}

// ── POST /api/contacto ───────────────────────
router.post('/', contactLimiter, async (req, res) => {
  const { nombre, email, discord, servicio, pack, presupuesto, descripcion } = req.body;

  if (!nombre || !email || !servicio || !descripcion)
    return res.status(400).json({ error: 'Faltan campos obligatorios.' });

  // Input length validation
  if (typeof nombre !== 'string' || nombre.length > 255)
    return res.status(400).json({ error: 'Nombre demasiado largo (máx. 255 caracteres).' });
  if (typeof email !== 'string' || email.length > 255)
    return res.status(400).json({ error: 'Email demasiado largo (máx. 255 caracteres).' });
  if (discord && (typeof discord !== 'string' || discord.length > 255))
    return res.status(400).json({ error: 'Discord demasiado largo (máx. 255 caracteres).' });
  if (pack && (typeof pack !== 'string' || pack.length > 100))
    return res.status(400).json({ error: 'Pack demasiado largo (máx. 100 caracteres).' });
  if (presupuesto && (typeof presupuesto !== 'string' || presupuesto.length > 50))
    return res.status(400).json({ error: 'Presupuesto demasiado largo (máx. 50 caracteres).' });
  if (typeof descripcion !== 'string' || descripcion.length > 5000)
    return res.status(400).json({ error: 'Descripción demasiado larga (máx. 5000 caracteres).' });

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'Email no válido.' });

  const validos = ['web', 'discord_bot', 'video_editing', 'gta_script', 'otro'];
  if (!validos.includes(servicio))
    return res.status(400).json({ error: 'Servicio no válido.' });

  const tk = ticket();

  try {
    // Guardar en MySQL
    await db.execute(
      `INSERT INTO contactos (ticket, nombre, email, discord, servicio, pack, presupuesto, descripcion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [tk, nombre.trim(), email.trim().toLowerCase(),
       discord?.trim() || null, servicio,
       pack?.trim() || null, presupuesto?.trim() || null, descripcion.trim()]
    );

    console.log('📩 Nueva solicitud:', tk, '—', nombre, '(' + servicio + ')');

    // Enviar email (sin bloquear la respuesta)
    const transporte = crearTransporte();
    if (transporte && process.env.NOTIFY_EMAIL) {
      transporte.sendMail({
        from:    '"Gravity Studios CRM" <' + process.env.SMTP_USER + '>',
        to:      process.env.NOTIFY_EMAIL,
        subject: '🔔 Nueva solicitud ' + tk + ' — ' + nombre,
        html:    buildEmail({ nombre, email, discord, servicio, pack, presupuesto, descripcion }, tk)
      }).then(() => {
        console.log('✉️  Email enviado para', tk);
      }).catch(err => {
        console.error('❌ Error email:', err.message);
      });
    }

    return res.status(201).json({ ok: true, ticket: tk });

  } catch (e) {
    console.error('Error al guardar contacto:', e.message);
    return res.status(500).json({ error: 'Error interno.' });
  }
});

// ── GET /api/contacto/:ticket ────────────────
router.get('/:ticket', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT ticket, nombre, servicio, pack, estado, created_at FROM contactos WHERE ticket = ?',
      [req.params.ticket]
    );
    if (!rows.length) return res.status(404).json({ error: 'Ticket no encontrado.' });
    return res.json(rows[0]);
  } catch (e) {
    return res.status(500).json({ error: 'Error interno.' });
  }
});

module.exports = router;