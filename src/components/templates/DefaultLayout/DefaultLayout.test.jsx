import { render, screen } from '@testing-library/react';

import DefaultLayout from './DefaultLayout';

describe('DefaultLayout', () => {
  it('coloca el título en la cabecera', () => {
    render(
      <DefaultLayout title="Chat">
        <p>Contenido</p>
      </DefaultLayout>,
    );
    expect(screen.getByRole('heading', { name: 'Chat' })).toBeInTheDocument();
  });

  it('renderiza el contenido hijo dentro del main', () => {
    render(
      <DefaultLayout title="Chat">
        <p>Contenido de prueba</p>
      </DefaultLayout>,
    );
    const main = screen.getByRole('main');
    expect(main).toHaveTextContent('Contenido de prueba');
  });

  it('sin `centered` no envuelve el contenido en una tarjeta centrada', () => {
    render(
      <DefaultLayout title="Chat">
        <p>Contenido</p>
      </DefaultLayout>,
    );
    expect(screen.getByRole('main').firstElementChild.tagName).toBe('P');
  });

  it('con `centered` envuelve el contenido para centrarlo en la pantalla', () => {
    render(
      <DefaultLayout title="Chat" centered>
        <p>Contenido</p>
      </DefaultLayout>,
    );
    const main = screen.getByRole('main');
    expect(main).toHaveTextContent('Contenido');
    // El contenido queda dentro de un contenedor extra (la tarjeta centrada),
    // no como hijo directo del <p> del main.
    expect(main.firstElementChild.tagName).not.toBe('P');
    expect(main.firstElementChild).toContainElement(screen.getByText('Contenido'));
  });

  it('sin `tarjeta` no dibuja el patrón de burbujas', () => {
    const { container } = render(
      <DefaultLayout title="Chat" centered>
        <p>Contenido</p>
      </DefaultLayout>,
    );
    expect(container.querySelector('svg[aria-hidden="true"]')).not.toBeInTheDocument();
  });

  it('con `centered` y `tarjeta` monta el fondo de burbujas', () => {
    const { container } = render(
      <DefaultLayout title="Chat" centered tarjeta>
        <p>Contenido</p>
      </DefaultLayout>,
    );
    expect(container.querySelector('svg[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('muestra el pie de página', () => {
    render(
      <DefaultLayout title="Chat">
        <p>Contenido</p>
      </DefaultLayout>,
    );
    expect(screen.getByRole('contentinfo')).toHaveTextContent('Proyecto Chat');
  });

  it('pasa `headerCentro` al centro de la cabecera', () => {
    render(
      <DefaultLayout title="Chat" headerCentro={<input aria-label="Chatear con" />}>
        <p>Contenido</p>
      </DefaultLayout>,
    );
    expect(screen.getByLabelText('Chatear con')).toBeInTheDocument();
  });

  it('sin `altoCompleto`, no fija el alto de pantalla ni el scroll interno', () => {
    const { container } = render(
      <DefaultLayout title="Chat">
        <p>Contenido</p>
      </DefaultLayout>,
    );
    expect(container.firstChild.className).not.toMatch(/altoCompleto/i);
    expect(screen.getByRole('main').className).not.toMatch(/altoCompleto/i);
  });

  it('con `altoCompleto`, fija el layout al alto de pantalla y el scroll interno del contenido', () => {
    const { container } = render(
      <DefaultLayout title="Chat" altoCompleto>
        <p>Contenido</p>
      </DefaultLayout>,
    );
    expect(container.firstChild.className).toMatch(/layoutAltoCompleto/);
    expect(screen.getByRole('main').className).toMatch(/contentAltoCompleto/);
  });

  it('el fondo de burbujas cubre toda la pantalla, no solo el contenido', () => {
    const { container } = render(
      <DefaultLayout title="Chat" centered tarjeta>
        <p>Contenido</p>
      </DefaultLayout>,
    );
    const svg = container.querySelector('svg[aria-hidden="true"]');
    const main = screen.getByRole('main');

    // Va fuera del <main> (hermano de la cabecera, el contenido y el pie),
    // no recortado dentro del área de contenido.
    expect(main.contains(svg)).toBe(false);
    expect(container.firstChild).toContainElement(svg);
  });
});
