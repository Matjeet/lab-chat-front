# assets/

Fuentes de diseño que **no se sirven tal cual** (no van en `public/`): se
inlinean a mano dentro de un componente porque necesitan lógica de tema u
otro procesamiento. Este directorio es el origen para regenerar ese código,
no algo que la app importe en tiempo de build.

| Archivo | Se usa en | Cómo |
|---------|-----------|------|
| `404-claro.svg` | `src/components/atoms/Ilustracion404` | Inlineado tal cual como variante `claro`. |
| `404-oscuro.svg` | `src/components/atoms/Ilustracion404` | Inlineado tal cual como variante `oscuro`. |

## Si hay que editar la ilustración 404

1. Edita el `.svg` aquí (o pide uno nuevo) — mismo `viewBox="0 0 750 750"` en
   ambos archivos para que seguir siendo intercambiables.
2. Vuelve a generar el componente: copia el contenido de cada archivo dentro
   de su `<svg>` correspondiente en `Ilustracion404.jsx`, y en cada uno:
   - `fill-rule=` → `fillRule=`, `clip-rule=` → `clipRule=` (JSX no acepta
     kebab-case en atributos).
   - Quita la etiqueta `<svg ...>` externa y el `</svg>` de cierre — el
     componente ya pone la suya (con `viewBox`, `aria-hidden`, la clase
     `claro`/`oscuro`...).
   - **No** conviertas los colores a `var(--token)`: cada archivo trae su
     propia paleta pensada para su tema; ver `docs/arquitectura.md` §
     "Assets estáticos".
3. `npm test` (hay tests que comprueban el fondo de cada variante) y revisa
   cualquier ruta que no exista (p. ej. `/prueba-404`) en ambos temas antes de
   dar por bueno.
