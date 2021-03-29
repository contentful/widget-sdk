import { fetchWebappContentByEntryID } from 'core/services/ContentfulCDA';

import {
  fetchSpacePurchaseContent,
  fetchPlatformPurchaseContent,
  SPACE_PURCHASE_CONTENT_ENTRY_ID,
  PLATFORM_PURCHASE_CONTENT_ENTRY_ID,
} from './fetchSpacePurchaseContent';

jest.mock('core/services/ContentfulCDA', () => ({
  fetchWebappContentByEntryID: jest.fn(),
}));

const mockPageContent = {
  pageName: 'Space Purchase',
  content: [],
};

describe('fetchSpacePurchaseContent', () => {
  it('should return the entry for the content of the space purchase page', async () => {
    fetchWebappContentByEntryID.mockReturnValue({
      fields: mockPageContent,
    });
    const result = await fetchSpacePurchaseContent();
    expect(result).toEqual({ fields: mockPageContent });
    expect(fetchWebappContentByEntryID).toBeCalledWith(SPACE_PURCHASE_CONTENT_ENTRY_ID);
  });
});

describe('fetchPlatformPurchaseContent', () => {
  it('should return the entry for the content of the platform purchase page', async () => {
    fetchWebappContentByEntryID.mockReturnValue({
      fields: mockPageContent,
    });
    const result = await fetchPlatformPurchaseContent();
    expect(result).toEqual({ fields: mockPageContent });
    expect(fetchWebappContentByEntryID).toBeCalledWith(PLATFORM_PURCHASE_CONTENT_ENTRY_ID);
  });
});
