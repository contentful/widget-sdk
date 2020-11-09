export const createPubSubClientForSpace = jest.fn().mockReturnValue({
  on: jest.fn(),
  off: jest.fn(),
});
