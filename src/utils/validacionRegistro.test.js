import {
  validarUsername,
  validarEmail,
  validarPassword,
  validarFormularioRegistro,
  requisitosUsername,
  requisitosPassword,
} from './validacionRegistro';

const estadoDe = (requisitos, id) => requisitos.find((r) => r.id === id).cumplido;

describe('validarUsername', () => {
  it('acepta un usuario válido', () => {
    expect(validarUsername('mateo_29')).toBeNull();
  });

  it.each([
    ['vacío', ''],
    ['demasiado corto', 'ab'],
    ['demasiado largo', 'a'.repeat(51)],
    ['con espacios', 'ma teo'],
    ['con símbolos no permitidos', 'mateo!'],
  ])('rechaza un usuario %s', (_caso, valor) => {
    expect(validarUsername(valor)).not.toBeNull();
  });
});

describe('validarEmail', () => {
  it('acepta un correo válido', () => {
    expect(validarEmail('mateo@example.com')).toBeNull();
  });

  it.each([
    ['vacío', ''],
    ['sin arroba', 'mateo.example.com'],
    ['sin dominio', 'mateo@'],
    ['demasiado largo', `${'a'.repeat(250)}@x.com`],
  ])('rechaza un correo %s', (_caso, valor) => {
    expect(validarEmail(valor)).not.toBeNull();
  });
});

describe('validarPassword', () => {
  it('acepta una contraseña de 8 a 100 caracteres', () => {
    expect(validarPassword('secretpass')).toBeNull();
  });

  it('no recorta espacios (la contraseña se envía tal cual)', () => {
    expect(validarPassword('  abcdef  ')).toBeNull();
  });

  it.each([
    ['muy corta', 'corta'],
    ['muy larga', 'x'.repeat(101)],
    ['vacía', ''],
  ])('rechaza una contraseña %s', (_caso, valor) => {
    expect(validarPassword(valor)).not.toBeNull();
  });
});

describe('validarFormularioRegistro', () => {
  it('devuelve objeto vacío cuando todo es válido', () => {
    expect(
      validarFormularioRegistro({
        username: 'mateo',
        email: 'mateo@example.com',
        password: 'secretpass',
      }),
    ).toEqual({});
  });

  it('acumula un error por cada campo inválido', () => {
    const errores = validarFormularioRegistro({
      username: 'a',
      email: 'malo',
      password: '123',
    });
    expect(Object.keys(errores).sort()).toEqual(['email', 'password', 'username']);
  });
});

describe('requisitosUsername', () => {
  it('marca todo pendiente con el campo vacío', () => {
    const reqs = requisitosUsername('');
    expect(reqs.every((r) => !r.cumplido)).toBe(true);
  });

  it('marca formato cumplido pero longitud pendiente con 2 caracteres válidos', () => {
    const reqs = requisitosUsername('ab');
    expect(estadoDe(reqs, 'formato')).toBe(true);
    expect(estadoDe(reqs, 'longitud')).toBe(false);
  });

  it('marca todo cumplido con un usuario válido', () => {
    const reqs = requisitosUsername('mateo.29');
    expect(reqs.every((r) => r.cumplido)).toBe(true);
  });

  it('marca formato pendiente si hay caracteres no permitidos', () => {
    expect(estadoDe(requisitosUsername('mateo!'), 'formato')).toBe(false);
  });
});

describe('requisitosPassword', () => {
  it('pendiente con menos de 8 caracteres', () => {
    expect(estadoDe(requisitosPassword('corta'), 'longitud')).toBe(false);
  });

  it('cumplido entre 8 y 100 caracteres', () => {
    expect(estadoDe(requisitosPassword('secretpass'), 'longitud')).toBe(true);
  });

  it('pendiente con más de 100 caracteres', () => {
    expect(estadoDe(requisitosPassword('x'.repeat(101)), 'longitud')).toBe(false);
  });
});
