import ExtensionAPI from './ExtensionAPI.es6';

describe('ExtensionAPI', () => {
  const createAPI = extraConfig => {
    return new ExtensionAPI({
      channel: { connect: jest.fn(), send: jest.fn() },
      current: { field: {}, locale: {} },
      fields: [],
      locales: { available: [], default: {} },
      entryData: { fields: {} },
      contentTypeData: {},
      spaceMembership: {
        sys: {},
        user: { sys: {}, firstName: 'Jakub' },
        roles: []
      },
      parameters: {
        instance: { test: true },
        installation: { hello: 'world' }
      },
      ...extraConfig
    });
  };

  describe('#connect()', () => {
    it('sends connect message with all data through channel', () => {
      const api = createAPI({
        current: {
          field: {
            apiName: 'FID-public',
            id: 'FID-internal',
            type: 'FIELD-TYPE',
            validations: 'VALIDATIONS'
          },
          locale: {
            code: 'LOCALE',
            internal_code: 'LOCALE-internal'
          }
        },
        fields: [{ id: 'FID-internal', apiName: 'FID-public', localized: false }],
        locales: {
          available: [
            { code: 'LOCALE', internal_code: 'LOCALE-internal', default: true },
            { code: 'L2', internal_code: 'L2-internal' }
          ],
          default: { code: 'LOCALE', internal_code: 'LOCALE-internal', default: true }
        },
        entryData: {
          sys: { id: 'test' },
          fields: {
            'FID-internal': {
              'LOCALE-internal': 'VALUE'
            }
          }
        },
        contentTypeData: 'CT'
      });

      api.connect();
      expect(api.channel.connect).toBeCalledTimes(1);
      expect(api.channel.connect).toBeCalledWith(
        expect.objectContaining({
          user: expect.any(Object),
          field: {
            id: 'FID-public',
            locale: 'LOCALE',
            value: 'VALUE',
            isDisabled: false,
            type: 'FIELD-TYPE',
            validations: 'VALIDATIONS'
          },
          fieldInfo: [
            {
              id: 'FID-public',
              locales: ['LOCALE'],
              localized: false,
              values: { LOCALE: 'VALUE' }
            }
          ],
          locales: {
            available: ['LOCALE', 'L2'],
            default: 'LOCALE'
          },
          parameters: expect.any(Object),
          entry: { sys: { id: 'test' }, fields: expect.any(Object) },
          contentType: 'CT'
        })
      );
    });
  });

  describe('#sendFieldValueChange()', () => {
    it('sends "valueChanged" message and translates internal to public paths', () => {
      const api = createAPI({
        fields: [{ id: 'FID-internal', apiName: 'FID-public' }],
        locales: {
          available: [{ code: 'LC-public', internal_code: 'LC-internal', default: true }],
          default: { code: 'LC-public', internal_code: 'LC-internal', default: true }
        }
      });

      api.sendFieldValueChange('FID-internal', 'LC-internal', 'VALUE');
      expect(api.channel.send).toBeCalledTimes(1);
      expect(api.channel.send).toBeCalledWith('valueChanged', ['FID-public', 'LC-public', 'VALUE']);
    });
  });

  describe('#buildDocPath()', () => {
    it('translates public paths to internal', () => {
      const api = createAPI({
        fields: [{ id: 'FID-internal', apiName: 'FID-public' }],
        locales: {
          available: [{ code: 'LC-public', internal_code: 'LC-internal', default: true }],
          default: { code: 'LC-public', internal_code: 'LC-internal', default: true }
        }
      });

      const path = api.buildDocPath('FID-public', 'LC-public');
      expect(path).toEqual(['fields', 'FID-internal', 'LC-internal']);
    });
  });
});
