import { render } from '@testing-library/react';

import Ilustracion404 from './Ilustracion404';

describe('Ilustracion404', () => {
  it('monta las dos variantes (claro y oscuro), decorativas', () => {
    const { container } = render(<Ilustracion404 />);
    const svgs = container.querySelectorAll('svg');

    expect(svgs).toHaveLength(2);
    svgs.forEach((svg) => {
      expect(svg).toHaveAttribute('aria-hidden', 'true');
      expect(svg).toHaveAttribute('viewBox', '0 0 750 750');
    });
  });

  it('cada variante trae el fondo pensado para su tema', () => {
    const { container } = render(<Ilustracion404 />);
    const [claro, oscuro] = container.querySelectorAll('svg');

    // El SVG "claro" está hecho para fondo #F5F6F8 (--color-bg en claro);
    // el "oscuro", para #0E0F13 (--color-bg en oscuro).
    expect(claro.innerHTML).toContain('#F5F6F8');
    expect(oscuro.innerHTML).toContain('#0E0F13');
  });

  it('aplica className al contenedor', () => {
    const { container } = render(<Ilustracion404 className="foo" />);
    expect(container.firstChild).toHaveClass('foo');
  });
});
