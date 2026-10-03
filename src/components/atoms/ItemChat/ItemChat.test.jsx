import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ItemChat from './ItemChat';

describe('ItemChat', () => {
  it('muestra el otro usuario y el contenido del último mensaje', () => {
    render(
      <ItemChat otroUsuario="ana" ultimoMensaje={{ contenido: 'Hola!' }} onClick={jest.fn()} />,
    );
    expect(screen.getByText('ana')).toBeInTheDocument();
    expect(screen.getByText('Hola!')).toBeInTheDocument();
  });

  it('llama a onClick al hacer click', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(<ItemChat otroUsuario="ana" ultimoMensaje={{ contenido: 'Hola!' }} onClick={onClick} />);

    await user.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('marca aria-current cuando es el chat activo', () => {
    render(
      <ItemChat
        otroUsuario="ana"
        ultimoMensaje={{ contenido: 'Hola!' }}
        activo
        onClick={jest.fn()}
      />,
    );
    expect(screen.getByRole('button')).toHaveAttribute('aria-current', 'true');
  });

  it('no marca aria-current cuando no es el chat activo', () => {
    render(
      <ItemChat otroUsuario="ana" ultimoMensaje={{ contenido: 'Hola!' }} onClick={jest.fn()} />,
    );
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-current');
  });

  it('muestra el avatar recibido a la izquierda del nombre', () => {
    render(
      <ItemChat
        otroUsuario="ana"
        ultimoMensaje={{ contenido: 'Hola!' }}
        avatar={<span data-testid="avatar" />}
        onClick={jest.fn()}
      />,
    );

    const avatar = screen.getByTestId('avatar');
    const nombre = screen.getByText('ana');
    // eslint-disable-next-line no-bitwise
    expect(nombre.compareDocumentPosition(avatar) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
  });

  it('sin avatar, no reserva hueco para él', () => {
    const { container } = render(
      <ItemChat otroUsuario="ana" ultimoMensaje={{ contenido: 'Hola!' }} onClick={jest.fn()} />,
    );
    expect(container.querySelectorAll('button > span')).toHaveLength(1); // solo el bloque de texto
  });
});
