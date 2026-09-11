import { render, screen } from '@testing-library/react';

import RequisitosCampo from './RequisitosCampo';

const requisitos = [
  { id: 'a', texto: 'Requisito cumplido', cumplido: true },
  { id: 'b', texto: 'Requisito pendiente', cumplido: false },
];

describe('RequisitosCampo', () => {
  it('lista todos los requisitos', () => {
    render(<RequisitosCampo requisitos={requisitos} />);
    expect(screen.getByText('Requisito cumplido')).toBeInTheDocument();
    expect(screen.getByText('Requisito pendiente')).toBeInTheDocument();
  });

  it('marca el estado de cada requisito', () => {
    render(<RequisitosCampo requisitos={requisitos} />);
    expect(screen.getByText('Requisito cumplido').closest('li')).toHaveAttribute(
      'data-estado',
      'cumplido',
    );
    expect(screen.getByText('Requisito pendiente').closest('li')).toHaveAttribute(
      'data-estado',
      'pendiente',
    );
  });

  it('expone el estado como texto para lectores de pantalla', () => {
    render(<RequisitosCampo requisitos={requisitos} />);
    expect(screen.getByText('Requisito cumplido').closest('li')).toHaveTextContent(
      '(cumplido)',
    );
  });
});
