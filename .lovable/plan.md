## Problema

En `DemoLeaderboardTab.tsx` la consulta filtra los partidos demo por `round_label LIKE "Clausura%"` (un legado de cuando se mezclaban Apertura/Clausura). Pero `demo-sync` ahora guarda los `round_label` que devuelve la API (`"Cuartos de Final"`, `"Semifinales"`, `"Final"`, etc.), ninguno empieza con "Clausura". Por eso `clausuraMatchIds` queda vacío y **todas las predicciones se descartan**, resultando en 0 puntos para todos los miembros aunque el cálculo en BD sí ocurrió.

Verificado en BD:
- `demo_matches.round_label` = `"Cuartos de Final"` (4 finished, 4 upcoming)
- `demo_predictions` tiene `points_awarded` asignados (1 pt en partidos finalizados)
- Tabla de Posiciones muestra 0 porque el filtro elimina todo

En grupos privados (`LeaderboardTab.tsx`) **no existe ese filtro defectuoso**, así que la lógica de agregación es correcta. Sin embargo, comparten un problema secundario: tras el scoring automático del cron `api-football-fixtures`, el frontend no se entera hasta que el usuario navega de nuevo. Vamos a reforzar la frescura de datos en ambos.

## Cambios

### 1. `src/components/demo/DemoLeaderboardTab.tsx`
- Eliminar el filtro `round_label LIKE "Clausura%"` y la consulta auxiliar a `demo_matches` (ya no es necesaria; demo-sync sólo inserta Liguilla Clausura).
- Agregar exactos/correctos/total contando todas las predicciones del usuario directamente.

### 2. `src/components/group/LeaderboardTab.tsx` y `DemoLeaderboardTab.tsx`
- Configurar la query con `staleTime: 0` y `refetchOnWindowFocus: true` para que al volver al tab tras un scoring automático se actualicen los puntos.
- Suscribirse vía Supabase Realtime a cambios en `predictions` (filtrado por `group_id`) y `demo_predictions`, e invalidar la query del leaderboard cuando llegue un UPDATE con `points_awarded`.

### 3. `src/pages/GroupDashboard.tsx` y `src/pages/DemoGroup.tsx`
- Al montar el dashboard, invalidar la query del leaderboard una vez para forzar refetch fresco.

## Detalles técnicos

- La RLS actual de `predictions` y `demo_predictions` ya permite leer puntos ajenos cuando `matches.status='finished'`, así que el agregado por usuario en el leaderboard sigue siendo correcto sin cambios de BD.
- No requiere migraciones SQL ni edge functions nuevas.
- Tras el cambio el leaderboard del demo reflejará los puntos ya calculados de los Cuartos de Final, y los grupos privados se actualizarán en tiempo real cuando `api-football-fixtures` marque puntos.
