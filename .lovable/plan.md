## Problema

En mobile, el navbar muestra logo + "Estadísticas" + campana + "Mis Grupos" + perfil todos en una sola fila, lo que se ve apretado especialmente en pantallas angostas (~390px).

## Solución

Reemplazar la fila apretada por un patrón estándar de navbar mobile:

1. **Mobile (`md:hidden`)**: dejar solo en la barra superior:
   - Logo Quinielazo (izquierda)
   - Campana de notificaciones con badge (si hay user)
   - Botón hamburguesa (icono `Menu` de lucide-react)

2. **Menú hamburguesa**: usar el componente `Sheet` de shadcn (`@/components/ui/sheet`) que se desliza desde la derecha, conteniendo:
   - Si hay user: Calendario, Estadísticas, Mis Grupos, Mi Perfil, Cerrar sesión
   - Si no hay user: Calendario, Estadísticas, Iniciar sesión, Registrarse (botón hero)
   - Cada link cierra el sheet al hacer click

3. **Logo en mobile**: reducir ligeramente el tamaño del texto "QUINIELAZO" (de `text-2xl` a `text-xl` solo en mobile) para más respiro.

4. **Desktop (`md:flex`)**: sin cambios, sigue mostrando todos los links inline.

## Archivos a modificar

- `src/components/landing/Navbar.tsx`: agregar estado `mobileMenuOpen`, importar `Sheet`/`SheetContent`/`SheetTrigger` y el icono `Menu`, reemplazar el bloque `md:hidden` por logo+campana+hamburguesa, y mover los links al contenido del Sheet.

No se tocan otros componentes ni lógica de auth/notificaciones.