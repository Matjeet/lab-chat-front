import { act, renderHook } from '@testing-library/react';

import useCanalMensajes from './useCanalMensajes';

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

beforeEach(() => {
  WebSocketFalso.instancias = [];
  global.WebSocket = WebSocketFalso;
});

afterEach(() => {
  jest.clearAllMocks();
  jest.useRealTimers();
});

describe('useCanalMensajes', () => {
  it('sin "yo", no abre ningún socket', () => {
    const { result } = renderHook(() => useCanalMensajes(''));

    expect(WebSocketFalso.instancias).toHaveLength(0);
    expect(result.current.conectado).toBe(false);
    expect(result.current.ultimoMensaje).toBeNull();
  });

  it('abre un WebSocket a /ws/chat/{yo}', () => {
    renderHook(() => useCanalMensajes('mateo'));

    expect(WebSocketFalso.instancias).toHaveLength(1);
    expect(WebSocketFalso.instancias[0].url).toBe('ws://localhost:8080/ws/chat/mateo');
  });

  it('"conectado" pasa a true cuando el socket abre, y a false al cerrarse', () => {
    const { result } = renderHook(() => useCanalMensajes('mateo'));
    expect(result.current.conectado).toBe(false);

    act(() => WebSocketFalso.instancias[0].onopen());
    expect(result.current.conectado).toBe(true);

    act(() => WebSocketFalso.instancias[0].onclose());
    expect(result.current.conectado).toBe(false);
  });

  it('expone en "ultimoMensaje" cualquier mensaje recibido, sin filtrar por conversación', () => {
    const { result } = renderHook(() => useCanalMensajes('mateo'));

    act(() => {
      WebSocketFalso.instancias[0].onmessage({
        data: JSON.stringify(mensaje({ remitente: 'carlos', destinatario: 'mateo' })),
      });
    });

    expect(result.current.ultimoMensaje).toEqual(mensaje({ remitente: 'carlos', destinatario: 'mateo' }));
  });

  it('cada mensaje nuevo es un objeto distinto, aunque el contenido se repita', () => {
    const { result } = renderHook(() => useCanalMensajes('mateo'));

    act(() => {
      WebSocketFalso.instancias[0].onmessage({ data: JSON.stringify(mensaje({ id: '1' })) });
    });
    const primero = result.current.ultimoMensaje;

    act(() => {
      WebSocketFalso.instancias[0].onmessage({ data: JSON.stringify(mensaje({ id: '2' })) });
    });

    expect(result.current.ultimoMensaje).not.toBe(primero);
    expect(result.current.ultimoMensaje.id).toBe('2');
  });

  it('ignora un frame que no es JSON válido', () => {
    const { result } = renderHook(() => useCanalMensajes('mateo'));

    act(() => {
      WebSocketFalso.instancias[0].onmessage({ data: 'no es json' });
    });

    expect(result.current.ultimoMensaje).toBeNull();
  });

  it('enviarMensaje valida antes de mandar: un mensaje vacío no llega al socket', () => {
    const { result } = renderHook(() => useCanalMensajes('mateo'));

    const resultado = result.current.enviarMensaje('ana', '   ');

    expect(resultado.ok).toBe(false);
    expect(WebSocketFalso.instancias[0].ultimoEnviado).toBeUndefined();
  });

  it('enviarMensaje manda el frame correcto por el socket, al destinatario indicado', () => {
    const { result } = renderHook(() => useCanalMensajes('mateo'));

    const resultado = result.current.enviarMensaje('ana', 'Hola!');

    expect(resultado).toEqual({ ok: true });
    expect(JSON.parse(WebSocketFalso.instancias[0].ultimoEnviado)).toEqual({
      destinatario: 'ana',
      contenido: 'Hola!',
    });
  });

  it('cierra el socket al desmontarse', () => {
    const { unmount } = renderHook(() => useCanalMensajes('mateo'));
    const cerrarSpy = jest.spyOn(WebSocketFalso.instancias[0], 'close');

    unmount();

    expect(cerrarSpy).toHaveBeenCalled();
  });

  it('si el socket se cierra (caída, o nunca llegó a abrir), reintenta pasado un tiempo', () => {
    renderHook(() => useCanalMensajes('mateo'));
    jest.useFakeTimers();

    act(() => {
      WebSocketFalso.instancias[0].onclose();
    });
    expect(WebSocketFalso.instancias).toHaveLength(1); // no reintenta al instante

    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(WebSocketFalso.instancias).toHaveLength(2); // reconectó solo

    act(() => {
      WebSocketFalso.instancias[1].onopen();
    });
  });

  it('sigue reintentando mientras el servidor siga caído', () => {
    const { result } = renderHook(() => useCanalMensajes('mateo'));
    jest.useFakeTimers();

    act(() => {
      WebSocketFalso.instancias[0].onclose();
    });
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    act(() => {
      WebSocketFalso.instancias[1].onclose();
    });
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(WebSocketFalso.instancias).toHaveLength(3);

    act(() => {
      WebSocketFalso.instancias[2].onopen();
    });
    expect(result.current.conectado).toBe(true);
  });

  it('cancela el reintento pendiente al desmontarse (no reconecta después)', () => {
    const { unmount } = renderHook(() => useCanalMensajes('mateo'));
    jest.useFakeTimers();

    act(() => {
      WebSocketFalso.instancias[0].onclose();
    });
    unmount();

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(WebSocketFalso.instancias).toHaveLength(1);
  });

  it('"yo" cambia (p. ej. login con otro usuario): reabre el socket', () => {
    const { rerender } = renderHook((yo) => useCanalMensajes(yo), { initialProps: 'mateo' });
    expect(WebSocketFalso.instancias).toHaveLength(1);

    rerender('ana');

    expect(WebSocketFalso.instancias).toHaveLength(2);
    expect(WebSocketFalso.instancias[1].url).toBe('ws://localhost:8080/ws/chat/ana');
  });
});
