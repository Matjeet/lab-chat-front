import { render } from '@testing-library/react';

import Ilustracion404 from './Ilustracion404';

describe('Ilustracion404', () => {
  it('es puramente decorativa y admite className', () => {
    const { container } = render(<Ilustracion404 className="foo" />);
    const svg = container.querySelector('svg');

    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('viewBox', '0 0 750 750');
    expect(svg).toHaveClass('foo');
  });

  it('usa tokens de color reactivos al tema, no hex fijo', () => {
    const { container } = render(<Ilustracion404 />);
    const html = container.innerHTML;

    expect(html).toContain('var(--color-bg)');
    expect(html).toContain('var(--color-primary)');
    expect(html).toContain('var(--color-on-primary)');
    expect(html).not.toMatch(/#0E0F13|#8B83FF|#00160A/i);
  });
});
