export default {
  resolve: jest.fn().mockImplementation(...args => Promise.resolve(...args)),
  reject: jest.fn().mockImplementation(error => Promise.reject(error)),
  all: jest.fn().mockImplementation(queries => Promise.all(queries))
};
