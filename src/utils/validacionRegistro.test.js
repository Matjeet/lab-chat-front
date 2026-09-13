import {
  validarUsername,
  validarEmail,
  validarPassword,
  validarFormularioRegistro,
  requisitosUsername,
  requisitosPassword,
} from './validacionRegistro';

const estadoDe = (requisitos, id) => requisitos.find((r) => r.id === id).cumplido;

// Cumple los 6 requisitos: 8-20 caracteres, mayúscula, minúscula, número,
// especial, sin un carácter repetido 4+ veces seguidas.
const PASSWORD_VALIDA = 'Passw0rd!';

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
  it('acepta una contraseña que cumple todos los requisitos', () => {
    expect(validarPassword(PASSWORD_VALIDA)).toBeNull();
  });

  it('exige la contraseña con un mensaje específico', () => {
    expect(validarPassword('')).toBe('La contraseña es obligatoria.');
  });

  it.each([
    ['sin minúscula', 'PASSW0RD!'],
    ['sin mayúscula', 'passw0rd!'],
    ['sin número', 'Password!'],
    ['sin carácter especial', 'Password1'],
    ['con un carácter repetido 4+ veces seguidas', 'Aa1!AAAA'],
    ['muy corta', 'Pw1!'],
    ['muy larga (21 caracteres)', 'Aa1!Aa1!Aa1!Aa1!Aa1!A'],
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
        password: PASSWORD_VALIDA,
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
  it('marca todo pendiente con el campo vacío', () => {
    expect(requisitosPassword('').every((r) => !r.cumplido)).toBe(true);
  });

  it('marca todo cumplido con una contraseña que satisface la política', () => {
    expect(requisitosPassword(PASSWORD_VALIDA).every((r) => r.cumplido)).toBe(true);
  });

  it.each([
    ['longitud', 'Pw1!'],
    ['minuscula', 'PASSW0RD!'],
    ['mayuscula', 'passw0rd!'],
    ['numero', 'Password!'],
    ['especial', 'Password1'],
    ['repeticion', 'Aa1!AAAA'],
  ])('marca "%s" pendiente cuando no se cumple, sin afectar al resto', (id, valor) => {
    const reqs = requisitosPassword(valor);
    expect(estadoDe(reqs, id)).toBe(false);
    const otros = reqs.filter((r) => r.id !== id);
    expect(otros.every((r) => r.cumplido)).toBe(true);
  });
});
