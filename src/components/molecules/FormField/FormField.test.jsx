import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import FormField from './FormField';

describe('FormField', () => {
  const baseProps = { id: 'nombre', label: 'Nombre', value: '', onChange: () => {} };

  it('asocia la etiqueta con el input', () => {
    render(<FormField {...baseProps} />);
    expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
  });

  it('no muestra alerta cuando no hay error', () => {
    render(<FormField {...baseProps} />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('muestra el mensaje de error y marca el input como inválido', () => {
    render(<FormField {...baseProps} error="Campo obligatorio" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Campo obligatorio');
    expect(screen.getByLabelText('Nombre')).toHaveAttribute('aria-invalid', 'true');
  });

  it('describe el input con la ayuda cuando se pasa hint', () => {
    render(<FormField {...baseProps} hint="Entre 3 y 50 caracteres" />);
    expect(screen.getByLabelText('Nombre')).toHaveAccessibleDescription(
      'Entre 3 y 50 caracteres',
    );
  });

  it('muestra los requisitos solo mientras el campo tiene el foco', async () => {
    const user = userEvent.setup();
    const requisitos = [{ id: 'a', texto: 'Requisito A', cumplido: false }];
    render(<FormField {...baseProps} requisitos={requisitos} />);

    expect(screen.queryByText('Requisito A')).not.toBeInTheDocument();

    await user.click(screen.getByLabelText('Nombre'));
    expect(screen.getByText('Requisito A')).toBeInTheDocument();

    await user.tab();
    expect(screen.queryByText('Requisito A')).not.toBeInTheDocument();
  });

  it('oculta el error del campo mientras se ven los requisitos', async () => {
    const user = userEvent.setup();
    const requisitos = [{ id: 'a', texto: 'Requisito A', cumplido: false }];
    render(<FormField {...baseProps} error="Campo obligatorio" requisitos={requisitos} />);

    expect(screen.getByText('Campo obligatorio')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Nombre'));
    expect(screen.queryByText('Campo obligatorio')).not.toBeInTheDocument();
    expect(screen.getByText('Requisito A')).toBeInTheDocument();
  });
});
