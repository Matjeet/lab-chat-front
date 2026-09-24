import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { InterlocutorProvider, useInterlocutor } from './InterlocutorContext';

const Sonda = () => {
  const { con, establecerCon } = useInterlocutor();
  return (
    <div>
      <p>con: {con || '(vacío)'}</p>
      <button type="button" onClick={() => establecerCon('ana')}>
        Elegir ana
      </button>
    </div>
  );
};

describe('InterlocutorContext', () => {
  it('empieza vacío', () => {
    render(
      <InterlocutorProvider>
        <Sonda />
      </InterlocutorProvider>,
    );
    expect(screen.getByText('con: (vacío)')).toBeInTheDocument();
  });

  it('establecerCon actualiza el valor para todo consumidor', async () => {
    const user = userEvent.setup();
    render(
      <InterlocutorProvider>
        <Sonda />
      </InterlocutorProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Elegir ana' }));

    expect(screen.getByText('con: ana')).toBeInTheDocument();
  });

  it('useInterlocutor lanza si se usa fuera de InterlocutorProvider', () => {
    // Silencia el error esperado que React imprime en consola por el throw.
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Sonda />)).toThrow(
      'useInterlocutor debe usarse dentro de <InterlocutorProvider>.',
    );
    consoleError.mockRestore();
  });
});
