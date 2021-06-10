import * as PublicContentType from './PublicContentType';
import {
  InternalContentType,
  InternalContentTypeField,
} from '../app/widgets/ExtensionSDKs/createContentTypeApi';

describe('PublicContentType', () => {
  describe('#internalToPublic()', () => {
    const ct = {
      name: 'apple',
      sys: {},
      displayField: 'yodasays',
      fields: [
        {
          apiName: 'eins',
          id: 'yodasays',
          name: 'wat',
        },
        {
          apiName: 'zwei',
          id: 'obiwansays',
          name: 'nein',
        },
        {
          id: 'lukesays',
          name: 'dad?',
        },
      ],
    } as InternalContentType;

    it('sets "displayField" to apiName of referenced field', function () {
      const internalData = {
        displayField: 'internal',
        fields: [{ id: 'internal', apiName: 'apiName' } as InternalContentTypeField],
      };
      const publicData = PublicContentType.fromInternal(internalData as InternalContentType);
      expect(publicData.displayField).toBe('apiName');
    });

    it('has a sys field', function () {
      const publicData = PublicContentType.fromInternal({
        sys: { id: 'test-sys' },
      } as InternalContentType);
      expect(publicData.sys.id).toBe('test-sys');
    });

    it('has a name field', function () {
      const publicData = PublicContentType.fromInternal({ name: 'test' } as InternalContentType);
      expect(publicData.name).toBe('test');
    });

    it('has a description field', function () {
      const publicData = PublicContentType.fromInternal({
        description: 'test',
      } as InternalContentType);
      expect(publicData.description).toBe('test');
    });

    it('always has a fields array', function () {
      const publicData = PublicContentType.fromInternal({} as InternalContentType);
      expect(Array.isArray(publicData.fields)).toBe(true);
    });

    it('keeps internal "displayField" ID if apiName is not present', function () {
      const internalData = {
        displayField: 'internal',
        fields: [{ id: 'internal' } as InternalContentTypeField],
      };
      const publicData = PublicContentType.fromInternal(internalData as InternalContentType);
      expect(publicData.displayField).toBe('internal');
    });

    it('removes "apiName" property from all the fields', function () {
      const publicData = PublicContentType.fromInternal(ct);
      publicData.fields.forEach((field) => {
        expect('apiName' in field).toBe(false);
      });
    });

    it('uses "apiName" as id if available', function () {
      const publicData = PublicContentType.fromInternal(ct);
      publicData.fields.forEach((field, i) => {
        const originalField = ct.fields[i];

        if ('apiName' in originalField) {
          expect(field.id).toBe(originalField.apiName);
        } else {
          expect(field.id).toBe(originalField.id);
        }
      });
    });

    it('takes an already public content type and returns an exact copy of it', () => {
      const publicData1 = PublicContentType.fromInternal(ct);
      const publicData2 = PublicContentType.fromInternal(publicData1);
      expect(publicData2).toEqual(publicData1);
    });
  });
});
