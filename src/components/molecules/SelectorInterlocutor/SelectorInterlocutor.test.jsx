import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SelectorInterlocutor from './SelectorInterlocutor';
import { InterlocutorProvider, useInterlocutor } from '../../../context/InterlocutorContext';

// Sonda para leer, en el propio test, lo que quedó en el contexto tras enviar
// el formulario — sin esto no hay forma de observar `establecerCon` desde fuera.
const SondaCon = () => {
  const { con } = useInterlocutor();
  return <p>con actual: {con || '(vacío)'}</p>;
};

const montar = () =>
  render(
    <InterlocutorProvider>
      <SelectorInterlocutor />
      <SondaCon />
    </InterlocutorProvider>,
  );

describe('SelectorInterlocutor', () => {
  it('empieza vacío si no hay interlocutor elegido', () => {
    montar();
    expect(screen.getByLabelText('Chatear con')).toHaveValue('');
    expect(screen.getByText('con actual: (vacío)')).toBeInTheDocument();
  });

  it('confirma un username válido en el contexto', async () => {
    const user = userEvent.setup();
    montar();

    await user.type(screen.getByLabelText('Chatear con'), 'ana');
    await user.click(screen.getByRole('button', { name: 'Ir' }));

    expect(screen.getByText('con actual: ana')).toBeInTheDocument();
  });

  it('no confirma un username con formato inválido', async () => {
    const user = userEvent.setup();
    montar();

    await user.type(screen.getByLabelText('Chatear con'), 'a');
    await user.click(screen.getByRole('button', { name: 'Ir' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/entre 3 y 50/i);
    expect(screen.getByText('con actual: (vacío)')).toBeInTheDocument();
  });

  it('limpia el error al volver a escribir', async () => {
    const user = userEvent.setup();
    montar();

    await user.type(screen.getByLabelText('Chatear con'), 'a');
    await user.click(screen.getByRole('button', { name: 'Ir' }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Chatear con'), 'na');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
