## Objetivo

Dejar cada secreto con su propósito correcto:
- `API_FOOTBALL_KEY` = tu API key real de api-football.com
- `CRON_SECRET` = un token aleatorio interno que solo conoce el cron y la edge function

## Pasos

### 1. Verificar que `API_FOOTBALL_KEY` tenga el valor correcto
Quiero confirmar contigo que el secreto `API_FOOTBALL_KEY` ya tiene la key real (la que generaste en tu dashboard de api-football.com / RapidAPI). Si no estás seguro, lo actualizamos con `update_secret` y pegas el valor real ahí.

### 2. Reemplazar `CRON_SECRET` con un valor aleatorio nuevo
- Generamos un token aleatorio fuerte (por ejemplo `openssl rand -hex 32`) y te lo paso para que lo pegues en el formulario de `update_secret`.
- Esto actualiza el env var que usa la edge function `api-football-fixtures` para validar el header `Authorization: Bearer ...`.

### 3. Sincronizar el valor en Supabase Vault
La función `_cron_secret()` (que firma las llamadas del cron) **no** lee de los env vars de las edge functions: lee del **Vault de Supabase** (`vault.decrypted_secrets WHERE name = 'CRON_SECRET'`). Hay que escribir el **mismo** token nuevo ahí, con un statement como:

```sql
SELECT vault.create_secret('<nuevo-token>', 'CRON_SECRET');
-- o, si ya existe:
SELECT vault.update_secret(
  (SELECT id FROM vault.secrets WHERE name = 'CRON_SECRET'),
  '<nuevo-token>'
);
```

Esto se ejecuta con la herramienta de inserción de datos (no como migración), porque el valor es específico de tu proyecto y no debe quedar en migraciones que otros remixen.

### 4. Verificar
- Esperar a la próxima ejecución del cron (cada hora) o disparar manualmente la función `api-football-fixtures`.
- Revisar los logs de la edge function: debe responder 200 y traer fixtures, no 401.

## Lo que necesito de ti antes de implementar

1. ¿La API key real de API-Football la tienes a la mano para confirmar/actualizar `API_FOOTBALL_KEY`?
2. ¿OK con que yo genere el token aleatorio para `CRON_SECRET` y tú solo lo pegues en el formulario?
