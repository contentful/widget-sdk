import createAppDefinitionLoader from './AppDefinitionLoader';

describe('AppDefinitionLoader', () => {
  describe('getById', () => {
    it('fetches from the public endpoint', async () => {
      const definitionsEndpoint = jest.fn(() => {
        return Promise.resolve({
          items: [
            { sys: { type: 'ExtensionDefinition', id: 'def1' } },
            { sys: { type: 'ExtensionDefinition', id: 'def2' } }
          ]
        });
      });

      const orgEndpoint = jest.fn();

      const loader = createAppDefinitionLoader(definitionsEndpoint, orgEndpoint);

      const result = await loader.getById('def2');

      expect(definitionsEndpoint).toBeCalledTimes(1);
      expect(definitionsEndpoint).toBeCalledWith({
        method: 'GET',
        path: [],
        query: {
          'sys.id[in]': 'def2'
        }
      });

      expect(orgEndpoint).not.toBeCalled();
      expect(result).toEqual({ sys: { type: 'ExtensionDefinition', id: 'def2' } });
    });

    it('falls back to the organization endpoint', async () => {
      const definitionsEndpoint = jest.fn(() => {
        return Promise.resolve({
          items: [{ sys: { type: 'ExtensionDefinition', id: 'def1' } }]
        });
      });

      const orgEndpoint = jest.fn(() => {
        return Promise.resolve({
          items: [
            { sys: { type: 'ExtensionDefinition', id: 'def2' } },
            { sys: { type: 'ExtensionDefinition', id: 'def3' } }
          ]
        });
      });

      const loader = createAppDefinitionLoader(definitionsEndpoint, orgEndpoint);

      const result = await loader.getById('def2');

      expect(definitionsEndpoint).toBeCalledTimes(1);
      expect(definitionsEndpoint).toBeCalledWith({
        method: 'GET',
        path: [],
        query: {
          'sys.id[in]': 'def2'
        }
      });

      expect(orgEndpoint).toBeCalledTimes(1);
      expect(orgEndpoint).toBeCalledWith({
        method: 'GET',
        path: ['app_definitions'],
        query: {
          'sys.id[in]': 'def2'
        }
      });

      expect(result).toEqual({ sys: { type: 'ExtensionDefinition', id: 'def2' } });
    });

    it('throws if definition was not found in both endpoint reposnses', async () => {
      const definitionsEndpoint = jest.fn(() => Promise.resolve({ items: [] }));

      const orgEndpoint = jest.fn(() => {
        return Promise.resolve({
          items: [{ sys: { type: 'ExtensionDefinition', id: 'def1' } }]
        });
      });

      const loader = createAppDefinitionLoader(definitionsEndpoint, orgEndpoint);

      expect.assertions(3);
      try {
        await loader.getById('def2');
      } catch (err) {
        expect(err.message).toMatch(/be found/);
        expect(definitionsEndpoint).toBeCalledTimes(1);
        expect(orgEndpoint).toBeCalledTimes(1);
      }
    });
  });

  describe('getByIds', () => {
    it('fetches from the public endpoint', async () => {
      const definitionsEndpoint = jest.fn(() => {
        return Promise.resolve({
          items: [
            { sys: { type: 'ExtensionDefinition', id: 'def1' } },
            { sys: { type: 'ExtensionDefinition', id: 'def2' } }
          ]
        });
      });

      const orgEndpoint = jest.fn();

      const loader = createAppDefinitionLoader(definitionsEndpoint, orgEndpoint);

      const result = await loader.getByIds(['def1', 'def2']);

      expect(definitionsEndpoint).toBeCalledTimes(1);
      expect(definitionsEndpoint).toBeCalledWith({
        method: 'GET',
        path: [],
        query: {
          'sys.id[in]': 'def1,def2'
        }
      });

      expect(orgEndpoint).not.toBeCalled();

      expect(result).toEqual({
        def1: { sys: { type: 'ExtensionDefinition', id: 'def1' } },
        def2: { sys: { type: 'ExtensionDefinition', id: 'def2' } }
      });
    });

    it('falls back to organization endpoint and provides null of not found', async () => {
      const definitionsEndpoint = jest.fn(() => {
        return Promise.resolve({
          items: [{ sys: { type: 'ExtensionDefinition', id: 'def1' } }]
        });
      });

      const orgEndpoint = jest.fn(() => {
        return Promise.resolve({
          items: [{ sys: { type: 'ExtensionDefinition', id: 'def2' } }]
        });
      });

      const loader = createAppDefinitionLoader(definitionsEndpoint, orgEndpoint);

      const result = await loader.getByIds(['def1', 'def2', 'def3']);

      expect(definitionsEndpoint).toBeCalledTimes(1);
      expect(definitionsEndpoint).toBeCalledWith({
        method: 'GET',
        path: [],
        query: {
          'sys.id[in]': 'def1,def2,def3'
        }
      });

      expect(orgEndpoint).toBeCalledTimes(1);
      expect(orgEndpoint).toBeCalledWith({
        method: 'GET',
        path: ['app_definitions'],
        query: {
          'sys.id[in]': 'def2,def3'
        }
      });

      expect(result).toEqual({
        def1: { sys: { type: 'ExtensionDefinition', id: 'def1' } },
        def2: { sys: { type: 'ExtensionDefinition', id: 'def2' } },
        def3: null
      });
    });
  });

  describe('getAllForCurrentOrganization', () => {
    it('calls only the organization endpoint', async () => {
      const definitionsEndpoint = jest.fn();
      const orgEndpoint = jest.fn(() => Promise.resolve({ items: 'DEFINITIONS' }));

      const loader = createAppDefinitionLoader(definitionsEndpoint, orgEndpoint);

      const result = await loader.getAllForCurrentOrganization();

      expect(definitionsEndpoint).not.toBeCalled();
      expect(orgEndpoint).toBeCalledTimes(1);
      expect(orgEndpoint).toBeCalledWith({
        method: 'GET',
        path: ['app_definitions']
      });

      expect(result).toBe('DEFINITIONS');
    });
  });
});
