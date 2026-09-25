import { crearSolicitud } from './solicitudes';

const respuestaFake = (status, cuerpo) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => cuerpo,
});

const solicitudFake = {
  id: '1',
  solicitante: 'mateo',
  solicitado: 'ana',
  aceptada: false,
  creadaEn: '2026-09-23T20:53:47.441193Z',
};

afterEach(() => {
  jest.restoreAllMocks();
});

describe('crearSolicitud', () => {
  it('manda solicitante y solicitado con el idToken como Bearer', async () => {
    global.fetch = jest.fn().mockResolvedValue(respuestaFake(201, solicitudFake));

    const resultado = await crearSolicitud('mateo', 'ana', 'token-abc');

    expect(resultado).toEqual({ ok: true, data: solicitudFake });
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/v1/conversaciones/solicitudes',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token-abc' },
        body: JSON.stringify({ solicitante: 'mateo', solicitado: 'ana' }),
      },
    );
  });

  it('trata un 400 (validation-error) como "validacion", con el detail como mensaje', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      respuestaFake(400, {
        type: 'urn:problem-type:validation-error',
        detail: 'solicitante y solicitado no pueden ser el mismo usuario',
        errors: [],
      }),
    );

    expect(await crearSolicitud('mateo', 'mateo', 'token')).toEqual({
      ok: false,
      error: { kind: 'validacion', mensaje: 'solicitante y solicitado no pueden ser el mismo usuario' },
    });
  });

  it('trata un 401 (unauthorized) como "no-autenticado"', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      respuestaFake(401, { type: 'urn:problem-type:unauthorized' }),
    );

    expect(await crearSolicitud('mateo', 'ana', 'token')).toEqual({
      ok: false,
      error: { kind: 'no-autenticado' },
    });
  });

  it('trata un 403 (forbidden) como "prohibido"', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      respuestaFake(403, { type: 'urn:problem-type:forbidden' }),
    );

    expect(await crearSolicitud('mateo', 'ana', 'token')).toEqual({
      ok: false,
      error: { kind: 'prohibido' },
    });
  });

  it('trata un 404 (resource-not-found) como "no-encontrado"', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      respuestaFake(404, { type: 'urn:problem-type:resource-not-found' }),
    );

    expect(await crearSolicitud('mateo', 'fantasma', 'token')).toEqual({
      ok: false,
      error: { kind: 'no-encontrado' },
    });
  });

  it('trata un 409 (duplicate-resource) como "duplicada"', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      respuestaFake(409, { type: 'urn:problem-type:duplicate-resource' }),
    );

    expect(await crearSolicitud('mateo', 'ana', 'token')).toEqual({
      ok: false,
      error: { kind: 'duplicada' },
    });
  });

  it('trata un 503 (u otro) como "servidor"', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      respuestaFake(503, { type: 'urn:problem-type:service-unavailable' }),
    );

    expect(await crearSolicitud('mateo', 'ana', 'token')).toEqual({
      ok: false,
      error: { kind: 'servidor' },
    });
  });

  it('trata un fallo de red como "red"', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    expect(await crearSolicitud('mateo', 'ana', 'token')).toEqual({
      ok: false,
      error: { kind: 'red' },
    });
  });
});
