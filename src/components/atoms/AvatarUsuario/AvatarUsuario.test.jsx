import { render, screen } from '@testing-library/react';

import AvatarUsuario from './AvatarUsuario';

describe('AvatarUsuario', () => {
  it('sin avatar ni username, no pinta nada', () => {
    const { container } = render(<AvatarUsuario />);
    expect(container).toBeEmptyDOMElement();
  });

  it('sin avatar, con username, cae al automático (solo el nombre)', () => {
    const { container } = render(<AvatarUsuario username="mateo" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(screen.getByTitle('Avatar de mateo')).toBeInTheDocument();
  });

  it('con un enlace http(s), pinta una imagen en vez de un Blobatar', () => {
    const url = 'https://cdn.example.com/avatares/mateo.png';
    const { container } = render(<AvatarUsuario avatar={url} username="mateo" />);

    const imagen = container.querySelector('img');
    expect(imagen).toHaveAttribute('src', url);
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  it('con una etiqueta <Blobatar .../> personalizada, la respeta (no el username suelto)', () => {
    render(
      <AvatarUsuario
        avatar='<Blobatar name="ana" shape="sun" hue="200" tone="0.5" expression="happy" />'
        username="mateo"
      />,
    );

    // El `name` de la etiqueta guardada manda, no el `username` por prop
    // (puede haber cambiado desde que se guardó el avatar).
    expect(screen.getByTitle('Avatar de ana')).toBeInTheDocument();
  });

  it('con una etiqueta sin personalización, equivale al automático de ese name', () => {
    render(<AvatarUsuario avatar='<Blobatar name="ana" />' username="mateo" />);

    expect(screen.getByTitle('Avatar de ana')).toBeInTheDocument();
  });
});
