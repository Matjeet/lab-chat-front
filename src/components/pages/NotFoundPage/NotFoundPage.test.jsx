import { render, screen } from '@testing-library/react';

import NotFoundPage from './NotFoundPage';

describe('NotFoundPage', () => {
  it('muestra el título de la pantalla y el código 404', () => {
    render(<NotFoundPage />);
    expect(
      screen.getByRole('heading', { name: 'Página no encontrada' }),
    ).toBeInTheDocument();
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('ofrece un enlace para volver al inicio', () => {
    render(<NotFoundPage />);
    expect(screen.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute(
      'href',
      '/',
    );
  });

  it('incluye la ilustración como decorativa (alt vacío)', () => {
    // alt="" hace que el <img> tenga role "presentation": no se busca por
    // role "img", se comprueba directo en el DOM.
    const { container } = render(<NotFoundPage />);
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('src', '/not-found.svg');
    expect(img).toHaveAttribute('alt', '');
  });
});
