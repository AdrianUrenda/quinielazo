

## Plan: Página "Mi Perfil" con Editar Perfil, Billetera, Cerrar Sesión y Eliminar Cuenta

### Resumen
Reemplazar el botón "Cerrar sesión" en la Navbar por un enlace "Mi Perfil" (mismo estilo que Calendario/Mis Grupos). Crear una nueva página `/profile` con cuatro secciones.

---

### Cambios en la base de datos

**Migración SQL** para permitir que los usuarios eliminen su propia cuenta:
- Crear una función `delete_user_account()` con `SECURITY DEFINER` que elimine el perfil, membresías, predicciones, notificaciones y finalmente el usuario de `auth.users`.
- Agregar política RLS de DELETE en `profiles` para el propio usuario.

---

### Archivos a modificar/crear

#### 1. `src/components/landing/Navbar.tsx`
- Reemplazar el botón rojo "Cerrar sesión" por un `<Link to="/profile">` con el mismo estilo de texto que "Calendario" y "Mis Grupos" (`text-sm font-body text-primary-foreground/70 hover:text-primary-foreground`).
- En mobile: reemplazar el botón de icono LogOut por un enlace a `/profile` con icono `User`.

#### 2. `src/pages/Profile.tsx` (nuevo)
Página protegida con cuatro secciones en tarjetas:

**Sección 1 — Editar Perfil**
- Campo editable: Nombre de usuario (carga actual de `profiles.display_name`, actualiza con `supabase.from("profiles").update()`).
- Botón "Cambiar contraseña" que llama a `supabase.auth.updateUser({ password })` — solo visible si el usuario NO se registró con Google (se detecta revisando `user.app_metadata.provider`).

**Sección 2 — Billetera (placeholder)**
- Tarjeta mostrando saldo: `$0.00 MXN` hardcoded.
- Botón "Solicitar retiro" deshabilitado con tooltip "Próximamente".

**Sección 3 — Cerrar Sesión**
- Botón rojo/blanco reutilizando la lógica existente de `handleLogout`.

**Sección 4 — Eliminar Cuenta**
- Botón destructivo que abre un `AlertDialog` con advertencia de irreversibilidad.
- Al confirmar: llama a una función RPC `delete_user_account()` en Supabase, cierra sesión y redirige a `/`.

#### 3. `src/App.tsx`
- Agregar ruta `/profile` envuelta en `<ProtectedRoute>`.
- Importar el nuevo componente `Profile`.

---

### Detalles técnicos

**Detección de proveedor de autenticación:**
```typescript
const isGoogleUser = user?.app_metadata?.provider === "google";
```

**Función SQL `delete_user_account`:**
```sql
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.predictions WHERE user_id = auth.uid();
  DELETE FROM public.group_members WHERE user_id = auth.uid();
  DELETE FROM public.notifications WHERE user_id = auth.uid();
  DELETE FROM public.demo_predictions WHERE user_id = auth.uid();
  DELETE FROM public.demo_group_members WHERE user_id = auth.uid();
  DELETE FROM public.profiles WHERE id = auth.uid();
  -- Delete groups where user is admin
  DELETE FROM public.groups WHERE admin_user_id = auth.uid();
  -- Delete auth user
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;
```

