import { createSpaceApi } from './createSpaceApi';
import { createContentTypeApi } from './createContentTypeApi';
import { CONTENT_ENTITY_UPDATED_EVENT } from 'services/PubSubService';
import { InternalContentType } from './createContentTypeApi';
import { makeReadOnlyApiError, ReadOnlyApi } from './createReadOnlyApi';
import { ContentType } from '@contentful/app-sdk';
import * as jwt from 'jsonwebtoken';
import APIClient from 'data/APIClient';
import { SpaceContextType } from 'classes/spaceContextTypes';

jest.mock('Config', () => ({
  uploadApiUrl: jest.fn(() => 'example_url'),
}));

jest.mock('services/PubSubService', () => ({
  CONTENT_ENTITY_UPDATED_EVENT: 'CONTENT_ENTITY_UPDATED_EVENT',
}));

jest.mock('Authentication', () => ({
  getToken: jest.fn(() => 'fake_key'),
}));

jest.mock('app/ScheduledActions/DataManagement/ScheduledActionsRepo', () => ({
  getAllScheduledActions: jest.fn(),
  getEntityScheduledActions: jest.fn(),
}));

const pubSubClient = {
  on: jest.fn(),
  off: jest.fn(),
};

const environmentIds = ['my_environment'];

const cma = {
  archiveEntry: jest.fn(),
  archiveAsset: jest.fn(),
  createContentType: jest.fn(),
  createEntry: jest.fn(),
  createAsset: jest.fn(),
  createAssetKey: jest.fn().mockResolvedValue({ policy: 'POLICY', secret: 'SECRET' }),
  deleteAsset: jest.fn(),
  deleteContentType: jest.fn(),
  deleteEntry: jest.fn(),
  getAsset: jest.fn(),
  getAssets: jest.fn(),
  getEditorInterface: jest.fn(),
  getEditorInterfaces: jest.fn(),
  getEntry: jest.fn(),
  getEntrySnapshots: jest.fn(),
  getEntries: jest.fn(),
  getContentType: jest.fn(),
  getContentTypes: jest.fn(),
  getPublishedEntries: jest.fn(),
  getPublishedAssets: jest.fn(),
  processAsset: jest.fn(),
  publishAsset: jest.fn(),
  publishEntry: jest.fn(),
  unarchiveAsset: jest.fn(),
  unarchiveEntry: jest.fn(),
  unpublishAsset: jest.fn(),
  unpublishEntry: jest.fn(),
  updateAsset: jest.fn(),
  updateContentType: jest.fn(),
  updateEntry: jest.fn(),
  validateEntry: jest.fn(),
  validateRelease: jest.fn(),
  executeRelease: jest.fn(),
  signAssetUrl: jest.fn(),
  signRequest: jest.fn(),
};

const tagsRepo = {
  readTags: jest.fn(),
  createTag: jest.fn(),
  deleteTag: jest.fn(),
  updateTag: jest.fn(),
};

const usersRepo = {
  getAll: jest.fn(),
};
const spaceId = 'space_id';

const buildSpaceApi = (
  initialContentTypes: InternalContentType[],
  onEntityChanged?,
  readOnly = false
) => {
  const api = createSpaceApi({
    cma,
    tagsRepo,
    usersRepo,
    spaceId,
    initialContentTypes,
    pubSubClient,
    environmentIds,
    readOnly,
  } as any);

  // onEntityChanged is built internally, so we need to monkey patch to mock it
  return onEntityChanged ? { ...api, onEntityChanged } : api;
};

describe('createSpaceApi', () => {
  describe('getCachedContentTypes', () => {
    describe('with no initial content types', () => {
      it('returns an empty array', () => {
        const spaceApi = buildSpaceApi([]);

        const result = spaceApi.getCachedContentTypes();

        expect(result).toHaveLength(0);
      });
    });

    describe('with initial content types', () => {
      it('creates a contentTypeApi for each', () => {
        const initialContentTypes = [
          {
            sys: {
              type: 'something',
              id: 'conte_type_id',
            } as ContentType['sys'],
            fields: [],
            displayField: 'title',
            description: 'my content type',
            disabled: false,
            id: 'content_type',
            localized: false,
            name: 'my content type',
            omitted: false,
            required: false,
            type: 'Something',
            validations: [],
          },
        ];

        const spaceApi = buildSpaceApi(initialContentTypes);

        const result = spaceApi.getCachedContentTypes();

        expect(result).toEqual(initialContentTypes.map(createContentTypeApi));
      });
    });
  });
  describe('createUpload', () => {
    let originalFetch: any;
    beforeEach(() => {
      originalFetch = window.fetch;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      window.fetch = jest.fn(async () => ({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: jest.fn(async () => ({ foo: 'bar' })),
      }));
    });
    afterEach(() => {
      window.fetch = originalFetch;
    });

    it('calls fetch and returns the json response', async () => {
      const initialContentTypes = [];

      const spaceApi = buildSpaceApi(initialContentTypes);

      // TODO: this function doesn't match the type defined here https://github.com/contentful/ui-extensions-sdk/blob/b0b7931e034362185728f0afeeb3adb96a5e83fb/lib/types.ts#L257
      const result = await spaceApi.createUpload('example data');

      expect(window.fetch).toHaveBeenCalledWith('example_url', expect.any(Object));

      expect(result).toEqual({ foo: 'bar' });
    });
  });

  describe('getUsers', () => {
    it('formats and returns usrs from userRepo', async () => {
      const initialContentTypes = [];
      usersRepo.getAll.mockReturnValueOnce([
        {
          sys: {
            id: 'bob',
          },
          firstName: 'bob',
          lastName: 'cratchit',
          email: 'bob@bob.com',
          avatarUrl: 'www.example.com',
        },
        {
          sys: {
            id: 'ed',
          },
          firstName: 'ed',
          lastName: 'wood',
          email: 'ed@wood.com',
          avatarUrl: 'www.somewhere.com',
        },
      ]);

      const spaceApi = buildSpaceApi(initialContentTypes);

      expect(await spaceApi.getUsers()).toEqual({
        items: [
          {
            firstName: 'bob',
            lastName: 'cratchit',
            email: 'bob@bob.com',
            avatarUrl: 'www.example.com',
            sys: {
              id: 'bob',
              type: 'User',
            },
          },
          {
            firstName: 'ed',
            lastName: 'wood',
            email: 'ed@wood.com',
            avatarUrl: 'www.somewhere.com',
            sys: {
              id: 'ed',
              type: 'User',
            },
          },
        ],
        total: 2,
        limit: 2,
        skip: 0,
        sys: {
          type: 'Array',
        },
      });
    });
  });

  describe('waitUntilAssetProcessed', () => {
    it('returns the asset when cma.getAsset resolves', async () => {
      const initialContentTypes = [];
      const spaceApi = buildSpaceApi(initialContentTypes);

      const promise = spaceApi.waitUntilAssetProcessed('asset_id', 'en');

      cma.getAsset.mockResolvedValueOnce({
        fields: {
          file: {
            en: {
              url: 'www.example.com',
            },
          },
        },
      });

      const result = await promise;

      expect(result).toEqual({
        fields: {
          file: {
            en: {
              url: 'www.example.com',
            },
          },
        },
      });
    });
  });

  describe('onEntityChanged', () => {
    it('registers a handler with the pubsubclient', () => {
      const initialContentTypes = [];
      const spaceApi = buildSpaceApi(initialContentTypes);

      const callback = jest.fn();
      spaceApi.onEntityChanged('Entry', 'my_entity', callback);

      expect(pubSubClient.on).toHaveBeenCalledWith(
        CONTENT_ENTITY_UPDATED_EVENT,
        expect.any(Function)
      );
    });

    describe('when the handler is called', () => {
      it('the callback is called with the result of getEntry', async () => {
        const initialContentTypes = [];
        const spaceApi = buildSpaceApi(initialContentTypes);

        const callback = jest.fn();
        spaceApi.onEntityChanged('Entry', 'my_entity', callback);
        cma.getEntry.mockResolvedValueOnce('data');

        await pubSubClient.on.mock.calls[0][1]({
          environmentId: environmentIds[0],
          entityType: 'Entry',
          entityId: 'my_entity',
        });

        expect(callback).toHaveBeenCalledWith('data');
      });
    });
  });

  describe('when creating read-only API', () => {
    let allMethods, readMethods, handlerMethods, otherMethods, spaceApi;
    beforeEach(() => {
      // Methods whose behaviour is read-only, but they are not getters
      const excludedMethods = ['signAssetUrl'];
      const readOnlyWhiteList = ['readTags', 'waitUntilAssetProcessed', 'createAssetKey'];

      spaceApi = buildSpaceApi([], jest.fn(), true);
      allMethods = Object.getOwnPropertyNames(spaceApi).filter(
        (prop) => typeof spaceApi[prop] === 'function'
      );
      readMethods = allMethods.filter(
        (method) =>
          method.startsWith('get') ||
          (readOnlyWhiteList.includes(method) && !excludedMethods.includes(method))
      );
      handlerMethods = allMethods.filter(
        (method) => method.startsWith('on') && !excludedMethods.includes(method)
      );
      otherMethods = allMethods.filter(
        (method) =>
          !handlerMethods.includes(method) &&
          !readMethods.includes(method) &&
          !excludedMethods.includes(method)
      );
    });

    it(`does not throw on read methods`, async () => {
      for (const method of readMethods) {
        expect(() => spaceApi[method]()).not.toThrow();
      }
    });

    it(`does not throw on handler methods`, async () => {
      for (const method of handlerMethods) {
        expect(() => spaceApi[method]()).not.toThrow();
      }
    });

    it(`throws a ReadOnlyNavigatorAPI error on non-read methods`, () => {
      for (const method of otherMethods) {
        expect(() => spaceApi[method]()).toThrowError(
          makeReadOnlyApiError(ReadOnlyApi.Space, method)
        );
      }
    });
  });

  describe('signAssetUrl', () => {
    it('signs a url correctly', async () => {
      const spaceApi = buildSpaceApi([]);

      const policy = 'POLICY';
      const secret = 'SECRET';

      cma.createAssetKey.mockResolvedValue({ policy, secret });

      const signedUrlStr = await spaceApi.signAssetUrl(
        'https://images.secure.ctfassets.net/spaceid/assetid/rand/filename.png'
      );

      const url = new URL(signedUrlStr);
      const baseUrl = url.origin + url.pathname;

      const token = url.searchParams.get('token');
      expect(token).toBeDefined();
      expect(url.searchParams.get('policy')).toBe(policy);

      jwt.verify(token as string, secret, { subject: baseUrl });
    });

    it('caches signing keys', async () => {
      const spaceApi = buildSpaceApi([]);

      cma.createAssetKey.mockResolvedValue({ policy: 'POLICY', secret: 'SECRET' });

      await spaceApi.signAssetUrl(
        'https://images.secure.ctfassets.net/spaceid/assetid/rand/filename1.png'
      );
      await spaceApi.signAssetUrl(
        'https://images.secure.ctfassets.net/spaceid/assetid/rand/filename2.png'
      );

      expect(cma.createAssetKey).toHaveBeenCalledTimes(1);
    });
  });
});
