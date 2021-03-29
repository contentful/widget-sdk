import { initWebappContentCDAClient } from 'core/services/ContentfulCDA';

import { fetchWebappContentByEntryID } from './fetchWebappContentByEntryID';

jest.mock('core/services/ContentfulCDA', () => ({
  initWebappContentCDAClient: jest.fn(),
}));

const mockFeatureContent = {
  pageName: 'page name',
  content: [],
};
const ENTRY_ID = 'mock id';

describe('fetchWebappContentByEntryID', () => {
  it('should return the entry for the feature', async () => {
    const getEntry = jest.fn().mockReturnValue({
      fields: mockFeatureContent,
    });

    initWebappContentCDAClient.mockReturnValueOnce({
      getEntry,
    });
    const result = await fetchWebappContentByEntryID(ENTRY_ID);

    expect(initWebappContentCDAClient).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockFeatureContent);
    expect(getEntry).toBeCalledWith(ENTRY_ID, { include: 2 });
  });
});
