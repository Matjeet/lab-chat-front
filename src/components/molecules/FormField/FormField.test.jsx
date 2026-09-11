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

  it('muestra el mensaje de error cuando se proporciona', () => {
    render(<FormField {...baseProps} error="Campo obligatorio" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Campo obligatorio');
  });
});
