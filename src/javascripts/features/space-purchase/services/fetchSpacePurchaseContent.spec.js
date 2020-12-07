import { initWebappContentCDAClient } from 'core/services/ContentfulCDA';

import {
  fetchSpacePurchaseContent,
  fetchPlatformPurchaseContent,
  SPACE_PURCHASE_CONTENT_ENTRY_ID,
  PLATFORM_PURCHASE_CONTENT_ENTRY_ID,
} from './fetchSpacePurchaseContent';

jest.mock('core/services/ContentfulCDA', () => ({
  initWebappContentCDAClient: jest.fn(),
}));

const mockPageContent = {
  pageName: 'Space Purchase',
  content: [],
};

describe('fetchSpacePurchaseContent', () => {
  it('should return the entry for the content of the space purchase page', async () => {
    const getEntry = jest.fn().mockReturnValue({
      fields: mockPageContent,
    });

    initWebappContentCDAClient.mockReturnValueOnce({
      getEntry,
    });
    const result = await fetchSpacePurchaseContent();

    expect(initWebappContentCDAClient).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockPageContent);
    expect(getEntry).toBeCalledWith(SPACE_PURCHASE_CONTENT_ENTRY_ID, { include: 2 });
  });
});

describe('fetchPlatformPurchaseContent', () => {
  it('should return the entry for the content of the platform purchase page', async () => {
    const getEntry = jest.fn().mockReturnValue({
      fields: mockPageContent,
    });

    initWebappContentCDAClient.mockReturnValueOnce({
      getEntry,
    });
    const result = await fetchPlatformPurchaseContent();

    expect(initWebappContentCDAClient).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockPageContent);
    expect(getEntry).toBeCalledWith(PLATFORM_PURCHASE_CONTENT_ENTRY_ID, { include: 2 });
  });
});
