Implementaré la opción B convirtiendo el `invite_code` en un enlace real de invitación con formato:

```text
/join/{inviteCode}
```

El objetivo es que cualquier persona pueda abrir el enlace y ver el grupo en el modal, pero solo un usuario con sesión activa pueda enviar la solicitud para unirse.

## Flujo esperado

```text
Admin copia enlace de invitación
        ↓
Invitado abre /join/{inviteCode}
        ↓
La app busca el grupo por inviteCode
        ↓
Abre el modal con ese grupo seleccionado
        ↓
Usuario hace click en “Solicitar unirme”
        ↓
¿Hay sesión activa?
   ├─ Sí → valida código de acceso, cupo y membresía; envía solicitud
   └─ No → redirige a /login, preservando el link de invitación
        ↓
Después de login, vuelve a /join/{inviteCode} y puede solicitar unirse
```

## Cambios propuestos

### 1. Usar `invite_code` como identificador del enlace
Actualmente la ruta `/join/:groupId` usa el parámetro como si fuera el `id` del grupo. La cambiaré conceptualmente para que `/join/:inviteCode` busque el grupo por su `invite_code`.

Resultado:

```text
https://quinielazo.link/join/abc123...
```

En vez de depender de:

```text
/join/{groupId}
```

### 2. Exponer búsqueda segura por código de invitación
Crearé una función segura en Supabase, por ejemplo:

```sql
public.get_group_by_invite_code(_invite_code text)
```

Esta función devolverá solo la información necesaria para pintar el modal:

- `id`
- `name`
- `description`
- `max_members`
- `tier`
- `has_access_code`

No devolverá `access_code`, ni datos sensibles.

Esto evita tener que exponer `invite_code` en la vista pública `groups_discovery` completa o filtrar grupos desde el frontend.

### 3. Actualizar la página `/join/:inviteCode`
Modificaré `src/pages/JoinGroup.tsx` para que:

- Permita cargar la página aunque el usuario no esté logeado.
- No redirija automáticamente a `/register` o `/login` al abrir el link.
- Consulte el grupo usando el `inviteCode`.
- Abra `JoinGroupModal` con el grupo ya seleccionado.
- Muestre un estado claro si el enlace es inválido o el grupo no existe.

### 4. Ajustar `JoinGroupModal` para aceptar grupo preseleccionado por invitación
El modal actualmente necesita que el grupo venga de `groups_discovery` y usa `preSelectedGroupId`.

Lo adaptaré para que acepte también un objeto de grupo preseleccionado, obtenido por `inviteCode`. Así el modal podrá abrir directo con el grupo correcto sin que el usuario tenga que buscarlo por nombre.

También mantendré el flujo actual de búsqueda por nombre desde “Unirme a un grupo”, para no romper el uso existente.

### 5. Bloquear la acción “Solicitar unirme” si no hay sesión
En `handleSubmit` del modal agregaré una validación explícita:

```text
si no hay user activo:
  redirigir a /login con el retorno al link actual
  no insertar nada en group_members
```

La redirección preservará el destino, por ejemplo usando `state.from`, para que después de iniciar sesión el usuario vuelva a:

```text
/join/{inviteCode}
```

Importante: el modal sí se podrá ver sin sesión; lo que se bloquea es la solicitud de unión.

### 6. Ajustar Login para preservar mejor el retorno
El login ya soporta `location.state.from`. Verificaré y ajustaré el flujo para que al venir desde `/join/{inviteCode}` regrese a esa ruta después de iniciar sesión.

También revisaré Google OAuth, porque actualmente redirige siempre a `/groups`. Lo ideal es que, si el usuario llegó desde una invitación, Google también pueda regresar al link de invitación. Si no es viable sin más cambios, dejaré cubierto al menos el login email/contraseña y evitaré romper el OAuth actual.

### 7. Cambiar lo que copia el administrador
En `GroupDashboard.tsx`, el bloque actual dice “Código de invitación” y copia solo el código.

Lo cambiaré para que muestre/copie el enlace completo:

```text
https://quinielazo.link/join/{inviteCode}
```

Con texto más claro, por ejemplo:

```text
Enlace de invitación
Copiar enlace
```

Esto elimina la confusión de intentar pegar el código en el buscador de grupos.

### 8. Actualizar creación de grupos gratis
La Edge Function `create-checkout-session` actualmente genera `inviteLink` con el `group.id` y opcionalmente agrega `?code=...`.

La ajustaré para que, después de crear el grupo, seleccione también `invite_code` y devuelva:

```text
/join/{inviteCode}
```

No incluiré automáticamente el `access_code` en el link, porque ese código funciona como contraseña del grupo. Mantenerlo separado es más seguro y respeta el flujo actual: el link identifica el grupo; el código de acceso controla quién puede solicitar entrar.

### 9. Revisar grupo pagado creado por Stripe
El webhook de Stripe crea el grupo después del pago. Como el `invite_code` ya tiene default en base de datos, no necesita generarlo manualmente.

No obstante, revisaré que cualquier lugar donde se muestre o copie el enlace use el `invite_code`, no el `id`.

## Seguridad y reglas de acceso

- El enlace de invitación no aprueba membresías por sí solo.
- El enlace solo identifica el grupo y abre el modal.
- Si el grupo tiene `access_code`, el usuario deberá ingresarlo igual.
- Solo usuarios autenticados podrán insertar una solicitud en `group_members`.
- Las políticas RLS existentes en `group_members` siguen actuando como segunda capa: solo permiten insertar una solicitud para `auth.uid()`.
- No se expondrá el `access_code` en vistas públicas ni funciones públicas.

## Archivos que planeo tocar

- `src/App.tsx`
  - Mantener o renombrar semánticamente la ruta `/join/:inviteCode`.

- `src/pages/JoinGroup.tsx`
  - Resolver grupo por `inviteCode`.
  - Permitir vista pública.
  - Abrir modal con el grupo seleccionado.
  - Manejar enlace inválido.

- `src/components/groups/JoinGroupModal.tsx`
  - Aceptar grupo preseleccionado por invitación.
  - Redirigir a `/login` solo al intentar solicitar unirse sin sesión.
  - Mantener búsqueda por nombre.

- `src/pages/GroupDashboard.tsx`
  - Mostrar y copiar enlace completo de invitación en vez de código suelto.

- `supabase/functions/create-checkout-session/index.ts`
  - Devolver `inviteLink` con `invite_code`, no con `group.id`.

- Nueva migración Supabase
  - Crear función segura `get_group_by_invite_code`.
  - Conceder ejecución a `anon` y `authenticated`, devolviendo solo campos no sensibles.

## Resultado final

Después de implementar, el administrador podrá compartir un link como:

```text
https://quinielazo.link/join/{inviteCode}
```

Cualquier persona podrá abrirlo y ver directamente el grupo en el modal. Si intenta solicitar unirse sin sesión, irá a `/login`; al iniciar sesión, regresará al link de invitación y podrá continuar con el proceso normal.