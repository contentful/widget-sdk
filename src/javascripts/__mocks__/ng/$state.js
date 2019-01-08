export const go = jest.fn();
export const href = jest.fn().mockImplementation(sref => `http://url-for-state-${sref}`);

export default {
  go,
  href
};
