import { validarPasswordLogin, validarFormularioLogin } from './validacionLogin';

describe('validarPasswordLogin', () => {
  it('acepta cualquier contraseña no vacía', () => {
    expect(validarPasswordLogin('a')).toBeNull();
    expect(validarPasswordLogin('sin-mayusculas-ni-numero')).toBeNull();
  });

  it('exige la contraseña', () => {
    expect(validarPasswordLogin('')).toBe('La contraseña es obligatoria.');
  });
});

describe('validarFormularioLogin', () => {
  it('devuelve objeto vacío cuando todo es válido', () => {
    expect(
      validarFormularioLogin({ email: 'mateo@example.com', password: 'lo-que-sea' }),
    ).toEqual({});
  });

  it('acumula un error por cada campo inválido', () => {
    const errores = validarFormularioLogin({ email: 'malo', password: '' });
    expect(Object.keys(errores).sort()).toEqual(['email', 'password']);
  });
});
