import { urlSocketConversacion } from './config';

describe('urlSocketConversacion', () => {
  it('deriva ws:// del origen http:// configurado', () => {
    expect(urlSocketConversacion('mateo')).toBe('ws://localhost:8082/ws/chat/mateo');
  });

  it('codifica el usuario en la URL', () => {
    expect(urlSocketConversacion('a b')).toBe('ws://localhost:8082/ws/chat/a%20b');
  });
});
