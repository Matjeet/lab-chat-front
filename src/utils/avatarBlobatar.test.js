import { happy, idle } from 'blobatar/expression';
import {
  FORMAS,
  EMOCIONES,
  PERSONALIZACION_INICIAL,
  opcionesBlobatar,
  etiquetaBlobatar,
} from './avatarBlobatar';

// Mismo `@Pattern` que valida chat-gateway para el campo `avatar` (ver
// RegistroRequest.java) — se copia aquí para comprobar, sin depender de ese
// repo, que todo lo que generamos pasaría esa validación.
const AVATAR_REGEX = /^(https?:\/\/[^\s"'<>]+|<Blobatar(\s[^<>\r\n]*)?\/>)$/;

describe('avatarBlobatar', () => {
  it('FORMAS tiene diez siluetas con ids únicos y posiciones dentro de [0, 1)', () => {
    expect(FORMAS).toHaveLength(10);
    const ids = FORMAS.map((f) => f.id);
    expect(new Set(ids).size).toBe(10);
    FORMAS.forEach((forma) => {
      expect(forma.posicion).toBeGreaterThanOrEqual(0);
      expect(forma.posicion).toBeLessThan(1);
    });
  });

  it('EMOCIONES tiene las catorce poses de blobatar/expression, cada una con su objeto', () => {
    expect(EMOCIONES).toHaveLength(14);
    const idle_ = EMOCIONES.find((e) => e.id === 'idle');
    const happy_ = EMOCIONES.find((e) => e.id === 'happy');
    expect(idle_.valor).toBe(idle);
    expect(happy_.valor).toBe(happy);
  });

  describe('opcionesBlobatar', () => {
    it('sin personalización, no añade ninguna opción', () => {
      expect(opcionesBlobatar({})).toEqual({});
      expect(opcionesBlobatar()).toEqual({});
    });

    it('traduce la forma a su posición de traits.shape', () => {
      expect(opcionesBlobatar({ shape: 'round' })).toEqual({ traits: { shape: 0.11 } });
      expect(opcionesBlobatar({ shape: 'triangle' })).toEqual({ traits: { shape: 0.99 } });
    });

    it('pasa hue y tone tal cual', () => {
      expect(opcionesBlobatar({ hue: 200, tone: 0.4 })).toEqual({ hue: 200, tone: 0.4 });
    });

    it('traduce la emoción a su objeto Expression real', () => {
      expect(opcionesBlobatar({ expression: 'happy' })).toEqual({ expression: happy });
    });

    it('combina las cuatro a la vez', () => {
      expect(opcionesBlobatar(PERSONALIZACION_INICIAL)).toEqual({
        traits: { shape: 0.11 },
        hue: 200,
        tone: 0.5,
        expression: idle,
      });
    });

    it('ignora un id de forma o de emoción que no existe, sin lanzar', () => {
      expect(opcionesBlobatar({ shape: 'no-existe', expression: 'no-existe' })).toEqual({});
    });
  });

  describe('etiquetaBlobatar', () => {
    it('sin personalización, solo trae el name', () => {
      expect(etiquetaBlobatar('mateo', {})).toBe('<Blobatar name="mateo" />');
    });

    it('incluye cada atributo personalizado', () => {
      expect(etiquetaBlobatar('mateo', PERSONALIZACION_INICIAL)).toBe(
        '<Blobatar name="mateo" shape="round" hue="200" tone="0.5" expression="idle" />',
      );
    });

    it('el resultado siempre cumple el formato que exige chat-gateway', () => {
      expect(etiquetaBlobatar('mateo', {})).toMatch(AVATAR_REGEX);
      expect(etiquetaBlobatar('mateo', PERSONALIZACION_INICIAL)).toMatch(AVATAR_REGEX);
      expect(etiquetaBlobatar('a', { shape: 'sun', hue: 0, tone: 0, expression: 'sick' })).toMatch(
        AVATAR_REGEX,
      );
    });

    it('nunca supera los 500 caracteres que acepta el contrato, ni con un username en el límite', () => {
      const usernameLargo = 'a'.repeat(50); // el máximo que permite chat-registro
      const etiqueta = etiquetaBlobatar(usernameLargo, PERSONALIZACION_INICIAL);
      expect(etiqueta.length).toBeLessThanOrEqual(500);
    });
  });
});
