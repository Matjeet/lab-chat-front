import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Notificaciones from './Notificaciones';

describe('Notificaciones', () => {
  it('empieza cerrada', () => {
    render(<Notificaciones />);
    expect(screen.getByRole('button', { name: 'Notificaciones' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('abre el panel al pulsar la campana, con el estado vacío', async () => {
    const user = userEvent.setup();
    render(<Notificaciones />);

    await user.click(screen.getByRole('button', { name: 'Notificaciones' }));

    const panel = screen.getByRole('dialog', { name: 'Notificaciones' });
    expect(panel).toHaveTextContent('No tienes notificaciones por ahora.');
    expect(screen.getByRole('button', { name: 'Notificaciones' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('cierra el panel al volver a pulsar la campana', async () => {
    const user = userEvent.setup();
    render(<Notificaciones />);
    const campana = screen.getByRole('button', { name: 'Notificaciones' });

    await user.click(campana);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(campana);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('cierra el panel al pulsar Escape', async () => {
    const user = userEvent.setup();
    render(<Notificaciones />);

    await user.click(screen.getByRole('button', { name: 'Notificaciones' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('cierra el panel al hacer clic fuera', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <Notificaciones />
        <button type="button">Fuera</button>
      </div>,
    );

    await user.click(screen.getByRole('button', { name: 'Notificaciones' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Fuera' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('no se cierra al hacer clic dentro del panel', async () => {
    const user = userEvent.setup();
    render(<Notificaciones />);

    await user.click(screen.getByRole('button', { name: 'Notificaciones' }));
    await user.click(screen.getByText('No tienes notificaciones por ahora.'));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
