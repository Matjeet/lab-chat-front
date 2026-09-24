import { guardarMiUsuario, leerMiUsuario } from './miUsuario';

afterEach(() => {
  localStorage.clear();
});

describe('miUsuario', () => {
  it('guarda y vuelve a leer el username', () => {
    guardarMiUsuario('mateo29');
    expect(leerMiUsuario()).toBe('mateo29');
  });

  it('sin nada guardado, devuelve cadena vacía', () => {
    expect(leerMiUsuario()).toBe('');
  });

  it('leerMiUsuario tolera que localStorage falle', () => {
    const original = window.localStorage.getItem;
    window.localStorage.getItem = () => {
      throw new Error('no disponible');
    };
    expect(leerMiUsuario()).toBe('');
    window.localStorage.getItem = original;
  });

  it('guardarMiUsuario tolera que localStorage falle', () => {
    const original = window.localStorage.setItem;
    window.localStorage.setItem = () => {
      throw new Error('no disponible');
    };
    expect(() => guardarMiUsuario('mateo29')).not.toThrow();
    window.localStorage.setItem = original;
  });
});
