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
});
