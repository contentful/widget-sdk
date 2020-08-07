import { createContentTypeApi } from './createContentTypeApi';

describe('createContentTypeApi', () => {
  describe('when passed an internal content type', () => {
    const internalContentType = {
      name: 'content type',
      description: 'a type of content',
      sys: { id: 'something' },
      displayField: 'title',
      fields: [
        {
          id: 'internalId',
          apiName: 'externalId',
        },
        {
          id: 'title',
          apiName: 'title',
        },
      ],
    };
    let result;
    beforeAll(() => {
      result = createContentTypeApi(internalContentType);
    });

    it('hides internal ids', () => {
      expect(result.fields[0]).toEqual({ id: 'externalId' });
    });

    it('preserves the sys, name, description, and displayfield properties', () => {
      expect(result.displayField).toEqual(internalContentType.displayField);
      expect(result.sys).toEqual(internalContentType.sys);
      expect(result.name).toEqual(internalContentType.name);
      expect(result.description).toEqual(internalContentType.description);
    });
  });
});
