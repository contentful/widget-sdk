import * as AppOperations from './AppOperations';

import {
  NAMESPACE_BUILTIN,
  NAMESPACE_BUILTIN_SIDEBAR,
  NAMESPACE_EXTENSION
} from 'widgets/WidgetNamespaces';

jest.mock('i13n/Telemetry', () => ({ count: () => {} }));
jest.mock('data/CMA/ProductCatalog', () => ({ getCurrentSpaceFeature: () => true }));

describe('AppOperations', () => {
  describe('installOrUpdate', () => {
    it('validates target state', async () => {
      expect.assertions(1);

      try {
        await AppOperations.installOrUpdate({}, () => {}, () => {}, {
          targetState: {
            EditorInterface: {
              CT1: {
                sidebar: { position: 'BOOM' }
              }
            }
          }
        });
      } catch (err) {
        expect(err.message).toMatch(/Invalid target sidebar/);
      }
    });

    it('stores parameters in AppInstallation entity', async () => {
      const cma = {
        updateAppInstallation: jest.fn(installation => {
          return Promise.resolve({
            ...installation,
            sys: { ...installation.sys, widgetId: 'some-widget-id' }
          });
        }),
        getEditorInterfaces: jest.fn(() => Promise.resolve({ items: [] }))
      };
      const evictWidget = jest.fn();
      const checkAppStatus = jest.fn(() => {
        return Promise.resolve({ appDefinition: { sys: { id: 'def-id' } } });
      });

      await AppOperations.installOrUpdate(cma, evictWidget, checkAppStatus, {
        parameters: { test: true }
      });

      expect(cma.updateAppInstallation).toBeCalledTimes(1);
      expect(cma.updateAppInstallation).toBeCalledWith('def-id', { test: true });
      expect(evictWidget).toBeCalledTimes(1);
      expect(evictWidget).toBeCalledWith(expect.stringContaining('some-widget-id'));
    });

    it('fails if AppInstallation cannot be updated', async () => {
      const cma = {
        updateAppInstallation: jest.fn(() => Promise.reject('unprocessable'))
      };
      const evictWidget = jest.fn();
      const checkAppStatus = jest.fn(() => {
        return Promise.resolve({ appDefinition: { sys: { id: 'def-id' } } });
      });

      expect.assertions(3);

      try {
        await AppOperations.installOrUpdate(cma, evictWidget, checkAppStatus);
      } catch (err) {
        expect(err).toMatch('unprocessable');
        expect(cma.updateAppInstallation).toBeCalledTimes(1);
        expect(evictWidget).not.toBeCalled();
      }
    });

    it('executes the target state plan', async () => {
      const cma = {
        updateAppInstallation: jest.fn(installation => {
          return Promise.resolve({
            ...installation,
            sys: { ...installation.sys, widgetId: 'some-widget-id' }
          });
        }),
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
      const evictWidget = jest.fn();
      const checkAppStatus = jest.fn(() => {
        return Promise.resolve({ appDefinition: { sys: { id: 'def-id' } } });
      });

      await AppOperations.installOrUpdate(cma, evictWidget, checkAppStatus, {
        targetState: {
          EditorInterface: {
            CT1: {
              controls: [{ fieldId: 'xxx' }]
            }
          }
        }
      });

      expect(cma.updateAppInstallation).toBeCalledTimes(1);
      expect(cma.getEditorInterfaces).toBeCalledTimes(1);
      expect(cma.updateEditorInterface).toBeCalledTimes(1);

      expect(cma.updateEditorInterface).toBeCalledWith({
        sys: { contentType: { sys: { id: 'CT1' } } },
        controls: [
          { fieldId: 'xxx', widgetNamespace: NAMESPACE_EXTENSION, widgetId: 'some-widget-id' }
        ]
      });

      expect(evictWidget).toBeCalledTimes(1);
      expect(evictWidget).toBeCalledWith('some-widget-id');
    });
  });

  describe('uninstall', () => {
    it('removes widget references from editor interfaces', async () => {
      const widgetId = 'test-widget';
      const cma = {
        getEditorInterfaces: jest.fn(() =>
          Promise.resolve({
            items: [
              {
                sys: { contentType: { sys: { id: 'CT1' } } },
                controls: [
                  { fieldId: 'title', widgetNamespace: NAMESPACE_BUILTIN, widgetId },
                  { fieldId: 'content', widgetNamespace: NAMESPACE_BUILTIN, widgetId: 'markdown' },
                  { fieldId: 'author', widgetNamespace: NAMESPACE_EXTENSION, widgetId }
                ],
                sidebar: [
                  { widgetNamespace: NAMESPACE_BUILTIN_SIDEBAR, widgetId: 'publication-widget' },
                  { widgetNamespace: NAMESPACE_EXTENSION, widgetId }
                ],
                editor: {
                  widgetNamespace: NAMESPACE_EXTENSION,
                  widgetId
                }
              }
            ]
          })
        ),
        updateEditorInterface: jest.fn(ei => Promise.resolve(ei)),
        deleteAppInstallation: jest.fn(() => Promise.resolve())
      };
      const evictWidget = jest.fn();
      const checkAppStatus = jest.fn(() =>
        Promise.resolve({
          appDefinition: { sys: { id: 'def' } },
          appInstallation: { sys: { widgetId } }
        })
      );

      await AppOperations.uninstall(cma, evictWidget, checkAppStatus);

      expect(cma.getEditorInterfaces).toBeCalledTimes(1);
      expect(cma.updateEditorInterface).toBeCalledTimes(1);

      expect(cma.updateEditorInterface).toBeCalledWith({
        sys: { contentType: { sys: { id: 'CT1' } } },
        controls: [
          { fieldId: 'title', widgetNamespace: NAMESPACE_BUILTIN, widgetId },
          { fieldId: 'content', widgetNamespace: NAMESPACE_BUILTIN, widgetId: 'markdown' },
          { fieldId: 'author' }
        ],
        sidebar: [{ widgetNamespace: NAMESPACE_BUILTIN_SIDEBAR, widgetId: 'publication-widget' }]
      });

      expect(evictWidget).toBeCalledTimes(1);
      expect(evictWidget).toBeCalledWith(widgetId);
    });

    it('deletes the installation', async () => {
      const cma = {
        getEditorInterfaces: jest.fn(() => Promise.resolve({ items: [] })),
        deleteAppInstallation: jest.fn(() => Promise.resolve())
      };
      const evictWidget = jest.fn();
      const checkAppStatus = jest.fn(() =>
        Promise.resolve({
          appDefinition: { sys: { id: 'def' } },
          appInstallation: { sys: { widgetId: 'some-widget' } }
        })
      );

      await AppOperations.uninstall(cma, evictWidget, checkAppStatus);

      expect(cma.deleteAppInstallation).toBeCalledTimes(1);
      expect(cma.deleteAppInstallation).toBeCalledWith('def');

      expect(evictWidget).toBeCalledTimes(1);
      expect(evictWidget).toBeCalledWith('some-widget');
    });

    it('fails if an installation cannot be deleted', async () => {
      const cma = {
        getEditorInterfaces: jest.fn(() => Promise.resolve({ items: [] })),
        deleteAppInstallation: jest.fn(() => Promise.reject('unauthorized'))
      };
      const evictWidget = jest.fn();
      const checkAppStatus = jest.fn(() => {
        return Promise.resolve({
          appInstallation: { sys: { widgetId: 'some-widget' } },
          appDefinition: { sys: { id: 'test' } }
        });
      });

      expect.assertions(3);

      try {
        await AppOperations.uninstall(cma, evictWidget, checkAppStatus);
      } catch (err) {
        expect(cma.deleteAppInstallation).toBeCalledWith('test');
        expect(err).toMatch('unauthorized');
        expect(evictWidget).not.toBeCalled();
      }
    });
  });
});
