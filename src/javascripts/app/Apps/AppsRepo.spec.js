import createAppsRepo from './AppsRepo';
import appsListingEntryMock from './__mocks__/appsListingEntryMock.json';
import allAppsMock from './__mocks__/appEntriesMock.json';

const NETLIFY_DEFINITION_ID = '1VchawWvbIClHuMIyxwR5m';

describe('AppsRepo', () => {
  let originalFetch;

  beforeAll(() => {
    originalFetch = global.window.fetch;
  });

  afterAll(() => {
    global.window.fetch = originalFetch;
  });

  const netlifyInstallation = {
    sys: {
      type: 'AppInstallation',
      appDefinition: {
        sys: {
          type: 'Link',
          linkType: 'AppDefinition',
          id: NETLIFY_DEFINITION_ID,
        },
      },
    },
  };

  const netlifyDefinition = {
    sys: { type: 'AppDefinition', id: NETLIFY_DEFINITION_ID },
    name: 'Netlify',
    locations: ['app', 'entry-sidebar'],
    src: 'http://localhost:1234',
  };

  const privateDefinition = {
    sys: { type: 'AppDefinition', id: 'app-definition-id' },
    name: 'My app',
    locations: ['app', 'entry-field'],
    src: 'http://localhost:666',
  };

  const loader = {
    getByIds: jest.fn(() => {
      return Promise.resolve({ [NETLIFY_DEFINITION_ID]: netlifyDefinition });
    }),
    getAllForCurrentOrganization: jest.fn(() => {
      return Promise.resolve([privateDefinition]);
    }),
  };

  const cma = {
    getAppInstallations: jest.fn(() => {
      return Promise.resolve({ items: [netlifyInstallation] });
    }),
  };

  describe('getApps', () => {
    it('should only return private apps if the marketplace endpoint returns no data', async () => {
      const mockFetch = jest.fn(() => {
        return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
      });

      global.window.fetch = mockFetch;

      const repo = createAppsRepo(cma, loader);
      const result = await repo.getApps();

      expect(
        mockFetch
      ).toHaveBeenCalledWith(
        'https://cdn.contentful.com/spaces/lpjm8d10rkpy/entries?include=0&sys.id[in]=2fPbSMx3baxlwZoCyXC7F1',
        { headers: { Authorization: 'Bearer XMf7qZNsdNypDfO9TC1NZK2YyitHORa_nIYqYdpnQhk' } }
      );

      expect(
        mockFetch
      ).toHaveBeenCalledWith(
        'https://cdn.contentful.com/spaces/lpjm8d10rkpy/entries?include=10&content_type=app',
        { headers: { Authorization: 'Bearer XMf7qZNsdNypDfO9TC1NZK2YyitHORa_nIYqYdpnQhk' } }
      );

      expect(result).toEqual([
        {
          appDefinition: privateDefinition,
          id: 'private_app-definition-id',
          title: 'My app',
          isPrivateApp: true,
        },
      ]);
    });

    it('should only return private apps the marketplace endpoint returns bad data', async () => {
      const mockFetch = jest.fn(() => {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ items: [], includes: { Assets: [] }, sys: {} }),
        });
      });

      global.window.fetch = mockFetch;

      const repo = createAppsRepo(cma, loader);
      const result = await repo.getApps();

      expect(result).toEqual([
        {
          appDefinition: privateDefinition,
          id: 'private_app-definition-id',
          title: 'My app',
          isPrivateApp: true,
        },
      ]);
    });

    it('should return an array of apps when the marketplace endpoint returns good data', async () => {
      const mockFetch = jest.fn((url) => {
        const jsonResponse = url.endsWith('2fPbSMx3baxlwZoCyXC7F1')
          ? appsListingEntryMock
          : allAppsMock;
        return Promise.resolve({ ok: true, json: () => Promise.resolve(jsonResponse) });
      });

      global.window.fetch = mockFetch;

      const repo = createAppsRepo(cma, loader);
      const result = await repo.getApps();

      expect(
        mockFetch
      ).toHaveBeenCalledWith(
        'https://cdn.contentful.com/spaces/lpjm8d10rkpy/entries?include=0&sys.id[in]=2fPbSMx3baxlwZoCyXC7F1',
        { headers: { Authorization: 'Bearer XMf7qZNsdNypDfO9TC1NZK2YyitHORa_nIYqYdpnQhk' } }
      );

      expect(
        mockFetch
      ).toHaveBeenCalledWith(
        'https://cdn.contentful.com/spaces/lpjm8d10rkpy/entries?include=10&content_type=app',
        { headers: { Authorization: 'Bearer XMf7qZNsdNypDfO9TC1NZK2YyitHORa_nIYqYdpnQhk' } }
      );

      expect(result).toMatchSnapshot();
    });
  });

  describe('getApp', () => {
    beforeEach(() => {
      global.window.fetch = jest.fn((url) => {
        const jsonResponse = url.endsWith('2fPbSMx3baxlwZoCyXC7F1')
          ? // listing
            appsListingEntryMock
          : // apps
            allAppsMock;

        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(jsonResponse),
        });
      });
    });

    it('returns an app if present', async () => {
      const repo = createAppsRepo(cma, loader);

      const app1 = await repo.getApp('private_app-definition-id');
      expect(app1.appDefinition).toEqual(privateDefinition);

      const app2 = await repo.getApp('netlify');
      expect(app2.appDefinition).toEqual(netlifyDefinition);
      expect(app2.appInstallation).toEqual(netlifyInstallation);
    });

    it('fails if an app is not present', async () => {
      const repo = createAppsRepo(cma, loader);

      expect.assertions(1);
      try {
        await repo.getApp('not-here');
      } catch (err) {
        expect(err.message).toBe('Could not find an app with ID "not-here".');
      }
    });

    it('fails if API call fails', async () => {
      const cma = {
        getAppInstallations: () => Promise.reject(new Error('api error')),
      };

      const repo = createAppsRepo(cma, loader);

      expect.assertions(1);
      try {
        await repo.getApp('fails-either-way');
      } catch (err) {
        expect(err.message).toBe('api error');
      }
    });
  });
});
