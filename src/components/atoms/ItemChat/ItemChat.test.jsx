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
});
