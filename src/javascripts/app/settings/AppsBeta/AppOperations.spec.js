import * as AppOperations from './AppOperations.es6';

import {
  NAMESPACE_BUILTIN,
  NAMESPACE_BUILTIN_SIDEBAR,
  NAMESPACE_EXTENSION
} from 'widgets/WidgetNamespaces.es6';

jest.mock('i13n/Telemetry.es6', () => ({ count: () => {} }));

describe('AppOperations', () => {
  describe('installOrUpdate', () => {
    it('validates target state', async () => {
      const cma = {};
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
        await AppOperations.installOrUpdate(cma, checkAppStatus, {
          targetState: invalidTargetState
        });
      } catch (err) {
        expect(err.message).toMatch(/Invalid target sidebar/);
      }
    });

    it('creates an extension if not installed yet', async () => {
      const cma = {
        createExtension: jest.fn(ext => Promise.resolve(ext)),
        updateExtension: jest.fn()
      };
      const checkAppStatus = jest.fn(() => {
        return Promise.resolve({
          appId: 'test',
          extensionDefinition: { sys: { id: 'def-id' } }
        });
      });

      await AppOperations.installOrUpdate(cma, checkAppStatus, { parameters: { test: true } });

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
    });

    it('updates an extension if already installed', async () => {
      const cma = {
        createExtension: jest.fn(),
        updateExtension: jest.fn(ext => Promise.resolve(ext))
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

      await AppOperations.installOrUpdate(cma, checkAppStatus, { parameters: { hello: 'world' } });

      expect(cma.createExtension).not.toBeCalled();
      expect(cma.updateExtension).toBeCalledTimes(1);

      expect(cma.updateExtension).toBeCalledWith({
        sys: { id: 'some-extension-id', version: 2 },
        extensionDefinition: {
          sys: {
            type: 'Link',
            linkType: 'ExtensionDefinition',
            id: 'some-definition-id'
          }
        },
        parameters: { hello: 'world' }
      });
    });

    it('fails if an extension cannot be created', async () => {
      const cma = {
        createExtension: jest.fn(() => Promise.reject('unprocessable'))
      };
      const checkAppStatus = jest.fn(() => {
        return Promise.resolve({
          appId: 'test',
          extensionDefinition: { sys: { id: 'def-id' } }
        });
      });

      expect.assertions(1);

      try {
        await AppOperations.installOrUpdate(cma, checkAppStatus);
      } catch (err) {
        expect(err).toMatch('unprocessable');
      }
    });

    it('executes the target state plan', async () => {
      const cma = {
        createExtension: jest.fn(ext => Promise.resolve(ext)),
        getEditorInterface: jest.fn(() => {
          return Promise.resolve({
            sys: { contentType: { sys: { id: 'CT1' } } },
            controls: [{ fieldId: 'xxx', widgetNamespace: NAMESPACE_BUILTIN, widgetId: 'markdown' }]
          });
        }),
        updateEditorInterface: jest.fn(ext => Promise.resolve(ext))
      };
      const checkAppStatus = jest.fn(() => {
        return Promise.resolve({
          appId: 'test',
          extensionDefinition: { sys: { id: 'def-id' } }
        });
      });

      await AppOperations.installOrUpdate(cma, checkAppStatus, {
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

      expect(cma.getEditorInterface).toBeCalledTimes(1);
      expect(cma.getEditorInterface).toBeCalledWith('CT1');
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
        getContentTypes: jest.fn(() => Promise.resolve({ items: [{ sys: { id: 'CT1' } }] })),
        getEditorInterface: jest.fn(() => {
          return Promise.resolve({
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
          });
        }),
        updateEditorInterface: jest.fn(ei => Promise.resolve(ei)),
        deleteExtension: jest.fn(() => Promise.resolve())
      };

      const checkAppStatus = jest.fn(() =>
        Promise.resolve({ extension: { sys: { id: extensionId } } })
      );

      await AppOperations.uninstall(cma, checkAppStatus);

      expect(cma.getContentTypes).toBeCalledTimes(1);
      expect(cma.getEditorInterface).toBeCalledTimes(1);
      expect(cma.getEditorInterface).toBeCalledWith('CT1');
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
      const cma = {
        getContentTypes: jest.fn(() => Promise.resolve({ items: [] })),
        deleteExtension: jest.fn(() => Promise.resolve())
      };
      const checkAppStatus = jest.fn(() => Promise.resolve({ extension: { sys: { id: 'test' } } }));

      await AppOperations.uninstall(cma, checkAppStatus);

      expect(cma.deleteExtension).toBeCalledTimes(1);
      expect(cma.deleteExtension).toBeCalledWith('test');
    });

    it('fails if an extension cannot be deleted', async () => {
      const cma = {
        getContentTypes: jest.fn(() => Promise.resolve({ items: [] })),
        deleteExtension: jest.fn(() => Promise.reject('unauthorized'))
      };
      const checkAppStatus = jest.fn(() => Promise.resolve({ extension: { sys: { id: 'test' } } }));

      expect.assertions(1);

      try {
        await AppOperations.uninstall(cma, checkAppStatus);
      } catch (err) {
        expect(err).toMatch('unauthorized');
      }
    });
  });
});
