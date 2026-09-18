import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Conversacion from './Conversacion';

const MENSAJES = [
  {
    id: '1',
    remitente: 'mateo',
    destinatario: 'ana',
    contenido: 'Hola!',
    enviadoEn: '2026-01-01T10:00:00Z',
  },
  {
    id: '2',
    remitente: 'ana',
    destinatario: 'mateo',
    contenido: 'Hola, qué tal?',
    enviadoEn: '2026-01-01T10:01:00Z',
  },
];

describe('Conversacion', () => {
  it('muestra el nombre de con quién se habla y los mensajes', () => {
    render(
      <Conversacion yo="mateo" con="ana" mensajes={MENSAJES} conectado onEnviar={jest.fn()} />,
    );

    expect(screen.getByText('ana')).toBeInTheDocument();
    expect(screen.getByText('Hola!')).toBeInTheDocument();
    expect(screen.getByText('Hola, qué tal?')).toBeInTheDocument();
  });

  it('sin mensajes, muestra un aviso de conversación vacía', () => {
    render(<Conversacion yo="mateo" con="ana" mensajes={[]} conectado onEnviar={jest.fn()} />);
    expect(screen.getByText(/todavía no hay mensajes/i)).toBeInTheDocument();
  });

  it('conectado, no muestra el aviso de "sin conexión" y deja escribir', () => {
    render(
      <Conversacion yo="mateo" con="ana" mensajes={[]} conectado onEnviar={jest.fn()} />,
    );
    expect(screen.queryByText(/sin conexión/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText('Mensaje')).toBeEnabled();
  });

  it('desconectado, avisa y deshabilita el campo de escritura', () => {
    render(
      <Conversacion yo="mateo" con="ana" mensajes={[]} conectado={false} onEnviar={jest.fn()} />,
    );
    expect(screen.getByText(/sin conexión/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Mensaje')).toBeDisabled();
  });

  it('delega el envío en onEnviar', async () => {
    const user = userEvent.setup();
    const onEnviar = jest.fn().mockReturnValue({ ok: true });
    render(
      <Conversacion yo="mateo" con="ana" mensajes={[]} conectado onEnviar={onEnviar} />,
    );

    await user.type(screen.getByLabelText('Mensaje'), 'Hola!');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(onEnviar).toHaveBeenCalledWith('Hola!');
  });
});
