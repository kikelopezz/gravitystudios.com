// ═══════════════════════════════════════════
//  DISCORD STUDIOS CRM — JavaScript
// ═══════════════════════════════════════════

var SVC = {
  web:           'Página Web',
  discord_bot:   'Discord Bot',
  video_editing: 'Video Editing',
  gta_script:    'GTA V Script',
  otro:          'Otro'
};

var ESTA = {
  pendiente:   'Pendiente',
  en_proceso:  'En proceso',
  completado:  'Completado',
  cancelado:   'Cancelado'
};

var currentId  = null;
var delId      = null;
var currentView= 'dashboard';
var pagActual  = 1;
var totalPags  = 1;

// ── UTILIDADES ────────────────────────────────
function get(id) { return document.getElementById(id); }

function badge(estado) {
  var label = ESTA[estado] || estado;
  return '<span class="badge badge-' + estado + '">' + label + '</span>';
}

function fecha(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-ES', { day:'2-digit', month:'2-digit', year:'numeric' });
}

function toast(msg, tipo) {
  var el = get('toast');
  el.textContent = msg;
  el.className = 'show ' + (tipo || 'info');
  clearTimeout(el._timer);
  el._timer = setTimeout(function() { el.className = ''; }, 3200);
}

function api(url, opciones) {
  opciones = opciones || {};
  var headers = { 'Content-Type': 'application/json' };
  return fetch(url, {
    credentials: 'include',
    headers: headers,
    method:  opciones.method  || 'GET',
    body:    opciones.body    || undefined
  }).then(function(res) {
    return res.json().then(function(data) {
      if (!res.ok) throw new Error(data.error || 'Error ' + res.status);
      return data;
    });
  });
}

// ── AUTH ──────────────────────────────────────
function mostrarLogin() {
  get('loginWrap').style.display = 'flex';
  get('appWrap').style.display   = 'none';
}

function mostrarApp() {
  get('loginWrap').style.display = 'none';
  get('appWrap').style.display   = 'flex';
  iniciarNav();
  irA('dashboard');
}

function init() {
  get('tbDate').textContent = new Date().toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long'
  });

  api('/api/crm/me').then(function(d) {
    if (d.ok) mostrarApp();
    else      mostrarLogin();
  }).catch(function() {
    mostrarLogin();
  });
}

get('loginForm').addEventListener('submit', function(e) {
  e.preventDefault();
  var btn  = get('loginBtn');
  var err  = get('loginErr');
  err.textContent = '';
  btn.textContent = 'Entrando...';
  btn.disabled    = true;

  api('/api/crm/login', {
    method: 'POST',
    body:   JSON.stringify({ user: get('loginUser').value.trim(), pass: get('loginPass').value })
  }).then(function() {
    mostrarApp();
  }).catch(function(e) {
    err.textContent = e.message;
    btn.textContent = 'Entrar';
    btn.disabled    = false;
  });
});

get('logoutBtn').addEventListener('click', function() {
  api('/api/crm/logout', { method: 'POST' }).catch(function(){});
  mostrarLogin();
});

// ── NAVEGACIÓN ────────────────────────────────
function iniciarNav() {
  document.querySelectorAll('[data-view]').forEach(function(el) {
    el.addEventListener('click', function() {
      irA(el.dataset.view);
    });
  });
}

function irA(view) {
  currentView = view;

  document.querySelectorAll('.sb-link').forEach(function(l) {
    l.classList.toggle('active', l.dataset.view === view);
  });

  get('vDashboard').style.display   = view === 'dashboard'   ? 'block' : 'none';
  get('vSolicitudes').style.display = view === 'solicitudes' ? 'block' : 'none';

  get('tbTitle').textContent = view === 'dashboard' ? 'Dashboard' : 'Solicitudes';

  if (view === 'dashboard')   cargarDashboard();
  if (view === 'solicitudes') cargarSolicitudes();
}

// ── DASHBOARD ─────────────────────────────────
function cargarDashboard() {
  api('/api/crm/solicitudes?page=1').then(function(d) {
    var s = d.stats || {};
    get('stTotal').textContent      = s.total      || 0;
    get('stPendiente').textContent  = s.pendiente  || 0;
    get('stProceso').textContent    = s.en_proceso || 0;
    get('stCompletado').textContent = s.completado || 0;
    get('stCancelado').textContent  = s.cancelado  || 0;

    var b = get('sbBadge');
    if (s.pendiente > 0) { b.textContent = s.pendiente; b.style.display = 'inline-block'; }
    else b.style.display = 'none';

    var tbody = get('recentBody');
    if (!d.rows || d.rows.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="tbl-empty">Sin solicitudes todavía. Envía el formulario desde la web.</td></tr>';
      return;
    }

    tbody.innerHTML = d.rows.slice(0, 8).map(function(r) {
      return '<tr>' +
        '<td>' + r.ticket + '</td>' +
        '<td style="color:var(--cream);font-weight:500;">' + r.nombre + '</td>' +
        '<td>' + (SVC[r.servicio] || r.servicio) + '</td>' +
        '<td>' + badge(r.estado) + '</td>' +
        '<td>' + fecha(r.created_at) + '</td>' +
        '<td><button class="btn-abrir" onclick="abrirModal(' + r.id + ')">Abrir</button></td>' +
      '</tr>';
    }).join('');

  }).catch(function(e) {
    toast('Error: ' + e.message, 'err');
  });
}

// ── SOLICITUDES ───────────────────────────────
function cargarSolicitudes(p) {
  p = p || 1;
  pagActual = p;

  var params = new URLSearchParams({
    page:     p,
    buscar:   get('fSearch').value.trim(),
    estado:   get('fEstado').value,
    servicio: get('fServicio').value
  });

  var tbody = get('solBody');
  tbody.innerHTML = '<tr><td colspan="9" class="tbl-empty">Cargando...</td></tr>';

  api('/api/crm/solicitudes?' + params.toString()).then(function(d) {
    totalPags = Math.ceil(d.total / 20) || 1;

    if (!d.rows || d.rows.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" class="tbl-empty">Sin resultados.</td></tr>';
      renderPaginacion();
      return;
    }

    tbody.innerHTML = d.rows.map(function(r) {
      return '<tr>' +
        '<td>' + r.ticket + '</td>' +
        '<td style="color:var(--cream);font-weight:500;">' + r.nombre + '</td>' +
        '<td style="font-size:12px;">' + r.email + '</td>' +
        '<td style="font-size:12px;color:var(--muted);">' + (r.discord || '—') + '</td>' +
        '<td>' + (SVC[r.servicio] || r.servicio) + '</td>' +
        '<td style="font-size:12px;color:var(--muted);">' + (r.pack || '—') + '</td>' +
        '<td>' + badge(r.estado) + '</td>' +
        '<td style="font-size:12px;">' + fecha(r.created_at) + '</td>' +
        '<td><button class="btn-abrir" onclick="abrirModal(' + r.id + ')">Abrir</button></td>' +
      '</tr>';
    }).join('');

    renderPaginacion();

  }).catch(function(e) {
    tbody.innerHTML = '<tr><td colspan="9" class="tbl-empty" style="color:var(--red);">Error: ' + e.message + '</td></tr>';
  });
}

function renderPaginacion() {
  var el = get('paginacion');
  el.innerHTML = '';
  if (totalPags <= 1) return;

  var btn;

  btn = document.createElement('button');
  btn.className = 'pg-btn';
  btn.textContent = '←';
  btn.disabled = (pagActual === 1);
  btn.onclick = function() { cargarSolicitudes(pagActual - 1); };
  el.appendChild(btn);

  for (var i = 1; i <= totalPags; i++) {
    btn = document.createElement('button');
    btn.className = 'pg-btn' + (i === pagActual ? ' activo' : '');
    btn.textContent = i;
    (function(num) { btn.onclick = function() { cargarSolicitudes(num); }; })(i);
    el.appendChild(btn);
  }

  btn = document.createElement('button');
  btn.className = 'pg-btn';
  btn.textContent = '→';
  btn.disabled = (pagActual === totalPags);
  btn.onclick = function() { cargarSolicitudes(pagActual + 1); };
  el.appendChild(btn);
}

get('fBtn').addEventListener('click', function() { cargarSolicitudes(1); });

var searchTimer;
get('fSearch').addEventListener('input', function() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(function() { cargarSolicitudes(1); }, 400);
});

// ── MODAL ─────────────────────────────────────
function abrirModal(id) {
  currentId = id;
  api('/api/crm/solicitudes/' + id).then(function(r) {
    get('modalTitulo').textContent  = 'Solicitud #' + r.id;
    get('modalTicket').textContent  = r.ticket;
    get('mNombre').textContent      = r.nombre;
    get('mEmail').textContent       = r.email;
    get('mDiscord').textContent     = r.discord || '—';
    get('mServicio').textContent    = SVC[r.servicio] || r.servicio;
    get('mPack').textContent        = r.pack || '—';
    get('mPresupuesto').textContent = r.presupuesto || '—';
    get('mDesc').textContent        = r.descripcion;
    get('eEstado').value            = r.estado;
    get('eNotas').value             = r.notas_admin || '';
    get('modalFondo').style.display = 'flex';
  }).catch(function(e) {
    toast('Error: ' + e.message, 'err');
  });
}

function cerrarModal() {
  get('modalFondo').style.display = 'none';
  currentId = null;
}

get('modalCerrar').addEventListener('click', cerrarModal);
get('btnCancelar').addEventListener('click', cerrarModal);
get('modalFondo').addEventListener('click', function(e) {
  if (e.target === get('modalFondo')) cerrarModal();
});

get('btnGuardar').addEventListener('click', function() {
  if (!currentId) return;
  var btn = get('btnGuardar');
  btn.textContent = 'Guardando...';
  btn.disabled    = true;

  api('/api/crm/solicitudes/' + currentId, {
    method: 'PUT',
    body: JSON.stringify({
      estado:      get('eEstado').value,
      notas_admin: get('eNotas').value.trim() || null
    })
  }).then(function() {
    toast('Guardado correctamente', 'ok');
    cerrarModal();
    cargarDashboard();
    if (currentView === 'solicitudes') cargarSolicitudes(pagActual);
  }).catch(function(e) {
    toast('Error: ' + e.message, 'err');
  }).finally(function() {
    btn.textContent = 'Guardar';
    btn.disabled    = false;
  });
});

// ── ELIMINAR ──────────────────────────────────
get('btnEliminar').addEventListener('click', function() {
  if (!currentId) return;
  delId = currentId;
  get('confirmTexto').textContent = 'Ticket: ' + get('modalTicket').textContent;
  get('confirmFondo').style.display = 'flex';
});

get('confirmNo').addEventListener('click', function() {
  get('confirmFondo').style.display = 'none';
  delId = null;
});

get('confirmFondo').addEventListener('click', function(e) {
  if (e.target === get('confirmFondo')) {
    get('confirmFondo').style.display = 'none';
    delId = null;
  }
});

get('confirmSi').addEventListener('click', function() {
  if (!delId) return;
  var id = delId;
  delId  = null;

  api('/api/crm/solicitudes/' + id, { method: 'DELETE' }).then(function() {
    get('confirmFondo').style.display = 'none';
    cerrarModal();
    toast('Solicitud eliminada', 'info');
    cargarDashboard();
    if (currentView === 'solicitudes') cargarSolicitudes(pagActual);
  }).catch(function(e) {
    toast('Error: ' + e.message, 'err');
  });
});

// ── ARRANQUE ──────────────────────────────────
init();
