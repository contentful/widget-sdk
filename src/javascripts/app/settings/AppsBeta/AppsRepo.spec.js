import createAppsRepo from './AppsRepo';
import appsListingEntryMock from './mockData/appsListingEntryMock.json';
import appEntryMock from './mockData/appEntryMock.json';

const NETLIFY_APP_ID = 'netlify';
const NETLIFY_EXTENSION_DEFINITION_ID = '1VchawWvbIClHuMIyxwR5m';

describe('AppsRepo', () => {
  describe('getAppWidgets', () => {
    const originalFetch = global.window.fetch;
    const netlifyExtension = {
      sys: { type: 'Extension', id: 'netlify-extension-id' },
      extensionDefinition: {
        sys: {
          type: 'Link',
          linkType: 'ExtensionDefinition',
          id: NETLIFY_EXTENSION_DEFINITION_ID
        }
      }
    };
    const netlifyDefinition = {
      sys: { type: 'ExtensionDefinition', id: NETLIFY_EXTENSION_DEFINITION_ID },
      name: 'Netlify',
      locations: ['app', 'entry-sidebar'],
      src: 'http://localhost:1234'
    };
    const loader = {
      getByIds: jest.fn(() => {
        return Promise.resolve({ [NETLIFY_EXTENSION_DEFINITION_ID]: netlifyDefinition });
      })
    };
    const spaceEndpoint = jest.fn(() => {
      return Promise.resolve({ items: [netlifyExtension] });
    });
    const repo = createAppsRepo(loader, spaceEndpoint);

    afterAll(() => {
      global.window.fetch = originalFetch;
    });

    it('should return an object of apps when the endpoint returns good data', async () => {
      const mockFetch = jest.fn(() => {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(appsListingEntryMock) });
      });

      global.window.fetch = mockFetch;

      const result = await repo.getAppWidgets();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://cdn.contentful.com/spaces/lpjm8d10rkpy/entries?include=10&sys.id[in]=2fPbSMx3baxlwZoCyXC7F1',
        { headers: { Authorization: 'Bearer XMf7qZNsdNypDfO9TC1NZK2YyitHORa_nIYqYdpnQhk' } }
      );

      expect(result).toMatchSnapshot();
    });
  });

  describe('getMarketplaceApps', () => {
    const originalFetch = global.window.fetch;
    const netlifyInstallation = {
      sys: {
        type: 'AppInstallation',
        appDefinition: {
          sys: {
            type: 'Link',
            linkType: 'AppDefinition',
            id: NETLIFY_EXTENSION_DEFINITION_ID
          }
        }
      }
    };
    const netlifyDefinition = {
      sys: { type: 'AppDefinition', id: NETLIFY_EXTENSION_DEFINITION_ID },
      name: 'Netlify',
      locations: ['app', 'entry-sidebar'],
      src: 'http://localhost:1234'
    };
    const loader = {
      getByIds: jest.fn(() => {
        return Promise.resolve({ [NETLIFY_EXTENSION_DEFINITION_ID]: netlifyDefinition });
      })
    };
    const spaceEndpoint = jest.fn(() => {
      return Promise.resolve({ items: [netlifyInstallation] });
    });
    const repo = createAppsRepo(loader, spaceEndpoint);

    afterAll(() => {
      global.window.fetch = originalFetch;
    });

    it('should return an empty array if the endpoint returns no data', async () => {
      const mockFetch = jest.fn(() => {
        return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
      });

      global.window.fetch = mockFetch;

      const result = await repo.getMarketplaceApps();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://cdn.contentful.com/spaces/lpjm8d10rkpy/entries?include=10&sys.id[in]=2fPbSMx3baxlwZoCyXC7F1',
        { headers: { Authorization: 'Bearer XMf7qZNsdNypDfO9TC1NZK2YyitHORa_nIYqYdpnQhk' } }
      );

      expect(result).toEqual([]);
    });

    it('should return an empty array if the endpoint returns bad data', async () => {
      const mockFetch = jest.fn(() => {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ items: [], includes: { Assets: [] }, sys: {} })
        });
      });

      global.window.fetch = mockFetch;

      const result = await repo.getMarketplaceApps();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://cdn.contentful.com/spaces/lpjm8d10rkpy/entries?include=10&sys.id[in]=2fPbSMx3baxlwZoCyXC7F1',
        { headers: { Authorization: 'Bearer XMf7qZNsdNypDfO9TC1NZK2YyitHORa_nIYqYdpnQhk' } }
      );

      expect(result).toEqual([]);
    });
    it('should return an object of apps when the endpoint returns good data', async () => {
      const mockFetch = jest.fn(() => {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(appsListingEntryMock) });
      });

      global.window.fetch = mockFetch;

      const result = await repo.getMarketplaceApps();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://cdn.contentful.com/spaces/lpjm8d10rkpy/entries?include=10&sys.id[in]=2fPbSMx3baxlwZoCyXC7F1',
        { headers: { Authorization: 'Bearer XMf7qZNsdNypDfO9TC1NZK2YyitHORa_nIYqYdpnQhk' } }
      );

      expect(result).toMatchSnapshot();
    });
  });
  describe('getDevApps', () => {
    it('returns fake dev apps for all extension definitions in the current org', async () => {
      const definitions = [
        { sys: { type: 'AppDefinition', id: 'org-def-1' } },
        { sys: { type: 'AppDefinition', id: 'org-def-2' } }
      ];

      const installation = {
        sys: {
          type: 'AppInstallation',
          appDefinition: {
            sys: {
              type: 'Link',
              linkType: 'AppDefinition',
              id: 'org-def-2'
            }
          }
        }
      };

      const loader = {
        getAllForCurrentOrganization: jest.fn(() => Promise.resolve(definitions))
      };

      const spaceEndpoint = jest.fn(() => Promise.resolve({ items: [installation] }));

      const repo = createAppsRepo(loader, spaceEndpoint);
      const result = await repo.getDevApps();

      expect(loader.getAllForCurrentOrganization).toBeCalledTimes(1);
      expect(spaceEndpoint).toBeCalledTimes(1);
      expect(spaceEndpoint).toBeCalledWith({
        method: 'GET',
        path: ['app_installations']
      });

      expect(result).toEqual([
        {
          sys: { type: 'DevApp', id: 'dev-app_org-def-1' },
          extensionDefinition: definitions[0]
        },
        {
          sys: { type: 'DevApp', id: 'dev-app_org-def-2' },
          extensionDefinition: definitions[1],
          extension: installation
        }
      ]);
    });
  });

  describe('getAppDefinitionForApp', () => {
    const originalFetch = global.window.fetch;

    beforeAll(() => {
      const mockFetch = jest.fn(() => {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(appEntryMock) });
      });
      global.window.fetch = mockFetch;
    });

    afterAll(() => {
      global.window.fetch = originalFetch;
    });

    it('fetches definition by app ID', async () => {
      const loader = { getById: jest.fn(() => Promise.resolve('DEFINITION')) };

      const repo = createAppsRepo(loader);
      const result = await repo.getAppDefinitionForApp(NETLIFY_APP_ID);

      expect(loader.getById).toBeCalledTimes(1);
      expect(loader.getById).toBeCalledWith(NETLIFY_EXTENSION_DEFINITION_ID);
      expect(result).toBe('DEFINITION');
    });

    it('rethrows loader errors', async () => {
      const loader = {
        getById: jest.fn(() => {
          throw new Error('boom');
        })
      };

      const repo = createAppsRepo(loader);
      expect.assertions(2);
      try {
        await repo.getAppDefinitionForApp('netlify');
      } catch (err) {
        expect(loader.getById).toBeCalledTimes(1);
        expect(err.message).toBe('boom');
      }
    });

    it('derives extension definition ID from a dev app ID', async () => {
      const loader = { getById: jest.fn(() => Promise.resolve('DEFINITION')) };

      const repo = createAppsRepo(loader);
      const result = await repo.getAppDefinitionForApp('dev-app_my-definition');

      expect(loader.getById).toBeCalledTimes(1);
      expect(loader.getById).toBeCalledWith('my-definition');
      expect(result).toBe('DEFINITION');
    });
  });

  describe('getAppInstallation', () => {
    const definition = {
      sys: {
        type: 'AppDefinition',
        id: 'my-app-def'
      }
    };

    const installation = {
      sys: {
        type: 'AppInstallation',
        appDefinition: {
          sys: {
            type: 'Link',
            linkType: definition.sys.type,
            id: definition.sys.id
          }
        }
      }
    };

    it('returns installation if present', async () => {
      const spaceEndpoint = jest.fn(() => Promise.resolve(installation));

      const repo = createAppsRepo(jest.fn(), spaceEndpoint);
      const res = await repo.getAppInstallation(definition.sys.id);

      expect(res.sys.appDefinition.sys.id).toBe('my-app-def');
      expect(spaceEndpoint).toBeCalledTimes(1);
      expect(spaceEndpoint).toBeCalledWith({
        method: 'GET',
        path: ['app_installations', definition.sys.id]
      });
    });

    it('fails if API call fails', async () => {
      const spaceEndpoint = jest.fn(() => Promise.reject(new Error('api error')));
      const repo = createAppsRepo(jest.fn(), spaceEndpoint);

      expect.assertions(1);
      try {
        await repo.getAppInstallation(definition.sys.id);
      } catch (err) {
        expect(err.message).toBe('api error');
      }
    });
  });

  describe('isDevApp', () => {
    const repo = createAppsRepo(jest.fn(), jest.fn());

    it('should return false when not passed a string', () => {
      [false, [], {}, 0, null, undefined].forEach(type => {
        expect(repo.isDevApp(type)).toBe(false);
      });
    });

    it('should return false for non dev ids', () => {
      ['myApp', 'optimizely', 'not-a-dev-app'].forEach(type => {
        expect(repo.isDevApp(type)).toBe(false);
      });
    });

    it('should return true for dev app ids', () => {
      ['dev-app_something', 'dev-app'].forEach(type => {
        expect(repo.isDevApp(type)).toBe(true);
      });
    });
  });
});
