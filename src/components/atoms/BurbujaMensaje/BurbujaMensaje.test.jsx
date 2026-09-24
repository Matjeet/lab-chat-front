import { render, screen } from '@testing-library/react';

import BurbujaMensaje from './BurbujaMensaje';

describe('BurbujaMensaje', () => {
  it('muestra el contenido y la hora', () => {
    render(<BurbujaMensaje contenido="Hola!" enviadoEn="2026-01-01T15:30:00Z" />);
    expect(screen.getByText('Hola!')).toBeInTheDocument();
    expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument();
  });

  it('sin `propio`, no lleva la clase de mensaje propio', () => {
    const { container } = render(
      <BurbujaMensaje contenido="Hola!" enviadoEn="2026-01-01T15:30:00Z" />,
    );
    expect(container.querySelector('li').className).not.toMatch(/propio/);
  });

  it('con `propio`, se marca como tal', () => {
    const { container } = render(
      <BurbujaMensaje contenido="Hola!" enviadoEn="2026-01-01T15:30:00Z" propio />,
    );
    expect(container.querySelector('li').className).toMatch(/propio/);
  });
});
