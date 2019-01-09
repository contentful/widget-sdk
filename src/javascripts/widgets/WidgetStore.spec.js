import { create as createStore } from './WidgetStore.es6';
import { create as createBuiltinWidgetList } from './BuiltinWidgets.es6';

describe('WidgetStore', () => {
  describe('#refresh()', () => {
    it('returns an object including the builtin widgets', async () => {
      const cma = { getExtensions: jest.fn(() => Promise.resolve({ items: [] })) };
      const store = createStore(cma);
      const widgets = await store.refresh();
      expect(widgets.map(w => w.id)).toEqual(createBuiltinWidgetList().map(b => b.id));
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
      const extension = widgets.find(w => w.id === 'CUSTOM');

      expect(extension.name).toEqual('NAME');
      expect(extension.src).toEqual('SRC');
      expect(extension.sidebar).toEqual(true);
      expect(extension.template).toEqual('<cf-iframe-widget />');
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
      expect(widgets.map(w => w.id)).toEqual(createBuiltinWidgetList().map(b => b.id));
    });

    // This test describes behaviour that may not be desirable.
    // It was implemented like this back in 2016 and some people may rely on it.
    it('overrides builtins with extensions if IDs clash', async () => {
      const customDatePicker = {
        sys: { id: 'datePicker' },
        extension: {
          name: 'my date picker',
          srcdoc: 'doc',
          fieldTypes: [{ type: 'Date' }]
        }
      };
      const cma = { getExtensions: jest.fn(() => Promise.resolve({ items: [customDatePicker] })) };
      const store = createStore(cma);

      const widgets = await store.refresh();
      const datePickerWidgets = widgets.filter(w => w.id === 'datePicker');
      expect(datePickerWidgets).toHaveLength(1);
      expect(datePickerWidgets[0].name).toEqual('my date picker');
    });
  });

  describe('#getAll()', () => {
    it('returns an empty array if not refreshed yet', () => {
      const store = createStore();
      expect(store.getAll()).toEqual([]);
    });

    it('returns cached version after refresh', async () => {
      const cma = { getExtensions: jest.fn(() => Promise.resolve({ items: [] })) };
      const store = createStore(cma);
      const widgets = await store.refresh();
      expect(store.getAll()).toBe(widgets);

      const refreshed = await store.refresh();
      expect(refreshed).not.toBe(widgets);
      expect(store.getAll()).toBe(refreshed);
    });
  });
});
