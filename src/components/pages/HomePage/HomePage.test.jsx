import { render, screen } from '@testing-library/react';

import HomePage from './HomePage';

describe('HomePage', () => {
  it('confirma que la sesión se inició correctamente', () => {
    render(<HomePage />);
    expect(
      screen.getByText('¡Sesión iniciada correctamente!'),
    ).toBeInTheDocument();
  });
});
