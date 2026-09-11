import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Input from './Input';

/** Wrapper con estado para probar el input controlado de forma realista. */
const ControlledInput = (props) => {
  const [value, setValue] = useState('');
  return <Input {...props} value={value} onChange={(e) => setValue(e.target.value)} />;
};

describe('Input', () => {
  it('muestra el placeholder', () => {
    render(<Input value="" onChange={() => {}} placeholder="Escribe un mensaje" />);
    expect(screen.getByPlaceholderText('Escribe un mensaje')).toBeInTheDocument();
  });

  it('refleja el texto que escribe la persona usuaria', async () => {
    render(<ControlledInput placeholder="msg" />);
    const input = screen.getByPlaceholderText('msg');

    await userEvent.type(input, 'hola');

    expect(input).toHaveValue('hola');
  });

  it('no acepta texto cuando está deshabilitado', async () => {
    render(<Input value="" onChange={() => {}} placeholder="msg" disabled />);
    const input = screen.getByPlaceholderText('msg');

    await userEvent.type(input, 'hola');

    expect(input).toHaveValue('');
    expect(input).toBeDisabled();
  });
});
