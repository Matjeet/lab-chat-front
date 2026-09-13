jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
  getApps: jest.fn(() => []),
  getApp: jest.fn(() => ({})),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  signInWithEmailAndPassword: jest.fn(),
}));

import { signInWithEmailAndPassword } from 'firebase/auth';

import { iniciarSesion } from './auth';

describe('iniciarSesion', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('devuelve uid, email e idToken cuando las credenciales son correctas', async () => {
    signInWithEmailAndPassword.mockResolvedValue({
      user: {
        uid: 'abc123',
        email: 'usuario1@gmail.com',
        getIdToken: jest.fn().mockResolvedValue('token-de-prueba'),
      },
    });

    const resultado = await iniciarSesion({
      email: 'usuario1@gmail.com',
      password: 'aA1-qwertyuiop',
    });

    expect(resultado).toEqual({
      ok: true,
      data: { uid: 'abc123', email: 'usuario1@gmail.com', idToken: 'token-de-prueba' },
    });
  });

  it.each([
    ['auth/invalid-credential', 'credenciales'],
    ['auth/invalid-email', 'credenciales'],
    ['auth/user-not-found', 'credenciales'],
    ['auth/wrong-password', 'credenciales'],
    ['auth/too-many-requests', 'demasiados-intentos'],
    ['auth/network-request-failed', 'red'],
    ['auth/internal-error', 'desconocido'],
  ])('mapea el código %s de Firebase a error.kind "%s"', async (code, kind) => {
    signInWithEmailAndPassword.mockRejectedValue({ code });

    const resultado = await iniciarSesion({
      email: 'usuario1@gmail.com',
      password: 'lo-que-sea',
    });

    expect(resultado).toEqual({ ok: false, error: { kind } });
  });
});
