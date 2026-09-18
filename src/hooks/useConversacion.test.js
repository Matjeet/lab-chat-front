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

/** WebSocket falso: registra instancias creadas y lo último enviado por cada una. */
class WebSocketFalso {
  constructor(url) {
    this.url = url;
    this.readyState = 0;
    WebSocketFalso.instancias.push(this);
  }

  send(datos) {
    this.ultimoEnviado = datos;
  }

  close() {
    this.readyState = 3;
  }
}
WebSocketFalso.instancias = [];

const mensaje = (overrides) => ({
  id: '1',
  remitente: 'ana',
  destinatario: 'mateo',
  contenido: 'hola',
  enviadoEn: '2026-01-01T00:00:00Z',
  ...overrides,
});

/** Monta el hook y espera a que el historial (mockeado) termine de resolver. */
const montar = async (props = { yo: 'mateo', con: 'ana' }) => {
  const utils = renderHook((p) => useConversacion(p), { initialProps: props });
  await waitFor(() => expect(utils.result.current.cargandoHistorial).toBe(false));
  return utils;
};

beforeEach(() => {
  WebSocketFalso.instancias = [];
  global.WebSocket = WebSocketFalso;
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

  it('abre un WebSocket a /ws/chat/{yo}', async () => {
    await montar();

    expect(WebSocketFalso.instancias).toHaveLength(1);
    expect(WebSocketFalso.instancias[0].url).toBe('ws://localhost:8082/ws/chat/mateo');
  });

  it('"conectado" pasa a true cuando el socket abre, y a false al cerrarse', async () => {
    const { result } = await montar();
    expect(result.current.conectado).toBe(false);

    act(() => WebSocketFalso.instancias[0].onopen());
    expect(result.current.conectado).toBe(true);

    act(() => WebSocketFalso.instancias[0].onclose());
    expect(result.current.conectado).toBe(false);
  });

  it('añade un mensaje de esta conversación recibido por el socket', async () => {
    const { result } = await montar();

    act(() => {
      WebSocketFalso.instancias[0].onmessage({ data: JSON.stringify(mensaje()) });
    });

    expect(result.current.mensajes).toHaveLength(1);
    expect(result.current.mensajes[0].contenido).toBe('hola');
  });

  it('ignora un mensaje de un tercero ajeno a esta conversación', async () => {
    const { result } = await montar();

    act(() => {
      WebSocketFalso.instancias[0].onmessage({
        data: JSON.stringify(mensaje({ remitente: 'carlos', destinatario: 'mateo' })),
      });
    });

    expect(result.current.mensajes).toHaveLength(0);
  });

  it('no duplica un mensaje con el mismo id', async () => {
    const { result } = await montar();
    const frame = { data: JSON.stringify(mensaje()) };

    act(() => {
      WebSocketFalso.instancias[0].onmessage(frame);
      WebSocketFalso.instancias[0].onmessage(frame);
    });

    expect(result.current.mensajes).toHaveLength(1);
  });

  it('enviarMensaje valida antes de mandar: un mensaje vacío no llega al socket', async () => {
    const { result } = await montar();

    const resultado = result.current.enviarMensaje('   ');

    expect(resultado.ok).toBe(false);
    expect(WebSocketFalso.instancias[0].ultimoEnviado).toBeUndefined();
  });

  it('enviarMensaje manda el frame correcto por el socket', async () => {
    const { result } = await montar();

    const resultado = result.current.enviarMensaje('Hola!');

    expect(resultado).toEqual({ ok: true });
    expect(JSON.parse(WebSocketFalso.instancias[0].ultimoEnviado)).toEqual({
      destinatario: 'ana',
      contenido: 'Hola!',
    });
  });

  it('cierra el socket al desmontarse', async () => {
    const { unmount } = await montar();
    const cerrarSpy = jest.spyOn(WebSocketFalso.instancias[0], 'close');

    unmount();

    expect(cerrarSpy).toHaveBeenCalled();
  });

  it('cambiar de interlocutor sin cambiar "yo" no reabre el socket, pero sí cambia el filtro', async () => {
    const { result, rerender } = await montar({ yo: 'mateo', con: 'ana' });

    rerender({ yo: 'mateo', con: 'carlos' });
    await waitFor(() =>
      expect(obtenerHistorial).toHaveBeenLastCalledWith('mateo', 'carlos', {
        size: 50,
        sort: 'enviadoEn,desc',
      }),
    );

    expect(WebSocketFalso.instancias).toHaveLength(1); // mismo socket, no se reabrió

    act(() => {
      WebSocketFalso.instancias[0].onmessage({
        data: JSON.stringify(mensaje({ remitente: 'carlos', destinatario: 'mateo' })),
      });
    });

    expect(result.current.mensajes.some((m) => m.remitente === 'carlos')).toBe(true);
  });
});
