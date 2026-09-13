import { render } from '@testing-library/react';

import PatronBurbujas from './PatronBurbujas';

describe('PatronBurbujas', () => {
  it('es puramente decorativo', () => {
    const { container } = render(<PatronBurbujas />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('usa tokens de color, no hex fijo', () => {
    const { container } = render(<PatronBurbujas />);
    expect(container.innerHTML).toContain('var(--color-border)');
    expect(container.innerHTML).not.toMatch(/#[0-9a-f]{3,6}/i);
  });

  it('genera un id de patrón único por instancia (sin choques al repetirlo)', () => {
    const { container: a } = render(<PatronBurbujas />);
    const { container: b } = render(<PatronBurbujas />);

    const idA = a.querySelector('pattern').id;
    const idB = b.querySelector('pattern').id;

    expect(idA).not.toBe(idB);
    expect(a.querySelector('rect[fill]').getAttribute('fill')).toBe(`url(#${idA})`);
  });
});
