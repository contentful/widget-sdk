import createMockEndpoint from 'helpers/mocks/SpaceEndpoint';

describe('widgets/store', function () {
  beforeEach(function () {
    module('contentful/test');
    this.createStore = this.$inject('widgets/store');
    this.builtins = this.$inject('widgets/builtin');
  });

  describe('#refresh()', function () {
    it('returns an object including the builtin widgets', function* () {
      const endpoint = createMockEndpoint();
      const store = this.createStore(endpoint.request);
      const widgets = yield store.refresh();
      expect(widgets.map(w => w.id)).toEqual(this.builtins.map(b => b.id));
    });

    it('includes processed extensions from API', function* () {
      const endpoint = createMockEndpoint();
      endpoint.stores.extensions.custom = {
        sys: {id: 'CUSTOM'},
        extension: {
          name: 'NAME',
          src: 'SRC',
          srcdoc: 'SRCDOC',
          sidebar: true,
          fieldTypes: [{type: 'Array', items: {type: 'Link', linkType: 'Asset'}}]
        }
      };
      const store = this.createStore(endpoint.request);

      const widgets = yield store.refresh();
      const extension = _.find(widgets, {id: 'CUSTOM'});

      expect(extension.name).toEqual('NAME');
      expect(extension.src).toEqual('SRC');
      expect(extension.srcdoc).toEqual('SRCDOC');
      expect(extension.sidebar).toEqual(true);
      expect(extension.template).toEqual('<cf-iframe-widget>');
      expect(extension.fieldTypes).toEqual(['Assets']);
      expect(extension.options).toEqual([]);
    });

    it('returns only builtins if API call fails', function* () {
      const endpoint = sinon.stub().rejects();
      const store = this.createStore(endpoint);
      const widgets = yield store.refresh();
      expect(widgets.map(w => w.id)).toEqual(this.builtins.map(b => b.id));
    });

    // This test describes behaviour that may not be desirable.
    // It was implemented like this back in 2016 and some people may rely on it.
    it('overrides builtins with extensions if IDs clash', function* () {
      const endpoint = createMockEndpoint();
      endpoint.stores.extensions.customDatePicker = {
        sys: {id: 'datePicker'},
        extension: {
          name: 'my date picker',
          srcdoc: 'doc',
          fieldTypes: [{type: 'Date'}]
        }
      };
      const store = this.createStore(endpoint.request);

      const widgets = yield store.refresh();
      const datePickerWidgets = widgets.filter(w => w.id === 'datePicker');
      expect(datePickerWidgets.length).toBe(1);
      expect(datePickerWidgets[0].name).toEqual('my date picker');
    });
  });

  describe('#getAll()', function () {
    it('returns an empty array if not refreshed yet', function () {
      const store = this.createStore();
      expect(store.getAll()).toEqual([]);
    });

    it('returns cached version after refresh', function* () {
      const endpoint = createMockEndpoint();
      const store = this.createStore(endpoint.request);
      const widgets = yield store.refresh();
      expect(store.getAll()).toBe(widgets);

      const refreshed = yield store.refresh();
      expect(refreshed).not.toBe(widgets);
      expect(store.getAll()).toBe(refreshed);
    });
  });
});
