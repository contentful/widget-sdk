export default {
  go: jest.fn(),
  href: jest.fn().mockImplementation(sref => `http://url-for-state-${sref}`)
};
