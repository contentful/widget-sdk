jest.mock('Config.es6', () => ({ apiUrl: v => `https://api.some-domain.com/${v}` }));
jest.mock('dataloader', () => jest.fn());

// This test verifies that the math we do results in some reasonable numbers.
const MAX_ENTITIES_IE = 27;
const MAX_ENTITIES_OTHER = 119;

describe('newBatchEntityFetcher() invoking new DataLoader() `maxBatchSize` option', () => {
  beforeEach(() => jest.resetModules());

  it(`sets it to ${MAX_ENTITIES_IE} for IE browser`, () => {
    jest.mock('detect-browser', () => ({
      detect: jest.fn().mockReturnValue({ name: 'ie' })
    }));
    expectMaxBatchSize(MAX_ENTITIES_IE);
  });

  it(`sets it to ${MAX_ENTITIES_OTHER} for other browsers`, () => {
    jest.mock('detect-browser', () => ({
      detect: jest.fn().mockReturnValue({ name: 'not-ie' })
    }));
    expectMaxBatchSize(MAX_ENTITIES_OTHER);
  });

  function expectMaxBatchSize(maxBatchSize) {
    const DataLoader = require('dataloader');
    const { default: newBatchEntityFetcher } = require('./newBatchEntityFetcher.es6');

    newBatchEntityFetcher({
      getResources: () => {},
      resourceContext: {}
    });

    expect(DataLoader).toHaveBeenCalledTimes(1);
    expect(DataLoader).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        maxBatchSize
      })
    );
  }
});
