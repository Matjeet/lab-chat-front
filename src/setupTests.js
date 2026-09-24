// Extiende los matchers de Jest con los de Testing Library:
// toBeInTheDocument, toHaveTextContent, toBeDisabled, etc.
import '@testing-library/jest-dom';

// jsdom no implementa scrollIntoView (lo usa Conversacion para el
// auto-scroll al último mensaje) — sin este stub, cualquier test que
// monte ese componente falla con "scrollIntoView is not a function".
Element.prototype.scrollIntoView = jest.fn();

// jsdom tampoco implementa IntersectionObserver (lo usa ListaChats para el
// scroll infinito) — este stub no-op basta para montar el componente; los
// tests que necesiten simular una intersección real sobrescriben
// global.IntersectionObserver ellos mismos (ver ListaChats.test.jsx).
class IntersectionObserverStub {
  observe() {}

  unobserve() {}

  disconnect() {}
}
global.IntersectionObserver = IntersectionObserverStub;
