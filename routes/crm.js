const router = require('express').Router();
const db     = require('../db');

function auth(req, res, next) {
  if (req.session?.admin) return next();
  return res.status(401).json({ error: 'No autorizado.' });
}

// POST /api/crm/login
router.post('/login', (req, res) => {
  const { user, pass } = req.body;
  if (user === process.env.ADMIN_USER && pass === process.env.ADMIN_PASS) {
    req.session.admin = true;
    return res.json({ ok: true });
  }
  return res.status(401).json({ error: 'Credenciales incorrectas.' });
});

// POST /api/crm/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// GET /api/crm/me
router.get('/me', (req, res) => {
  res.json({ ok: !!req.session?.admin });
});

// GET /api/crm/solicitudes
router.get('/solicitudes', auth, async (req, res) => {
  const { estado, servicio, buscar, page = 1 } = req.query;
  const limit  = 20;
  const offset = (parseInt(page) - 1) * limit;
  const where  = []; const params = [];

  if (estado)  { where.push('estado = ?');   params.push(estado); }
  if (servicio){ where.push('servicio = ?'); params.push(servicio); }
  if (buscar)  {
    where.push('(nombre LIKE ? OR email LIKE ? OR ticket LIKE ?)');
    const s = `%${buscar}%`;
    params.push(s, s, s);
  }

  const w = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const [rows]  = await db.execute(`SELECT * FROM contactos ${w} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`, params);
  const [[{total}]] = await db.execute(`SELECT COUNT(*) AS total FROM contactos ${w}`, params);
  const [[stats]]   = await db.execute(
    `SELECT
      COUNT(*) AS total,
      SUM(estado='pendiente')   AS pendiente,
      SUM(estado='en_proceso')  AS en_proceso,
      SUM(estado='completado')  AS completado,
      SUM(estado='cancelado')   AS cancelado
     FROM contactos`
  );
  return res.json({ rows, total, stats });
});

// GET /api/crm/solicitudes/:id
router.get('/solicitudes/:id', auth, async (req, res) => {
  const [rows] = await db.execute('SELECT * FROM contactos WHERE id=?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'No encontrado.' });
  return res.json(rows[0]);
});

// PUT /api/crm/solicitudes/:id
router.put('/solicitudes/:id', auth, async (req, res) => {
  const { estado, notas_admin } = req.body;
  const validos = ['pendiente','en_proceso','completado','cancelado'];
  if (estado && !validos.includes(estado))
    return res.status(400).json({ error: 'Estado no válido.' });

  const fields = []; const params = [];
  if (estado !== undefined)      { fields.push('estado=?');      params.push(estado); }
  if (notas_admin !== undefined) { fields.push('notas_admin=?'); params.push(notas_admin); }
  if (!fields.length) return res.status(400).json({ error: 'Nada que actualizar.' });

  params.push(req.params.id);
  await db.execute(`UPDATE contactos SET ${fields.join(',')} WHERE id=?`, params);
  const [rows] = await db.execute('SELECT * FROM contactos WHERE id=?', [req.params.id]);
  return res.json(rows[0]);
});

// DELETE /api/crm/solicitudes/:id
router.delete('/solicitudes/:id', auth, async (req, res) => {
  const [r] = await db.execute('DELETE FROM contactos WHERE id=?', [req.params.id]);
  if (!r.affectedRows) return res.status(404).json({ error: 'No encontrado.' });
  return res.json({ ok: true });
});

module.exports = router;
