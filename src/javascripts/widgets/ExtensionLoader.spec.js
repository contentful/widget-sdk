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
  let orgEndpoint;
  let spaceEndpoint;
  let loader;

  beforeEach(function() {
    orgEndpoint = jest.fn();
    spaceEndpoint = jest.fn();
    loader = createExtensionLoader(orgEndpoint, spaceEndpoint);
  });

  describe('getAllExtensions()', () => {
    it('gets all extensions for a space environment', async () => {
      spaceEndpoint.mockReturnValue(
        Promise.resolve({
          items: [makeExtension('id1'), makeExtension('id2')]
        })
      );

      const result = await loader.getAllExtensions();

      expect(spaceEndpoint).toBeCalledWith({ method: 'GET', path: '/extensions' });
      expect(orgEndpoint).not.toBeCalled();

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

      orgEndpoint.mockReturnValue(
        Promise.resolve({
          items: [
            {
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
            }
          ]
        })
      );

      const result = await loader.getAllExtensions();

      expect(spaceEndpoint).toBeCalledWith({ method: 'GET', path: '/extensions' });
      expect(orgEndpoint).toBeCalledWith({
        method: 'GET',
        path: '/extension_definitions',
        query: {
          'sys.id[in]': 'definitionId2,definitionId3'
        }
      });

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
            fieldTypes: [{ type: 'Object' }]
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

      await loader.getAllExtensions();
      const result = await loader.getExtensionsById(['id1']);

      expect(spaceEndpoint.mock.calls).toHaveLength(1);

      expect(result).toEqual([makeExtension('id1')]);
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
        path: '/extensions',
        query: { 'sys.id[in]': 'id1,id2,id3' }
      });
      expect(orgEndpoint).not.toBeCalled();

      expect(result).toEqual([makeExtension('id1'), makeExtension('id2')]);
    });

    it('resolves extension definitions', async () => {
      spaceEndpoint.mockReturnValue(
        Promise.resolve({
          items: [makeExtensionWithDefinition('id2', 'definitionId2')]
        })
      );

      orgEndpoint.mockReturnValue(
        Promise.resolve({
          items: [
            {
              sys: { id: 'definitionId2' },
              src: 'http://localhost:2222',
              name: 'Test',
              locations: ['entry-sidebar']
            }
          ]
        })
      );

      const result = await loader.getExtensionsById(['id2']);

      expect(spaceEndpoint).toBeCalledWith({
        method: 'GET',
        path: '/extensions',
        query: { 'sys.id[in]': 'id2' }
      });

      expect(orgEndpoint).toBeCalledWith({
        method: 'GET',
        path: '/extension_definitions',
        query: {
          'sys.id[in]': 'definitionId2'
        }
      });

      expect(result).toEqual([
        {
          ...makeExtensionWithDefinition('id2', 'definitionId2'),
          extension: {
            src: 'http://localhost:2222',
            name: 'Test'
          }
        }
      ]);
    });
  });
});
