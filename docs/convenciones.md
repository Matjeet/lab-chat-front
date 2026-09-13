# Convenciones de código

## Nombres

- Componentes en `PascalCase`: `FormField`, `LoginPage`.
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
  `import LoginPage from '@/components/pages/LoginPage';`

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
- Clase global `.sr-only` (en `global.css`) para texto solo de lectores de
  pantalla.

## Imports

- Respetar la regla de dependencia de Atomic Design (solo hacia niveles inferiores).
- Importar componentes por su carpeta gracias al `index.js`:
  `import Button from '../../atoms/Button';`

## Commits

Este repo usa **[Conventional Commits](https://www.conventionalcommits.org/)**:

```
<tipo>(<scope opcional>): <descripción>
```

- Tipos: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `build`,
  `ci`, `perf`.
- La descripción va en **español e imperativo**, en minúscula, sin punto final:
  `feat(registro): valida el formulario antes de enviar`.
- Cambio incompatible: `feat!: ...` o un pie `BREAKING CHANGE: ...`.
- El cuerpo (opcional) explica el porqué; una línea en blanco lo separa del asunto.

Ejemplos:

```
feat(atoms): añade el átomo Alert
fix(header): corrige el layout en móvil
docs: actualiza la guía del sistema de diseño
test(registro): cubre el caso de conflicto 409
```
