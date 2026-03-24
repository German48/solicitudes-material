const SUPABASE_URL = 'https://orypvcwpeomplyhqwzdh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yeXB2Y3dwZW9tcGx5aHF3emRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MDE4OTUsImV4cCI6MjA4NTM3Nzg5NX0.WUB5SAQPGdbQQgKWsoxGnxjKGWq9iUNUlTG19SWhhk8';

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

async function crearSolicitud(solicitud) {
  const { data, error } = await supabase
    .from('solicitudes_material')
    .insert([solicitud])
    .select();
  if (error) throw error;
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
