// Extiende los matchers de Jest con los de Testing Library:
// toBeInTheDocument, toHaveTextContent, toBeDisabled, etc.
import '@testing-library/jest-dom';

// jsdom no implementa scrollIntoView (lo usa Conversacion para el
// auto-scroll al último mensaje) — sin este stub, cualquier test que
// monte ese componente falla con "scrollIntoView is not a function".
Element.prototype.scrollIntoView = jest.fn();
