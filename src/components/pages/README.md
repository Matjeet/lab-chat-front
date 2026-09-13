# Pages (páginas)

Instancias concretas de una plantilla con datos y lógica reales. Son el punto
donde se conecta el estado, las llamadas a la API y la navegación.

Ejemplos en este repo: `LoginPage`, `RegistroPage`.

Reglas:

- Pueden importar plantillas, organismos, moléculas y átomos.
- Aquí vive el estado de la vista, los hooks de datos y los handlers.
- Cada una la monta un `page.jsx` de `app/` (App Router) — ver
  `docs/arquitectura.md`.
