/** Osciladores/ganancias falsos: registran instancias y lo que se les pide hacer. */
class OsciladorFalso {
  constructor() {
    this.frequency = { value: 0 };
    this.type = null;
    OsciladorFalso.instancias.push(this);
  }

  connect(destino) {
    this.conectadoA = destino;
  }

  start(cuando) {
    this.iniciadoEn = cuando;
  }

  stop(cuando) {
    this.detenidoEn = cuando;
  }
}
OsciladorFalso.instancias = [];

class GananciaFalsa {
  constructor() {
    this.valoresGain = [];
    this.gain = {
      setValueAtTime: (valor, cuando) => this.valoresGain.push(['set', valor, cuando]),
      linearRampToValueAtTime: (valor, cuando) => this.valoresGain.push(['ramp', valor, cuando]),
    };
    GananciaFalsa.instancias.push(this);
  }

  connect(destino) {
    this.conectadoA = destino;
  }
}
GananciaFalsa.instancias = [];

class AudioContextFalso {
  constructor() {
    this.currentTime = 0;
    this.state = 'running';
    this.destination = {};
    this.resume = jest.fn().mockResolvedValue(undefined);
    AudioContextFalso.instancias.push(this);
  }

  createOscillator() {
    return new OsciladorFalso();
  }

  createGain() {
    return new GananciaFalsa();
  }
}
AudioContextFalso.instancias = [];

/** Recarga el módulo desde cero: su `AudioContext` cacheado es estado de módulo. */
const cargarSonidos = () => {
  jest.resetModules();
  // eslint-disable-next-line global-require -- recarga intencional del módulo bajo prueba
  return require('./sonidosMensajes');
};

beforeEach(() => {
  OsciladorFalso.instancias = [];
  GananciaFalsa.instancias = [];
  AudioContextFalso.instancias = [];
});

afterEach(() => {
  delete window.AudioContext;
  jest.clearAllMocks();
});

describe('sonidosMensajes', () => {
  it('sin AudioContext disponible, no lanza al reproducir', () => {
    delete window.AudioContext;
    const { reproducirSonidoEnviado, reproducirSonidoRecibido } = cargarSonidos();

    expect(() => reproducirSonidoEnviado()).not.toThrow();
    expect(() => reproducirSonidoRecibido()).not.toThrow();
  });

  it('reproducirSonidoEnviado toca un único tono', () => {
    window.AudioContext = AudioContextFalso;
    const { reproducirSonidoEnviado } = cargarSonidos();

    reproducirSonidoEnviado();

    expect(OsciladorFalso.instancias).toHaveLength(1);
    expect(OsciladorFalso.instancias[0].frequency.value).toBe(880);
    expect(OsciladorFalso.instancias[0].iniciadoEn).toBeDefined();
  });

  it('reproducirSonidoRecibido toca dos tonos distintos (más llamativo)', () => {
    window.AudioContext = AudioContextFalso;
    const { reproducirSonidoRecibido } = cargarSonidos();

    reproducirSonidoRecibido();

    expect(OsciladorFalso.instancias).toHaveLength(2);
    const frecuencias = OsciladorFalso.instancias.map((o) => o.frequency.value);
    expect(frecuencias).toEqual([587, 784]);
  });

  it('el tono de enviado y el de recibido usan frecuencias distintas', () => {
    window.AudioContext = AudioContextFalso;
    const { reproducirSonidoEnviado, reproducirSonidoRecibido } = cargarSonidos();

    reproducirSonidoEnviado();
    const frecuenciaEnviado = OsciladorFalso.instancias[0].frequency.value;

    reproducirSonidoRecibido();
    const frecuenciasRecibido = OsciladorFalso.instancias.slice(1).map((o) => o.frequency.value);

    expect(frecuenciasRecibido).not.toContain(frecuenciaEnviado);
  });

  it('reutiliza el mismo AudioContext entre llamadas, no crea uno nuevo cada vez', () => {
    window.AudioContext = AudioContextFalso;
    const { reproducirSonidoEnviado, reproducirSonidoRecibido } = cargarSonidos();

    reproducirSonidoEnviado();
    reproducirSonidoRecibido();
    reproducirSonidoEnviado();

    expect(AudioContextFalso.instancias).toHaveLength(1);
  });

  it('si el contexto está suspendido (política de autoplay), lo reanuda', () => {
    window.AudioContext = AudioContextFalso;
    const { reproducirSonidoEnviado } = cargarSonidos();

    reproducirSonidoEnviado(); // crea el contexto (state: 'running' por defecto)
    AudioContextFalso.instancias[0].state = 'suspended';

    reproducirSonidoEnviado(); // segunda llamada: debe detectar 'suspended' y reanudar

    expect(AudioContextFalso.instancias[0].resume).toHaveBeenCalled();
  });

  it('conecta oscilador -> ganancia -> destino', () => {
    window.AudioContext = AudioContextFalso;
    const { reproducirSonidoEnviado } = cargarSonidos();

    reproducirSonidoEnviado();

    const oscilador = OsciladorFalso.instancias[0];
    const ganancia = GananciaFalsa.instancias[0];
    expect(oscilador.conectadoA).toBe(ganancia);
    expect(ganancia.conectadoA).toBe(AudioContextFalso.instancias[0].destination);
  });
});
