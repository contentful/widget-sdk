import _ from 'lodash';
import * as spaceTemplateCreator from 'services/SpaceTemplateCreator';

import * as LocaleRepo from 'data/CMA/LocaleRepo';
import * as EnrichTemplate from 'services/SpaceTemplateCreator/enrichTemplate';
import * as LocaleStore from 'services/localeStore';
import * as ContentPreview from 'features/content-preview';
import * as ApiKeysManagement from 'features/api-keys-management';

jest.mock('data/EndpointFactory', () => ({ createSpaceEndpoint: jest.fn() }));
jest.mock('data/CMA/LocaleRepo');
jest.mock('./createAssetFileProcessedHandler', () => ({
  createAssetFileProcessedHandler: jest.fn().mockReturnValue((_, callback) => callback()),
}));
jest.mock('analytics/Analytics', () => ({ track: jest.fn() }));
jest.mock('services/SpaceTemplateCreator/enrichTemplate');
jest.mock('services/localeStore');
jest.mock('features/content-preview');
jest.mock('features/api-keys-management');

jest.mock('core/NgRegistry', () => ({
  getModule: () => ({
    $apply: (fn) => fn(),
  }),
}));

describe('Space Template creation service', () => {
  let creator, stubs, spaceContext, enrichTemplate;

  beforeEach(async function () {
    stubs = {
      ctPublish: jest.fn(),
      assetPublish: jest.fn(),
      assetProcess: jest.fn(),
      entryPublish: jest.fn(),
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
      createLocaleRepo: jest.fn().mockReturnValue({
        save: jest.fn().mockReturnValue(Promise.resolve({ code: 'something' })),
      }),
    };

    LocaleRepo.default = stubs.createLocaleRepo;

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
        contentTypes: [
          { sys: { id: 'ct1' }, publish: stubs.ctPublish },
          { sys: { id: 'ct2' }, publish: stubs.ctPublish },
          { sys: { id: 'ct3' }, publish: stubs.ctPublish },
        ],
        assets: [
          {
            sys: { id: 'a1' },
            fields: { file: { 'en-US': 'val' } },
            process: stubs.assetProcess,
            publish: stubs.assetPublish,
          },
          {
            sys: { id: 'a2' },
            fields: { file: { 'en-US': 'val' } },
            process: stubs.assetProcess,
            publish: stubs.assetPublish,
          },
          {
            sys: { id: 'a3' },
            fields: { file: { 'en-US': 'val' } },
            process: stubs.assetProcess,
            publish: stubs.assetPublish,
          },
        ],
        entries: [
          {
            sys: { id: 'e1', contentType: { sys: { id: 'ct1' } } },
            fields: { file: { 'en-US': 'val' } },
            publish: stubs.entryPublish,
          },
          {
            sys: { id: 'e2', contentType: { sys: { id: 'ct2' } } },
            fields: { file: { 'en-US': 'val' } },
            publish: stubs.entryPublish,
          },
          {
            sys: { id: 'e3', contentType: { sys: { id: 'ct3' } } },
            fields: { file: { 'en-US': 'val' } },
            publish: stubs.entryPublish,
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
        space: {
          getId: _.constant('123'),
          createContentType: jest.fn(),
          createEntry: jest.fn(),
          createAsset: jest.fn(),
          getContentType: jest.fn().mockResolvedValue(),
        },
        cma: {
          updateEditorInterface: jest.fn().mockResolvedValue(),
        },
      };

      spaceContext.space.createContentType
        .mockResolvedValueOnce(template.contentTypes[0])
        .mockResolvedValueOnce(template.contentTypes[1])
        .mockRejectedValueOnce(new Error('can not create a content type'));
      stubs.ctPublish.mockReturnValue(Promise.resolve({ data: { sys: { id: 'ct1' } } }));

      spaceContext.space.createAsset
        .mockResolvedValueOnce(template.assets[0])
        .mockResolvedValueOnce(template.assets[1])
        .mockRejectedValueOnce(new Error('can not create an asset'));
      stubs.assetProcess.mockReturnValue(Promise.resolve());
      stubs.assetPublish.mockReturnValue(Promise.resolve());

      spaceContext.space.createEntry
        .mockResolvedValueOnce(template.entries[0])
        .mockResolvedValueOnce(template.entries[1])
        .mockRejectedValueOnce(new Error('can not create an entry'));
      stubs.entryPublish.mockReturnValue(Promise.resolve());

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
      expect(spaceContext.space.createContentType).toHaveBeenCalledTimes(3);
    });

    it('publishes 2 content types', () => {
      expect(stubs.ctPublish).toHaveBeenCalledTimes(2);
    });

    it('creates 1 editor interface', () => {
      expect(spaceContext.cma.updateEditorInterface).toHaveBeenCalledTimes(1);
    });

    it('attempts to create 3 assets', () => {
      expect(spaceContext.space.createAsset).toHaveBeenCalledTimes(3);
    });

    it('transforms assets locale', () => {
      expect(_.keys(spaceContext.space.createAsset.mock.calls[0][0].fields.file)[0]).toEqual(
        'de-DE'
      );
      expect(_.keys(spaceContext.space.createAsset.mock.calls[1][0].fields.file)[0]).toEqual(
        'de-DE'
      );
      expect(_.keys(spaceContext.space.createAsset.mock.calls[2][0].fields.file)[0]).toEqual(
        'de-DE'
      );
    });

    it('processes 2 assets', () => {
      expect(stubs.assetProcess).toHaveBeenCalledTimes(2);
    });

    it('publishes 2 assets', () => {
      expect(stubs.assetPublish).toHaveBeenCalledTimes(2);
    });

    it('attempts to create 3 entries', () => {
      expect(spaceContext.space.createEntry).toHaveBeenCalledTimes(3);
    });

    it('calls entry with content type id', () => {
      expect(spaceContext.space.createEntry.mock.calls[0][0]).toEqual('ct1');
      expect(spaceContext.space.createEntry.mock.calls[1][0]).toEqual('ct2');
      expect(spaceContext.space.createEntry.mock.calls[2][0]).toEqual('ct3');
    });

    it('transforms entries locale', () => {
      expect(_.keys(spaceContext.space.createEntry.mock.calls[0][1].fields.file)[0]).toEqual(
        'de-DE'
      );
      expect(_.keys(spaceContext.space.createEntry.mock.calls[1][1].fields.file)[0]).toEqual(
        'de-DE'
      );
      expect(_.keys(spaceContext.space.createEntry.mock.calls[2][1].fields.file)[0]).toEqual(
        'de-DE'
      );
    });

    it('publishes 2 entries', () => {
      expect(stubs.entryPublish).toHaveBeenCalledTimes(2);
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

    it('updates error progress 4 times', () => {
      expect(stubs.progressError).toHaveBeenCalledTimes(3);
    });

    it('rejects promise because some have failed', () => {
      expect(stubs.error).toHaveBeenCalled();
    });

    describe('retries creating the failed entities', () => {
      beforeEach(async function () {
        const template = {
          contentTypes: [
            { sys: { id: 'ct1' }, publish: stubs.ctPublish },
            { sys: { id: 'ct2' }, publish: stubs.ctPublish },
            { sys: { id: 'ct3' }, publish: stubs.ctPublish },
          ],
          assets: [
            {
              sys: { id: 'a1' },
              fields: { file: { 'en-US': 'val' } },
              process: stubs.assetProcess,
              publish: stubs.assetPublish,
            },
            {
              sys: { id: 'a2' },
              fields: { file: { 'en-US': 'val' } },
              process: stubs.assetProcess,
              publish: stubs.assetPublish,
            },
            {
              sys: { id: 'a3' },
              fields: { file: { 'en-US': 'val' } },
              process: stubs.assetProcess,
              publish: stubs.assetPublish,
            },
          ],
          entries: [
            {
              sys: { id: 'e1', contentType: { sys: { id: 'ct1' } } },
              fields: { file: { 'en-US': 'val' } },
              publish: stubs.entryPublish,
            },
            {
              sys: { id: 'e2', contentType: { sys: { id: 'ct2' } } },
              fields: { file: { 'en-US': 'val' } },
              publish: stubs.entryPublish,
            },
            {
              sys: { id: 'e3', contentType: { sys: { id: 'ct3' } } },
              fields: { file: { 'en-US': 'val' } },
              publish: stubs.entryPublish,
            },
          ],
          apiKeys: [{ sys: { id: 'ak1' } }, { sys: { id: 'ak2' } }],
          space: {
            locales: [],
          },
        };
        spaceContext.space.createContentType = jest.fn();
        spaceContext.space.createEntry = jest.fn();
        spaceContext.space.createAsset = jest.fn();

        spaceContext.space.createContentType.mockReturnValue(
          Promise.resolve({ sys: { id: 'ct3' }, publish: stubs.ctPublish })
        );
        stubs.ctPublish.mockReturnValue(Promise.resolve());

        spaceContext.space.createAsset.mockReturnValue(
          Promise.resolve({
            sys: { id: 'a3' },
            process: stubs.assetProcess,
            publish: stubs.assetPublish,
          })
        );
        stubs.assetProcess.mockReturnValue(Promise.resolve());
        stubs.assetPublish.mockReturnValue(Promise.resolve());

        spaceContext.space.createEntry.mockReturnValue(
          Promise.resolve({ sys: { id: 'e3' }, publish: stubs.entryPublish })
        );
        stubs.entryPublish.mockReturnValue(Promise.resolve());

        await creator.create(template).spaceSetup.catch(stubs.retrySuccess);
      });

      it('creates 1 content type', () => {
        expect(spaceContext.space.createContentType).toHaveBeenCalledTimes(1);
      });

      it('has published all 3 content types', () => {
        expect(stubs.ctPublish).toHaveBeenCalledTimes(3);
      });

      it('creates 1 asset', () => {
        expect(spaceContext.space.createAsset).toHaveBeenCalledTimes(1);
      });

      it('has processed all 3 assets', () => {
        expect(stubs.assetProcess).toHaveBeenCalledTimes(3);
      });

      it('has published all 3 assets', () => {
        expect(stubs.assetPublish).toHaveBeenCalledTimes(3);
      });

      it('creates 1 entry', () => {
        expect(spaceContext.space.createEntry).toHaveBeenCalledTimes(1);
      });

      it('has published all 3 entries', () => {
        expect(stubs.entryPublish).toHaveBeenCalledTimes(3);
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
