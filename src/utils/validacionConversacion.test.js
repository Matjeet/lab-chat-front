import {
  validarContenido,
  validarIdentidad,
  validarUsername,
} from './validacionConversacion';

describe('validarUsername', () => {
  it('acepta un username válido', () => {
    expect(validarUsername('mateo29')).toBeNull();
    expect(validarUsername('mateo.29_ok-1')).toBeNull();
  });

  it('rechaza vacío', () => {
    expect(validarUsername('')).toBe('Este campo es obligatorio.');
    expect(validarUsername('   ')).toBe('Este campo es obligatorio.');
  });

  it('rechaza menos de 3 o más de 50 caracteres', () => {
    expect(validarUsername('ab')).toMatch(/entre 3 y 50/i);
    expect(validarUsername('a'.repeat(51))).toMatch(/entre 3 y 50/i);
  });

  it('rechaza caracteres fuera de A-Za-z0-9._-', () => {
    expect(validarUsername('mateo!')).toMatch(/entre 3 y 50/i);
    expect(validarUsername('mateo ana')).toMatch(/entre 3 y 50/i);
  });
});

describe('validarContenido', () => {
  it('acepta un texto no vacío dentro del límite', () => {
    expect(validarContenido('Hola!')).toBeNull();
  });

  it('rechaza vacío o solo espacios', () => {
    expect(validarContenido('')).toBe('Escribe un mensaje.');
    expect(validarContenido('   ')).toBe('Escribe un mensaje.');
  });

  it('rechaza más de 2000 caracteres', () => {
    expect(validarContenido('a'.repeat(2001))).toMatch(/2000 caracteres/);
  });

  it('acepta exactamente 2000 caracteres', () => {
    expect(validarContenido('a'.repeat(2000))).toBeNull();
  });
});

describe('validarIdentidad', () => {
  it('sin errores cuando ambos usuarios son válidos y distintos', () => {
    expect(validarIdentidad({ yo: 'mateo', con: 'ana' })).toEqual({});
  });

  it('marca ambos campos si son inválidos', () => {
    const errores = validarIdentidad({ yo: '', con: 'x' });
    expect(errores.yo).toBeTruthy();
    expect(errores.con).toBeTruthy();
  });

  it('rechaza chatear contigo mismo', () => {
    expect(validarIdentidad({ yo: 'mateo', con: 'mateo' })).toEqual({
      con: 'No puedes chatear contigo mismo.',
    });
  });

  it('la comparación de "contigo mismo" ignora mayúsculas y espacios', () => {
    expect(validarIdentidad({ yo: 'Mateo', con: ' mateo ' })).toEqual({
      con: 'No puedes chatear contigo mismo.',
    });
  });
});
