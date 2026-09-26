import { obtenerNotificaciones, actualizarLeida } from './notificaciones';

const respuestaFake = (status, cuerpo) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => cuerpo,
});

const paginaFake = {
  content: [{ id: 1, remitente: 'mateo', tipo: 'solicitud', leida: false, createdAt: '2026-01-01T00:00:00Z' }],
  page: 0,
  size: 20,
  totalElements: 1,
  totalPages: 1,
  first: true,
  last: true,
  empty: false,
};

afterEach(() => {
  jest.restoreAllMocks();
});

describe('obtenerNotificaciones', () => {
  it('pide las notificaciones del receptor mandando el idToken como Bearer, sin parámetros si no se dan opciones', async () => {
    global.fetch = jest.fn().mockResolvedValue(respuestaFake(200, paginaFake));

    const resultado = await obtenerNotificaciones('ana', 'token-abc');

    expect(resultado).toEqual({ ok: true, data: paginaFake });
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8080/api/v1/notificaciones/ana', {
      headers: { Authorization: 'Bearer token-abc' },
    });
  });

  it('agrega page, size y sort como query params cuando se pasan', async () => {
    global.fetch = jest.fn().mockResolvedValue(respuestaFake(200, paginaFake));

    await obtenerNotificaciones('ana', 'token-abc', { page: 1, size: 10, sort: 'createdAt,asc' });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/v1/notificaciones/ana?page=1&size=10&sort=createdAt%2Casc',
      { headers: { Authorization: 'Bearer token-abc' } },
    );
  });

  it('trata un 401 (unauthorized) como "no-autenticado"', async () => {
    global.fetch = jest.fn().mockResolvedValue(respuestaFake(401, { type: 'urn:problem-type:unauthorized' }));

    expect(await obtenerNotificaciones('ana', 'token')).toEqual({ ok: false, error: { kind: 'no-autenticado' } });
  });

  it('trata un 403 (forbidden) como "prohibido"', async () => {
    global.fetch = jest.fn().mockResolvedValue(respuestaFake(403, { type: 'urn:problem-type:forbidden' }));

    expect(await obtenerNotificaciones('ana', 'token')).toEqual({ ok: false, error: { kind: 'prohibido' } });
  });

  it('trata un 503 (u otro) como "servidor"', async () => {
    global.fetch = jest.fn().mockResolvedValue(respuestaFake(503, { type: 'urn:problem-type:service-unavailable' }));

    expect(await obtenerNotificaciones('ana', 'token')).toEqual({ ok: false, error: { kind: 'servidor' } });
  });

  it('trata un fallo de red como "red"', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    expect(await obtenerNotificaciones('ana', 'token')).toEqual({ ok: false, error: { kind: 'red' } });
  });
});

describe('actualizarLeida', () => {
  const notificacionFake = { id: 1, remitente: 'mateo', tipo: 'solicitud', leida: true, createdAt: '2026-01-01T00:00:00Z' };

  it('manda uid y leida en el cuerpo, con el idToken como Bearer', async () => {
    global.fetch = jest.fn().mockResolvedValue(respuestaFake(200, notificacionFake));

    const resultado = await actualizarLeida(1, 'uid-123', true, 'token-abc');

    expect(resultado).toEqual({ ok: true, data: notificacionFake });
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8080/api/v1/notificaciones/1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token-abc' },
      body: JSON.stringify({ uid: 'uid-123', leida: true }),
    });
  });

  it('trata un 400 (validation-error) como "validacion"', async () => {
    global.fetch = jest.fn().mockResolvedValue(respuestaFake(400, { type: 'urn:problem-type:validation-error' }));

    expect(await actualizarLeida(1, '', true, 'token')).toEqual({ ok: false, error: { kind: 'validacion' } });
  });

  it('trata un 401 (unauthorized) como "no-autenticado"', async () => {
    global.fetch = jest.fn().mockResolvedValue(respuestaFake(401, { type: 'urn:problem-type:unauthorized' }));

    expect(await actualizarLeida(1, 'uid-123', true, 'token')).toEqual({ ok: false, error: { kind: 'no-autenticado' } });
  });

  it('trata un 403 (forbidden) como "prohibido"', async () => {
    global.fetch = jest.fn().mockResolvedValue(respuestaFake(403, { type: 'urn:problem-type:forbidden' }));

    expect(await actualizarLeida(1, 'uid-123', true, 'token')).toEqual({ ok: false, error: { kind: 'prohibido' } });
  });

  it('trata un 404 (resource-not-found) como "no-encontrado"', async () => {
    global.fetch = jest.fn().mockResolvedValue(respuestaFake(404, { type: 'urn:problem-type:resource-not-found' }));

    expect(await actualizarLeida(999, 'uid-123', true, 'token')).toEqual({ ok: false, error: { kind: 'no-encontrado' } });
  });

  it('trata un 503 (u otro) como "servidor"', async () => {
    global.fetch = jest.fn().mockResolvedValue(respuestaFake(503, { type: 'urn:problem-type:service-unavailable' }));

    expect(await actualizarLeida(1, 'uid-123', true, 'token')).toEqual({ ok: false, error: { kind: 'servidor' } });
  });

  it('trata un fallo de red como "red"', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    expect(await actualizarLeida(1, 'uid-123', true, 'token')).toEqual({ ok: false, error: { kind: 'red' } });
  });
});
