import createAppsRepo from './AppsRepo.es6';

const NETLIFY_APP_ID = 'netlify';
const NETLIFY_EXTENSION_DEFINITION_ID = '3VJXxF6XcYPl4akixQuJlc';

describe('AppsRepo', () => {
  describe('getApps', () => {
    // These tests are using Netlify App and Definition IDs
    // but they shouldn't break if we add more (we use only
    // `arrayContaining`, `objectContaining`, not equality).
    const netlifyDefinition = {
      sys: { type: 'ExtensionDefinition', id: NETLIFY_EXTENSION_DEFINITION_ID },
      name: 'Netlify',
      locations: ['app', 'entry-sidebar'],
      src: 'http://localhost:1234'
    };

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

    it('returns a list of apps', async () => {
      const loader = {
        getByIds: jest.fn(() => {
          return Promise.resolve({ [NETLIFY_EXTENSION_DEFINITION_ID]: netlifyDefinition });
        })
      };

      const spaceEndpoint = jest.fn(() => {
        return Promise.resolve({ items: [netlifyExtension] });
      });

      const repo = createAppsRepo(loader, spaceEndpoint);
      const result = await repo.getApps();

      expect(loader.getByIds).toBeCalledTimes(1);
      expect(loader.getByIds).toBeCalledWith(
        expect.arrayContaining([NETLIFY_EXTENSION_DEFINITION_ID])
      );

      expect(spaceEndpoint).toBeCalledTimes(1);
      expect(spaceEndpoint).toBeCalledWith({
        method: 'GET',
        path: ['extensions'],
        query: {
          'extensionDefinition.sys.id[in]': expect.stringContaining(NETLIFY_EXTENSION_DEFINITION_ID)
        }
      });

      expect(result).toEqual(
        expect.arrayContaining([
          {
            sys: { type: 'App', id: NETLIFY_APP_ID },
            extensionDefinition: netlifyDefinition,
            extension: netlifyExtension
          }
        ])
      );
    });

    it('does not include the app if definition does not exist', async () => {
      const loader = {
        getByIds: jest.fn(() => Promise.resolve({}))
      };

      const spaceEndpoint = jest.fn(() => {
        return Promise.resolve({ items: [netlifyExtension] });
      });

      const repo = createAppsRepo(loader, spaceEndpoint);
      const result = await repo.getApps();

      expect(loader.getByIds).toBeCalledTimes(1);
      expect(loader.getByIds).toBeCalledWith(
        expect.arrayContaining([NETLIFY_EXTENSION_DEFINITION_ID])
      );

      expect(result).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            sys: { type: 'App', id: NETLIFY_APP_ID }
          })
        ])
      );
    });

    it('includes the app if definition exists but definition does not', async () => {
      const loader = {
        getByIds: jest.fn(() =>
          Promise.resolve({
            [NETLIFY_EXTENSION_DEFINITION_ID]: netlifyDefinition
          })
        )
      };

      const spaceEndpoint = jest.fn(() => {
        return Promise.resolve({ items: [] });
      });

      const repo = createAppsRepo(loader, spaceEndpoint);
      const result = await repo.getApps();

      expect(loader.getByIds).toBeCalledTimes(1);
      expect(loader.getByIds).toBeCalledWith(
        expect.arrayContaining([NETLIFY_EXTENSION_DEFINITION_ID])
      );

      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            sys: { type: 'App', id: NETLIFY_APP_ID }
          })
        ])
      );
    });

    it('does not include app extension if there are two extensions for its definition', async () => {
      const loader = {
        getByIds: jest.fn(() =>
          Promise.resolve({
            [NETLIFY_EXTENSION_DEFINITION_ID]: netlifyDefinition
          })
        )
      };

      const spaceEndpoint = jest.fn(() => {
        return Promise.resolve({
          items: [
            { ...netlifyExtension, sys: { type: 'Extension', id: 'e1' } },
            { ...netlifyExtension, sys: { type: 'Extension', id: 'e2' } }
          ]
        });
      });

      const repo = createAppsRepo(loader, spaceEndpoint);
      const result = await repo.getApps();

      expect(loader.getByIds).toBeCalledTimes(1);
      expect(loader.getByIds).toBeCalledWith(
        expect.arrayContaining([NETLIFY_EXTENSION_DEFINITION_ID])
      );

      expect(result).toEqual(
        expect.arrayContaining([
          {
            sys: { type: 'App', id: NETLIFY_APP_ID },
            extensionDefinition: netlifyDefinition
          }
        ])
      );
    });
  });

  describe('getDevApps', () => {
    it('returns fake dev apps for all extension definitions in the current org', async () => {
      const definitions = [
        { sys: { type: 'ExtensionDefinition', id: 'org-def-1' } },
        { sys: { type: 'ExtensionDefinition', id: 'org-def-2' } }
      ];

      const extension = {
        sys: { type: 'Extension', id: 'ext-for-def-2' },
        extensionDefinition: {
          sys: {
            type: 'Link',
            linkType: 'ExtensionDefinition',
            id: 'org-def-2'
          }
        }
      };

      const loader = {
        getAllForCurrentOrganization: jest.fn(() => Promise.resolve(definitions))
      };

      const spaceEndpoint = jest.fn(() => Promise.resolve({ items: [extension] }));

      const repo = createAppsRepo(loader, spaceEndpoint);
      const result = await repo.getDevApps();

      expect(loader.getAllForCurrentOrganization).toBeCalledTimes(1);
      expect(spaceEndpoint).toBeCalledTimes(1);
      expect(spaceEndpoint).toBeCalledWith({
        method: 'GET',
        path: ['extensions'],
        query: {
          'extensionDefinition.sys.id[in]': 'org-def-1,org-def-2'
        }
      });

      expect(result).toEqual([
        {
          sys: { type: 'DevApp', id: 'dev-app_org-def-1' },
          extensionDefinition: definitions[0]
        },
        {
          sys: { type: 'DevApp', id: 'dev-app_org-def-2' },
          extensionDefinition: definitions[1],
          extension
        }
      ]);
    });
  });

  describe('getExtensionDefinitionForApp', () => {
    it('fetches definition by app ID', async () => {
      const loader = { getById: jest.fn(() => 'DEFINITION') };

      const repo = createAppsRepo(loader);
      const result = await repo.getExtensionDefinitionForApp(NETLIFY_APP_ID);

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
        await repo.getExtensionDefinitionForApp('netlify');
      } catch (err) {
        expect(loader.getById).toBeCalledTimes(1);
        expect(err.message).toBe('boom');
      }
    });

    it('derives extension definition ID from a dev app ID', async () => {
      const loader = { getById: jest.fn(() => 'DEFINITION') };

      const repo = createAppsRepo(loader);
      const result = await repo.getExtensionDefinitionForApp('dev-app_my-definition');

      expect(loader.getById).toBeCalledTimes(1);
      expect(loader.getById).toBeCalledWith('my-definition');
      expect(result).toBe('DEFINITION');
    });
  });

  describe('getExtensionForExtensionDefinition', () => {
    const definition = {
      sys: {
        type: 'ExtensionDefinition',
        id: 'my-def'
      }
    };

    const makeExtension = extensionId => {
      return {
        sys: { type: 'Extension', id: extensionId || 'my-ext' },
        extensionDefinition: {
          sys: {
            type: 'Link',
            linkType: definition.sys.type,
            id: definition.sys.id
          }
        }
      };
    };

    it('returns extension it there is exactly one extension for definition provided', async () => {
      const spaceEndpoint = jest.fn(() => {
        return Promise.resolve({ items: [makeExtension()] });
      });

      const repo = createAppsRepo(jest.fn(), spaceEndpoint);
      const extension = await repo.getExtensionForExtensionDefinition(definition.sys.id);

      expect(extension.sys.id).toBe('my-ext');
      expect(spaceEndpoint).toBeCalledTimes(1);
      expect(spaceEndpoint).toBeCalledWith({
        method: 'GET',
        path: ['extensions'],
        query: {
          'extensionDefinition.sys.id[in]': 'my-def'
        }
      });
    });

    it('fails if there are no extensions for a definition', async () => {
      const spaceEndpoint = jest.fn(() => {
        return Promise.resolve({ items: [] });
      });

      const repo = createAppsRepo(jest.fn(), spaceEndpoint);
      expect.assertions(2);
      try {
        await repo.getExtensionForExtensionDefinition(definition.sys.id);
      } catch (err) {
        expect(err.message).toMatch(/exactly one Extension/);
        expect(err.extensionCount).toBe(0);
      }
    });

    it('fails if there are multiple extensions for a definition', async () => {
      const spaceEndpoint = jest.fn(() => {
        return Promise.resolve({ items: [makeExtension('e1'), makeExtension('e2')] });
      });

      const repo = createAppsRepo(jest.fn(), spaceEndpoint);
      expect.assertions(2);
      try {
        await repo.getExtensionForExtensionDefinition(definition.sys.id);
      } catch (err) {
        expect(err.message).toMatch(/exactly one Extension/);
        expect(err.extensionCount).toBe(2);
      }
    });
  });
});
