# Testing

## Herramientas

| Herramienta | Para qué |
|-------------|----------|
| **Jest** | Runner de tests, assertions, mocks y cobertura. |
| **next/jest** | Adapta Jest a Next: usa el compilador SWC, resuelve el alias `@/`, y mockea CSS Modules y assets estáticos sin configuración extra. |
| **@testing-library/react** | Renderizar componentes y consultarlos como lo haría una persona usuaria. |
| **@testing-library/jest-dom** | Matchers extra (`toBeInTheDocument`, `toBeDisabled`, ...). |
| **@testing-library/user-event** | Simular interacciones reales (clic, escritura). |
| **jest-environment-jsdom** | DOM simulado para que React pueda renderizar. |

Con `next/jest` **no** hacen falta `babel-jest`, `identity-obj-proxy` ni mocks
manuales de imágenes: lo cubre el propio adaptador.

## Configuración

- `jest.config.js` — envuelve la config con `nextJest({ dir: './' })`.
- `src/setupTests.js` — se ejecuta antes de cada archivo de test
  (`setupFilesAfterEnv`); carga los matchers de `jest-dom`.

En los tests, `styles.button` (de un `*.module.css`) es simplemente `"button"`.

## Comandos

```bash
npm test              # Ejecuta toda la suite una vez
npm run test:watch    # Modo watch (re-ejecuta al guardar)
npm run test:coverage # Genera informe de cobertura en coverage/
```

## Convenciones

- Un archivo de test por componente: `Componente.test.jsx`, junto al componente.
- Nombrar los `describe` con el nombre del componente y los `it` en español,
  describiendo el comportamiento observable ("ejecuta onClick al hacer clic").
- Consultar por rol/label/texto (`getByRole`, `getByLabelText`, `getByText`)
  antes que por `data-testid`.
- Probar **comportamiento**, no implementación: qué ve y qué puede hacer la
  persona usuaria, no el estado interno.
- Usar `user-event` (no `fireEvent`) para interacciones.

## Ejemplo

```jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from './Button';

it('ejecuta onClick al hacer clic', async () => {
  const onClick = jest.fn();
  render(<Button onClick={onClick}>Enviar</Button>);

  await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));

  expect(onClick).toHaveBeenCalledTimes(1);
});
```

## Qué testear en cada nivel de Atomic Design

| Nivel | Foco de los tests |
|-------|-------------------|
| atoms | Render según props, estados (disabled), eventos básicos. |
| molecules | Composición correcta de átomos, paso de props, casos con/sin error. |
| organisms | Render de las partes, interacción entre subcomponentes. |
| templates | Que los `children` y slots aparecen en su sitio. |
| pages | Flujos completos de la vista (rellenar formulario y ver resultado). |
| app/ | Que la ruta monta la `page` correcta (test ligero de humo). |
