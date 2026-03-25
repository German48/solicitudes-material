import { getSolicitudes, crearSolicitud, eliminarSolicitud } from './supabase.js';

const form = document.getElementById('form-solicitud');
const lista = document.getElementById('lista-solicitudes');
const filtroEstado = document.getElementById('filtro-estado');
const filtroModulo = document.getElementById('filtro-modulo');
const buscadorGlobal = document.getElementById('buscador-global');
const mensajeError = document.getElementById('mensaje-error');
const mensajeExito = document.getElementById('mensaje-exito');
const borradorIndicator = document.getElementById('borrador-indicator');

// ── Listas cerradas persistidas en localStorage ─────────────
const LISTAS_KEY = 'solicitudes_listas';

const LISTAS_DEFAULT = {
  docente: ['Enrique', 'Juan Carlos', 'Álvaro', 'Nico', 'Pepa', 'Laura', 'Germán', 'Saskia', 'Jonás'],
  modulo: ['DDR', 'DRP', 'GNE', 'RRC', 'SOJ', 'ABD', 'DHI', 'DJK', 'MLU', 'PXE', 'A10', 'MC4', 'OAA', 'PVW', 'DCU', 'MRN', 'PUB', 'SOV', 'ATZ', 'EB1', 'PMB', 'AAD', 'MCR', 'OPP', 'CDA', 'NCI', 'OPZ', 'PZ1', 'TUO', 'ILB', 'IUD', 'TPZ', 'FAT', 'IYO', 'MJC', 'Departamento']
};

function getListas() {
  try {
    const saved = localStorage.getItem(LISTAS_KEY);
    return saved ? JSON.parse(saved) : { ...LISTAS_DEFAULT };
  } catch { return { ...LISTAS_DEFAULT }; }
}

function saveListas(listas) {
  localStorage.setItem(LISTAS_KEY, JSON.stringify(listas));
}

// ── Poblar selects dinámicamente ──────────────────────────
function populateSelect(id, valores, selectedValue = '') {
  const sel = document.getElementById(id);
  if (!sel) return;
  // Solo toca las options generadas por nosotros (marcadas con data-dynamic)
  const firstRealOption = sel.options[0];
  sel.innerHTML = '';
  if (firstRealOption) sel.appendChild(firstRealOption);
  valores.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v;
    if (v === selectedValue) opt.selected = true;
    opt.dataset.dynamic = '1';
    sel.appendChild(opt);
  });
}

function populateAllSelects(selectedDocente = '', selectedModulo = '') {
  const listas = getListas();
  populateSelect('docente', listas.docente, selectedDocente);
  populateSelect('modulo', listas.modulo, selectedModulo);
  populateSelect('filtro-modulo', ['', ...listas.modulo], filtroModulo?.value || '');
}

// ── Modal gestionar opciones ────────────────────────────────
let modalTarget = null; // 'docente' | 'modulo'

function abrirModal(tipo) {
  modalTarget = tipo;
  const listas = getListas();
  const items = listas[tipo] || [];
  const titulo = document.getElementById('modal-titulo');
  const listaEl = document.getElementById('gestion-lista');
  const input = document.getElementById('gestion-nuevo');
  const modal = document.getElementById('modal-gestionar');

  titulo.textContent = tipo === 'docente' ? 'Gestionar Docentes' : 'Gestionar Módulos';
  input.value = '';
  listaEl.innerHTML = '';

  items.forEach((item, idx) => {
    const row = document.createElement('div');
    row.className = 'gestion-item';
    row.innerHTML = `
      <span>${item}</span>
      <button type="button" class="btn-delete-item" data-idx="${idx}" title="Eliminar">✕</button>
    `;
    listaEl.appendChild(row);
  });

  listaEl.querySelectorAll('.btn-delete-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.idx);
      listas[tipo].splice(idx, 1);
      saveListas(listas);
      abrirModal(tipo); // refresh
      populateAllSelects();
    });
  });

  modal.style.display = 'flex';
  setTimeout(() => input.focus(), 100);
}

function cerrarModal() {
  document.getElementById('modal-gestionar').style.display = 'none';
  modalTarget = null;
}

document.getElementById('modal-cerrar')?.addEventListener('click', cerrarModal);
document.getElementById('btn-add-opcion')?.addEventListener('click', () => {
  const input = document.getElementById('gestion-nuevo');
  const val = input.value.trim();
  if (!val || !modalTarget) return;
  const listas = getListas();
  if (!listas[modalTarget].includes(val)) {
    listas[modalTarget].push(val);
    saveListas(listas);
    populateAllSelects();
    abrirModal(modalTarget); // refresh
  }
  input.value = '';
  input.focus();
});

document.querySelectorAll('.btn-gestionar').forEach(btn => {
  btn.addEventListener('click', () => abrirModal(btn.dataset.target));
});

// Cerrar modal al hacer clic fuera
document.getElementById('modal-gestionar')?.addEventListener('click', (e) => {
  if (e.target.id === 'modal-gestionar') cerrarModal();
});

// ── Theme toggle ───────────────────────────────────────────
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');

function applyTheme(dark) {
  document.body.classList.toggle('dark', dark);
  themeIcon.textContent = dark ? '☀️' : '🌙';
  localStorage.setItem('theme', dark ? 'dark' : 'light');
}

(function initTheme() {
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(saved === 'dark' || (!saved && prefersDark));
})();

themeToggle.addEventListener('click', () => {
  applyTheme(!document.body.classList.contains('dark'));
});

// ── Auto-llenar fecha hoy ──────────────────────────────────
const fechaInput = document.getElementById('fecha');
const hoy = new Date().toISOString().split('T')[0];
if (fechaInput) fechaInput.value = hoy;

// ── Autoguardado en localStorage ───────────────────────────
const DRAFT_KEY = 'solicitud_material_draft';

function getFormData() {
  return {
    fecha: document.getElementById('fecha')?.value || '',
    docente: document.getElementById('docente')?.value || '',
    grupo: document.getElementById('grupo')?.value || '',
    modulo: document.getElementById('modulo')?.value || '',
    nombre_proyecto: document.getElementById('nombre_proyecto')?.value || '',
    estado: document.getElementById('estado')?.value || 'Por comprar',
    material_solicitado: document.getElementById('material_solicitado')?.value || '',
    descripcion_enlace: document.getElementById('descripcion_enlace')?.value || '',
    donde_comprar: document.getElementById('donde_comprar')?.value || '',
    comentarios: document.getElementById('comentarios')?.value || ''
  };
}

function restoreForm(data) {
  if (!data || !form) return;
  if (data.fecha && document.getElementById('fecha')) document.getElementById('fecha').value = data.fecha;
  if (data.docente && document.getElementById('docente')) document.getElementById('docente').value = data.docente;
  if (data.grupo && document.getElementById('grupo')) document.getElementById('grupo').value = data.grupo;
  if (data.modulo && document.getElementById('modulo')) document.getElementById('modulo').value = data.modulo;
  if (data.nombre_proyecto && document.getElementById('nombre_proyecto')) document.getElementById('nombre_proyecto').value = data.nombre_proyecto;
  if (data.estado && document.getElementById('estado')) document.getElementById('estado').value = data.estado;
  if (data.material_solicitado && document.getElementById('material_solicitado')) document.getElementById('material_solicitado').value = data.material_solicitado;
  if (data.descripcion_enlace && document.getElementById('descripcion_enlace')) document.getElementById('descripcion_enlace').value = data.descripcion_enlace;
  if (data.donde_comprar && document.getElementById('donde_comprar')) document.getElementById('donde_comprar').value = data.donde_comprar;
  if (data.comentarios && document.getElementById('comentarios')) document.getElementById('comentarios').value = data.comentarios;
}

function guardarBorrador() {
  if (!form) return;
  const data = getFormData();
  localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  if (borradorIndicator) {
    borradorIndicator.textContent = 'Borrador guardado';
    borradorIndicator.style.display = 'inline';
    clearTimeout(borradorIndicator._timeout);
    borradorIndicator._timeout = setTimeout(() => {
      if (borradorIndicator) borradorIndicator.style.display = 'none';
    }, 2000);
  }
}

function clearBorrador() {
  localStorage.removeItem(DRAFT_KEY);
  if (borradorIndicator) borradorIndicator.style.display = 'none';
}

(function restoreDraft() {
  try {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      restoreForm(data);
    }
  } catch (e) { /* ignore */ }
})();

function debounce(fn, ms) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}

const debouncedGuardar = debounce(guardarBorrador, 500);
if (form) form.addEventListener('input', debouncedGuardar);

// ── Colores de estado ────────────────────────────────────
const coloresEstado = {
  'Por comprar': '#f97316',
  'Comprado': '#3b82f6',
  'Recibido': '#22c55e',
  'Anulado': '#6b7280'
};

function colorBadge(estado) {
  const color = coloresEstado[estado] || '#6b7280';
  return `<span class="badge" style="background:${color}">${estado}</span>`;
}

// ── Renderizar lista (cards) ────────────────────────────────
function renderizarLista(solicitudes) {
  if (!lista) return;
  lista.innerHTML = '';

  if (solicitudes.length === 0) {
    lista.innerHTML = '<p class="vacio">No hay solicitudes que coincidan.</p>';
    return;
  }

  solicitudes.forEach(s => {
    const div = document.createElement('div');
    div.className = 'solicitud-card';
    div.innerHTML = `
      <div class="solicitud-header">
        <strong>${s.numero_solicitud ? s.numero_solicitud + ' — ' : ''}${s.docente || s.nombre_profesor || '-'}</strong>
        ${colorBadge(s.urgencia || s.estado || 'Por comprar')}
        <button class="btn-eliminar" data-id="${s.id}" title="Eliminar">✕</button>
      </div>
      <div class="solicitud-body">
        <p><strong>Fecha:</strong> ${s.fecha}</p>
        <p><strong>Grupo:</strong> ${s.grupo_curso || '-'}</p>
        <p><strong>Módulo:</strong> ${s.modulo || '-'}</p>
        <p><strong>Proyecto:</strong> ${s.nombre_proyecto || '-'}</p>
        <p><strong>Material:</strong> ${s.material_solicitado}</p>
        ${s.descripcion_enlace ? `<p><strong>Descripción:</strong> ${s.descripcion_enlace}</p>` : ''}
        ${s.donde_comprar ? `<p><strong>Dónde comprar:</strong> ${s.donde_comprar}</p>` : ''}
        ${s.comentarios ? `<p><strong>Comentarios:</strong> ${s.comentarios}</p>` : ''}
      </div>
    `;
    lista.appendChild(div);
  });

  lista.querySelectorAll('.btn-eliminar').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('¿Eliminar esta solicitud?')) {
        await eliminarSolicitud(Number(btn.dataset.id));
        cargarSolicitudes();
      }
    });
  });
}

// ── Cargar solicitudes ─────────────────────────────────────
async function cargarSolicitudes() {
  if (!lista) return;
  try {
    const estadoFiltro = filtroEstado?.value || '';
    const moduloFiltro = filtroModulo?.value || '';
    const textoBuscador = buscadorGlobal?.value?.toLowerCase() || '';

    let datos = await getSolicitudes(estadoFiltro, moduloFiltro);

    if (textoBuscador) {
      datos = datos.filter(s =>
        (s.docente || s.nombre_profesor || '').toLowerCase().includes(textoBuscador) ||
        (s.material_solicitado || '').toLowerCase().includes(textoBuscador) ||
        (s.modulo || '').toLowerCase().includes(textoBuscador) ||
        (s.grupo_curso || '').toLowerCase().includes(textoBuscador) ||
        (s.nombre_proyecto || '').toLowerCase().includes(textoBuscador) ||
        (s.descripcion_enlace || '').toLowerCase().includes(textoBuscador) ||
        (s.donde_comprar || '').toLowerCase().includes(textoBuscador) ||
        (s.comentarios || '').toLowerCase().includes(textoBuscador)
      );
    }

    renderizarLista(datos);
    if (mensajeError) mensajeError.textContent = '';
  } catch (e) {
    if (mensajeError) mensajeError.textContent = 'Error al cargar: ' + e.message;
  }
}

// ── Submit formulario ───────────────────────────────────────
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (mensajeError) mensajeError.textContent = '';
    if (mensajeExito) mensajeExito.textContent = '';

    const datos = {
      fecha: document.getElementById('fecha').value,
      nombre_profesor: document.getElementById('docente').value.trim(),
      grupo_curso: document.getElementById('grupo').value,
      modulo: document.getElementById('modulo').value,
      material_solicitado: document.getElementById('material_solicitado').value.trim(),
      urgencia: document.getElementById('estado').value,
      nombre_proyecto: document.getElementById('nombre_proyecto').value.trim(),
      descripcion_enlace: document.getElementById('descripcion_enlace').value.trim(),
      donde_comprar: document.getElementById('donde_comprar').value.trim(),
      comentarios: document.getElementById('comentarios').value.trim()
    };

    if (!datos.nombre_profesor || !datos.material_solicitado) {
      if (mensajeError) mensajeError.textContent = 'Completa los campos obligatorios.';
      return;
    }

    try {
      const result = await crearSolicitud(datos);
      clearBorrador();
      const numSol = result?.numero_solicitud || '';
      if (mensajeExito) {
        mensajeExito.textContent = numSol ? `✓ Solicitud ${numSol} enviada correctamente.` : '✓ Solicitud enviada correctamente.';
        setTimeout(() => { mensajeExito.textContent = ''; }, 4000);
      }
      form.reset();
      if (fechaInput) fechaInput.value = hoy;
      populateAllSelects();
      window.location.href = 'solicitudes.html';
    } catch (e) {
      if (mensajeError) mensajeError.textContent = 'Error al enviar: ' + e.message;
    }
  });
}

// ── Filtros ─────────────────────────────────────────────────
if (filtroEstado) filtroEstado.addEventListener('change', cargarSolicitudes);
if (filtroModulo) filtroModulo.addEventListener('change', cargarSolicitudes);
if (buscadorGlobal) buscadorGlobal.addEventListener('input', debounce(cargarSolicitudes, 300));

// ── Init selects + carga ──────────────────────────────────
populateAllSelects();
if (lista) cargarSolicitudes();

// ── Registrar Service Worker ───────────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

// ── PWA Install Banner ─────────────────────────────────────
const PWA_BANNER_DISMISSED_KEY = 'pwa_banner_dismissed';

function isIOS() { return /iPhone|iPad|iPod/i.test(navigator.userAgent); }

function showBanner() {
  const banner = document.getElementById('pwa-install-banner');
  const textEl = document.getElementById('pwa-banner-text');
  const btnEl = document.getElementById('pwa-install-btn');
  if (!banner || !textEl) return;
  banner.style.display = 'flex';
  if (isIOS()) {
    textEl.textContent = '📲 Para instalar en tu móvil: pulsa compartir ⬆️ y luego "Añadir a pantalla de inicio"';
    if (btnEl) btnEl.style.display = 'none';
  } else {
    textEl.textContent = '📲 Instala esta app en tu móvil para acceso rápido';
    if (btnEl) btnEl.style.display = 'inline-block';
  }
}

function hideBanner() {
  const banner = document.getElementById('pwa-install-banner');
  if (banner) banner.style.display = 'none';
  localStorage.setItem(PWA_BANNER_DISMISSED_KEY, '1');
}

document.getElementById('pwa-banner-close')?.addEventListener('click', hideBanner);

let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (!localStorage.getItem(PWA_BANNER_DISMISSED_KEY)) showBanner();
});

window.addEventListener('appinstalled', () => { deferredPrompt = null; hideBanner(); });

window.addEventListener('DOMContentLoaded', () => {
  if (isIOS() && !localStorage.getItem(PWA_BANNER_DISMISSED_KEY)) showBanner();
});
