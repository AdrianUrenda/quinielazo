## Plan

1. **Reducir el universo de sincronización**
   - En `api-football-fixtures`, antes de actualizar la tabla `matches`, separar los fixtures con el mismo criterio UX usado en Predicciones:
     - Jornadas completamente cerradas.
     - Última jornada cerrada.
     - Jornadas actuales/futuras.
   - Sincronizar solamente la **última jornada cerrada + jornadas actuales/futuras**.
   - Dejar intactos los partidos de jornadas cerradas anteriores para evitar trabajo redundante.

2. **Evitar refrescos individuales masivos**
   - Ajustar `refreshStaleFixtures` para que sólo re-consulte por `fixture id` los partidos dentro de esa ventana activa.
   - Esto evita llamar decenas de endpoints individuales para partidos que ya terminaron hace días.

3. **Mantener scoring correcto**
   - Seguir recalculando puntos sólo para partidos sincronizados que estén finalizados.
   - Como la última jornada cerrada sí queda incluida, el usuario todavía verá sus puntos recientes actualizarse aunque el endpoint agregado venga atrasado.

4. **Mejorar diagnóstico del error**
   - Agregar logs internos con conteos: fixtures totales, fixtures incluidos, fixtures archivados, fixtures stale refrescados.
   - Cambiar la respuesta exitosa para incluir esos conteos, sin afectar la UI actual.

5. **Validar**
   - Desplegar la edge function `api-football-fixtures`.
   - Probar `sync-matches` directamente contra la función desplegada.
   - Revisar logs para confirmar que ya no procesa todos los partidos históricos y que responde sin timeout.

## Detalle técnico

- El criterio de “jornada” se basará en la fecha local CDMX, equivalente al agrupado de Predicciones.
- Una jornada cuenta como cerrada si todos sus partidos están en estado finalizado (`FT`, `AET`, `PEN`) o cancelado/terminal (`PST`, `CANC`, `ABD`, `AWD`, `WO`).
- Para no cambiar el frontend innecesariamente, el botón seguirá llamando `{ action: "sync-matches" }`; el guardrail vivirá en la edge function.