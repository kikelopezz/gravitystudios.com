require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors    = require('cors');
const path    = require('path');
const { testConnection } = require('./connection');

const app  = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret:            process.env.SESSION_SECRET || 'kikedev_secret',
  resave:            false,
  saveUninitialized: false,
  cookie:            { secure: false, httpOnly: true, maxAge: 8 * 60 * 60 * 1000 }
}));

// Archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use('/crm', express.static(path.join(__dirname, 'crm')));

// Rutas API
app.use('/api/contacto', require('./routes/contacto'));
app.use('/api/crm',      require('./routes/crm'));
app.use('/api/chat',     require('./routes/chat'));

// Health check
app.get('/api/health', (_, res) => res.json({ ok: true }));

// Fallbacks / páginas
app.get('/crm*',        (_, res) => res.sendFile(path.join(__dirname, 'crm', 'index.html')));
app.get('/privacidad',  (_, res) => res.sendFile(path.join(__dirname, 'public', 'privacidad.html')));
app.get('/aviso-legal', (_, res) => res.sendFile(path.join(__dirname, 'public', 'aviso-legal.html')));
app.get('/estado',      (_, res) => res.sendFile(path.join(__dirname, 'public', 'estado.html')));
app.get('/sitemap.xml', (_, res) => res.sendFile(path.join(__dirname, 'public', 'sitemap.xml')));
app.get('/robots.txt',  (_, res) => res.sendFile(path.join(__dirname, 'public', 'robots.txt')));
app.get('*',            (_, res) => res.sendFile(path.join(__dirname, 'public', '404.html')));

// INICIAR SERVIDOR (SOLO UNA VEZ)
app.listen(PORT, async () => {
  console.log(`\nServidor corriendo en puerto ${PORT}`);
  console.log(`URL: http://localhost:${PORT}`);
  console.log(`CRM: http://localhost:${PORT}/crm\n`);

  // Verificar conexion a la base de datos al iniciar
  await testConnection();
});