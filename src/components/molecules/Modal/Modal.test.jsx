import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Modal from './Modal';

describe('Modal', () => {
  it('muestra título y mensaje dentro de un alertdialog', () => {
    render(<Modal titulo="Usuario no encontrado" mensaje="Ese usuario no existe." onCerrar={() => {}} />);

    const dialogo = screen.getByRole('alertdialog', { name: 'Usuario no encontrado' });
    expect(dialogo).toHaveTextContent('Ese usuario no existe.');
  });

  it('sin tono, usa "error" por defecto (título genérico y botón danger)', () => {
    render(<Modal mensaje="Algo falló." onCerrar={() => {}} />);
    expect(screen.getByRole('alertdialog', { name: 'Ha ocurrido un error' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entendido' })).toHaveClass('danger');
  });

  it('con tono "info", usa un título genérico distinto y el botón primary', () => {
    render(<Modal tono="info" mensaje="Ya tienes una solicitud pendiente." onCerrar={() => {}} />);
    expect(screen.getByRole('alertdialog', { name: 'Aviso' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entendido' })).toHaveClass('primary');
  });

  it('acepta un mensaje con contenido enriquecido (JSX), no solo texto', () => {
    render(
      <Modal
        tono="info"
        titulo="Solicitud enviada"
        mensaje={
          <>
            Solicitud enviada a <strong>ana</strong>.
          </>
        }
        onCerrar={() => {}}
      />,
    );
    const dialogo = screen.getByRole('alertdialog', { name: 'Solicitud enviada' });
    expect(dialogo.querySelector('strong')).toHaveTextContent('ana');
  });

  it('mueve el foco al diálogo al montarse', () => {
    render(<Modal mensaje="Algo falló." onCerrar={() => {}} />);
    expect(screen.getByRole('alertdialog')).toHaveFocus();
  });

  it('llama a onCerrar al pulsar el botón de confirmación', async () => {
    const onCerrar = jest.fn();
    const user = userEvent.setup();
    render(<Modal mensaje="Algo falló." onCerrar={onCerrar} />);

    await user.click(screen.getByRole('button', { name: 'Entendido' }));
    expect(onCerrar).toHaveBeenCalledTimes(1);
  });

  it('acepta un texto de botón distinto', () => {
    render(<Modal mensaje="Algo falló." onCerrar={() => {}} textoBoton="Reintentar" />);
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });

  it('llama a onCerrar al pulsar Escape', async () => {
    const onCerrar = jest.fn();
    const user = userEvent.setup();
    render(<Modal mensaje="Algo falló." onCerrar={onCerrar} />);

    await user.keyboard('{Escape}');
    expect(onCerrar).toHaveBeenCalledTimes(1);
  });

  it('llama a onCerrar al hacer clic en el fondo', async () => {
    const onCerrar = jest.fn();
    const user = userEvent.setup();
    const { container } = render(<Modal mensaje="Algo falló." onCerrar={onCerrar} />);

    await user.click(container.firstChild);
    expect(onCerrar).toHaveBeenCalledTimes(1);
  });

  it('no llama a onCerrar al hacer clic dentro del diálogo', async () => {
    const onCerrar = jest.fn();
    const user = userEvent.setup();
    render(<Modal titulo="Título" mensaje="Algo falló." onCerrar={onCerrar} />);

    await user.click(screen.getByText('Algo falló.'));
    expect(onCerrar).not.toHaveBeenCalled();
  });

  it('devuelve el foco al elemento que lo tenía antes, al desmontarse', () => {
    const boton = document.createElement('button');
    document.body.appendChild(boton);
    boton.focus();

    const { unmount } = render(<Modal mensaje="Algo falló." onCerrar={() => {}} />);
    expect(boton).not.toHaveFocus();

    unmount();
    expect(boton).toHaveFocus();

    boton.remove();
  });
});
