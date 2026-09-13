import { render, screen } from '@testing-library/react';

import TextoAleatorio from './TextoAleatorio';

describe('TextoAleatorio', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('con una sola opción, la muestra tal cual', () => {
    render(<TextoAleatorio opciones={['Única frase.']} />);
    expect(screen.getByText('Única frase.')).toBeInTheDocument();
  });

  it('al montar, muestra una de las frases recibidas', () => {
    const opciones = ['Frase uno.', 'Frase dos.', 'Frase tres.'];
    render(<TextoAleatorio opciones={opciones} />);

    const parrafo = screen.getByText((contenido) => opciones.includes(contenido));
    expect(parrafo).toBeInTheDocument();
  });

  it('respeta el azar: distintos valores de Math.random eligen distinta frase', () => {
    const opciones = ['Frase uno.', 'Frase dos.', 'Frase tres.'];

    jest.spyOn(Math, 'random').mockReturnValue(0);
    const { unmount } = render(<TextoAleatorio opciones={opciones} />);
    expect(screen.getByText('Frase uno.')).toBeInTheDocument();
    unmount();

    jest.spyOn(Math, 'random').mockReturnValue(0.99);
    render(<TextoAleatorio opciones={opciones} />);
    expect(screen.getByText('Frase tres.')).toBeInTheDocument();
  });

  it('aplica la clase recibida al párrafo', () => {
    render(<TextoAleatorio opciones={['Frase.']} className="mi-clase" />);
    expect(screen.getByText('Frase.')).toHaveClass('mi-clase');
  });
});
