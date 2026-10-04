import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import BotonIA from './BotonIA';

describe('BotonIA', () => {
  it('muestra el botón de funciones de IA y no el aviso hasta pulsarlo', () => {
    render(<BotonIA />);

    expect(screen.getByRole('button', { name: 'Funciones de IA' })).toBeInTheDocument();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('al pulsarlo, avisa en un modal amarillo que la función está en construcción', async () => {
    const user = userEvent.setup();
    render(<BotonIA />);

    await user.click(screen.getByRole('button', { name: 'Funciones de IA' }));

    const dialogo = screen.getByRole('alertdialog');
    expect(dialogo).toHaveTextContent('Función en construcción');
    expect(dialogo).toHaveClass('warning');
  });

  it('el aviso se cierra con el botón de confirmación', async () => {
    const user = userEvent.setup();
    render(<BotonIA />);

    await user.click(screen.getByRole('button', { name: 'Funciones de IA' }));
    await user.click(screen.getByRole('button', { name: 'Entendido' }));

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });
});
