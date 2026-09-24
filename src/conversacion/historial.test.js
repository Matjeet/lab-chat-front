import { obtenerHistorial } from './historial';

const respuestaFake = (status, cuerpo) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => cuerpo,
});

const paginaFake = {
  content: [
    {
      id: '1',
      remitente: 'mateo',
      destinatario: 'ana',
      contenido: 'Hola!',
      enviadoEn: '2026-01-01T00:00:00Z',
    },
  ],
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

describe('obtenerHistorial', () => {
  it('pide el historial entre los dos usuarios, sin parámetros si no se dan opciones', async () => {
    global.fetch = jest.fn().mockResolvedValue(respuestaFake(200, paginaFake));

    const resultado = await obtenerHistorial('mateo', 'ana');

    expect(resultado).toEqual({ ok: true, data: paginaFake });
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/v1/conversaciones/mateo/ana',
    );
  });

  it('agrega page, size y sort como query params cuando se pasan', async () => {
    global.fetch = jest.fn().mockResolvedValue(respuestaFake(200, paginaFake));

    await obtenerHistorial('mateo', 'ana', { page: 1, size: 50, sort: 'enviadoEn,desc' });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/v1/conversaciones/mateo/ana?page=1&size=50&sort=enviadoEn%2Cdesc',
    );
  });

  it('trata cualquier respuesta no-ok como "servidor"', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      respuestaFake(500, {
        type: 'urn:problem-type:internal-error',
      }),
    );

    expect(await obtenerHistorial('mateo', 'ana')).toEqual({
      ok: false,
      error: { kind: 'servidor' },
    });
  });

  it('trata un fallo de red como "red"', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    expect(await obtenerHistorial('mateo', 'ana')).toEqual({
      ok: false,
      error: { kind: 'red' },
    });
  });
});
