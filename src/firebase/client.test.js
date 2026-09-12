// Nota: cada test resetea los módulos y vuelve a requerir `./client` para
// tener una instancia fresca del singleton `authInstance` (module-level).
// El caso "lanza fuera del navegador" no se cubre aquí — simularlo de forma
// fiable en jsdom es frágil; lo real que lo prueba es que `next build`
// (export estático, con su pase de prerender en Node) compila sin romperse.

describe('obtenerAuth', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('inicializa la app y Auth la primera vez, y reutiliza la instancia después', () => {
    jest.doMock('firebase/app', () => ({
      getApps: jest.fn(() => []),
      getApp: jest.fn(),
      initializeApp: jest.fn(() => ({})),
    }));
    jest.doMock('firebase/auth', () => ({ getAuth: jest.fn(() => ({})) }));

    const { obtenerAuth } = require('./client');
    const { initializeApp } = require('firebase/app');
    const { getAuth } = require('firebase/auth');

    const primera = obtenerAuth();
    const segunda = obtenerAuth();

    expect(primera).toBe(segunda);
    expect(initializeApp).toHaveBeenCalledTimes(1);
    expect(getAuth).toHaveBeenCalledTimes(1);
  });

  it('reutiliza una app de Firebase ya inicializada en vez de crear otra', () => {
    const appExistente = { name: '[DEFAULT]' };
    jest.doMock('firebase/app', () => ({
      getApps: jest.fn(() => [appExistente]),
      getApp: jest.fn(() => appExistente),
      initializeApp: jest.fn(),
    }));
    jest.doMock('firebase/auth', () => ({ getAuth: jest.fn(() => ({})) }));

    const { obtenerAuth } = require('./client');
    const { getApp, initializeApp } = require('firebase/app');

    obtenerAuth();

    expect(getApp).toHaveBeenCalled();
    expect(initializeApp).not.toHaveBeenCalled();
  });
});
