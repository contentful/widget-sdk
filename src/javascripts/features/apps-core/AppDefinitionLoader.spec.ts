import { createAppDefinitionLoader, ORGANIZATION_HEADER } from './AppDefinitionLoader';

const ORGANIZATION_ID = 'organization';
const GET_IDS_HEADERS = { [ORGANIZATION_HEADER]: ORGANIZATION_ID };

describe('AppDefinitionLoader', () => {
  describe('getById', () => {
    it('fetches from the public endpoint', async () => {
      const definitionsEndpoint = jest.fn(() => {
        return Promise.resolve({
          items: [
            { sys: { type: 'AppDefinition', id: 'def1' } },
            { sys: { type: 'AppDefinition', id: 'def2' } },
          ],
          includes: {
            ResolvedAppDefinition: [
              { sys: { type: 'ResolvedAppDefinition', id: 'def1' } },
              { sys: { type: 'ResolvedAppDefinition', id: 'def2' } },
            ],
          },
        });
      });

      const orgEndpoint = jest.fn();

      const loader = createAppDefinitionLoader(definitionsEndpoint, orgEndpoint, ORGANIZATION_ID);

      const result = await loader.getById('def2');

      expect(definitionsEndpoint).toBeCalledTimes(1);
      expect(definitionsEndpoint).toBeCalledWith(
        {
          method: 'GET',
          path: [],
          query: {
            'sys.id[in]': 'def2',
          },
        },
        GET_IDS_HEADERS
      );

      expect(orgEndpoint).not.toBeCalled();
      expect(result).toEqual({ sys: { type: 'ResolvedAppDefinition', id: 'def2' } });
    });

    it('falls back to the organization endpoint', async () => {
      const definitionsEndpoint = jest.fn(() => {
        return Promise.resolve({
          items: [{ sys: { type: 'AppDefinition', id: 'def1' } }],
          includes: {
            ResolvedAppDefinition: [{ sys: { type: 'ResolvedAppDefinition', id: 'def1' } }],
          },
        });
      });

      const orgEndpoint = jest.fn(() => {
        return Promise.resolve({
          items: [
            { sys: { type: 'AppDefinition', id: 'def2' } },
            { sys: { type: 'AppDefinition', id: 'def3' } },
          ],
          includes: {
            ResolvedAppDefinition: [
              { sys: { type: 'ResolvedAppDefinition', id: 'def2' } },
              { sys: { type: 'ResolvedAppDefinition', id: 'def3' } },
            ],
          },
        });
      });

      const loader = createAppDefinitionLoader(definitionsEndpoint, orgEndpoint, ORGANIZATION_ID);

      const result = await loader.getById('def2');

      expect(definitionsEndpoint).toBeCalledTimes(1);
      expect(definitionsEndpoint).toBeCalledWith(
        {
          method: 'GET',
          path: [],
          query: {
            'sys.id[in]': 'def2',
          },
        },
        GET_IDS_HEADERS
      );

      expect(orgEndpoint).toBeCalledTimes(1);
      expect(orgEndpoint).toBeCalledWith({
        method: 'GET',
        path: ['app_definitions'],
        query: {
          'sys.id[in]': 'def2',
        },
      });

      expect(result).toEqual({ sys: { type: 'ResolvedAppDefinition', id: 'def2' } });
    });

    it('throws if definition was not found in both endpoint reposnses', async () => {
      const definitionsEndpoint = jest.fn(() =>
        Promise.resolve({
          items: [],
          includes: {
            ResolvedAppDefinition: [],
          },
        })
      );

      const orgEndpoint = jest.fn(() => {
        return Promise.resolve({
          items: [{ sys: { type: 'AppDefinition', id: 'def1' } }],
          includes: {
            ResolvedAppDefinition: [{ sys: { type: 'ResolvedAppDefinition', id: 'def1' } }],
          },
        });
      });

      const loader = createAppDefinitionLoader(definitionsEndpoint, orgEndpoint, ORGANIZATION_ID);

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
            { sys: { type: 'AppDefinition', id: 'def1' } },
            { sys: { type: 'AppDefinition', id: 'def2' } },
          ],
          includes: {
            ResolvedAppDefinition: [
              { sys: { type: 'ResolvedAppDefinition', id: 'def1' } },
              { sys: { type: 'ResolvedAppDefinition', id: 'def2' } },
            ],
          },
        });
      });

      const orgEndpoint = jest.fn();

      const loader = createAppDefinitionLoader(definitionsEndpoint, orgEndpoint, ORGANIZATION_ID);

      const result = await loader.getByIds(['def1', 'def2']);

      expect(definitionsEndpoint).toBeCalledTimes(1);
      expect(definitionsEndpoint).toBeCalledWith(
        {
          method: 'GET',
          path: [],
          query: {
            'sys.id[in]': 'def1,def2',
          },
        },
        GET_IDS_HEADERS
      );

      expect(orgEndpoint).not.toBeCalled();

      expect(result).toEqual({
        def1: { sys: { type: 'ResolvedAppDefinition', id: 'def1' } },
        def2: { sys: { type: 'ResolvedAppDefinition', id: 'def2' } },
      });
    });

    it('falls back to organization endpoint and provides null of not found', async () => {
      const definitionsEndpoint = jest.fn(() => {
        return Promise.resolve({
          items: [{ sys: { type: 'AppDefinition', id: 'def1' } }],
          includes: {
            ResolvedAppDefinition: [{ sys: { type: 'ResolvedAppDefinition', id: 'def1' } }],
          },
        });
      });

      const orgEndpoint = jest.fn(() => {
        return Promise.resolve({
          items: [{ sys: { type: 'AppDefinition', id: 'def2' } }],
          includes: {
            ResolvedAppDefinition: [{ sys: { type: 'ResolvedAppDefinition', id: 'def2' } }],
          },
        });
      });

      const loader = createAppDefinitionLoader(definitionsEndpoint, orgEndpoint, ORGANIZATION_ID);

      const result = await loader.getByIds(['def1', 'def2', 'def3']);

      expect(definitionsEndpoint).toBeCalledTimes(1);
      expect(definitionsEndpoint).toBeCalledWith(
        {
          method: 'GET',
          path: [],
          query: {
            'sys.id[in]': 'def1,def2,def3',
          },
        },
        GET_IDS_HEADERS
      );

      expect(orgEndpoint).toBeCalledTimes(1);
      expect(orgEndpoint).toBeCalledWith({
        method: 'GET',
        path: ['app_definitions'],
        query: {
          'sys.id[in]': 'def2,def3',
        },
      });

      expect(result).toEqual({
        def1: { sys: { type: 'ResolvedAppDefinition', id: 'def1' } },
        def2: { sys: { type: 'ResolvedAppDefinition', id: 'def2' } },
        def3: null,
      });
    });
  });

  describe('getAllForCurrentOrganization', () => {
    it('calls only the organization endpoint', async () => {
      const definitionsEndpoint = jest.fn();
      const orgEndpoint = jest.fn(() =>
        Promise.resolve({
          items: 'DEFINITIONS',
          includes: { ResolvedAppDefinition: 'RESOLVED_DEFINITIONS' },
        })
      );

      const loader = createAppDefinitionLoader(definitionsEndpoint, orgEndpoint, ORGANIZATION_ID);

      const result = await loader.getAllForCurrentOrganization();

      expect(definitionsEndpoint).not.toBeCalled();
      expect(orgEndpoint).toBeCalledTimes(1);
      expect(orgEndpoint).toBeCalledWith({
        method: 'GET',
        path: ['app_definitions'],
      });

      expect(result).toBe('RESOLVED_DEFINITIONS');
    });
  });
});
