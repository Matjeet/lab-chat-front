import {
  consumirBienvenidaPendiente,
  descartarBienvenidaPendiente,
  marcarBienvenidaPendiente,
} from './bienvenida';

afterEach(() => {
  sessionStorage.clear();
  jest.restoreAllMocks();
});

describe('bienvenida', () => {
  it('sin marca previa, no hay bienvenida pendiente', () => {
    expect(consumirBienvenidaPendiente()).toBe(false);
  });

  it('una vez marcada, se consume una sola vez', () => {
    marcarBienvenidaPendiente();

    expect(consumirBienvenidaPendiente()).toBe(true);
    expect(consumirBienvenidaPendiente()).toBe(false);
  });

  it('descartarla antes de consumirla la deja sin efecto', () => {
    marcarBienvenidaPendiente();
    descartarBienvenidaPendiente();

    expect(consumirBienvenidaPendiente()).toBe(false);
  });

  it('si el almacenamiento falla, no lanza y no hay bienvenida', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });

    expect(() => marcarBienvenidaPendiente()).not.toThrow();
    expect(consumirBienvenidaPendiente()).toBe(false);
  });
});
