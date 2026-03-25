const SUPABASE_URL = 'https://orypvcwpeomplyhqwzdh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yeXB2Y3dwZW9tcGx5aHF3emRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MDE4OTUsImV4cCI6MjA4NTM3Nzg5NX0.WUB5SAQPGdbQQgKWsoxGnxjKGWq9iUNUlTG19SWhhk8';
const SUPABASE_EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/notify-telegram`;
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function getSolicitudes(filtroUrgencia = '', filtroModulo = '') {
  let query = supabase
    .from('solicitudes_material')
    .select('*')
    .order('fecha', { ascending: false });

  const { data, error } = await query;
  if (error) throw error;

  let resultados = data || [];

  if (filtroUrgencia) {
    resultados = resultados.filter(s => s.urgencia === filtroUrgencia);
  }
  if (filtroModulo) {
    resultados = resultados.filter(s => s.modulo && s.modulo.toLowerCase().includes(filtroModulo.toLowerCase()));
  }

  return resultados;
}

/**
 * Crea una solicitud con número automático (SOL-2526-NNN) y notifica por Telegram.
 * El número se genera en servidor (RPC) para evitar race conditions.
 */
async function crearSolicitud(solicitud) {
  // 1. Obtener siguiente número desde Supabase (RPC atómico)
  const { data: rpcData, error: rpcError } = await supabase.rpc('generar_numero_solicitud');
  if (rpcError) throw new Error('Error al generar número de solicitud: ' + rpcError.message);
  const numeroSolicitud = rpcData; // ej. "SOL-2526-001"

  // 2. Insertar con el número asignado
  const solicitudConNumero = { ...solicitud, numero_solicitud: numeroSolicitud };
  const { data, error } = await supabase
    .from('solicitudes_material')
    .insert([solicitudConNumero])
    .select()
    .single();
  if (error) throw error;

  // 3. Notificar por Telegram (Edge Function)
  try {
    const notifyRes = await fetch(SUPABASE_EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        numero_solicitud: numeroSolicitud,
        nombre_profesor: solicitud.nombre_profesor,
        grupo: solicitud.grupo_curso,
        modulo: solicitud.modulo,
        material: solicitud.material_solicitado,
        cantidad: solicitud.cantidad,
        urgencia: solicitud.urgencia,
        proyecto: solicitud.nombre_proyecto,
        fecha: solicitud.fecha
      })
    });
    const notifyData = await notifyRes.json();
    if (!notifyRes.ok) {
      console.error('Telegram notification failed:', notifyData);
      // No lanzamos error — la solicitud ya se guardó
    }
  } catch (notifyErr) {
    console.error('Telegram notification error:', notifyErr);
    // No bloqueamos — la solicitud ya se guardó
  }

  return data;
}

async function eliminarSolicitud(id) {
  const { error } = await supabase
    .from('solicitudes_material')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export { supabase, getSolicitudes, crearSolicitud, eliminarSolicitud };
