import { obtenerListaChats } from './listaChats';

const respuestaFake = (status, cuerpo) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => cuerpo,
});

const paginaFake = {
  content: [
    {
      otroUsuario: 'ana',
      ultimoMensaje: {
        id: '1',
        remitente: 'mateo',
        destinatario: 'ana',
        contenido: 'Hola!',
        enviadoEn: '2026-01-01T00:00:00Z',
      },
    },
  ],
  nextCursor: '',
  hasMore: false,
};

afterEach(() => {
  jest.restoreAllMocks();
});

describe('obtenerListaChats', () => {
  it('pide los chats del usuario mandando el idToken como Bearer, sin parámetros si no se dan opciones', async () => {
    global.fetch = jest.fn().mockResolvedValue(respuestaFake(200, paginaFake));

    const resultado = await obtenerListaChats('mateo', 'token-abc');

    expect(resultado).toEqual({ ok: true, data: paginaFake });
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/v1/conversaciones/mateo/chats',
      { headers: { Authorization: 'Bearer token-abc' } },
    );
  });

  it('agrega cursor y size como query params cuando se pasan', async () => {
    global.fetch = jest.fn().mockResolvedValue(respuestaFake(200, paginaFake));

    await obtenerListaChats('mateo', 'token-abc', { cursor: 'abc==', size: 10 });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/v1/conversaciones/mateo/chats?cursor=abc%3D%3D&size=10',
      { headers: { Authorization: 'Bearer token-abc' } },
    );
  });

  it('codifica el usuario en la URL', async () => {
    global.fetch = jest.fn().mockResolvedValue(respuestaFake(200, paginaFake));

    await obtenerListaChats('usuario con espacio', 'token');

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/v1/conversaciones/usuario%20con%20espacio/chats',
      expect.anything(),
    );
  });

  it('trata un 400 (validation-error) como "cursor-invalido", con el detail como mensaje', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      respuestaFake(400, {
        type: 'urn:problem-type:validation-error',
        detail: 'El cursor no es válido',
        errors: [],
      }),
    );

    expect(await obtenerListaChats('mateo', 'token', { cursor: 'roto' })).toEqual({
      ok: false,
      error: { kind: 'cursor-invalido', mensaje: 'El cursor no es válido' },
    });
  });

  it('trata un 401 (unauthorized) como "no-autenticado"', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      respuestaFake(401, { type: 'urn:problem-type:unauthorized' }),
    );

    expect(await obtenerListaChats('mateo', 'token')).toEqual({
      ok: false,
      error: { kind: 'no-autenticado' },
    });
  });

  it('trata un 403 (forbidden) como "prohibido"', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      respuestaFake(403, { type: 'urn:problem-type:forbidden' }),
    );

    expect(await obtenerListaChats('mateo', 'token')).toEqual({
      ok: false,
      error: { kind: 'prohibido' },
    });
  });

  it('trata un 404 (resource-not-found) como "no-encontrado"', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      respuestaFake(404, { type: 'urn:problem-type:resource-not-found' }),
    );

    expect(await obtenerListaChats('mateo', 'token')).toEqual({
      ok: false,
      error: { kind: 'no-encontrado' },
    });
  });

  it('trata un 503/500 (u otro) como "servidor"', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      respuestaFake(503, { type: 'urn:problem-type:service-unavailable' }),
    );

    expect(await obtenerListaChats('mateo', 'token')).toEqual({
      ok: false,
      error: { kind: 'servidor' },
    });
  });

  it('trata un fallo de red como "red"', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    expect(await obtenerListaChats('mateo', 'token')).toEqual({
      ok: false,
      error: { kind: 'red' },
    });
  });
});
