Plan: usar el Grupo Demo como espejo funcional de los grupos privados

Objetivo
Hacer que la pestaña PREDICCIONES del grupo DEMO se comporte visual y funcionalmente como la de los grupos privados: mostrar todos los partidos relevantes, conservar partidos ya transcurridos, mostrar predicción, marcador final y puntos por partido, y organizar correctamente Cuartos, Semifinales y Final con filtros tipo Calendario.

Alcance

1. Unificar el formato visual de partidos del DEMO
- Refactorizar `src/components/demo/DemoPredictionsTab.tsx` para usar el mismo patrón visual de `src/components/group/PredictionsTab.tsx`:
  - Header del partido con ronda, estado y badge.
  - Equipos con escudos en la misma disposición.
  - Inputs de predicción cuando el partido todavía permite predecir.
  - Marcador final cuando el partido ya terminó.
  - Texto inferior con fecha/sede.
  - Bloque inferior con “Tu predicción” y badge de puntos por partido.
- Mantener compatibilidad con equipos “Por definir” para que no se pueda predecir hasta que existan ambos equipos.
- Conservar el botón flotante “Guardar predicciones”, igual que en grupos privados.

2. Dejar de ocultar partidos ya transcurridos
- Quitar el filtro actual que solo muestra partidos `upcoming` y futuros.
- Mostrar partidos DEMO de Liguilla aunque estén finalizados, en vivo o cerrados.
- Para partidos finalizados:
  - Mostrar marcador final.
  - Mostrar la predicción del usuario si existe.
  - Mostrar puntos otorgados: exacto +3, resultado +1, 0 pts o “Sin predicción”.
- Para partidos cerrados sin marcador final:
  - Mostrar estado cerrado/en curso según corresponda, sin permitir edición.

3. Agregar filtros de ronda como en Calendario
- Añadir botones de agrupación arriba del listado, tomando como referencia la página de Calendario.
- Para DEMO no se necesitan grupos A-L; usar filtros específicos de Liga MX/Liguilla:
  - Todos
  - Play-In
  - Cuartos
  - Semifinales
  - Final
- Al seleccionar un filtro, mostrar solo esa ronda.
- En “Todos”, organizar el contenido en secciones ordenadas por ronda.

4. Corregir la categorización de Ida y Vuelta
- Corregir la lógica de `supabase/functions/demo-sync/index.ts` para no alternar Ida/Vuelta simplemente por índice global del round, porque eso genera errores cuando los partidos están intercalados por fecha/hora.
- Nueva regla propuesta:
  - Si API-Football ya incluye “1st leg”, “Ida”, “2nd leg” o “Vuelta”, respetarlo.
  - Si no lo incluye, agrupar por eliminatoria usando el par de equipos normalizado.
  - En cada par de equipos, ordenar por `kickoff_utc`:
    - primer partido del par = Ida
    - segundo partido del par = Vuelta
  - Si no hay pareja clara, usar fallback por bloque de fechas dentro de la ronda:
    - primera mitad cronológica = Ida
    - segunda mitad cronológica = Vuelta
- Esto corregirá casos como Cuartos de Final, donde actualmente se están mezclando etiquetas de Ida/Vuelta.

5. Asegurar que aparezcan Semifinales y Final
- Ajustar el filtro de carga y visualización para incluir todas las rondas de Liguilla disponibles en `demo_matches`, no solo los Cuartos de Final próximos.
- Confirmado en base de datos: existen partidos de Apertura para Semifinales y Final, pero el componente actual los oculta porque filtra solo partidos próximos.
- En la vista DEMO aparecerán también estas secciones cuando existan registros sincronizados.
- Si todavía no existen Semifinales/Final del Clausura por API, el sistema quedará listo para mostrarlas automáticamente cuando API-Football las entregue.

6. Mantener el DEMO como ambiente de validación
- Alinear `DemoMemberPredictionsView.tsx` para que la vista de predicciones de otros miembros tampoco oculte partidos ya transcurridos y use el mismo criterio visual que los grupos privados.
- Revisar `DemoAdmin.tsx` para que la administración manual del DEMO no dependa solo de “partidos pendientes”; debe permitir revisar rondas y registrar resultados en los partidos que correspondan, sin perder visibilidad de partidos ya sincronizados.

Detalles técnicos

Archivos principales a modificar:
- `src/components/demo/DemoPredictionsTab.tsx`
- `src/components/demo/DemoMemberPredictionsView.tsx`
- `src/pages/DemoAdmin.tsx`
- `supabase/functions/demo-sync/index.ts`

No se requiere crear tablas nuevas.

Posible migración opcional:
- Si después de ajustar la función de sincronización hay datos existentes con `leg_label` incorrecto, aplicar una migración o script de normalización para recalcular `leg_label` de los registros actuales de `demo_matches` sin borrar predicciones.
- Prioridad: evitar borrar datos del DEMO; solo actualizar metadata de ronda/leg cuando sea necesario.

Validación esperada

Después de implementar:
- En `/demo`, pestaña PREDICCIONES:
  - Se ven partidos finalizados y futuros.
  - Se ven Cuartos, Semifinales y Final si existen en la tabla.
  - Los partidos terminados muestran marcador final, predicción y puntos.
  - Los partidos próximos muestran inputs editables cuando aplica.
  - Los filtros de ronda funcionan de forma similar al Calendario.
- Los Cuartos de Final muestran correctamente Ida/Vuelta agrupando cada llave.
- El flujo de guardado de predicciones sigue usando `demo_predictions` y mantiene las mismas reglas RLS actuales.