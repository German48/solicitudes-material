# Despliegue — Edge Function notify-telegram

## 1. Añadir el secret del token de Telegram

```bash
supabase secrets set TELEGRAM_BOT_TOKEN=<tu_token_del_bot>
```

## 2. Crear la función RPC `generar_numero_solicitud`

Ejecuta el SQL de migración desde la consola de Supabase (Dashboard → SQL Editor) o desde CLI:

```bash
supabase db execute --file supabase/migrations/001_add_numero_solicitud.sql
```

O copia y ejecuta manualmente el contenido de `supabase/migrations/001_add_numero_solicitud.sql`.

## 3. Desplegar la Edge Function

```bash
cd C:\Users\Administrador\OneDrive\CODER\solicitudes-material
supabase functions deploy notify-telegram
```

## 4. Verificar

```bash
supabase functions list
```

Debería mostrar `notify-telegram` como deployed.

## 5. Probar la Edge Function

```bash
curl -X POST https://orypvcwpeomplyhqwzdh.supabase.co/functions/v1/notify-telegram \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -d '{"numero_solicitud":"SOL-2526-001","nombre_profesor":"Test","grupo":"1º DAM","modulo":"DI","material":"Cable USB","cantidad":5,"urgencia":"Normal","proyecto":"Test","fecha":"2026-03-24"}'
```

## Notas importantes

- **NUNCA** hardcodear el `TELEGRAM_BOT_TOKEN` en ningún archivo del repositorio.
- La Edge Function se llama con la `ANON_KEY` (ya es pública y está en supabase.js).
- La función RPC `generar_numero_solicitud` se ejecuta de forma atómica para evitar números duplicados.
