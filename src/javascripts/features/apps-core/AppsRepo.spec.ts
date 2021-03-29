import { AppsRepo } from './AppsRepo';
import { window } from 'core/services/window';
import type APIClient from 'data/APIClient';
import { appsListingEntryMock } from './__mocks__/appsListingEntryMock';
import { appEntriesMock } from './__mocks__/appEntriesMock';
import { contentfulAppEntriesMock } from './__mocks__/contentfulAppEntriesMock';
import { resolvedAppMock } from './__mocks__/resolvedAppMock';

const NETLIFY_DEFINITION_ID = '1VchawWvbIClHuMIyxwR5m';
const COMPOSE_DEFINITION_ID = '6TfQEqkcINtj1MS0TuQTWJ';
const FIRST_PARTY_DEFINITION_ID = '4iIetqcwsR1GIZxaYI6fRm';
const APP_LISTING_ID = '2fPbSMx3baxlwZoCyXC7F1';

jest.mock('Config.js', () => ({
  domain: 'contentful.com',
}));

jest.mock('core/services/window', () => ({
  window: {
    fetch: jest.fn(),
    location: {
      search: '',
    },
  },
}));

describe('AppsRepo', () => {
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

  const composeAppDefinition = {
    sys: { type: 'AppDefinition', id: COMPOSE_DEFINITION_ID },
    name: 'Compose',
    locations: ['app', 'entry-sidebar'],
    src: 'http://localhost:1234',
  };

  const firstPartyInstallation = {
    sys: {
      type: 'AppInstallation',
      appDefinition: {
        sys: {
          type: 'Link',
          linkType: 'AppDefinition',
          id: FIRST_PARTY_DEFINITION_ID,
        },
      },
    },
  };

  const firstPartyDefinition = {
    sys: { type: 'AppDefinition', id: FIRST_PARTY_DEFINITION_ID },
    name: 'Workflows',
    locations: ['app', 'entry-sidebar'],
    src: 'http://localhost:1234',
  };

  const privateDefinition = {
    sys: { type: 'AppDefinition', id: 'app-definition-id' },
    name: 'My app',
    locations: ['app', 'entry-field'],
    src: 'http://localhost:666',
  };

  const hostedDefinition = {
    ...resolvedAppMock,
    src: null,
    bundle: {
      sys: {
        id: 'appbundleid',
        type: 'Link',
        linkType: 'AppBundle',
      },
    },
  };

  const loader = {
    getByIds: jest.fn((ids) => {
      if (ids.includes(COMPOSE_DEFINITION_ID)) {
        return Promise.resolve({
          [COMPOSE_DEFINITION_ID]: composeAppDefinition,
        });
      }
      return Promise.resolve({
        [NETLIFY_DEFINITION_ID]: netlifyDefinition,
        [FIRST_PARTY_DEFINITION_ID]: firstPartyDefinition,
      });
    }),
    getAllForCurrentOrganization: jest.fn(() => {
      return Promise.resolve([privateDefinition]);
    }),
    getResolvedById: jest.fn((id, orgId) => {
      if (id === resolvedAppMock.sys.id && orgId === resolvedAppMock.sys.organization.sys.id) {
        return Promise.resolve(resolvedAppMock);
      }
    }),
  };

  const cma = ({
    getAppInstallations: jest.fn(() => {
      return Promise.resolve({
        items: [netlifyInstallation, firstPartyInstallation],
      });
    }),
  } as unknown) as APIClient;

  describe('getAllApps', () => {
    it('should return only private apps if the marketplace endpoint returns no data', async () => {
      (window.fetch as jest.Mock).mockImplementation(() => {
        return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
      });

      const repo = new AppsRepo(cma, loader);
      const result = await repo.getAllApps();

      expect(
        window.fetch
      ).toHaveBeenCalledWith(
        `https://cdn.contentful.com/spaces/lpjm8d10rkpy/entries?include=0&sys.id[in]=${APP_LISTING_ID}`,
        { headers: { Authorization: 'Bearer XMf7qZNsdNypDfO9TC1NZK2YyitHORa_nIYqYdpnQhk' } }
      );

      expect(
        window.fetch
      ).toHaveBeenCalledWith(
        'https://cdn.contentful.com/spaces/lpjm8d10rkpy/entries?include=10&content_type=app',
        { headers: { Authorization: 'Bearer XMf7qZNsdNypDfO9TC1NZK2YyitHORa_nIYqYdpnQhk' } }
      );

      expect(
        window.fetch
      ).toHaveBeenCalledWith(
        'https://cdn.contentful.com/spaces/lpjm8d10rkpy/entries?include=10&content_type=contentfulApp',
        { headers: { Authorization: 'Bearer XMf7qZNsdNypDfO9TC1NZK2YyitHORa_nIYqYdpnQhk' } }
      );

      expect(result).toEqual([
        {
          appDefinition: privateDefinition,
          id: 'app-definition-id',
          title: 'My app',
          isPrivateApp: true,
          isEarlyAccess: false,
        },
      ]);
    });

    it('should return only private apps if the marketplace endpoint returns bad data', async () => {
      (window.fetch as jest.Mock).mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ items: [], includes: { Assets: [] }, sys: {} }),
        });
      });

      const repo = new AppsRepo(cma, loader);
      const result = await repo.getAllApps();

      expect(result).toEqual([
        {
          appDefinition: privateDefinition,
          id: 'app-definition-id',
          title: 'My app',
          isPrivateApp: true,
          isEarlyAccess: false,
        },
      ]);
    });

    it('should return an array of apps when the marketplace endpoint returns good data', async () => {
      (window.fetch as jest.Mock).mockImplementation((url) => {
        const jsonResponse = url.endsWith(APP_LISTING_ID)
          ? appsListingEntryMock
          : url.includes('contentfulApp')
          ? contentfulAppEntriesMock
          : appEntriesMock;
        return Promise.resolve({ ok: true, json: () => Promise.resolve(jsonResponse) });
      });

      const repo = new AppsRepo(cma, loader);
      const result = await repo.getAllApps();

      expect(
        window.fetch
      ).toHaveBeenCalledWith(
        `https://cdn.contentful.com/spaces/lpjm8d10rkpy/entries?include=0&sys.id[in]=${APP_LISTING_ID}`,
        { headers: { Authorization: 'Bearer XMf7qZNsdNypDfO9TC1NZK2YyitHORa_nIYqYdpnQhk' } }
      );

      expect(
        window.fetch
      ).toHaveBeenCalledWith(
        'https://cdn.contentful.com/spaces/lpjm8d10rkpy/entries?include=10&content_type=app',
        { headers: { Authorization: 'Bearer XMf7qZNsdNypDfO9TC1NZK2YyitHORa_nIYqYdpnQhk' } }
      );

      expect(
        window.fetch
      ).toHaveBeenCalledWith(
        'https://cdn.contentful.com/spaces/lpjm8d10rkpy/entries?include=10&content_type=contentfulApp',
        { headers: { Authorization: 'Bearer XMf7qZNsdNypDfO9TC1NZK2YyitHORa_nIYqYdpnQhk' } }
      );

      expect(result).toMatchSnapshot();
    });
  });

  describe('getAppByIdOrSlug', () => {
    beforeEach(() => {
      (window.fetch as jest.Mock).mockImplementation((url) => {
        const jsonResponse = url.endsWith(APP_LISTING_ID)
          ? appsListingEntryMock
          : url.includes('contentfulApp')
          ? contentfulAppEntriesMock
          : appEntriesMock;

        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(jsonResponse),
        });
      });
    });

    it('returns an app if present', async () => {
      const repo = new AppsRepo(cma, loader);

      const app1 = await repo.getAppByIdOrSlug('app-definition-id');
      expect(app1.appDefinition).toEqual(privateDefinition);

      const app2 = await repo.getAppByIdOrSlug('netlify');
      expect(app2.appDefinition).toEqual(netlifyDefinition);
      expect(app2.appInstallation).toEqual(netlifyInstallation);

      const app3 = await repo.getAppByIdOrSlug('workflows');
      expect(app3.appDefinition).toEqual(firstPartyDefinition);
      expect(app3.appInstallation).toEqual(firstPartyInstallation);

      const app4 = await repo.getAppByIdOrSlug(FIRST_PARTY_DEFINITION_ID);
      expect(app4.appDefinition).toEqual(firstPartyDefinition);
      expect(app4.appInstallation).toEqual(firstPartyInstallation);

      const app5 = await repo.getAppByIdOrSlug(COMPOSE_DEFINITION_ID);
      expect(app5.appDefinition).toEqual(composeAppDefinition);
    });

    it('fails if an app is not present', async () => {
      const repo = new AppsRepo(cma, loader);

      expect.assertions(1);
      try {
        await repo.getAppByIdOrSlug('not-here');
      } catch (err) {
        expect(err.message).toBe('Could not find an app with ID "not-here".');
      }
    });

    it('fails if API call fails', async () => {
      const cma = ({
        getAppInstallations: () => Promise.reject(new Error('api error')),
      } as unknown) as APIClient;

      const repo = new AppsRepo(cma, loader);

      expect.assertions(1);
      try {
        await repo.getAppByIdOrSlug('fails-either-way');
      } catch (err) {
        expect(err.message).toBe('api error');
      }
    });
  });

  describe('getResolvedAppById', () => {
    beforeEach(() => {
      (window.fetch as jest.Mock).mockImplementation((url) => {
        const jsonResponse = url.endsWith(APP_LISTING_ID)
          ? appsListingEntryMock
          : url.includes('contentfulApp')
          ? contentfulAppEntriesMock
          : appEntriesMock;

        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(jsonResponse),
        });
      });
      (loader.getAllForCurrentOrganization as jest.Mock).mockResolvedValue([hostedDefinition]);
    });

    it('will return the resolved definition for private apps', async () => {
      const repo = new AppsRepo(cma, loader);

      const result = await repo.getResolvedAppById(resolvedAppMock.sys.id);

      expect(result.appDefinition).toEqual(resolvedAppMock);
    });

    it('will return the normal definition for non private apps', async () => {
      const repo = new AppsRepo(cma, loader);

      const netlify = await repo.getAppByIdOrSlug('netlify');
      expect(netlify.appDefinition).toEqual(netlifyDefinition);
      expect(netlify.appInstallation).toEqual(netlifyInstallation);
    });

    it('fails if an app is not present', async () => {
      const repo = new AppsRepo(cma, loader);

      expect.assertions(1);
      try {
        await repo.getResolvedAppById('not-here');
      } catch (err) {
        expect(err.message).toBe('Could not find an app with ID "not-here".');
      }
    });

    it('fails if API call fails', async () => {
      const cma = ({
        getAppInstallations: () => Promise.reject(new Error('api error')),
      } as unknown) as APIClient;

      const repo = new AppsRepo(cma, loader);

      expect.assertions(1);
      try {
        await repo.getResolvedAppById('fails-either-way');
      } catch (err) {
        expect(err.message).toBe('api error');
      }
    });
  });

  describe('caching and hooks', () => {
    it('clears cache and updates cache key for hooks', async () => {
      const repo = new AppsRepo(cma, loader);

      await repo.getAllApps();
      expect(repo.cache.marketplaceAppDefinitions).toBeDefined();

      const prevKey = repo._cacheKey;

      repo.clearCache(['marketplaceAppDefinitions']);
      expect(repo.cache.marketplaceAppDefinitions).toBeUndefined();
      expect(repo._cacheKey).not.toBe(prevKey);
    });
  });
});
