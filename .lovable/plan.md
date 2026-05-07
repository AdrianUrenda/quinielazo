## Objetivo

Actualizar automáticamente los resultados de los partidos cada 30 minutos, sin depender de que un usuario presione "Actualizar".

## Enfoque

Usar `pg_cron` + `pg_net` de Supabase para invocar la edge function `api-football-fixtures` con `action: "sync-matches"` cada 30 minutos. Esto reutiliza la lógica existente de sincronización (que ya escribe marcadores en `matches` y dispara el cálculo de puntos en `predictions`), por lo que la tabla de Posiciones se refrescará en tiempo real vía las suscripciones Realtime ya implementadas.

## Cambios técnicos

1. **Habilitar extensiones** `pg_cron` y `pg_net` en el proyecto Supabase (si no lo están).
2. **Ajustar `supabase/functions/api-football-fixtures/index.ts**` para permitir la invocación programada:
  - Hoy `action: "sync-matches"` exige un usuario autenticado (`requireAuthenticatedUser`). Cron no envía sesión de usuario.
  - Añadir una vía de autorización alterna: aceptar la llamada cuando el header `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>` (o un secreto dedicado `CRON_SECRET`) esté presente. Mantener el path para usuarios autenticados sin cambios.
3. **Crear el cron job** mediante la herramienta de inserción SQL (no migración, porque incluye la URL del proyecto y la service key — no debe propagarse en remixes):
  ```sql
   select cron.schedule(
     'sync-world-cup-fixtures-every30minutes',
     '0 * * * *',
     $$ select net.http_post(
       url := 'https://yodixfzcxmuvaabfucgh.supabase.co/functions/v1/api-football-fixtures',
       headers := '{"Content-Type":"application/json","Authorization":"Bearer <service-role>"}'::jsonb,
       body := '{"action":"sync-matches"}'::jsonb
     ); $$
   );
  ```
   Se ejecuta al minuto 0 y 30 de cada hora (48 llamadas/día, muy por debajo de los límites típicos de API-Football).
4. **Sin cambios en frontend**: las suscripciones Realtime sobre `predictions` (privados) y `demo_predictions` (demo) ya invalidan la query de Posiciones, así que en cuanto el cron actualice marcadores y se recalculen puntos, los leaderboards abiertos en cualquier navegador se refrescarán solos.

## Notas

- El job sólo cubre el Mundial (tabla `matches`). El grupo demo de Liga MX se gestiona manualmente por el Super Admin (memoria de proyecto), por lo que no se programa cron para `demo-sync`.
- Si en el futuro se quiere mayor frecuencia durante días de partido, basta con cambiar el cron expression sin tocar código.
- El botón "Actualizar" manual seguirá funcionando igual que hoy.