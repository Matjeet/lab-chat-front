import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import BotonRuleta from './BotonRuleta';

describe('BotonRuleta', () => {
  it('muestra el botón de la ruleta y no el aviso hasta pulsarlo', () => {
    render(<BotonRuleta />);

    expect(screen.getByRole('button', { name: 'Ruleta' })).toBeInTheDocument();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('al pulsarlo, avisa en un modal amarillo que la función está en construcción', async () => {
    const user = userEvent.setup();
    render(<BotonRuleta />);

    await user.click(screen.getByRole('button', { name: 'Ruleta' }));

    const dialogo = screen.getByRole('alertdialog');
    expect(dialogo).toHaveTextContent('Función en construcción');
    expect(dialogo).toHaveClass('warning');
  });

  it('el aviso se cierra con el botón de confirmación', async () => {
    const user = userEvent.setup();
    render(<BotonRuleta />);

    await user.click(screen.getByRole('button', { name: 'Ruleta' }));
    await user.click(screen.getByRole('button', { name: 'Entendido' }));

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });
});
