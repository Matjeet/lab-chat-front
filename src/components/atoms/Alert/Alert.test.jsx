import { render, screen } from '@testing-library/react';

import Alert from './Alert';

describe('Alert', () => {
  it('usa role="alert" cuando el tipo es error', () => {
    render(<Alert tipo="error">Algo falló</Alert>);
    expect(screen.getByRole('alert')).toHaveTextContent('Algo falló');
  });

  it('usa role="status" para éxito e información', () => {
    render(<Alert tipo="success">Listo</Alert>);
    expect(screen.getByRole('status')).toHaveTextContent('Listo');
  });
});
