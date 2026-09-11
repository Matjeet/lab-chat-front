import { render, screen } from '@testing-library/react';

import Page from './page';

describe('Ruta /', () => {
  it('renderiza la página inicial', () => {
    render(<Page />);
    expect(screen.getByRole('heading', { name: 'Chat' })).toBeInTheDocument();
  });
});
