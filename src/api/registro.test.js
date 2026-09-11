import { registrarUsuario } from './registro';

const datos = {
  username: 'mateo',
  email: 'mateo@example.com',
  password: 'secretpass',
};

const respuestaFake = (status, cuerpo) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => cuerpo,
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('registrarUsuario', () => {
  it('devuelve ok con los datos en un 201', async () => {
    const creado = { id: 1, username: 'mateo', email: 'mateo@example.com', activo: true };
    global.fetch = jest.fn().mockResolvedValue(respuestaFake(201, creado));

    const resultado = await registrarUsuario(datos);

    expect(resultado).toEqual({ ok: true, data: creado });
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/v1/registro',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('mapea validation-error a errores por campo', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      respuestaFake(400, {
        type: 'urn:problem-type:validation-error',
        errors: [
          { field: 'email', message: 'formato inválido' },
          { field: 'password', message: 'muy corta' },
        ],
      }),
    );

    const resultado = await registrarUsuario(datos);

    expect(resultado).toEqual({
      ok: false,
      error: { kind: 'validacion', campos: { email: 'formato inválido', password: 'muy corta' } },
    });
  });

  it('trata duplicate-resource como "duplicado" (genérico)', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      respuestaFake(409, { type: 'urn:problem-type:duplicate-resource' }),
    );

    expect(await registrarUsuario(datos)).toEqual({
      ok: false,
      error: { kind: 'duplicado' },
    });
  });

  it('trata un 500 como "servidor"', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      respuestaFake(500, { type: 'urn:problem-type:internal-error' }),
    );

    expect(await registrarUsuario(datos)).toEqual({
      ok: false,
      error: { kind: 'servidor' },
    });
  });

  it('trata un fallo de red como "red"', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    expect(await registrarUsuario(datos)).toEqual({
      ok: false,
      error: { kind: 'red' },
    });
  });
});
