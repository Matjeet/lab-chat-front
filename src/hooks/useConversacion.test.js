import { act, renderHook, waitFor } from '@testing-library/react';

import useConversacion from './useConversacion';
import { obtenerHistorial } from '../conversacion/historial';

// Factory explícita: mockea la función de historial (evita depender de fetch real).
jest.mock('../conversacion/historial', () => ({
  obtenerHistorial: jest.fn(),
}));

const PAGINA_VACIA = {
  content: [],
  page: 0,
  size: 50,
  totalElements: 0,
  totalPages: 0,
  first: true,
  last: true,
  empty: true,
};

const mensaje = (overrides) => ({
  id: '1',
  remitente: 'ana',
  destinatario: 'mateo',
  contenido: 'hola',
  enviadoEn: '2026-01-01T00:00:00Z',
  ...overrides,
});

/** `canal` falso — lo que devolvería `useCanalMensajes`, sin abrir ningún socket real. */
const canalFalso = (overrides = {}) => ({
  conectado: true,
  ultimoMensaje: null,
  enviarMensaje: jest.fn().mockReturnValue({ ok: true }),
  ...overrides,
});

/** Monta el hook y espera a que el historial (mockeado) termine de resolver. */
const montar = async (props = { yo: 'mateo', con: 'ana', canal: canalFalso() }) => {
  const utils = renderHook((p) => useConversacion(p), { initialProps: props });
  await waitFor(() => expect(utils.result.current.cargandoHistorial).toBe(false));
  return utils;
};

beforeEach(() => {
  obtenerHistorial.mockResolvedValue({ ok: true, data: PAGINA_VACIA });
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('useConversacion', () => {
  it('carga el historial pidiendo lo más reciente y lo invierte a orden cronológico', async () => {
    obtenerHistorial.mockResolvedValue({
      ok: true,
      data: {
        ...PAGINA_VACIA,
        content: [
          mensaje({ id: '2', contenido: 'hola de vuelta', enviadoEn: '2026-01-01T00:00:02Z' }),
          mensaje({ id: '1', contenido: 'hola', enviadoEn: '2026-01-01T00:00:01Z' }),
        ],
      },
    });

    const { result } = await montar();

    expect(result.current.mensajes.map((m) => m.id)).toEqual(['1', '2']);
    expect(obtenerHistorial).toHaveBeenCalledWith('mateo', 'ana', {
      size: 50,
      sort: 'enviadoEn,desc',
    });
  });

  it('expone el error si el historial falla', async () => {
    obtenerHistorial.mockResolvedValue({ ok: false, error: { kind: 'red' } });

    const { result } = await montar();

    expect(result.current.errorHistorial).toEqual({ kind: 'red' });
    expect(result.current.mensajes).toEqual([]);
  });

  it('"conectado" refleja directamente el "conectado" del canal', async () => {
    const { result, rerender } = await montar({ yo: 'mateo', con: 'ana', canal: canalFalso({ conectado: false }) });
    expect(result.current.conectado).toBe(false);

    rerender({ yo: 'mateo', con: 'ana', canal: canalFalso({ conectado: true }) });
    expect(result.current.conectado).toBe(true);
  });

  it('añade un mensaje de esta conversación recibido por el canal', async () => {
    const { result, rerender } = await montar();

    rerender({ yo: 'mateo', con: 'ana', canal: canalFalso({ ultimoMensaje: mensaje() }) });

    expect(result.current.mensajes).toHaveLength(1);
    expect(result.current.mensajes[0].contenido).toBe('hola');
  });

  it('ignora un mensaje de un tercero ajeno a esta conversación', async () => {
    const { result, rerender } = await montar();

    rerender({
      yo: 'mateo',
      con: 'ana',
      canal: canalFalso({ ultimoMensaje: mensaje({ remitente: 'carlos', destinatario: 'mateo' }) }),
    });

    expect(result.current.mensajes).toHaveLength(0);
  });

  it('no duplica un mensaje con el mismo id', async () => {
    const { result, rerender } = await montar();
    const unMensaje = mensaje();

    rerender({ yo: 'mateo', con: 'ana', canal: canalFalso({ ultimoMensaje: unMensaje }) });
    rerender({ yo: 'mateo', con: 'ana', canal: canalFalso({ ultimoMensaje: { ...unMensaje } }) });

    expect(result.current.mensajes).toHaveLength(1);
  });

  it('enviarMensaje delega en canal.enviarMensaje con el interlocutor actual (la validación vive en el canal)', async () => {
    const canal = canalFalso();
    const { result } = await montar({ yo: 'mateo', con: 'ana', canal });

    const resultado = result.current.enviarMensaje('Hola!');

    expect(resultado).toEqual({ ok: true });
    expect(canal.enviarMensaje).toHaveBeenCalledWith('ana', 'Hola!');
  });

  it('propaga tal cual un resultado de error de canal.enviarMensaje (p. ej. validación)', async () => {
    const errorValidacion = { ok: false, error: { kind: 'validacion', mensaje: 'Escribe un mensaje.' } };
    const canal = canalFalso({ enviarMensaje: jest.fn().mockReturnValue(errorValidacion) });
    const { result } = await montar({ yo: 'mateo', con: 'ana', canal });

    expect(result.current.enviarMensaje('   ')).toEqual(errorValidacion);
  });

  it('reintentarHistorial vuelve a pedir el historial (mismo yo/con)', async () => {
    obtenerHistorial.mockResolvedValueOnce({ ok: false, error: { kind: 'red' } });
    const { result } = await montar();
    expect(result.current.errorHistorial).toEqual({ kind: 'red' });

    obtenerHistorial.mockResolvedValueOnce({ ok: true, data: PAGINA_VACIA });
    act(() => {
      result.current.reintentarHistorial();
    });
    await waitFor(() => expect(result.current.errorHistorial).toBeNull());

    expect(obtenerHistorial).toHaveBeenCalledTimes(2);
    expect(obtenerHistorial).toHaveBeenLastCalledWith('mateo', 'ana', {
      size: 50,
      sort: 'enviadoEn,desc',
    });
  });

  it('cambiar de interlocutor cambia el filtro: un mensaje del nuevo "con" ya se acepta', async () => {
    const { result, rerender } = await montar({ yo: 'mateo', con: 'ana', canal: canalFalso() });

    rerender({ yo: 'mateo', con: 'carlos', canal: canalFalso() });
    await waitFor(() =>
      expect(obtenerHistorial).toHaveBeenLastCalledWith('mateo', 'carlos', {
        size: 50,
        sort: 'enviadoEn,desc',
      }),
    );

    rerender({
      yo: 'mateo',
      con: 'carlos',
      canal: canalFalso({ ultimoMensaje: mensaje({ remitente: 'carlos', destinatario: 'mateo' }) }),
    });

    expect(result.current.mensajes.some((m) => m.remitente === 'carlos')).toBe(true);
  });

  it('mismo "canal" (mismo objeto) al cambiar de interlocutor: no rompe nada, solo cambia a qué mensajes hace caso', async () => {
    const canal = canalFalso();
    const { result, rerender } = await montar({ yo: 'mateo', con: 'ana', canal });

    rerender({ yo: 'mateo', con: 'carlos', canal });

    expect(result.current.conectado).toBe(true);
  });
});
