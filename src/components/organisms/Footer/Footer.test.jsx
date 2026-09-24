import { render, screen } from '@testing-library/react';

import Footer from './Footer';

describe('Footer', () => {
  it('muestra la marca del proyecto', () => {
    render(<Footer />);
    expect(screen.getByText('Proyecto Chat')).toBeInTheDocument();
  });

  it('muestra el copyright con el año actual', () => {
    render(<Footer />);
    const anioActual = new Date().getFullYear();
    expect(screen.getByText(`© ${anioActual}`)).toBeInTheDocument();
  });
});
