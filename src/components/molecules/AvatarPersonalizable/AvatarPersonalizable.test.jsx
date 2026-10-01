import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import AvatarPersonalizable from './AvatarPersonalizable';

const montar = (username = 'mateo') => {
  const onCambiarAvatar = jest.fn();
  const utils = render(<AvatarPersonalizable username={username} onCambiarAvatar={onCambiarAvatar} />);
  return { onCambiarAvatar, ...utils };
};

describe('AvatarPersonalizable', () => {
  it('el botón de personalizar aparece antes que el avatar (arriba, visualmente)', () => {
    montar();
    const boton = screen.getByRole('button', { name: 'Personalizar avatar' });

    // El siguiente hermano del botón es el envoltorio del avatar, no el
    // propio botón (que también trae un <svg>, el icono de ajustes) —
    // comprobar el hermano evita confundir uno con otro.
    const siguienteHermano = boton.nextElementSibling;
    expect(siguienteHermano.querySelector('img, svg')).toBeTruthy();
  });

  it('al montar, avisa con el avatar automático (solo el username)', () => {
    const { onCambiarAvatar } = montar('mateo');
    expect(onCambiarAvatar).toHaveBeenCalledWith('<Blobatar name="mateo" />');
  });

  it('si cambia el username, avisa de nuevo con el avatar automático actualizado', () => {
    const onCambiarAvatar = jest.fn();
    const { rerender } = render(
      <AvatarPersonalizable username="mateo" onCambiarAvatar={onCambiarAvatar} />,
    );

    rerender(<AvatarPersonalizable username="ana" onCambiarAvatar={onCambiarAvatar} />);

    expect(onCambiarAvatar).toHaveBeenLastCalledWith('<Blobatar name="ana" />');
  });

  it('el panel de personalización empieza cerrado', () => {
    montar();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('al abrir el panel, siembra los cuatro controles con los valores por defecto y avisa con esa etiqueta', async () => {
    const user = userEvent.setup();
    const { onCambiarAvatar } = montar('mateo');

    await user.click(screen.getByRole('button', { name: 'Personalizar avatar' }));

    expect(screen.getByRole('dialog', { name: 'Personalizar avatar' })).toBeInTheDocument();
    expect(screen.getByLabelText('Forma')).toHaveValue('round');
    expect(screen.getByLabelText('Color')).toHaveValue('200');
    expect(screen.getByLabelText('Tono')).toHaveValue('0.5');
    expect(screen.getByLabelText('Emoción')).toHaveValue('idle');
    expect(onCambiarAvatar).toHaveBeenLastCalledWith(
      '<Blobatar name="mateo" shape="round" hue="200" tone="0.5" expression="idle" />',
    );
  });

  it('volver a pulsar el botón cierra el panel sin perder la personalización', async () => {
    const user = userEvent.setup();
    montar();
    const boton = screen.getByRole('button', { name: 'Personalizar avatar' });

    await user.click(boton);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(boton);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('cierra el panel al pulsar Escape', async () => {
    const user = userEvent.setup();
    montar();

    await user.click(screen.getByRole('button', { name: 'Personalizar avatar' }));
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('cierra el panel al hacer clic fuera', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <AvatarPersonalizable username="mateo" onCambiarAvatar={jest.fn()} />
        <button type="button">Fuera</button>
      </div>,
    );

    await user.click(screen.getByRole('button', { name: 'Personalizar avatar' }));
    await user.click(screen.getByRole('button', { name: 'Fuera' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('cambiar la forma actualiza la vista previa y la etiqueta avisada', async () => {
    const user = userEvent.setup();
    const { onCambiarAvatar } = montar('mateo');

    await user.click(screen.getByRole('button', { name: 'Personalizar avatar' }));
    await user.selectOptions(screen.getByLabelText('Forma'), 'sun');

    expect(onCambiarAvatar).toHaveBeenLastCalledWith(
      '<Blobatar name="mateo" shape="sun" hue="200" tone="0.5" expression="idle" />',
    );
  });

  it('cambiar la emoción actualiza la etiqueta avisada', async () => {
    const user = userEvent.setup();
    const { onCambiarAvatar } = montar('mateo');

    await user.click(screen.getByRole('button', { name: 'Personalizar avatar' }));
    await user.selectOptions(screen.getByLabelText('Emoción'), 'happy');

    expect(onCambiarAvatar).toHaveBeenLastCalledWith(
      '<Blobatar name="mateo" shape="round" hue="200" tone="0.5" expression="happy" />',
    );
  });

  // jsdom no simula el paso nativo de flecha-de-teclado sobre un
  // input[type=range] (comprobado a mano: ni siquiera cambia su `.value`),
  // así que mover el slider en un test solo es posible con `fireEvent.change`
  // — la única excepción a "user-event, no fireEvent" en esta suite, y solo
  // por esta limitación de jsdom con este tipo de control.
  it('cambiar el color (hue) actualiza la etiqueta avisada', async () => {
    const user = userEvent.setup();
    const { onCambiarAvatar } = montar('mateo');

    await user.click(screen.getByRole('button', { name: 'Personalizar avatar' }));
    fireEvent.change(screen.getByLabelText('Color'), { target: { value: '310' } });

    expect(onCambiarAvatar).toHaveBeenLastCalledWith(
      '<Blobatar name="mateo" shape="round" hue="310" tone="0.5" expression="idle" />',
    );
  });

  it('cambiar el tono actualiza la etiqueta avisada', async () => {
    const user = userEvent.setup();
    const { onCambiarAvatar } = montar('mateo');

    await user.click(screen.getByRole('button', { name: 'Personalizar avatar' }));
    fireEvent.change(screen.getByLabelText('Tono'), { target: { value: '0.2' } });

    expect(onCambiarAvatar).toHaveBeenLastCalledWith(
      '<Blobatar name="mateo" shape="round" hue="200" tone="0.2" expression="idle" />',
    );
  });

  it('"Usar automático" vuelve al avatar sin personalizar, sin cerrar el panel', async () => {
    const user = userEvent.setup();
    const { onCambiarAvatar } = montar('mateo');

    await user.click(screen.getByRole('button', { name: 'Personalizar avatar' }));
    await user.selectOptions(screen.getByLabelText('Forma'), 'sun');
    await user.click(screen.getByRole('button', { name: 'Usar automático' }));

    expect(onCambiarAvatar).toHaveBeenLastCalledWith('<Blobatar name="mateo" />');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('"Usar automático" se deshabilita justo después de usarlo (nada más que restablecer)', async () => {
    const user = userEvent.setup();
    montar();

    await user.click(screen.getByRole('button', { name: 'Personalizar avatar' }));
    const botonAutomatico = screen.getByRole('button', { name: 'Usar automático' });
    expect(botonAutomatico).toBeEnabled(); // ya se sembró PERSONALIZACION_INICIAL al abrir

    await user.click(botonAutomatico);
    expect(botonAutomatico).toBeDisabled();
  });
});
