export default {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  localStorage: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn()
  },
  sessionStorage: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn()
  }
};
