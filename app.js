import { getSolicitudes, crearSolicitud, eliminarSolicitud } from './supabase.js';

const form = document.getElementById('form-solicitud');
const lista = document.getElementById('lista-solicitudes');
const filtroUrgencia = document.getElementById('filtro-urgencia');
const filtroModulo = document.getElementById('filtro-modulo');
const mensajeError = document.getElementById('mensaje-error');
const mensajeExito = document.getElementById('mensaje-exito');

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

// ── Colores de urgencia ────────────────────────────────────
const coloresUrgencia = {
  Normal: '#22c55e',
  Pronto: '#f97316',
  Urgente: '#ef4444'
};

function colorBadge(urgencia) {
  const color = coloresUrgencia[urgencia] || '#6b7280';
  return `<span class="badge" style="background:${color}">${urgencia}</span>`;
}

// ── Renderizar lista (cards) ────────────────────────────────
function renderizarLista(solicitudes) {
  if (!lista) return;
  lista.innerHTML = '';

  if (solicitudes.length === 0) {
    lista.innerHTML = '<p class="vacio">No hay solicitudes aún.</p>';
    return;
  }

  solicitudes.forEach(s => {
    const div = document.createElement('div');
    div.className = 'solicitud-card';
    div.dataset.urgencia = s.urgencia;
    div.innerHTML = `
      <div class="solicitud-header">
        <strong>${s.nombre_profesor}</strong>
        ${colorBadge(s.urgencia)}
        <button class="btn-eliminar" data-id="${s.id}" title="Eliminar">✕</button>
      </div>
      <div class="solicitud-body">
        <p><strong>Fecha:</strong> ${s.fecha}</p>
        <p><strong>Grupo:</strong> ${s.grupo_curso || '-'}</p>
        <p><strong>Módulo:</strong> ${s.modulo || '-'}</p>
        <p><strong>Proyecto:</strong> ${s.nombre_proyecto || '-'}</p>
        <p><strong>Material:</strong> ${s.material_solicitado}</p>
        <p><strong>Cantidad:</strong> ${s.cantidad}</p>
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
    const datos = await getSolicitudes(filtroUrgencia?.value || '', filtroModulo?.value || '');
    renderizarLista(datos);
    if (mensajeError) mensajeError.textContent = '';
  } catch (e) {
    if (mensajeError) mensajeError.textContent = 'Error al cargar solicitudes: ' + e.message;
  }
}

// ── Submit formulario ───────────────────────────────────────
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (mensajeError) mensajeError.textContent = '';
    if (mensajeExito) mensajeExito.textContent = '';

    const grupo = document.getElementById('grupo').value;

    const datos = {
      fecha: document.getElementById('fecha').value,
      nombre_profesor: document.getElementById('nombre_profesor').value.trim(),
      grupo_curso: grupo,
      modulo: document.getElementById('modulo').value.trim(),
      material_solicitado: document.getElementById('material_solicitado').value.trim(),
      cantidad: Number(document.getElementById('cantidad').value),
      urgencia: document.getElementById('urgencia').value,
      nombre_proyecto: document.getElementById('nombre_proyecto').value.trim()
    };

    if (!datos.nombre_profesor || !datos.material_solicitado) {
      if (mensajeError) mensajeError.textContent = 'Completa los campos obligatorios.';
      return;
    }

    try {
      await crearSolicitud(datos);
      if (mensajeExito) {
        mensajeExito.textContent = '✓ Solicitud enviada correctamente.';
        setTimeout(() => { mensajeExito.textContent = ''; }, 2000);
      }
      form.reset();
      if (fechaInput) fechaInput.value = hoy;
      // Redirigir a la tabla
      window.location.href = 'solicitudes.html';
    } catch (e) {
      if (mensajeError) mensajeError.textContent = 'Error al enviar: ' + e.message;
    }
  });
}

// ── Filtros ─────────────────────────────────────────────────
if (filtroUrgencia) filtroUrgencia.addEventListener('change', cargarSolicitudes);
if (filtroModulo) filtroModulo.addEventListener('input', debounce(cargarSolicitudes, 400));

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// Carga inicial (index.html)
if (lista) cargarSolicitudes();

// ── Registrar Service Worker ───────────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
