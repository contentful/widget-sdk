import { createContentTypeApi } from './createContentTypeApi';
import { ContentType } from '@contentful/app-sdk';

describe('createContentTypeApi', () => {
  describe('when passed an internal content type', () => {
    const internalContentType = {
      name: 'content type',
      description: 'a type of content',
      sys: { id: 'something', type: 'ContentType' } as ContentType['sys'],
      displayField: 'title',
      fields: [
        {
          id: 'internalId',
          apiName: 'externalId',
          disabled: false,
          localized: false,
          name: 'first_field',
          omitted: false,
          required: false,
          type: 'Symbol',
          validations: [{}],
        },
        {
          id: 'title',
          apiName: 'title',
          disabled: false,
          localized: false,
          name: 'second_field',
          omitted: false,
          required: false,
          type: 'Symbol',
          validations: [{}],
        },
      ],
    };
    let result: ContentType;
    beforeAll(() => {
      result = createContentTypeApi(internalContentType);
    });

    it('hides internal ids', () => {
      expect(result.fields[0].id).toEqual('externalId');
    });

    it('preserves the sys, name, description, and displayfield properties', () => {
      expect(result.displayField).toEqual(internalContentType.displayField);
      expect(result.sys).toEqual(internalContentType.sys);
      expect(result.name).toEqual(internalContentType.name);
      expect(result.description).toEqual(internalContentType.description);
    });
  });
});
