# Integración con la API

Cómo consume este frontend los microservicios backend. Contrato completo:
[`../../chat-registro/docs/contratos-api.md`](../../chat-registro/docs/contratos-api.md).

## Configuración

| Variable | Por defecto | Notas |
|----------|-------------|-------|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8080` | Base URL de `chat-registro`. Se **inyecta en tiempo de build** (export estático). Define en `.env.local` para desarrollo. |

`src/api/config.js` la lee y le quita la barra final.

CORS lo resuelve el gateway / reverse proxy, no el servicio (ver contrato §1).

## Dónde vive el código

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/api/config.js` | `API_BASE_URL`. |
| `src/api/registro.js` | `registrarUsuario(datos)` → `POST /api/v1/registro`. |
| `src/utils/validacionRegistro.js` | Validación de cliente + `requisitos{Username,Password}` (estado en vivo de cada requisito). |
| `src/components/organisms/RegistroForm/` | Estado del formulario + reparto de errores. |
| `src/components/pages/RegistroPage/` | Alterna formulario ↔ confirmación. |

## Patrón: resultado tipado

Las funciones de `src/api/` **no lanzan**. Devuelven:

```js
{ ok: true,  data }                                  // 2xx
{ ok: false, error: { kind: 'validacion', campos } } // 400 validation-error
{ ok: false, error: { kind: 'duplicado' } }          // 409 duplicate / data-integrity
{ ok: false, error: { kind: 'servidor' } }           // 5xx u otros
{ ok: false, error: { kind: 'red' } }                // fetch falló (sin red, CORS, caído)
```

El organismo hace `if (resultado.ok) … else switch (resultado.error.kind)`.

## Reglas de negociación de errores (del contrato §4)

1. **Ramificar por `type`**, no por `status` ni por `title`/`detail`.
2. **El `409` es genérico**: nunca se atribuye a un campo concreto ni se muestra
   el valor enviado (anti-enumeración). Mensaje neutro en la UI.
3. **`password` nunca se guarda ni se muestra** tras el alta.
4. **El `email` se normaliza a minúsculas** en el servidor; al mostrarlo tras el
   alta se usa el valor de la respuesta, no el tecleado.
5. **Validación de cliente = espejo** de las reglas, solo para feedback
   inmediato. En un `400`, los textos que se muestran salen de `REGLAS[campo]`
   (nuestros), no del `message` del servidor (orientativo).
6. **La unicidad no se puede pre-comprobar** (no hay endpoint): se descubre con
   el `409` del `POST`.

## Añadir una llamada nueva

1. Función en `src/api/<servicio>.js` que devuelve el resultado tipado.
2. Si hay formulario, validación pura en `src/utils/`.
3. El organismo consume la función y traduce cada `kind` a UI.
4. Tests: mockear `src/api/<servicio>` en el test del organismo; testear la
   función de API aparte con `global.fetch = jest.fn()`.
