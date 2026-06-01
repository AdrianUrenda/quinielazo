# Mejorar la sección "¿Cómo funciona?" en Home

## Objetivo

Hacer más clara la explicación del sistema de puntos y agregar una nueva característica que explique el control de acceso por parte del administrador (ideal para "vaquitas" entre amigos/familia).

## Cambios en `src/components/landing/Features.tsx`

### 1. Tarjeta destacada de Sistema de Puntos (arriba, full-width)

Antes de la grilla de tarjetas actuales, agregar una tarjeta hero que ocupe todo el ancho con colores llamativos (gradiente dorado de la marca + acentos verdes), destacando visualmente:

- Título: **"SISTEMA DE PUNTOS"**
- Dos bloques grandes lado a lado dentro de la tarjeta:
  - **3 PTS** — Marcador exacto (ej. predices 2-1 y termina 2-1)
  - **1 PT** — Acertar solo el resultado (ganador/empate, sin marcador exacto)
- Nota inferior: desempate por cantidad de marcadores exactos.
- Estilo: fondo con `--gradient-gold` o gradiente verde-dorado, ícono Trophy/Target grande, tipografía display más prominente, sombra `--shadow-gold`, animación de entrada con framer-motion.

### 2. Reemplazar la tarjeta genérica "SISTEMA JUSTO"

Como el sistema de puntos ya está destacado arriba, esa tarjeta queda redundante. Se reemplaza por la nueva:

- **Ícono:** `ShieldCheck` o `UserCheck` (lucide-react)
- **Título:** "ADMIN APRUEBA ACCESOS"
- **Descripción:** "El administrador autoriza cada solicitud de ingreso. Ideal para 'vaquitas' entre amigos o familia: cobra la cuota antes de aprobar al miembro."

### 3. Grilla resultante (6 tarjetas, sin cambios estructurales)

Grupos privados · Predicciones · Tabla en vivo · **Admin aprueba accesos (nuevo)** · Notificaciones · Fácil de usar

## Diseño visual

- La tarjeta destacada usa los tokens existentes (`--gradient-gold`, `--shadow-gold`, `--primary`, `--secondary`) — sin colores hardcoded.
- Responsive: en mobile los dos bloques 3 PTS / 1 PT se apilan; en desktop quedan lado a lado.
- Mantener consistencia con la tipografía display (Bebas Neue) y animaciones framer-motion ya usadas en el archivo.

## Alcance

Solo se modifica `src/components/landing/Features.tsx`. No hay cambios de lógica de negocio ni de otros componentes.
