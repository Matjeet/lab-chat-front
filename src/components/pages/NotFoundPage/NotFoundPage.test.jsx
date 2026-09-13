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

  it('incluye la ilustración como decorativa', () => {
    const { container } = render(<NotFoundPage />);
    expect(container.querySelector('svg[aria-hidden="true"]')).toBeInTheDocument();
  });
});
