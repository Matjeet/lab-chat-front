import { render, screen } from '@testing-library/react';

import StyleGuidePage from './StyleGuidePage';

describe('StyleGuidePage', () => {
  it('muestra las secciones del sistema de diseño', () => {
    render(<StyleGuidePage />);
    expect(
      screen.getByRole('heading', { name: 'Sistema de diseño' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Colores' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Botones' })).toBeInTheDocument();
  });

  it('renderiza las variantes de Button', () => {
    render(<StyleGuidePage />);
    expect(screen.getByRole('button', { name: 'Primary' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Danger' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Disabled' })).toBeDisabled();
  });
});
