import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ModalError from './ModalError';

describe('ModalError', () => {
  it('muestra título y mensaje dentro de un alertdialog', () => {
    render(<ModalError titulo="Usuario no encontrado" mensaje="Ese usuario no existe." onCerrar={() => {}} />);

    const dialogo = screen.getByRole('alertdialog', { name: 'Usuario no encontrado' });
    expect(dialogo).toHaveTextContent('Ese usuario no existe.');
  });

  it('usa el título por defecto si no se indica uno', () => {
    render(<ModalError mensaje="Algo falló." onCerrar={() => {}} />);
    expect(screen.getByRole('alertdialog', { name: 'Ha ocurrido un error' })).toBeInTheDocument();
  });

  it('mueve el foco al diálogo al montarse', () => {
    render(<ModalError mensaje="Algo falló." onCerrar={() => {}} />);
    expect(screen.getByRole('alertdialog')).toHaveFocus();
  });

  it('llama a onCerrar al pulsar el botón de confirmación', async () => {
    const onCerrar = jest.fn();
    const user = userEvent.setup();
    render(<ModalError mensaje="Algo falló." onCerrar={onCerrar} />);

    await user.click(screen.getByRole('button', { name: 'Entendido' }));
    expect(onCerrar).toHaveBeenCalledTimes(1);
  });

  it('acepta un texto de botón distinto', () => {
    render(<ModalError mensaje="Algo falló." onCerrar={() => {}} textoBoton="Reintentar" />);
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });

  it('llama a onCerrar al pulsar Escape', async () => {
    const onCerrar = jest.fn();
    const user = userEvent.setup();
    render(<ModalError mensaje="Algo falló." onCerrar={onCerrar} />);

    await user.keyboard('{Escape}');
    expect(onCerrar).toHaveBeenCalledTimes(1);
  });

  it('llama a onCerrar al hacer clic en el fondo', async () => {
    const onCerrar = jest.fn();
    const user = userEvent.setup();
    const { container } = render(<ModalError mensaje="Algo falló." onCerrar={onCerrar} />);

    await user.click(container.firstChild);
    expect(onCerrar).toHaveBeenCalledTimes(1);
  });

  it('no llama a onCerrar al hacer clic dentro del diálogo', async () => {
    const onCerrar = jest.fn();
    const user = userEvent.setup();
    render(<ModalError titulo="Título" mensaje="Algo falló." onCerrar={onCerrar} />);

    await user.click(screen.getByText('Algo falló.'));
    expect(onCerrar).not.toHaveBeenCalled();
  });

  it('devuelve el foco al elemento que lo tenía antes, al desmontarse', () => {
    const boton = document.createElement('button');
    document.body.appendChild(boton);
    boton.focus();

    const { unmount } = render(<ModalError mensaje="Algo falló." onCerrar={() => {}} />);
    expect(boton).not.toHaveFocus();

    unmount();
    expect(boton).toHaveFocus();

    boton.remove();
  });
});
