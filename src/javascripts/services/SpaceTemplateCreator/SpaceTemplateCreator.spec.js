import _ from 'lodash';
import * as spaceTemplateCreator from 'services/SpaceTemplateCreator';

import * as EnrichTemplate from 'services/SpaceTemplateCreator/enrichTemplate';
import * as LocaleStore from 'services/localeStore';
import * as ContentPreview from 'features/content-preview';
import * as ApiKeysManagement from 'features/api-keys-management';

jest.mock('data/EndpointFactory', () => ({ createSpaceEndpoint: jest.fn() }));
jest.mock('./createAssetFileProcessedHandler', () => ({
  createAssetFileProcessedHandler: jest.fn().mockReturnValue((_, callback) => callback()),
}));
jest.mock('analytics/Analytics', () => ({ track: jest.fn() }));
jest.mock('services/SpaceTemplateCreator/enrichTemplate');
jest.mock('services/localeStore');
jest.mock('features/content-preview');
jest.mock('features/api-keys-management');

const mockUpdateContentType = jest.fn();
const mockPublishContentType = jest.fn();
const mockUpdateEntry = jest.fn();
const mockPublishEntry = jest.fn();
const mockUpdateAsset = jest.fn();
const mockPublishAsset = jest.fn();
const mockProcessAsset = jest.fn();
const mockUpdateEditorInterface = jest.fn();

jest.mock('core/services/usePlainCMAClient', () => ({
  getSpaceEnvCMAClient: () => ({
    contentType: {
      update: mockUpdateContentType,
      publish: mockPublishContentType,
    },
    editorInterface: {
      update: mockUpdateEditorInterface,
    },
    entry: {
      update: mockUpdateEntry,
      publish: mockPublishEntry,
    },
    asset: {
      update: mockUpdateAsset,
      processForLocale: mockProcessAsset,
      publish: mockPublishAsset,
    },
    locale: {
      create: jest.fn().mockReturnValue(Promise.resolve({ code: 'something' })),
      update: jest.fn().mockReturnValue(Promise.resolve({ code: 'something' })),
    },
  }),
}));

jest.mock('core/NgRegistry', () => ({
  getModule: () => ({
    $apply: (fn) => fn(),
  }),
}));

describe('Space Template creation service', () => {
  let creator, stubs, spaceContext, enrichTemplate;

  beforeEach(async function () {
    stubs = {
      progressSuccess: jest.fn(),
      progressError: jest.fn(),
      success: jest.fn(),
      error: jest.fn(),
      retrySuccess: jest.fn(),
      getContentPreview: jest.fn(),
      createContentPreview: jest.fn(),
      refreshLocaleStore: jest.fn(),
      setActiveLocales: jest.fn(),
      createApiKey: jest.fn().mockReturnValue(Promise.resolve()),
      getAllApiKeys: jest.fn().mockReturnValue(Promise.resolve([{ accessToken: 'mock-token' }])),
    };

    // we don't care about template info, because we describe enrichTemplate function by ourselves
    EnrichTemplate.enrichTemplate = (_templateInfo, template) => enrichTemplate(template);
    LocaleStore.default = {
      refresh: stubs.refreshLocaleStore,
      setActiveLocales: stubs.setActiveLocales,
    };

    ContentPreview.getContentPreview = () => ({
      getAll: stubs.getContentPreview,
      create: stubs.createContentPreview,
    });

    ApiKeysManagement.getApiKeyRepo = () => ({
      create: stubs.createApiKey,
      getAll: stubs.getAllApiKeys,
    });

    ApiKeysManagement.purgeApiKeyRepoCache = jest.fn();
  });

  afterEach(() => {
    creator = stubs = spaceContext = null;
  });

  describe('creates content based on a template', () => {
    let template;
    beforeEach(async function () {
      // we enrich template with 2 editor interfaces
      // but only 1 matches the content type we publish
      enrichTemplate = (template) => ({
        ...template,
        editorInterfaces: [
          {
            sys: {
              contentType: {
                sys: { id: 'ct1' },
              },
            },
          },
          {
            sys: {
              contentType: {
                sys: { id: 'unexisting_ct' },
              },
            },
          },
        ],
      });
      stubs.getContentPreview.mockReturnValue(Promise.resolve([]));
      stubs.createContentPreview.mockReturnValue(Promise.resolve({ sys: { id: 1 }, name: 'test' }));
      template = {
        contentTypes: [{ sys: { id: 'ct1' } }, { sys: { id: 'ct2' } }, { sys: { id: 'ct3' } }],
        assets: [
          {
            sys: { id: 'a1' },
            fields: { file: { 'en-US': 'val' } },
          },
          {
            sys: { id: 'a2' },
            fields: { file: { 'en-US': 'val' } },
          },
          {
            sys: { id: 'a3' },
            fields: { file: { 'en-US': 'val' } },
          },
        ],
        entries: [
          {
            sys: { id: 'e1', contentType: { sys: { id: 'ct1' } } },
            fields: { file: { 'en-US': 'val' } },
          },
          {
            sys: { id: 'e2', contentType: { sys: { id: 'ct2' } } },
            fields: { file: { 'en-US': 'val' } },
          },
          {
            sys: { id: 'e3', contentType: { sys: { id: 'ct3' } } },
            fields: { file: { 'en-US': 'val' } },
          },
        ],
        apiKeys: [{ sys: { id: 'ak1' } }, { sys: { id: 'ak2' } }],
        space: {
          locales: [
            {
              code: 'en-US',
            },
          ],
        },
      };

      spaceContext = {
        getEnvironmentId: _.constant('master'),
        getId: _.constant('123'),
      };

      mockUpdateContentType
        .mockResolvedValueOnce(template.contentTypes[0])
        .mockResolvedValueOnce(template.contentTypes[1])
        .mockRejectedValueOnce(new Error('cannot create a content type'));
      mockPublishContentType.mockReturnValue(Promise.resolve({ sys: { id: 'ct1' } }));

      mockUpdateEditorInterface.mockResolvedValue();

      mockUpdateAsset
        .mockResolvedValueOnce(template.assets[0])
        .mockResolvedValueOnce(template.assets[1])
        .mockRejectedValueOnce(new Error('cannot create an asset'));
      mockProcessAsset.mockReturnValue(Promise.resolve());
      mockPublishAsset.mockReturnValue(Promise.resolve());

      mockUpdateEntry
        .mockResolvedValueOnce(template.entries[0])
        .mockResolvedValueOnce(template.entries[1])
        .mockRejectedValueOnce(new Error('cannot create an entry'));
      mockPublishEntry.mockReturnValue(Promise.resolve());

      creator = spaceTemplateCreator.getCreator(
        spaceContext,
        { onItemSuccess: stubs.progressSuccess, onItemError: stubs.progressError },
        { name: 'Template name', spaceId: 'some_random_id' },
        'de-DE'
      );

      await creator
        .create(template)
        .spaceSetup.then((data) => {
          stubs.success(data);
        })
        .catch(() => {
          stubs.error();
        });
    });

    it('attempts to create 3 content types', () => {
      expect(mockUpdateContentType).toHaveBeenCalledTimes(3);
    });

    it('publishes 2 content types', () => {
      expect(mockPublishContentType).toHaveBeenCalledTimes(2);
    });

    it('creates 1 editor interface', () => {
      expect(mockUpdateEditorInterface).toHaveBeenCalledTimes(1);
    });

    it('attempts to create 3 assets', () => {
      expect(mockUpdateAsset).toHaveBeenCalledTimes(3);
    });

    it('transforms assets locale', () => {
      expect(_.keys(mockUpdateAsset.mock.calls[0][1].fields.file)[0]).toEqual('de-DE');
      expect(_.keys(mockUpdateAsset.mock.calls[1][1].fields.file)[0]).toEqual('de-DE');
      expect(_.keys(mockUpdateAsset.mock.calls[2][1].fields.file)[0]).toEqual('de-DE');
    });

    it('processes 2 assets', () => {
      expect(mockProcessAsset).toHaveBeenCalledTimes(2);
    });

    it('publishes 2 assets', () => {
      expect(mockPublishAsset).toHaveBeenCalledTimes(2);
    });

    it('attempts to create 3 entries', () => {
      expect(mockUpdateEntry).toHaveBeenCalledTimes(3);
    });

    it('calls entry with content type id', () => {
      const ctHeader = (contentTypeId) => ({ 'X-Contentful-Content-Type': contentTypeId });
      expect(mockUpdateEntry.mock.calls[0][2]).toEqual(ctHeader('ct1'));
      expect(mockUpdateEntry.mock.calls[1][2]).toEqual(ctHeader('ct2'));
      expect(mockUpdateEntry.mock.calls[2][2]).toEqual(ctHeader('ct3'));
    });

    it('transforms entries locale', () => {
      expect(_.keys(mockUpdateEntry.mock.calls[0][1].fields.file)[0]).toEqual('de-DE');
      expect(_.keys(mockUpdateEntry.mock.calls[1][1].fields.file)[0]).toEqual('de-DE');
      expect(_.keys(mockUpdateEntry.mock.calls[2][1].fields.file)[0]).toEqual('de-DE');
    });

    it('publishes 2 entries', () => {
      expect(mockPublishEntry).toHaveBeenCalledTimes(2);
    });

    it('creates 2 apikeys', () => {
      expect(stubs.createApiKey).toHaveBeenCalledTimes(2);
    });

    it('creates 1 preview environment', () => {
      const env = stubs.createContentPreview.mock.calls[0][0];
      expect(stubs.getContentPreview).toHaveBeenCalledTimes(1);
      expect(env.name).toBe('Discovery App');
      expect(env.configs).toHaveLength(3);
    });

    it('refreshes the locale store', () => {
      expect(stubs.refreshLocaleStore).toHaveBeenCalledTimes(1);
    });

    it('set active locales', () => {
      expect(stubs.refreshLocaleStore).toHaveBeenCalledTimes(1);
    });

    it('updates success progress 17 times', () => {
      expect(stubs.progressSuccess).toHaveBeenCalledTimes(17);
    });

    it('updates error progress 3 times', () => {
      expect(stubs.progressError).toHaveBeenCalledTimes(3);
    });

    it('rejects promise because some have failed', () => {
      expect(stubs.error).toHaveBeenCalled();
    });

    describe('retries creating the failed entities', () => {
      beforeEach(async function () {
        mockUpdateContentType.mockReset();
        mockUpdateEntry.mockReset();
        mockUpdateAsset.mockReset();

        const template = {
          contentTypes: [{ sys: { id: 'ct1' } }, { sys: { id: 'ct2' } }, { sys: { id: 'ct3' } }],
          assets: [
            {
              sys: { id: 'a1' },
              fields: { file: { 'en-US': 'val' } },
            },
            {
              sys: { id: 'a2' },
              fields: { file: { 'en-US': 'val' } },
            },
            {
              sys: { id: 'a3' },
              fields: { file: { 'en-US': 'val' } },
            },
          ],
          entries: [
            {
              sys: { id: 'e1', contentType: { sys: { id: 'ct1' } } },
              fields: { file: { 'en-US': 'val' } },
            },
            {
              sys: { id: 'e2', contentType: { sys: { id: 'ct2' } } },
              fields: { file: { 'en-US': 'val' } },
            },
            {
              sys: { id: 'e3', contentType: { sys: { id: 'ct3' } } },
              fields: { file: { 'en-US': 'val' } },
            },
          ],
          apiKeys: [{ sys: { id: 'ak1' } }, { sys: { id: 'ak2' } }],
          space: {
            locales: [],
          },
        };

        mockUpdateContentType.mockReturnValue(Promise.resolve({ sys: { id: 'ct3' } }));
        mockPublishContentType.mockReturnValue(Promise.resolve());

        mockUpdateAsset.mockReturnValue(Promise.resolve({ sys: { id: 'a3' } }));
        mockProcessAsset.mockReturnValue(Promise.resolve());
        mockPublishAsset.mockReturnValue(Promise.resolve());

        mockUpdateEntry.mockReturnValue(Promise.resolve({ sys: { id: 'e3' } }));
        mockPublishEntry.mockReturnValue(Promise.resolve());

        await creator.create(template).spaceSetup.catch(stubs.retrySuccess);
      });

      it('creates 1 content type', () => {
        expect(mockUpdateContentType).toHaveBeenCalledTimes(1);
      });

      it('has published all 3 content types', () => {
        expect(mockPublishContentType).toHaveBeenCalledTimes(3);
      });

      it('creates 1 asset', () => {
        expect(mockUpdateAsset).toHaveBeenCalledTimes(1);
      });

      it('has processed all 3 assets', () => {
        expect(mockProcessAsset).toHaveBeenCalledTimes(3);
      });

      it('has published all 3 assets', () => {
        expect(mockPublishAsset).toHaveBeenCalledTimes(3);
      });

      it('creates 1 entry', () => {
        expect(mockUpdateEntry).toHaveBeenCalledTimes(1);
      });

      it('has published all 3 entries', () => {
        expect(mockPublishEntry).toHaveBeenCalledTimes(3);
      });

      it('updates success progress 24 times in total', () => {
        expect(stubs.progressSuccess).toHaveBeenCalledTimes(24);
      });

      it('updates error progress 4 times in total', () => {
        expect(stubs.progressError).toHaveBeenCalledTimes(3);
      });

      it('rejects promise because some have failed', () => {
        expect(stubs.retrySuccess).toHaveBeenCalled();
      });
    });
  });
});
