import createAppsRepo from './AppsRepo';
import appsListingEntryMock from './mockData/appsListingEntryMock.json';

const NETLIFY_DEFINITION_ID = '1VchawWvbIClHuMIyxwR5m';

describe('AppsRepo', () => {
  describe('getApps', () => {
    const originalFetch = global.window.fetch;
    const netlifyInstallation = {
      sys: {
        type: 'AppInstallation',
        appDefinition: {
          sys: {
            type: 'Link',
            linkType: 'AppDefinition',
            id: NETLIFY_DEFINITION_ID
          }
        }
      }
    };
    const netlifyDefinition = {
      sys: { type: 'AppDefinition', id: NETLIFY_DEFINITION_ID },
      name: 'Netlify',
      locations: ['app', 'entry-sidebar'],
      src: 'http://localhost:1234'
    };
    const privateDefinition = {
      sys: { type: 'AppDefinition', id: 'private-app-definition-id' },
      name: 'My app',
      locations: ['app', 'entry-field'],
      src: 'http://localhost:666'
    };
    const loader = {
      getByIds: jest.fn(() => {
        return Promise.resolve({ [NETLIFY_DEFINITION_ID]: netlifyDefinition });
      }),
      getAllForCurrentOrganization: jest.fn(() => [privateDefinition])
    };
    const spaceEndpoint = jest.fn(() => {
      return Promise.resolve({ items: [netlifyInstallation] });
    });
    const repo = createAppsRepo(loader, spaceEndpoint);

    afterAll(() => {
      global.window.fetch = originalFetch;
    });

    it('should only return private apps if the marketplace endpoint returns no data', async () => {
      const mockFetch = jest.fn(() => {
        return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
      });

      global.window.fetch = mockFetch;

      const result = await repo.getApps();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://cdn.contentful.com/spaces/lpjm8d10rkpy/entries?include=10&sys.id[in]=2fPbSMx3baxlwZoCyXC7F1',
        { headers: { Authorization: 'Bearer XMf7qZNsdNypDfO9TC1NZK2YyitHORa_nIYqYdpnQhk' } }
      );

      expect(result).toEqual([
        {
          appDefinition: privateDefinition,
          id: 'dev-app_private-app-definition-id',
          title: 'My app',
          installed: false,
          isDevApp: true
        }
      ]);
    });

    it('should only return private apps the marketplace endpoint returns bad data', async () => {
      const mockFetch = jest.fn(() => {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ items: [], includes: { Assets: [] }, sys: {} })
        });
      });

      global.window.fetch = mockFetch;

      const result = await repo.getApps();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://cdn.contentful.com/spaces/lpjm8d10rkpy/entries?include=10&sys.id[in]=2fPbSMx3baxlwZoCyXC7F1',
        { headers: { Authorization: 'Bearer XMf7qZNsdNypDfO9TC1NZK2YyitHORa_nIYqYdpnQhk' } }
      );

      expect(result).toEqual([
        {
          appDefinition: privateDefinition,
          id: 'dev-app_private-app-definition-id',
          title: 'My app',
          installed: false,
          isDevApp: true
        }
      ]);
    });

    it('should return an array of apps when the marketplace endpoint returns good data', async () => {
      const mockFetch = jest.fn(() => {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(appsListingEntryMock) });
      });

      global.window.fetch = mockFetch;

      const result = await repo.getApps();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://cdn.contentful.com/spaces/lpjm8d10rkpy/entries?include=10&sys.id[in]=2fPbSMx3baxlwZoCyXC7F1',
        { headers: { Authorization: 'Bearer XMf7qZNsdNypDfO9TC1NZK2YyitHORa_nIYqYdpnQhk' } }
      );

      expect(result).toMatchSnapshot();
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
});
