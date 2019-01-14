import * as PublicContentType from './PublicContentType.es6';

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
          name: 'wat'
        },
        {
          apiName: 'zwei',
          id: 'obiwansays',
          name: 'nein'
        },
        {
          id: 'lukesays',
          name: 'dad?'
        }
      ]
    };

    it('sets "displayField" to apiName of referenced field', function() {
      const internalData = {
        displayField: 'internal',
        fields: [{ id: 'internal', apiName: 'apiName' }]
      };
      const publicData = PublicContentType.fromInternal(internalData);
      expect(publicData.displayField).toBe('apiName');
    });

    it('has a sys field', function() {
      const publicData = PublicContentType.fromInternal({ sys: 'test-sys' });
      expect(publicData.sys).toBe('test-sys');
    });

    it('has a name field', function() {
      const publicData = PublicContentType.fromInternal({ name: 'test' });
      expect(publicData.name).toBe('test');
    });

    it('has a description field', function() {
      const publicData = PublicContentType.fromInternal({ description: 'test' });
      expect(publicData.description).toBe('test');
    });

    it('always has a fields array', function() {
      const publicData = PublicContentType.fromInternal({});
      expect(Array.isArray(publicData.fields)).toBe(true);
    });

    it('keeps internal "displayField" ID if apiName is not present', function() {
      const internalData = {
        displayField: 'internal',
        fields: [{ id: 'internal' }]
      };
      const publicData = PublicContentType.fromInternal(internalData);
      expect(publicData.displayField).toBe('internal');
    });

    it('removes "apiName" property from all the fields', function() {
      const publicData = PublicContentType.fromInternal(ct);
      publicData.fields.forEach(field => {
        expect('apiName' in field).toBe(false);
      });
    });

    it('uses "apiName" as id if available', function() {
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
  });
});
