# assets/

Fuentes de diseño que **no se sirven tal cual** (no van en `public/`): o se
inlinean a mano dentro de un componente porque necesitan lógica de tema, o
necesitan un procesado (recorte, compresión...) antes de convertirse en el
archivo que sí se sirve desde `public/`. Este directorio es el origen para
regenerar ese resultado, no algo que la app importe en tiempo de build.

| Archivo | Se usa en | Cómo |
|---------|-----------|------|
| `404-claro.svg` | `src/components/atoms/Ilustracion404` | Inlineado tal cual como variante `claro`. |
| `404-oscuro.svg` | `src/components/atoms/Ilustracion404` | Inlineado tal cual como variante `oscuro`. |
| `chat-logo.webp` | `public/chat-logo.webp` (vía `Header`) | Fuente sin recortar (2000×2000, el dibujo ocupa ~39% del lienzo) — ver más abajo. |

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

## Si hay que regenerar el logo

`chat-logo.webp` aquí es el archivo tal cual se recibió (lienzo grande, mucho
margen transparente alrededor del dibujo — pensado para usarse como ícono de
app con zona de seguridad, no para una cabecera). `public/chat-logo.webp` es
un recorte de ese margen, para que el logo se vea a tamaño de `Header`
(`~32px`) sin quedar minúsculo dentro de tanto espacio vacío.

Para regenerar el recorte tras cambiar el original (necesita el paquete
`sharp`, ya es dependencia transitiva del proyecto):

```bash
node -e "
require('sharp')('assets/chat-logo.webp')
  .trim({ threshold: 10 })
  .extend({ top: 20, bottom: 20, left: 20, right: 20, background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .webp({ quality: 90 })
  .toFile('public/chat-logo.webp');
"
```

El `extend` deja un margen pequeño y uniforme (20px) en los cuatro lados tras
el recorte, para que el logo no quede pegado al borde de su caja en `Header`.
