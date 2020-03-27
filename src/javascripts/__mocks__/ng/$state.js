import querystring from 'querystring';

export const go = jest.fn();
export const href = jest
  .fn()
  .mockImplementation((to, params = '') => `${to}${params && '?' + querystring.stringify(params)}`);

export default {
  go,
  href,
};
