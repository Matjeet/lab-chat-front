import { registrarUsuario } from './registro';
import { borrarUsuarioFirebase, crearUsuarioFirebase } from '../firebase/auth';

jest.mock('../firebase/auth');

const datos = {
  username: 'mateo',
  email: 'mateo@example.com',
  password: 'Passw0rd!',
};

const usuarioFirebase = { uid: 'uid-123' };

const respuestaFake = (status, cuerpo) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => cuerpo,
});

const errorFirebase = (code) => Object.assign(new Error(code), { code });

afterEach(() => {
  jest.restoreAllMocks();
});

describe('registrarUsuario', () => {
  it('crea primero en Firebase y luego en el backend, enlazando por uid', async () => {
    crearUsuarioFirebase.mockResolvedValue(usuarioFirebase);
    const creado = { id: 1, username: 'mateo', email: 'mateo@example.com', activo: true };
    global.fetch = jest.fn().mockResolvedValue(respuestaFake(201, creado));

    const resultado = await registrarUsuario(datos);

    expect(crearUsuarioFirebase).toHaveBeenCalledWith({
      email: datos.email,
      password: datos.password,
      username: datos.username,
    });
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/v1/registro',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          username: 'mateo',
          email: 'mateo@example.com',
          uid: 'uid-123',
        }),
      }),
    );
    expect(resultado).toEqual({ ok: true, data: creado });
    expect(borrarUsuarioFirebase).not.toHaveBeenCalled();
  });

  it('no llama al backend si Firebase rechaza la creación', async () => {
    crearUsuarioFirebase.mockRejectedValue(errorFirebase('auth/email-already-in-use'));
    global.fetch = jest.fn();

    const resultado = await registrarUsuario(datos);

    expect(resultado).toEqual({ ok: false, error: { kind: 'duplicado' } });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it.each([
    ['auth/invalid-email', { kind: 'validacion', campos: { email: 'formato' } }],
    ['auth/weak-password', { kind: 'validacion', campos: { password: 'formato' } }],
    ['auth/network-request-failed', { kind: 'red' }],
    ['auth/algo-inesperado', { kind: 'servidor' }],
  ])('traduce el error de Firebase %s', async (code, esperado) => {
    crearUsuarioFirebase.mockRejectedValue(errorFirebase(code));

    expect(await registrarUsuario(datos)).toEqual({ ok: false, error: esperado });
  });

  it('revierte el alta en Firebase si el backend falla por red', async () => {
    crearUsuarioFirebase.mockResolvedValue(usuarioFirebase);
    global.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    const resultado = await registrarUsuario(datos);

    expect(resultado).toEqual({ ok: false, error: { kind: 'red' } });
    expect(borrarUsuarioFirebase).toHaveBeenCalledWith(usuarioFirebase);
  });

  it('revierte el alta en Firebase si el backend responde 409 duplicate-resource', async () => {
    crearUsuarioFirebase.mockResolvedValue(usuarioFirebase);
    global.fetch = jest.fn().mockResolvedValue(
      respuestaFake(409, { type: 'urn:problem-type:duplicate-resource' }),
    );

    const resultado = await registrarUsuario(datos);

    expect(resultado).toEqual({ ok: false, error: { kind: 'duplicado' } });
    expect(borrarUsuarioFirebase).toHaveBeenCalledWith(usuarioFirebase);
  });

  it('revierte el alta en Firebase si el backend responde 400 validation-error', async () => {
    crearUsuarioFirebase.mockResolvedValue(usuarioFirebase);
    global.fetch = jest.fn().mockResolvedValue(
      respuestaFake(400, {
        type: 'urn:problem-type:validation-error',
        errors: [{ field: 'username', message: 'x' }],
      }),
    );

    const resultado = await registrarUsuario(datos);

    expect(resultado).toEqual({
      ok: false,
      error: { kind: 'validacion', campos: { username: 'x' } },
    });
    expect(borrarUsuarioFirebase).toHaveBeenCalledWith(usuarioFirebase);
  });

  it('no revienta si tampoco se puede revertir el alta en Firebase', async () => {
    crearUsuarioFirebase.mockResolvedValue(usuarioFirebase);
    borrarUsuarioFirebase.mockRejectedValue(new Error('no se pudo borrar'));
    global.fetch = jest.fn().mockResolvedValue(
      respuestaFake(500, { type: 'urn:problem-type:internal-error' }),
    );

    await expect(registrarUsuario(datos)).resolves.toEqual({
      ok: false,
      error: { kind: 'servidor' },
    });
  });
});
