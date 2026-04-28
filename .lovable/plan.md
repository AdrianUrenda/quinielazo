Plan para modificar los modelos de pago de creación de grupos

1. Actualizar precios en la landing page
- Cambiar la tarjeta del plan Básico a “Gratis” / “$0 MXN”.
- Cambiar Familiar de $99 a $49 MXN.
- Cambiar Grande de $199 a $99 MXN.
- Mantener las capacidades actuales:
  - Básico: hasta 10 miembros
  - Familiar: hasta 20 miembros
  - Grande: 21 miembros o más / ilimitado

2. Actualizar el modal de creación de grupos
- Cambiar la lista de planes en `CreateGroupModal` con los mismos precios nuevos.
- Para Básico, cambiar el CTA de “Continuar al pago” a una acción de creación gratuita, por ejemplo “Crear grupo gratis”.
- Mantener “Continuar al pago” para Familiar y Grande.
- Cuando el usuario seleccione Básico, no enviarlo a Stripe.
- Cuando el usuario seleccione Familiar o Grande, conservar el checkout de Stripe.

3. Implementar creación directa del grupo gratuito
- Modificar la Edge Function `create-checkout-session` para manejar dos caminos:
  - `basico`: crear el grupo directamente en Supabase sin sesión de Stripe, con `tier = basico`, `max_members = 10` y `stripe_payment_id = null` o un identificador interno gratuito si conviene para trazabilidad.
  - `familiar` / `grande`: crear sesión de Stripe como actualmente.
- Agregar la membresía del administrador como `approved` inmediatamente al crear el grupo gratuito, igual que hace el webhook después de un pago exitoso.
- Responder al frontend con `{ groupId, inviteLink }` para que el modal muestre la pantalla de éxito sin salir a Stripe.

4. Actualizar precios de Stripe en el backend
- Cambiar `priceMap` en `supabase/functions/create-checkout-session/index.ts`:
  - `familiar: 4900`
  - `grande: 9900`
- Remover a Básico del flujo de cobro de Stripe o permitirlo explícitamente como plan gratuito sin `line_items`.
- Actualizar `tierLabels` para reflejar los nombres/capacidades correctas.
- Conservar metadatos (`tier`, `max_members`, `group_name`, etc.) para que el webhook siga creando correctamente los grupos pagados.

5. Ajustar textos y manejo de respuesta en frontend
- Si la función devuelve `url`, abrir Stripe como ahora.
- Si la función devuelve `groupId` e `inviteLink`, mostrar el estado de éxito existente del modal y permitir copiar la invitación.
- Actualizar mensajes de error/carga para distinguir “creando grupo” vs “iniciando pago”.

6. Verificación esperada
- Básico crea el grupo sin checkout y el usuario aparece como admin/miembro aprobado.
- Familiar abre Stripe con $49 MXN.
- Grande abre Stripe con $99 MXN.
- La landing y el modal muestran precios consistentes.
- El webhook de Stripe sigue funcionando para planes pagados sin afectar grupos gratuitos.

Detalles técnicos
- Archivos principales a modificar:
  - `src/components/landing/Pricing.tsx`
  - `src/components/groups/CreateGroupModal.tsx`
  - `supabase/functions/create-checkout-session/index.ts`
- No se requiere cambio de esquema de base de datos: los campos existentes `tier`, `max_members` y `stripe_payment_id` ya soportan un plan gratuito.
- Se mantendrá la API key de Stripe únicamente en la Edge Function; no se expondrá nada al frontend.