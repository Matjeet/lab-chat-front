import { obtenerUsuario } from './usuario';

const respuestaFake = (status, cuerpo) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => cuerpo,
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('obtenerUsuario', () => {
  it('manda el idToken como Bearer y devuelve username/email', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      respuestaFake(200, { username: 'mateo', email: 'mateo@example.com' }),
    );

    const resultado = await obtenerUsuario('uid-123', 'token-abc');

    expect(resultado).toEqual({
      ok: true,
      data: { username: 'mateo', email: 'mateo@example.com' },
    });
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/v1/usuarios/uid-123',
      { headers: { Authorization: 'Bearer token-abc' } },
    );
  });

  it('codifica el uid en la URL', async () => {
    global.fetch = jest.fn().mockResolvedValue(respuestaFake(200, {}));

    await obtenerUsuario('uid con espacio', 'token');

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/v1/usuarios/uid%20con%20espacio',
      expect.anything(),
    );
  });

  it('trata un 401 (unauthorized) como "no-autenticado"', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      respuestaFake(401, { type: 'urn:problem-type:unauthorized' }),
    );

    expect(await obtenerUsuario('uid-123', 'token')).toEqual({
      ok: false,
      error: { kind: 'no-autenticado' },
    });
  });

  it('trata un 403 (forbidden) como "prohibido"', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      respuestaFake(403, { type: 'urn:problem-type:forbidden' }),
    );

    expect(await obtenerUsuario('uid-123', 'token')).toEqual({
      ok: false,
      error: { kind: 'prohibido' },
    });
  });

  it('trata un 404 (resource-not-found) como "no-encontrado"', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      respuestaFake(404, { type: 'urn:problem-type:resource-not-found' }),
    );

    expect(await obtenerUsuario('uid-123', 'token')).toEqual({
      ok: false,
      error: { kind: 'no-encontrado' },
    });
  });

  it('trata un 503/500 (u otro) como "servidor"', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      respuestaFake(503, { type: 'urn:problem-type:service-unavailable' }),
    );

    expect(await obtenerUsuario('uid-123', 'token')).toEqual({
      ok: false,
      error: { kind: 'servidor' },
    });
  });

  it('trata un fallo de red como "red"', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    expect(await obtenerUsuario('uid-123', 'token')).toEqual({
      ok: false,
      error: { kind: 'red' },
    });
  });
});
