import { create as createStore } from './WidgetStore.es6';
import { create as createBuiltinWidgetList } from './BuiltinWidgets.es6';

describe('WidgetStore', () => {
  describe('#refresh()', () => {
    it('returns an object of all widget namespaces', async () => {
      const cma = { getExtensions: jest.fn(() => Promise.resolve({ items: [] })) };
      const store = createStore(cma);
      const widgets = await store.refresh();
      expect(widgets.extension).toEqual([]);
      expect(widgets.builtin.map(w => w.id)).toEqual(createBuiltinWidgetList().map(b => b.id));
    });

    it('includes processed extensions from API', async () => {
      const entity = {
        sys: { id: 'CUSTOM' },
        extension: {
          name: 'NAME',
          src: 'SRC',
          sidebar: true,
          fieldTypes: [{ type: 'Array', items: { type: 'Link', linkType: 'Asset' } }],
          parameters: {
            instance: [{ id: 'x' }],
            installation: [{ id: 'test' }]
          }
        },
        parameters: { test: true }
      };
      const cma = { getExtensions: jest.fn(() => Promise.resolve({ items: [entity] })) };
      const store = createStore(cma);

      const widgets = await store.refresh();
      const [extension] = widgets.extension;

      expect(extension.name).toEqual('NAME');
      expect(extension.src).toEqual('SRC');
      expect(extension.sidebar).toEqual(true);
      expect(extension.fieldTypes).toEqual(['Assets']);
      expect(extension.parameters).toEqual([{ id: 'x' }]);
      expect(extension.installationParameters).toEqual({
        definitions: [{ id: 'test' }],
        values: { test: true }
      });
    });

    it('returns only builtins if API call fails', async () => {
      const cma = { getExtensions: jest.fn(() => Promise.reject()) };
      const store = createStore(cma);
      const widgets = await store.refresh();
      expect(widgets.extension).toEqual([]);
      expect(widgets.builtin.map(w => w.id)).toEqual(createBuiltinWidgetList().map(b => b.id));
    });
  });

  describe('#getAll()', () => {
    it('returns only builtins if not refreshed yet', () => {
      const store = createStore();
      expect(store.getAll()).toEqual({
        builtin: expect.any(Array)
      });
    });

    it('returns cached version after refresh', async () => {
      const cma = { getExtensions: jest.fn(() => Promise.resolve({ items: [] })) };
      const store = createStore(cma);
      const widgets = await store.refresh();
      const initialExtensions = widgets.extension;
      expect(store.getAll().extension).toBe(initialExtensions);

      const refreshed = await store.refresh();
      expect(refreshed.extension).not.toBe(initialExtensions);
      expect(store.getAll().extension).toBe(refreshed.extension);
    });
  });
});
