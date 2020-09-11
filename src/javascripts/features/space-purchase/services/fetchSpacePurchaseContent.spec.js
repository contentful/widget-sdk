import { initWebappContentCDAClient } from 'core/services/ContentfulCDA';

import { fetchSpacePurchaseContent } from './fetchSpacePurchaseContent';

jest.mock('core/services/ContentfulCDA', () => ({
  initWebappContentCDAClient: jest.fn(),
}));

const mockPageContent = {
  pageName: 'Space Purchase',
  content: [],
};

describe('fetchSpacePurchaseContent', () => {
  it('should return the entry for the content of a page', async () => {
    initWebappContentCDAClient.mockReturnValueOnce({
      getEntry: jest.fn().mockReturnValue({
        fields: mockPageContent,
      }),
    });
    const result = await fetchSpacePurchaseContent();

    expect(initWebappContentCDAClient).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockPageContent);
  });
});
