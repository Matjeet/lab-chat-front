# Convenciones de código

## Nombres

- Componentes en `PascalCase`: `FormField`, `HomePage`.
- Carpeta del componente con el mismo nombre que el componente.
- Archivos: `Componente.jsx`, `Componente.module.css`, `Componente.test.jsx`, `index.js`.
- Hooks personalizados en `src/hooks/` con prefijo `use`: `useChatSocket`.
- Utilidades puras en `src/utils/`.

## Componentes

- Componentes de función con arrow functions y `export default`.
- Props documentadas con un bloque JSDoc encima del componente.
- Sin `React` importado explícitamente (runtime JSX automático).
- Un componente por archivo.
- `'use client'` en la primera línea solo si el componente usa estado, efectos
  o handlers de eventos. Los hijos heredan el modo cliente.

## Rutas (app/)

- `app/` solo contiene enrutado; cada `page.jsx` renderiza la `page` de Atomic
  Design correspondiente y nada más.
- Importar componentes de `src/` con el alias `@/`:
  `import HomePage from '@/components/pages/HomePage';`

## Estilos

- CSS Modules (`*.module.css`), una hoja por componente.
- Globales solo `src/styles/tokens.css` (tokens) y `src/styles/global.css`
  (reset y base), importados una vez en `app/layout.jsx`.
- Clases en `camelCase` para poder hacer `styles.miClase`.
- **Sin valores literales**: color, tamaño de fuente y espaciado se escriben
  siempre como `var(--token)`. Los tokens están en `tokens.css`; `npm run lint`
  (Stylelint) rechaza hex sueltos. Detalle en [`sistema-de-diseno.md`](./sistema-de-diseno.md).
- Selectores de CSS Modules: deben contener una clase local (nada de `code {}`
  suelto; usar `.seccion code {}`).

## Imports

- Respetar la regla de dependencia de Atomic Design (solo hacia niveles inferiores).
- Importar componentes por su carpeta gracias al `index.js`:
  `import Button from '../../atoms/Button';`

## Commits

- Mensajes en imperativo y en español: "añade átomo Button", "corrige layout del Header".
