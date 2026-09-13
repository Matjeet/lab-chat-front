import { render, screen } from '@testing-library/react';

import Header from './Header';

describe('Header', () => {
  it('muestra el título como encabezado de nivel 1', () => {
    render(<Header title="Chat" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Chat' })).toBeInTheDocument();
  });

  it('renderiza las acciones cuando se pasan', () => {
    render(<Header title="Chat" actions={<button type="button">Salir</button>} />);
    expect(screen.getByRole('button', { name: 'Salir' })).toBeInTheDocument();
  });

  it('no renderiza navegación si no hay acciones', () => {
    render(<Header title="Chat" />);
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('muestra el logo y el nombre de la app, enlazando a /', () => {
    render(<Header title="Iniciar sesión" />);
    const enlace = screen.getByRole('link', { name: 'Chat' });
    expect(enlace).toHaveAttribute('href', '/');
    expect(enlace.querySelector('img')).toHaveAttribute('src', '/chat-logo.webp');
  });
});
