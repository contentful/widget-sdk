import getContentTypePreview from './getContentTypePreview';
import { internalContentTypeData, expectedPreview } from './__mocks__/mockContentType';

describe('getContentTypePreview', () => {
  it('returns content type data in the right format', async () => {
    const preview = await getContentTypePreview(internalContentTypeData);
    expect(preview).toEqual(expectedPreview);
  });
});
