import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ThemeToggle from './ThemeToggle';

describe('ThemeToggle', () => {
  afterEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  it('arranca en modo sistema', () => {
    render(<ThemeToggle />);
    expect(
      screen.getByRole('button', { name: /actual: sistema/i }),
    ).toBeInTheDocument();
  });

  it('cicla sistema → claro → oscuro → sistema y lo persiste', async () => {
    render(<ThemeToggle />);
    const boton = screen.getByRole('button');

    await userEvent.click(boton);
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem('theme')).toBe('light');

    await userEvent.click(boton);
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');

    await userEvent.click(boton);
    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect(localStorage.getItem('theme')).toBeNull();
  });

  it('respeta el tema ya guardado al montar', () => {
    localStorage.setItem('theme', 'dark');
    render(<ThemeToggle />);
    expect(
      screen.getByRole('button', { name: /actual: oscuro/i }),
    ).toBeInTheDocument();
  });
});
