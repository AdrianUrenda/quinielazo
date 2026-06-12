## Problema

El endpoint `/standings` de API-Football devuelve **13 grupos**: los 12 reales (`Group Stage - Group A` … `Group L`, 4 equipos cada uno) **más uno extra llamado simplemente `"Group Stage"`** que contiene 12 equipos duplicados (Iran, Austria, Australia, Ivory Coast, Sweden, Uzbekistan, Qatar, Iraq, Saudi Arabia, Ghana, Haiti, Czech Republic) — aparentemente un pool legado de repechaje.

En `fetchTeamGroupMap` (`supabase/functions/api-football-fixtures/index.ts`) hay dos defectos que convierten ese pool basura en falsos "Grupo E":

1. La regex `groupName.match(/[A-L]$/i)` toma la última letra del string. `"Group Stage"` termina en **"e"** → devuelve `"E"`.
2. Iteramos los grupos en orden y **sobrescribimos** entradas previas. Como `"Group Stage"` viene al final, Czech Republic (que primero fue mapeado correctamente a `"A"`) queda reescrito a `"E"`, y se agregan 11 equipos más a "E".

Resultado en BD: Grupo E tiene 18 partidos; A solo 4; varios grupos a 5.

## Solución

Una sola edit en `fetchTeamGroupMap`:

1. Extraer la letra solo con `groupName.match(/Group\s+([A-L])\b/i)` (requiere "Group <Letra>" con frontera). Si no matchea → ignorar ese standings group completo (no procesar sus equipos).
2. No sobrescribir: `if (!map[name]) map[name] = letter;` por defensa adicional.

Esto descarta el pool `"Group Stage"` y deja el mapping limpio (47 equipos, letra correcta).

## Resincronización de datos

Después de desplegar la edge function, el usuario presiona **"Actualizar resultados"** una vez en cualquier grupo. `syncMatches` recalculará `group_label` para los 72 partidos de fase de grupos con el mapa correcto.

## Verificación

```sql
SELECT group_label, COUNT(*) FROM matches WHERE stage='group' GROUP BY group_label;
```
Debe devolver A–L con **6 partidos cada uno**. Luego, en `/calendar` y en Predicciones, el filtro Grupo A debe listar los partidos correctos (incluido Czech Republic vs Mexico).

## Archivo a modificar

- `supabase/functions/api-football-fixtures/index.ts` (solo `fetchTeamGroupMap`)
