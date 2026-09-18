import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CampoMensaje from './CampoMensaje';

describe('CampoMensaje', () => {
  it('llama a onEnviar con el texto escrito y lo limpia si sale bien', async () => {
    const user = userEvent.setup();
    const onEnviar = jest.fn().mockReturnValue({ ok: true });
    render(<CampoMensaje onEnviar={onEnviar} />);

    const campo = screen.getByLabelText('Mensaje');
    await user.type(campo, 'Hola!');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(onEnviar).toHaveBeenCalledWith('Hola!');
    expect(campo).toHaveValue('');
  });

  it('muestra el error y no limpia el campo si onEnviar rechaza', async () => {
    const user = userEvent.setup();
    const onEnviar = jest.fn().mockReturnValue({
      ok: false,
      error: { mensaje: 'Escribe un mensaje.' },
    });
    render(<CampoMensaje onEnviar={onEnviar} />);

    await user.type(screen.getByLabelText('Mensaje'), '   ');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(await screen.findByText('Escribe un mensaje.')).toBeInTheDocument();
    expect(screen.getByLabelText('Mensaje')).toHaveValue('   ');
  });

  it('el error desaparece al volver a escribir', async () => {
    const user = userEvent.setup();
    const onEnviar = jest.fn().mockReturnValue({
      ok: false,
      error: { mensaje: 'Escribe un mensaje.' },
    });
    render(<CampoMensaje onEnviar={onEnviar} />);

    await user.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(await screen.findByText('Escribe un mensaje.')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Mensaje'), 'a');
    expect(screen.queryByText('Escribe un mensaje.')).not.toBeInTheDocument();
  });

  it('deshabilita el campo y el botón cuando `disabled`', () => {
    render(<CampoMensaje onEnviar={jest.fn()} disabled />);
    expect(screen.getByLabelText('Mensaje')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeDisabled();
  });
});
