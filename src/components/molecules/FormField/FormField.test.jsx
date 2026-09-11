import { render, screen } from '@testing-library/react';

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
    const input = screen.getByLabelText('Nombre');
    expect(input).toHaveAccessibleDescription('Entre 3 y 50 caracteres');
  });
});
