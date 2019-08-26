'use strict';

import { createExtensionLoader } from './ExtensionLoader.es6.js';

const makeExtension = id => ({
  sys: {
    id
  }
});

const makeExtensionWithDefinition = (id, definitionId) => ({
  sys: {
    id
  },
  extensionDefinition: {
    sys: {
      type: 'Link',
      linkType: 'ExtensionDefinition',
      id: definitionId
    }
  }
});

describe('ExtensionLoader', () => {
  let extensionDefinitionLoader;
  let spaceEndpoint;
  let loader;

  beforeEach(function() {
    extensionDefinitionLoader = { getByIds: jest.fn() };
    spaceEndpoint = jest.fn();
    loader = createExtensionLoader(extensionDefinitionLoader, spaceEndpoint);
  });

  describe('getAllExtensionsForListing()', () => {
    it('gets all extensions for a space environment', async () => {
      spaceEndpoint.mockReturnValue(
        Promise.resolve({
          items: [makeExtension('id1'), makeExtension('id2')]
        })
      );

      const result = await loader.getAllExtensionsForListing();

      expect(spaceEndpoint).toBeCalledWith({
        method: 'GET',
        path: ['extensions'],
        query: {
          stripSrcdoc: 'true',
          limit: 1000
        }
      });

      expect(extensionDefinitionLoader.getByIds).toBeCalledWith([]);

      expect(result).toEqual([makeExtension('id1'), makeExtension('id2')]);
    });

    it('resolves extension definitions', async () => {
      spaceEndpoint.mockReturnValue(
        Promise.resolve({
          items: [
            makeExtension('id1'),
            makeExtensionWithDefinition('id2', 'definitionId2'),
            makeExtensionWithDefinition('id3', 'definitionId3')
          ]
        })
      );

      extensionDefinitionLoader.getByIds.mockReturnValue(
        Promise.resolve({
          definitionId2: {
            sys: { id: 'definitionId2' },
            src: 'http://localhost:2222',
            name: 'Test',
            locations: ['entry-sidebar'],
            parameters: {
              instance: {
                param: 'foo'
              }
            },
            fieldTypes: [{ type: 'Object' }]
          },
          definitionId3: null
        })
      );

      const result = await loader.getAllExtensionsForListing();

      expect(spaceEndpoint).toBeCalledWith({
        method: 'GET',
        path: ['extensions'],
        query: {
          stripSrcdoc: 'true',
          limit: 1000
        }
      });

      expect(extensionDefinitionLoader.getByIds).toBeCalledWith(['definitionId2', 'definitionId3']);

      expect(result).toEqual([
        makeExtension('id1'),
        {
          ...makeExtensionWithDefinition('id2', 'definitionId2'),
          extension: {
            src: 'http://localhost:2222',
            name: 'Test',
            parameters: {
              instance: {
                param: 'foo'
              }
            },
            fieldTypes: [{ type: 'Object' }],
            locations: ['entry-sidebar']
          }
        }
      ]);
    });
  });

  describe('getExtensionsById()', () => {
    it('loads only required extensions', async () => {
      spaceEndpoint.mockReturnValue(
        Promise.resolve({
          items: [makeExtension('id1'), makeExtension('id2')]
        })
      );

      const result = await loader.getExtensionsById(['id1', 'id2', 'id3']);

      expect(spaceEndpoint).toBeCalledWith({
        method: 'GET',
        path: ['extensions'],
        query: { 'sys.id[in]': 'id1,id2,id3' }
      });
      expect(extensionDefinitionLoader.getByIds).toBeCalledWith([]);

      expect(result).toEqual([makeExtension('id1'), makeExtension('id2')]);
    });

    it('resolves extension definitions', async () => {
      spaceEndpoint.mockReturnValue(
        Promise.resolve({
          items: [makeExtensionWithDefinition('id2', 'definitionId2')]
        })
      );

      extensionDefinitionLoader.getByIds.mockReturnValue(
        Promise.resolve({
          definitionId2: {
            sys: { id: 'definitionId2' },
            src: 'http://localhost:2222',
            name: 'Test',
            locations: ['entry-sidebar']
          }
        })
      );

      const result = await loader.getExtensionsById(['id2']);

      expect(spaceEndpoint).toBeCalledWith({
        method: 'GET',
        path: ['extensions'],
        query: { 'sys.id[in]': 'id2' }
      });

      expect(extensionDefinitionLoader.getByIds).toBeCalledWith(['definitionId2']);

      expect(result).toEqual([
        {
          ...makeExtensionWithDefinition('id2', 'definitionId2'),
          extension: {
            src: 'http://localhost:2222',
            name: 'Test',
            locations: ['entry-sidebar']
          }
        }
      ]);
    });

    it('caches loaded extensions', async () => {
      spaceEndpoint.mockReturnValue(
        Promise.resolve({
          items: [makeExtension('id1')]
        })
      );

      await loader.getExtensionsById(['id1']);
      const result = await loader.getExtensionsById(['id1']);

      expect(spaceEndpoint).toBeCalledTimes(1);

      expect(result).toEqual([makeExtension('id1')]);
    });
  });
});
