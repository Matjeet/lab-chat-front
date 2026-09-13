import { render, screen } from '@testing-library/react';

import LoginPage from './LoginPage';

const FRASES_INTRO = [
  'Un chat simple para hablar con tus amigos y conocidos.',
  'Habla con quien quieras, cuando quieras.',
  'Tu gente, siempre a un mensaje de distancia.',
  'Conversaciones sin complicaciones, con la gente que ya conoces.',
  'Un lugar para seguir la conversación con tus amigos.',
];

describe('LoginPage', () => {
  it('muestra una de las frases de bienvenida al azar', () => {
    render(<LoginPage />);
    expect(
      screen.getByText((contenido) => FRASES_INTRO.includes(contenido)),
    ).toBeInTheDocument();
  });

  it('muestra el formulario de inicio de sesión', () => {
    render(<LoginPage />);
    expect(
      screen.getByRole('heading', { name: 'Iniciar sesión' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
  });

  it('ofrece un enlace para crear una cuenta', () => {
    render(<LoginPage />);
    expect(screen.getByRole('link', { name: 'Crear una cuenta' })).toHaveAttribute(
      'href',
      '/registro',
    );
  });
});
