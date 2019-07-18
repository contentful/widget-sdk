import createAppsRepo from './AppsRepo.es6';

describe('AppsRepo', () => {
  // TODO: right now this is the only tested method of the repo.
  // This one will stay with us. For all the other methods, in a follow-up
  // we'll be switching calls to org-scoped extension_definitions endpoint
  // to calls the the public extension_definitions endpoint.
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
      const extension = await repo.getExtensionForExtensionDefinition(definition);

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
        await repo.getExtensionForExtensionDefinition(definition);
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
        await repo.getExtensionForExtensionDefinition(definition);
      } catch (err) {
        expect(err.message).toMatch(/exactly one Extension/);
        expect(err.extensionCount).toBe(2);
      }
    });
  });
});
