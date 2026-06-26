## Problemas detectados

### 1. Etiqueta incorrecta "Grupo A" en partidos de eliminatorias
En `PredictionMatchCard` (y en el filtrado), siempre se llama a `getGroup(...)` con fallback a `teamGroupMap[home_team]`. Para South Africa vs Canada (treintaidosavos), la BD ya tiene `stage = round_of_32` y `group_label = NULL`, pero el helper igual devuelve "A" porque South Africa pertenece al Grupo A en la fase de grupos. Por eso aparece "Grupo A" en una fase eliminatoria.

**Fix:** derivar la etiqueta de grupo únicamente cuando `getStage(match.round_label, match.stage) === "group"`. Si no, mostrar siempre `getStageLabel(...)` ("Treintaidosavos", "Octavos", etc.). Aplicar el mismo cambio en el filtro por grupo dentro de `filtered` y replicarlo en `src/pages/MatchCalendar.tsx` para mantener consistencia.

### 2. Predicciones "preguardadas" en partidos de treintaidosavos
La BD tiene predicciones reales (ej. 2-0 para South Africa vs Canada creadas el 18-jun) atadas al `match_id` del partido #25. Eso ocurrió porque API-Football conservó el mismo `fixture id` mientras el partido se mostraba con placeholder (p. ej. "1A vs 1B") y luego lo resolvió con equipos reales. Las predicciones hechas sobre el placeholder quedaron pegadas al partido ya definido, dando la falsa impresión de que la app "preguarda" un valor.

**Fix en `sync-matches` (edge function `api-football-fixtures`):** al actualizar `matches`, si la fila existente tiene `home_team` o `away_team` distinto al nuevo valor que viene de la API (y el partido sigue `upcoming`), borrar todas las predicciones de ese `match_id` antes del `update`. Así, cuando un cruce de eliminatoria se resuelve, las predicciones del placeholder se eliminan automáticamente y el usuario debe ingresar una nueva predicción para los equipos reales.

**Limpieza única:** ejecutar un `DELETE` puntual sobre `predictions` para los `match_id` de treintaidosavos cuyos equipos ya se resolvieron (los 8 partidos con `stage = round_of_32` y `home_team`/`away_team` distintos a un placeholder tipo `^\d[A-L]$` / `^Winner|Loser|3rd`), de modo que las predicciones heredadas del placeholder desaparezcan ahora mismo. Esto deja a los usuarios sin predicción guardada en esos cruces (estado correcto) y pueden capturar la nueva.

## Detalles técnicos

- `src/components/group/PredictionsTab.tsx`
  - `PredictionMatchCard`: calcular `group` solo si `getStage(...) === "group"`; eliminar el fallback por `teamGroupMap` para fases eliminatorias.
  - `filtered`: el filtro por `groupFilter` debe ignorar partidos cuya stage no sea `group`.
- `src/pages/MatchCalendar.tsx`: aplicar la misma corrección al chip/etiqueta y al filtro.
- `supabase/functions/api-football-fixtures/index.ts` (`syncMatches`):
  - Antes del `update`, comparar `existing.home_team`/`away_team` con los nuevos. Si difieren y `status === "upcoming"`, hacer `supabase.from("predictions").delete().eq("match_id", existing.id)` y registrar en log.
- Limpieza única: migración SQL que ejecute el `DELETE` descrito arriba, restringido a partidos `round_of_32` cuyos nombres actuales no sean placeholders.

## Validación

1. Recargar la pestaña Predicciones: South Africa vs Canada (y demás cruces resueltos) deben mostrar "Treintaidosavos" en lugar de "Grupo A".
2. Los inputs de predicción para esos cruces deben aparecer vacíos con badge "Sin predicción".
3. Confirmar vía `supabase--read_query` que ya no existen predicciones residuales para esos `match_id` y que un nuevo `sync-matches` no las recrea.
