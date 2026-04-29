Plan para corregir PREDICCIONES en grupos privados y unificar la fuente de partidos con API-Football

Objetivo
- Que la sección PREDICCIONES dentro de grupos privados use la misma fuente oficial que /calendar: API-Football.
- Que la vista conserve inputs para pronosticar partidos futuros.
- Que los partidos finalizados no desaparezcan: deben mostrar marcador real, predicción del usuario y puntos ganados.
- Que el formato visual y de navegación sea prácticamente el mismo que /calendar: agrupación por día, filtros por fase y filtros por grupo.

Cambios propuestos

1. Persistir metadata oficial de API-Football en `matches`
- Agregar a `public.matches` campos equivalentes a los que hoy la app solo recibe en vivo desde API-Football:
  - `api_fixture_id` para identificar el fixture oficial y sincronizar sin duplicados.
  - logos de equipos: `home_team_logo`, `away_team_logo`.
  - `round_label` / `api_round` o similar para conservar el texto oficial de la ronda.
  - `status_detail` para guardar estados API-Football como `NS`, `FT`, `AET`, `PEN`, `LIVE`, etc.
  - `last_synced_at` para mostrar “Última actualización”.
- Crear índice único parcial sobre `api_fixture_id` para upserts seguros.

2. Crear/actualizar sincronización de Mundial 2026 desde API-Football
- Reutilizar `API_FOOTBALL_KEY`, que ya existe como secreto.
- Actualizar `supabase/functions/api-football-fixtures/index.ts` para que además de devolver fixtures a /calendar pueda sincronizar la tabla `matches` cuando se invoque con una acción tipo `sync-matches`.
- La sincronización debe:
  - Consultar `GET /fixtures?league=1&season=2026`.
  - Mapear cada fixture API-Football a una fila de `matches`.
  - Actualizar nombres, logos, sede, ciudad, fecha, fase, grupo, marcador, status y `last_synced_at`.
  - Mantener los IDs internos de `matches` para no romper predicciones existentes.
  - Si existe una fila con el mismo `api_fixture_id`, actualizarla.
  - Si todavía no tiene `api_fixture_id`, empatar preferentemente por `match_number`/fecha/equipos cuando sea viable.
  - Insertar fixtures faltantes si API-Football trae más partidos que la tabla actual.

3. Calcular puntos de predicciones privadas cuando se actualicen marcadores
- Dentro de la sincronización, después de marcar partidos como finalizados, recalcular `predictions.points_awarded` para esos partidos:
  - 3 puntos por marcador exacto.
  - 1 punto por resultado correcto.
  - 0 puntos si no acertó.
- Mantener el trigger existente de notificaciones para avisar cuando una predicción gana puntos.
- No recalcular puntos para partidos no finalizados.

4. Extraer componentes/utilidades compartidas del calendario
- Crear una utilidad compartida para:
  - normalizar fase desde `round`/`stage`.
  - detectar grupo A-L.
  - formatear fechas en CDMX.
  - badges de estado: Próximo, En curso, Finalizado, Pospuesto, Cancelado.
- Crear un componente reutilizable de tarjeta de partido con variante:
  - `calendar`: como /calendar actual.
  - `prediction`: mismo layout base, pero con inputs de marcador para partidos abiertos y panel de predicción/puntos para partidos cerrados.
- Esto evita duplicar lógica y mantiene consistencia visual entre /calendar y grupos privados.

5. Rehacer `src/components/group/PredictionsTab.tsx`
- Dejar de consultar solo `.eq("status", "upcoming").limit(20)`.
- Consultar todos los partidos relevantes del torneo, ordenados por fecha, para que aparezcan futuros, en curso y finalizados.
- Agregar filtros iguales a /calendar:
  - Todos, Grupos, 32avos, 8vos, 4tos, Semis, 3er Lugar, Final.
  - Botones Grupo A-L cuando aplique.
- Agrupar partidos por día como /calendar, con encabezado sticky por fecha.
- En cada tarjeta:
  - Partido futuro abierto: mostrar equipos, hora/sede e inputs para predicción del usuario.
  - Partido en curso o ya iniciado: bloquear edición y mostrar predicción guardada si existe.
  - Partido finalizado: mostrar marcador real, predicción del usuario y badge de puntos (+3, +1, 0 o sin predicción).
- Mantener el botón flotante “Guardar predicciones”, pero guardar solo cambios de partidos que sigan abiertos.
- Agregar loading skeleton y error state con reintentar.
- Agregar botón “Actualizar resultados” que invoque la sincronización de API-Football e invalide queries de partidos, predicciones, posiciones y vista de miembros.
- Mostrar “Última actualización: HH:MM CDMX”.

6. Actualizar vistas relacionadas con predicciones
- `MemberPredictionsView`: mostrar predicciones de otros miembros con el mismo criterio de partidos finalizados/no finalizados, incluyendo marcador real y puntos cuando aplique.
- `LeaderboardTab`: conservar cálculo por `points_awarded`, pero invalidarlo cuando se sincronicen resultados.
- Cualquier otra sección que lea `matches` para información de partidos deberá mostrar la metadata actualizada desde la tabla sincronizada.

7. Mantener /calendar como referencia visual
- /calendar puede seguir consumiendo `api-football-fixtures` directamente para refresco inmediato.
- Se alineará la lógica visual compartida para que PREDICCIONES dentro de grupos privados se vea y se navegue como /calendar, pero con la capa adicional de predicciones.

Detalles técnicos
- Requiere una migración de esquema para `matches`.
- La escritura de partidos y puntuación se hará desde Edge Function usando `SUPABASE_SERVICE_ROLE_KEY`; nunca se expone al frontend.
- El frontend seguirá usando `supabase.functions.invoke()` y el cliente anon normal.
- RLS de `matches` puede permanecer pública para SELECT; inserts/updates seguirán bloqueados desde cliente.
- La política de `predictions` ya impide actualizar cuando el partido no está `upcoming`; además el frontend bloqueará por kickoff/status para UX clara.

Criterios de aceptación
- En grupos privados, PREDICCIONES ya no muestra solo 20 próximos partidos estáticos.
- La pantalla muestra partidos agrupados por día y filtros de fase/grupo como /calendar.
- Un partido futuro permite ingresar marcador.
- Un partido finalizado muestra marcador real, predicción del usuario y puntos obtenidos.
- Al presionar “Actualizar resultados”, se refrescan fixtures, equipos, horarios, marcadores, estados y puntos.
- Los partidos transcurridos permanecen visibles en la sección de predicciones.
- La información de partidos queda centralizada en API-Football/sincronización, no en datos estáticos desactualizados.