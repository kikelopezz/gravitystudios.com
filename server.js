require('dotenv').config();
const express     = require('express');
const session     = require('express-session');
const cors        = require('cors');
const helmet      = require('helmet');
const rateLimit   = require('express-rate-limit');
const path        = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// Session secret must be set via environment variable
if (!process.env.SESSION_SECRET) {
  console.error('❌ Missing required environment variable: SESSION_SECRET');
  console.error('   Generate one with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
  process.exit(1);
}

// Security headers
app.use(helmet());

// CORS — only allow explicitly configured origins (defaults to same-origin)
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : [];
app.use(cors({
  origin: allowedOrigins.length > 0 ? allowedOrigins : false,
  credentials: true,
}));

// Global rate limiter — 100 requests per 15 min per IP
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
}));

// Body parsers with size limits
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(session({
  secret:            process.env.SESSION_SECRET,
  resave:            false,
  saveUninitialized: false,
  cookie: {
    secure:   process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge:   8 * 60 * 60 * 1000,
    sameSite: 'lax',
  }
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

// 🚀 INICIAR SERVIDOR (SOLO UNA VEZ)
app.listen(PORT, () => {
  console.log(`\n🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`📋 CRM: http://localhost:${PORT}/crm\n`);
});