// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

Object.defineProperty(Uint8Array, Symbol.hasInstance, {
    value(potentialInstance: unknown) {
      return this === Uint8Array
        ? Object.prototype.toString.call(potentialInstance) ===
            '[object Uint8Array]'
        : Uint8Array[Symbol.hasInstance].call(this, potentialInstance);
    },
  });