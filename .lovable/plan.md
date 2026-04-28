Plan para actualizar la landing page:

1. Quitar la sección actual de CALENDARIO de la landing
   - Eliminar la importación y el render de `MatchCalendarPreview` en `src/pages/Index.tsx`.
   - Mantener intacta la página `/calendar` y su navegación; solo se removerá el bloque de vista previa en la página principal.

2. Crear una nueva sección de placeholder para video demo
   - Añadir un componente de landing, por ejemplo `DemoVideoPlaceholder`, con un bloque visual tipo reproductor de video.
   - Ubicarlo inmediatamente después de `¿CÓMO FUNCIONA?`, reemplazando el espacio que ocupaba el calendario.
   - El placeholder incluirá un marco responsivo 16:9, icono/botón de play, texto breve como “Video demo próximamente” o “Mira cómo crear tu quiniela en segundos”, y un estilo consistente con las tarjetas actuales.

3. Conectar visualmente con la sección previa
   - Usar copy orientado a continuidad, por ejemplo: “Así se vive Quinielazo” / “Próximamente: demo de la app”.
   - Mantener la estética FIFA/Quinielazo: fondo oscuro, acentos verde/dorado, `font-display`, bordes redondeados y sombras/elevación existentes.

4. Responsividad
   - En móvil, el video placeholder ocupará el ancho disponible con padding cómodo.
   - En desktop, quedará centrado con ancho máximo para no romper la jerarquía entre Features y Pricing.

Archivos a modificar:
- `src/pages/Index.tsx`
- Nuevo archivo: `src/components/landing/DemoVideoPlaceholder.tsx`

No se tocará:
- `src/pages/MatchCalendar.tsx`
- Rutas de `/calendar`
- La integración de API-Football del calendario