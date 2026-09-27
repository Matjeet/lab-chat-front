import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ItemNotificacion from './ItemNotificacion';

const notificacionSolicitud = (extra = {}) => ({
  id: 1,
  remitente: 'ana',
  tipo: 'solicitud',
  leida: false,
  createdAt: '2026-01-01T00:00:00Z',
  ...extra,
});

describe('ItemNotificacion', () => {
  it('arma el texto a partir del tipo "solicitud" y el remitente', () => {
    render(
      <ItemNotificacion
        notificacion={notificacionSolicitud()}
        onMarcarLeida={jest.fn()}
        onMarcarNoLeida={jest.fn()}
        onAceptar={jest.fn()}
        onRechazar={jest.fn()}
      />,
    );
    expect(screen.getByText('ana te envió una solicitud de chat')).toBeInTheDocument();
  });

  it('un tipo desconocido muestra un texto genérico', () => {
    render(
      <ItemNotificacion
        notificacion={notificacionSolicitud({ tipo: 'otro' })}
        onMarcarLeida={jest.fn()}
        onMarcarNoLeida={jest.fn()}
      />,
    );
    expect(screen.getByText('Tienes una notificación nueva')).toBeInTheDocument();
  });

  it('si es una solicitud pendiente, muestra los botones de aceptar y rechazar', () => {
    render(
      <ItemNotificacion
        notificacion={notificacionSolicitud({ meta: { aceptada: false, pendiente: true } })}
        onMarcarLeida={jest.fn()}
        onMarcarNoLeida={jest.fn()}
        onAceptar={jest.fn()}
        onRechazar={jest.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Aceptar solicitud de ana' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rechazar solicitud de ana' })).toBeInTheDocument();
  });

  it('sin "meta", asume pendiente y muestra los botones (compatibilidad hacia atrás)', () => {
    render(
      <ItemNotificacion
        notificacion={notificacionSolicitud({ meta: null })}
        onMarcarLeida={jest.fn()}
        onMarcarNoLeida={jest.fn()}
        onAceptar={jest.fn()}
        onRechazar={jest.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Aceptar solicitud de ana' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rechazar solicitud de ana' })).toBeInTheDocument();
  });

  it('si la solicitud ya no está pendiente y fue aceptada, muestra "Aceptada" en vez de los botones', () => {
    render(
      <ItemNotificacion
        notificacion={notificacionSolicitud({ meta: { aceptada: true, pendiente: false } })}
        onMarcarLeida={jest.fn()}
        onMarcarNoLeida={jest.fn()}
      />,
    );
    expect(screen.getByText('Aceptada')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /aceptar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /rechazar/i })).not.toBeInTheDocument();
  });

  it('si la solicitud ya no está pendiente y no fue aceptada, muestra "Rechazada" en vez de los botones', () => {
    render(
      <ItemNotificacion
        notificacion={notificacionSolicitud({ meta: { aceptada: false, pendiente: false } })}
        onMarcarLeida={jest.fn()}
        onMarcarNoLeida={jest.fn()}
      />,
    );
    expect(screen.getByText('Rechazada')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /aceptar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /rechazar/i })).not.toBeInTheDocument();
  });

  it('si no es una solicitud, no muestra los botones de aceptar/rechazar', () => {
    render(
      <ItemNotificacion
        notificacion={notificacionSolicitud({ tipo: 'otro' })}
        onMarcarLeida={jest.fn()}
        onMarcarNoLeida={jest.fn()}
      />,
    );
    expect(screen.queryByRole('button', { name: /aceptar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /rechazar/i })).not.toBeInTheDocument();
  });

  it('llama a onAceptar y onRechazar al hacer clic en sus botones', async () => {
    const onAceptar = jest.fn();
    const onRechazar = jest.fn();
    const user = userEvent.setup();
    render(
      <ItemNotificacion
        notificacion={notificacionSolicitud()}
        onMarcarLeida={jest.fn()}
        onMarcarNoLeida={jest.fn()}
        onAceptar={onAceptar}
        onRechazar={onRechazar}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Aceptar solicitud de ana' }));
    await user.click(screen.getByRole('button', { name: 'Rechazar solicitud de ana' }));

    expect(onAceptar).toHaveBeenCalledTimes(1);
    expect(onRechazar).toHaveBeenCalledTimes(1);
  });

  it('al pasar el mouse por una notificación sin leer, llama a onMarcarLeida', async () => {
    const onMarcarLeida = jest.fn();
    const user = userEvent.setup();
    render(
      <ItemNotificacion
        notificacion={notificacionSolicitud({ leida: false })}
        onMarcarLeida={onMarcarLeida}
        onMarcarNoLeida={jest.fn()}
      />,
    );

    await user.hover(screen.getByText('ana te envió una solicitud de chat'));

    expect(onMarcarLeida).toHaveBeenCalledTimes(1);
  });

  it('al pasar el mouse por una notificación ya leída, no llama a onMarcarLeida', async () => {
    const onMarcarLeida = jest.fn();
    const user = userEvent.setup();
    render(
      <ItemNotificacion
        notificacion={notificacionSolicitud({ leida: true })}
        onMarcarLeida={onMarcarLeida}
        onMarcarNoLeida={jest.fn()}
      />,
    );

    await user.hover(screen.getByText('ana te envió una solicitud de chat'));

    expect(onMarcarLeida).not.toHaveBeenCalled();
  });

  it('una notificación leída muestra el botón para marcarla como no leída', async () => {
    const onMarcarNoLeida = jest.fn();
    const user = userEvent.setup();
    render(
      <ItemNotificacion
        notificacion={notificacionSolicitud({ leida: true })}
        onMarcarLeida={jest.fn()}
        onMarcarNoLeida={onMarcarNoLeida}
      />,
    );

    const boton = screen.getByRole('button', { name: 'Marcar como no leída' });
    await user.click(boton);

    expect(onMarcarNoLeida).toHaveBeenCalledTimes(1);
  });

  it('con deshabilitado, los botones de aceptar y rechazar quedan inhabilitados', () => {
    render(
      <ItemNotificacion
        notificacion={notificacionSolicitud({ meta: { aceptada: false, pendiente: true } })}
        onMarcarLeida={jest.fn()}
        onMarcarNoLeida={jest.fn()}
        onAceptar={jest.fn()}
        onRechazar={jest.fn()}
        deshabilitado
      />,
    );
    expect(screen.getByRole('button', { name: 'Aceptar solicitud de ana' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Rechazar solicitud de ana' })).toBeDisabled();
  });

  it('una notificación sin leer no muestra el botón de marcar como no leída', () => {
    render(
      <ItemNotificacion
        notificacion={notificacionSolicitud({ leida: false })}
        onMarcarLeida={jest.fn()}
        onMarcarNoLeida={jest.fn()}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Marcar como no leída' })).not.toBeInTheDocument();
  });
});
