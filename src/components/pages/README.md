# Pages (páginas)

Instancias concretas de una plantilla con datos y lógica reales. Son el punto
donde se conecta el estado, las llamadas a la API y la navegación.

Ejemplos: `HomePage`, `ChatPage`, `LoginPage`.

Reglas:

- Pueden importar plantillas, organismos, moléculas y átomos.
- Aquí vive el estado de la vista, los hooks de datos y los handlers.
- Es lo que consume `App.jsx` (o el router).
