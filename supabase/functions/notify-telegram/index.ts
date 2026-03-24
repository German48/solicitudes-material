// Supabase Edge Function: notify-telegram
// Envía un mensaje a Telegram cuando se crea una nueva solicitud.
// El token del bot se obtiene del secret TELEGRAM_BOT_TOKEN (nunca hardcodear).

const TELEGRAM_API = 'https://api.telegram.org';
const CHAT_ID = '7186910220';

interface SolicitudPayload {
  numero_solicitud: string;
  nombre_profesor: string;
  grupo: string;
  modulo: string;
  material: string;
  cantidad: number;
  urgencia: string;
  proyecto: string;
  fecha: string;
}

Deno.serve(async (req: Request) => {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Verificar Authorization header (anon key)
  const authHeader = req.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let payload: SolicitudPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const {
    numero_solicitud = '-',
    nombre_profesor = '-',
    grupo = '-',
    modulo = '-',
    material = '-',
    cantidad = '-',
    urgencia = '-',
    proyecto = '-',
    fecha = '-'
  } = payload;

  const texto = `🔔 Nueva solicitud de material
📋 Nº: ${numero_solicitud}
👤 Profesor/a: ${nombre_profesor}
🏫 Grupo: ${grupo}
📚 Módulo: ${modulo}
🔧 Material: ${material}
🔢 Cantidad: ${cantidad}
⚡ Urgencia: ${urgencia}
📁 Proyecto: ${proyecto}
📅 Fecha: ${fecha}`;

  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!botToken) {
    console.error('TELEGRAM_BOT_TOKEN secret not configured');
    return new Response(JSON.stringify({ error: 'Telegram bot token not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const url = `${TELEGRAM_API}/bot${botToken}/sendMessage`;
  const body = JSON.stringify({
    chat_id: CHAT_ID,
    text: texto,
    parse_mode: 'HTML'
  });

  let tgRes: Response;
  try {
    tgRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    });
  } catch (fetchErr) {
    console.error('Telegram fetch error:', fetchErr);
    return new Response(JSON.stringify({ error: 'Failed to reach Telegram API' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const tgData = await tgRes.json();
  if (!tgRes.ok) {
    console.error('Telegram API error:', tgData);
    return new Response(JSON.stringify({ error: 'Telegram API error', detail: tgData }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ ok: true, message_id: tgData.result?.message_id }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
});
