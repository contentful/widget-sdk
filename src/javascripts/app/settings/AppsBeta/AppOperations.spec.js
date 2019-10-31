import * as AppOperations from './AppOperations.es6';

import {
  NAMESPACE_BUILTIN,
  NAMESPACE_BUILTIN_SIDEBAR,
  NAMESPACE_EXTENSION
} from 'widgets/WidgetNamespaces.es6';

jest.mock('i13n/Telemetry.es6', () => ({ count: () => {} }));
jest.mock('data/CMA/ProductCatalog.es6', () => ({ getCurrentSpaceFeature: () => true }));

describe('AppOperations', () => {
  describe('installOrUpdate', () => {
    it('validates target state', async () => {
      const cma = {};
      const loader = {};
      const checkAppStatus = jest.fn();
      const invalidTargetState = {
        EditorInterface: {
          CT1: {
            sidebar: { position: 'BOOM' }
          }
        }
      };

      expect.assertions(1);

      try {
        await AppOperations.installOrUpdate(cma, loader, checkAppStatus, {
          targetState: invalidTargetState
        });
      } catch (err) {
        expect(err.message).toMatch(/Invalid target sidebar/);
      }
    });

    it('creates an extension if not installed yet', async () => {
      const cma = {
        createExtension: jest.fn(ext => Promise.resolve(ext)),
        updateExtension: jest.fn(),
        getEditorInterfaces: jest.fn(() => Promise.resolve({ items: [] }))
      };
      const loader = {
        evictExtension: jest.fn()
      };
      const checkAppStatus = jest.fn(() => {
        return Promise.resolve({
          appId: 'test',
          extensionDefinition: { sys: { id: 'def-id' } }
        });
      });

      await AppOperations.installOrUpdate(cma, loader, checkAppStatus, {
        parameters: { test: true }
      });

      expect(cma.createExtension).toBeCalledTimes(1);
      expect(cma.updateExtension).not.toBeCalled();

      expect(cma.createExtension).toBeCalledWith(
        expect.objectContaining({
          sys: {
            id: expect.stringContaining('test-app-')
          },
          extensionDefinition: {
            sys: {
              type: 'Link',
              linkType: 'ExtensionDefinition',
              id: 'def-id'
            }
          },
          parameters: { test: true }
        })
      );

      expect(loader.evictExtension).toBeCalledTimes(1);
      expect(loader.evictExtension).toBeCalledWith(expect.stringContaining('test-app-'));
    });

    it('updates an extension if already installed', async () => {
      const cma = {
        createExtension: jest.fn(),
        updateExtension: jest.fn(ext => Promise.resolve(ext)),
        getEditorInterfaces: jest.fn(() => Promise.resolve({ items: [] }))
      };
      const loader = {
        evictExtension: jest.fn()
      };
      const checkAppStatus = jest.fn(() => {
        return Promise.resolve({
          extension: {
            sys: { id: 'some-extension-id', version: 2 },
            extensionDefinition: {
              sys: {
                type: 'Link',
                linkType: 'ExtensionDefinition',
                id: 'some-definition-id'
              }
            }
          }
        });
      });

      await AppOperations.installOrUpdate(cma, loader, checkAppStatus, {
        parameters: { hello: 'world' }
      });

      expect(cma.createExtension).not.toBeCalled();
      expect(cma.updateExtension).toBeCalledTimes(1);

      const expectedEntity = {
        sys: { id: 'some-extension-id', version: 2 },
        extensionDefinition: {
          sys: {
            type: 'Link',
            linkType: 'ExtensionDefinition',
            id: 'some-definition-id'
          }
        },
        parameters: { hello: 'world' }
      };

      expect(cma.updateExtension).toBeCalledWith(expectedEntity);

      expect(loader.evictExtension).toBeCalledTimes(1);
      expect(loader.evictExtension).toBeCalledWith(expectedEntity.sys.id);
    });

    it('fails if an extension cannot be created', async () => {
      const cma = {
        createExtension: jest.fn(() => Promise.reject('unprocessable'))
      };
      const loader = {
        evictExtension: jest.fn()
      };
      const checkAppStatus = jest.fn(() => {
        return Promise.resolve({
          appId: 'test',
          extensionDefinition: { sys: { id: 'def-id' } }
        });
      });

      expect.assertions(3);

      try {
        await AppOperations.installOrUpdate(cma, loader, checkAppStatus);
      } catch (err) {
        expect(err).toMatch('unprocessable');
        expect(cma.createExtension).toBeCalledTimes(1);
        expect(loader.evictExtension).not.toBeCalled();
      }
    });

    it('executes the target state plan', async () => {
      const cma = {
        createExtension: jest.fn(ext => Promise.resolve(ext)),
        getEditorInterfaces: jest.fn(() => {
          return Promise.resolve({
            items: [
              {
                sys: { contentType: { sys: { id: 'CT1' } } },
                controls: [
                  { fieldId: 'xxx', widgetNamespace: NAMESPACE_BUILTIN, widgetId: 'markdown' }
                ]
              }
            ]
          });
        }),
        updateEditorInterface: jest.fn(ext => Promise.resolve(ext))
      };
      const loader = {
        evictExtension: jest.fn()
      };
      const checkAppStatus = jest.fn(() => {
        return Promise.resolve({
          appId: 'test',
          extensionDefinition: { sys: { id: 'def-id' } }
        });
      });

      await AppOperations.installOrUpdate(cma, loader, checkAppStatus, {
        targetState: {
          EditorInterface: {
            CT1: {
              controls: [{ fieldId: 'xxx' }]
            }
          }
        }
      });

      expect(cma.createExtension).toBeCalledTimes(1);
      const id = cma.createExtension.mock.calls[0][0].sys.id;

      expect(cma.getEditorInterfaces).toBeCalledTimes(1);
      expect(cma.updateEditorInterface).toBeCalledTimes(1);

      expect(cma.updateEditorInterface).toBeCalledWith({
        sys: { contentType: { sys: { id: 'CT1' } } },
        controls: [{ fieldId: 'xxx', widgetNamespace: NAMESPACE_EXTENSION, widgetId: id }]
      });
    });
  });

  describe('uninstall', () => {
    it('removes extension references from editor interfaces', async () => {
      const extensionId = 'test-extesnions';
      const cma = {
        getEditorInterfaces: jest.fn(() =>
          Promise.resolve({
            items: [
              {
                sys: { contentType: { sys: { id: 'CT1' } } },
                controls: [
                  { fieldId: 'title', widgetNamespace: NAMESPACE_BUILTIN, widgetId: extensionId },
                  { fieldId: 'content', widgetNamespace: NAMESPACE_BUILTIN, widgetId: 'markdown' },
                  { fieldId: 'author', widgetNamespace: NAMESPACE_EXTENSION, widgetId: extensionId }
                ],
                sidebar: [
                  { widgetNamespace: NAMESPACE_BUILTIN_SIDEBAR, widgetId: 'publication-widget' },
                  { widgetNamespace: NAMESPACE_EXTENSION, widgetId: extensionId }
                ],
                editor: {
                  widgetNamespace: NAMESPACE_EXTENSION,
                  widgetId: extensionId
                }
              }
            ]
          })
        ),
        updateEditorInterface: jest.fn(ei => Promise.resolve(ei)),
        deleteExtension: jest.fn(() => Promise.resolve())
      };
      const loader = {
        evictExtension: jest.fn()
      };
      const checkAppStatus = jest.fn(() =>
        Promise.resolve({ extension: { sys: { id: extensionId } } })
      );

      await AppOperations.uninstall(cma, loader, checkAppStatus);

      expect(cma.getEditorInterfaces).toBeCalledTimes(1);
      expect(cma.updateEditorInterface).toBeCalledTimes(1);

      expect(cma.updateEditorInterface).toBeCalledWith({
        sys: { contentType: { sys: { id: 'CT1' } } },
        controls: [
          { fieldId: 'title', widgetNamespace: NAMESPACE_BUILTIN, widgetId: extensionId },
          { fieldId: 'content', widgetNamespace: NAMESPACE_BUILTIN, widgetId: 'markdown' },
          { fieldId: 'author' }
        ],
        sidebar: [{ widgetNamespace: NAMESPACE_BUILTIN_SIDEBAR, widgetId: 'publication-widget' }]
      });
    });

    it('deletes the extension', async () => {
      const extensionId = 'test-extension';
      const cma = {
        getEditorInterfaces: jest.fn(() => Promise.resolve({ items: [] })),
        deleteExtension: jest.fn(() => Promise.resolve())
      };
      const loader = {
        evictExtension: jest.fn()
      };
      const checkAppStatus = jest.fn(() =>
        Promise.resolve({ extension: { sys: { id: extensionId } } })
      );

      await AppOperations.uninstall(cma, loader, checkAppStatus);

      expect(cma.deleteExtension).toBeCalledTimes(1);
      expect(cma.deleteExtension).toBeCalledWith(extensionId);

      expect(loader.evictExtension).toBeCalledTimes(1);
      expect(loader.evictExtension).toBeCalledWith(extensionId);
    });

    it('fails if an extension cannot be deleted', async () => {
      const cma = {
        getEditorInterfaces: jest.fn(() => Promise.resolve({ items: [] })),
        deleteExtension: jest.fn(() => Promise.reject('unauthorized'))
      };
      const loader = {
        evictExtension: jest.fn()
      };
      const checkAppStatus = jest.fn(() => Promise.resolve({ extension: { sys: { id: 'test' } } }));

      expect.assertions(2);

      try {
        await AppOperations.uninstall(cma, loader, checkAppStatus);
      } catch (err) {
        expect(err).toMatch('unauthorized');
        expect(loader.evictExtension).not.toBeCalled();
      }
    });
  });
});
