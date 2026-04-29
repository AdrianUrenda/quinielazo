Voy a reforzar la regla desde Supabase para que el bloqueo no dependa solo del frontend ni del cambio de estado del partido.

Cambios propuestos:

1. Actualizar la política RLS de `public.predictions`
   - Reemplazar la política actual `Update predictions before kickoff`.
   - Mantener que solo el dueño de la predicción pueda actualizarla.
   - Mantener que el partido debe estar en estado `upcoming`.
   - Agregar validación de tiempo:

```sql
m.kickoff_utc > now()
```

Con esto, una predicción de grupo privado solo se podrá modificar si el partido todavía no ha llegado a su hora oficial de inicio.

2. Reforzar también la inserción de predicciones
   - La política actual de `INSERT` permite insertar si el usuario es miembro aprobado del grupo, pero no valida el horario del partido.
   - La ajustaré para que también exija que el partido relacionado esté `upcoming` y que `kickoff_utc > now()`.
   - Esto evita que alguien pueda crear una predicción nueva después del inicio usando una llamada directa a Supabase.

3. Aplicar la misma protección al grupo demo
   - Actualizar `public.demo_predictions` para que tanto `INSERT` como `UPDATE` validen:

```sql
dm.status = 'upcoming'
dm.kickoff_utc > now()
```

4. Evitar recursión RLS
   - Las políticas consultarán `matches`, `demo_matches`, `group_members` y `demo_group_members`, no la misma tabla `predictions` ni `demo_predictions`, por lo que no deberían provocar infinite recursion.
   - No tocaré tablas reservadas de Supabase ni secretos.

Resultado esperado:

- En la interfaz, los inputs ya se cierran al llegar el kickoff.
- En la base de datos, Supabase también rechazará cualquier intento de insertar o modificar una predicción después del kickoff.
- La regla quedará consistente para grupos privados y grupo demo.
- El margen seguirá siendo exactamente hasta la hora de inicio del partido, sin minutos extra de anticipación.