import { render, screen } from '@testing-library/react';

import CargandoSesion from './CargandoSesion';

describe('CargandoSesion', () => {
  it('muestra el aviso de comprobación de sesión', () => {
    render(<CargandoSesion />);
    expect(screen.getByText('Comprobando sesión…')).toBeInTheDocument();
  });

  it('usa "Chat" como título de página (accesible, no visible)', () => {
    render(<CargandoSesion />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Chat' }),
    ).toBeInTheDocument();
  });
});
