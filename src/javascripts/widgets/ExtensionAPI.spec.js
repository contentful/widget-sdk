import ExtensionAPI from './ExtensionAPI.es6';
import { LOCATION_ENTRY_FIELD } from './WidgetLocations.es6';

describe('ExtensionAPI', () => {
  const createAPI = extraConfig => {
    const config = {
      extensionId: 'my-extension-id',
      spaceId: 'my-space-id',
      environmentId: 'master',
      location: LOCATION_ENTRY_FIELD,
      channel: { connect: jest.fn(), destroy: jest.fn(), send: jest.fn(), handlers: {} },
      current: { field: {}, locale: {} },
      locales: { available: [], default: {} },
      entryData: { sys: {}, fields: {} },
      contentTypeData: {},
      editorInterface: {},
      spaceMember: {
        sys: { user: { sys: {}, firstName: 'Jakub' } },
        roles: []
      },
      spaceMembership: {
        sys: { user: { sys: {}, firstName: 'Jakub' } },
        roles: []
      },
      parameters: {
        instance: { test: true },
        installation: { hello: 'world' }
      },
      ...extraConfig
    };

    return new ExtensionAPI(config);
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
        locales: {
          available: [
            { code: 'LOCALE', internal_code: 'LOCALE-internal', name: 'lang1', default: true },
            { code: 'L2', internal_code: 'L2-internal', name: 'lang2' }
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
        contentTypeData: {
          fields: [
            {
              id: 'FID-internal',
              apiName: 'FID-public',
              localized: false,
              type: 'Symbol',
              validations: 'VALIDATIONS1'
            },
            {
              id: 'FID-internal2',
              apiName: 'FID-public2',
              localized: true,
              type: 'Boolean',
              required: true
            },
            {
              id: 'FID-api-name-missing',
              localized: false,
              type: 'Array',
              items: {
                type: 'Link',
                linkType: 'Entry',
                validations: [{ linkContentType: 'testct' }]
              },
              required: false
            }
          ]
        }
      });

      api.connect();
      expect(api.channel.connect).toBeCalledTimes(1);
      expect(api.channel.connect).toBeCalledWith(
        expect.objectContaining({
          location: LOCATION_ENTRY_FIELD,
          user: expect.any(Object),
          field: {
            id: 'FID-public',
            locale: 'LOCALE',
            value: 'VALUE',
            type: 'FIELD-TYPE',
            validations: 'VALIDATIONS',
            required: false
          },
          fieldInfo: [
            {
              id: 'FID-public',
              locales: ['LOCALE'],
              localized: false,
              values: { LOCALE: 'VALUE' },
              type: 'Symbol',
              validations: 'VALIDATIONS1',
              required: false
            },
            {
              id: 'FID-public2',
              locales: ['LOCALE', 'L2'],
              localized: true,
              values: {},
              type: 'Boolean',
              required: true
            },
            {
              id: 'FID-api-name-missing',
              locales: ['LOCALE'],
              localized: false,
              values: {},
              type: 'Array',
              items: {
                type: 'Link',
                linkType: 'Entry',
                validations: [{ linkContentType: 'testct' }]
              },
              required: false
            }
          ],
          locales: {
            available: ['LOCALE', 'L2'],
            default: 'LOCALE',
            names: {
              LOCALE: 'lang1',
              L2: 'lang2'
            }
          },
          parameters: expect.any(Object),
          entry: { sys: { id: 'test' } },
          contentType: {
            fields: [
              { id: 'FID-public', localized: false, type: 'Symbol', validations: 'VALIDATIONS1' },
              { id: 'FID-public2', localized: true, type: 'Boolean', required: true },
              {
                id: 'FID-api-name-missing',
                localized: false,
                type: 'Array',
                items: {
                  type: 'Link',
                  linkType: 'Entry',
                  validations: [{ linkContentType: 'testct' }]
                },
                required: false
              }
            ]
          }
        })
      );
    });

    it('accepts the absence of a spaceMembership object', () => {
      const api = createAPI({ spaceMembership: null });
      expect(api.spaceMembership).toBeNull();
      api.connect();

      expect(api.channel.connect).toHaveBeenCalledWith(
        expect.objectContaining({ user: expect.objectContaining({ spaceMembership: null }) })
      );
    });
  });

  describe('#registerHandler()', () => {
    it('registers a channel handler', () => {
      const api = createAPI();

      const handlerStub = jest.fn(() => 'RESULT');
      api.registerHandler('test', handlerStub);

      const result = api.channel.handlers.test('x', 'y', 'z');
      expect(result).toBe('RESULT');
      expect(handlerStub).toBeCalledTimes(1);
      expect(handlerStub).toBeCalledWith('x', 'y', 'z');
    });
  });

  describe('#registerPathHandler()', () => {
    it('registers a channel handler translating paths to internal IDs', () => {
      const api = createAPI({
        locales: {
          available: [{ code: 'LC-public', internal_code: 'LC-internal', default: true }],
          default: { code: 'LC-public', internal_code: 'LC-internal', default: true }
        },
        contentTypeData: {
          fields: [{ id: 'FID-internal', apiName: 'FID-public' }]
        }
      });

      const handlerStub = jest.fn(() => 'RESULT');
      api.registerPathHandler('test', handlerStub);

      const result = api.channel.handlers.test('FID-public', 'LC-public', 'test');
      expect(result).toBe('RESULT');
      expect(handlerStub).toBeCalledTimes(1);
      expect(handlerStub).toBeCalledWith(['fields', 'FID-internal', 'LC-internal'], 'test');
    });
  });

  describe('#destroy()', () => {
    it('kills the channel', () => {
      const api = createAPI();
      api.destroy();
      expect(api.channel.destroy).toBeCalledTimes(1);
    });
  });

  describe('#send()', () => {
    it('sends a channel message', () => {
      const api = createAPI();

      api.send(1, 2, 3);

      expect(api.channel.send).toBeCalledTimes(1);
      expect(api.channel.send).toBeCalledWith(1, 2, 3);
    });
  });

  describe('#update()', () => {
    it('sends "valueChanged" message and translates internal to public paths', () => {
      const api = createAPI({
        locales: {
          available: [{ code: 'LC-public', internal_code: 'LC-internal', default: true }],
          default: { code: 'LC-public', internal_code: 'LC-internal', default: true }
        },
        contentTypeData: {
          fields: [{ id: 'FID-internal', apiName: 'FID-public' }]
        }
      });

      api.update(['fields', 'FID-internal', 'LC-internal'], {
        fields: { 'FID-internal': { 'LC-internal': 'VALUE' } }
      });

      expect(api.channel.send).toBeCalledTimes(1);
      expect(api.channel.send).toBeCalledWith('valueChanged', ['FID-public', 'LC-public', 'VALUE']);
    });

    it('ignores changes of non-field properties', () => {
      const api = createAPI();

      api.update(['sys', 'yolo'], { sys: { yolo: true } });

      expect(api.channel.send).not.toBeCalled();
    });

    it('ignores unknown fields', () => {
      const api = createAPI();

      api.update(['fields', 'UNKNOWN'], { fields: { UNKNOWN: {} } });

      expect(api.channel.send).not.toBeCalled();
    });
  });
});
