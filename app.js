import { getSolicitudes, crearSolicitud, eliminarSolicitud } from './supabase.js';

const form = document.getElementById('form-solicitud');
const lista = document.getElementById('lista-solicitudes');
const filtroUrgencia = document.getElementById('filtro-urgencia');
const filtroModulo = document.getElementById('filtro-modulo');
const mensajeError = document.getElementById('mensaje-error');
const mensajeExito = document.getElementById('mensaje-exito');

// Auto-llenar fecha hoy
const fechaInput = document.getElementById('fecha');
const hoy = new Date().toISOString().split('T')[0];
fechaInput.value = hoy;

// Colores de urgencia
const coloresUrgencia = {
  Normal: '#22c55e',
  Pronto: '#f97316',
  Urgente: '#ef4444'
};

function colorBadge(urgencia) {
  const color = coloresUrgencia[urgencia] || '#6b7280';
  return `<span class="badge" style="background:${color}">${urgencia}</span>`;
}

function renderizarLista(solicitudes) {
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
        <p><strong>Grupo/Curso:</strong> ${s.grupo_curso}</p>
        <p><strong>Módulo:</strong> ${s.modulo}</p>
        <p><strong>Proyecto:</strong> ${s.nombre_proyecto || '-'}</p>
        <p><strong>Material:</strong> ${s.material_solicitado}</p>
        <p><strong>Cantidad:</strong> ${s.cantidad}</p>
      </div>
    `;
    lista.appendChild(div);
  });

  // Eventos eliminar
  lista.querySelectorAll('.btn-eliminar').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('¿Eliminar esta solicitud?')) {
        await eliminarSolicitud(Number(btn.dataset.id));
        cargarSolicitudes();
      }
    });
  });
}

async function cargarSolicitudes() {
  try {
    const datos = await getSolicitudes(filtroUrgencia.value, filtroModulo.value);
    renderizarLista(datos);
    mensajeError.textContent = '';
  } catch (e) {
    mensajeError.textContent = 'Error al cargar solicitudes: ' + e.message;
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  mensajeError.textContent = '';
  mensajeExito.textContent = '';

  const datos = {
    fecha: document.getElementById('fecha').value,
    nombre_profesor: document.getElementById('nombre_profesor').value.trim(),
    grupo_curso: document.getElementById('grupo_curso').value.trim(),
    modulo: document.getElementById('modulo').value.trim(),
    material_solicitado: document.getElementById('material_solicitado').value.trim(),
    cantidad: Number(document.getElementById('cantidad').value),
    urgencia: document.getElementById('urgencia').value,
    nombre_proyecto: document.getElementById('nombre_proyecto').value.trim()
  };

  if (!datos.nombre_profesor || !datos.material_solicitado) {
    mensajeError.textContent = 'Completa los campos obligatorios.';
    return;
  }

  try {
    await crearSolicitud(datos);
    mensajeExito.textContent = '✓ Solicitud enviada correctamente.';
    form.reset();
    document.getElementById('fecha').value = hoy;
    cargarSolicitudes();
    setTimeout(() => { mensajeExito.textContent = ''; }, 3000);
  } catch (e) {
    mensajeError.textContent = 'Error al enviar: ' + e.message;
  }
});

filtroUrgencia.addEventListener('change', cargarSolicitudes);
filtroModulo.addEventListener('input', debounce(cargarSolicitudes, 400));

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// Carga inicial
cargarSolicitudes();

// Registrar Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
