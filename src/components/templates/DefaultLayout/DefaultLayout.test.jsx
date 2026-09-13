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
});
