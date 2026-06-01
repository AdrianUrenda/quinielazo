# Permitir editar el nombre del grupo

## Cambios en `src/components/group/EditGroupModal.tsx`

1. Agregar `name` a las props (`group.name` ya viene).
2. Agregar estado `name` inicializado desde `group.name`; resetear en el `useEffect` cuando se abre el modal.
3. Agregar un campo `Input` "Nombre del grupo" como primer campo del formulario (con ícono, ej. `Users` o `Tag`), `maxLength={50}`, requerido.
4. Validación en `handleSave`: el nombre no puede estar vacío (trim) y debe tener mínimo 3 caracteres; mostrar `toast.error` si falla.
5. Incluir `name: name.trim()` en el `update()` de Supabase.
6. Invalidar también la query de `my-groups` para refrescar la lista al cambiar el nombre.

No requiere cambios en la base de datos: las políticas RLS de `groups` ya permiten al admin actualizar (`admin_user_id = auth.uid()`).

## Alcance

Solo se modifica `EditGroupModal.tsx`. Sin cambios en backend ni en otros componentes.
