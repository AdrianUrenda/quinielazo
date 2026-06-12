## Problema

El filtro de etapa (`Grupos`, `8vos`, etc.) funciona, pero el filtro por **grupo del torneo** (`Grupo A`, `Grupo B`, …) nunca encuentra partidos.

Causa raíz: API-Football devuelve `round = "Group Stage - 1/2/3"` (sin letra), y por eso `group_label` está en `null` para **todos** los partidos de fase de grupos en la tabla `matches`. El cliente intenta extraer la letra del `round_label` con regex `/group\s+([A-L])/i`, que nunca coincide. Verificado en BD:

```
stage=group | round_label="Group Stage - 1" | group_label=NULL
```

La letra del grupo solo existe en el endpoint de **standings** (que ya consumimos en `api-football-stats` para la página Estadísticas), donde cada equipo viene con su grupo (`Group A`, `Group B`, …).

## Solución

Usar el mapping equipo → letra de grupo de standings como única fuente de verdad para etiquetar partidos de fase de grupos, tanto en backend (sync a `matches`) como en frontend (`/calendar`).

### 1. Edge function `api-football-fixtures`

- Antes de procesar fixtures, hacer fetch a `/standings?league=1&season=2026` y construir `teamGroupMap: Record<teamName, "A"|"B"|...>`.
- En `syncMatches`, calcular `group_label` para cada partido como `teamGroupMap[home_team] ?? teamGroupMap[away_team] ?? null` (solo cuando `stage === "group"`).
- Incluir `teamGroupMap` en el payload de respuesta para que el cliente pueda derivar el grupo sin tocar el DOM/BD.

### 2. `src/lib/matchCalendar.ts`

- Extender `getGroup(round, groupLabel, teamGroupMap?, homeTeam?, awayTeam?)` para que, si `groupLabel` y el regex fallan, consulte el mapa con los nombres de equipos.

### 3. `src/components/group/PredictionsTab.tsx`

- Pasar el mapa al filtrar. El mapa puede venir de un `useQuery` que invoca `api-football-fixtures` con `action: "team-groups"` (solo standings) **o** simplemente leer el `group_label` de la tabla `matches` una vez se haya re-sincronizado.
- Solución mínima: depender de `group_label` ya poblado por la edge function tras un sync. Mostrar el filtro funcional inmediatamente tras presionar "Actualizar resultados".

### 4. `src/pages/MatchCalendar.tsx`

- Consumir `teamGroupMap` del payload de la edge function y pasarlo a `getGroup`, ya que esta página no usa la tabla `matches`.

### 5. Backfill de datos existentes

- Añadir un trigger inicial: al cargar Predicciones/Calendar, si detectamos `stage='group'` con `group_label IS NULL`, invocar automáticamente `sync-matches` una vez (silencioso). Alternativa más simple: el usuario presiona "Actualizar resultados" y se pueblan los `group_label` para los 72 partidos de fase de grupos.

## Verificación

1. Invocar `sync-matches`, luego `SELECT DISTINCT group_label FROM matches WHERE stage='group'` debe devolver A–L.
2. En `/calendar` filtrar Grupos → Grupo A: debe listar los 3 partidos del Grupo A.
3. Lo mismo en la pestaña Predicciones de cualquier grupo privado.
4. Los demás filtros de etapa (32avos, 8vos, …) siguen funcionando.

## Archivos a modificar

- `supabase/functions/api-football-fixtures/index.ts`
- `src/lib/matchCalendar.ts`
- `src/pages/MatchCalendar.tsx`
- `src/components/group/PredictionsTab.tsx`
